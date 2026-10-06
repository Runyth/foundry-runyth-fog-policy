import { MODULE_ID, FLAGS } from "./constants.js";
import { runResilientBatches } from "./core/batch-core.js";
import { FogPolicyError, requireGm } from "./errors.js";
import { logger } from "./logger.js";
import { readPolicySettings } from "./settings.js";
import {
  auditScenes,
  buildRepairUpdates,
  forceFogExplorationDisabled,
  getPendingExemption,
  getSceneExemptFlag,
  isSceneManaged,
  sceneNeedsRepair
} from "./policy-core.js";

const SCENE_BATCH_SIZE = 100;
const FOG_DELETE_BATCH_SIZE = 100;
const FOG_QUERY_CONCURRENCY = 8;

function getSceneClass() {
  const sceneClass = globalThis.CONFIG?.Scene?.documentClass;
  if (!sceneClass?.updateDocuments) {
    throw new FogPolicyError(
      "RFP-SCENE-API",
      "Foundry's Scene document API is unavailable. Reload the world and try again."
    );
  }
  return sceneClass;
}

function getFogClass() {
  const fogClass = globalThis.CONFIG?.FogExploration?.documentClass;
  if (!fogClass?.load || !fogClass?.deleteDocuments) {
    throw new FogPolicyError(
      "RFP-FOG-API",
      "Foundry's FogExploration document API is unavailable. Reload the world and try again."
    );
  }
  return fogClass;
}

function uniqueSceneIds(sceneIds) {
  if (sceneIds == null) return null;
  return [...new Set(sceneIds)].filter((id) => typeof id === "string" && id);
}

function resolveScenes(sceneIds) {
  const ids = uniqueSceneIds(sceneIds);
  if (ids === null) return { scenes: game.scenes?.contents ?? [], missing: [] };

  const scenes = [];
  const missing = [];
  for (const id of ids) {
    const scene = game.scenes?.get(id);
    if (scene) scenes.push(scene);
    else missing.push(id);
  }
  return { scenes, missing };
}

async function updateScenesResilient(updates, operationCode) {
  const sceneClass = getSceneClass();
  const result = await runResilientBatches(updates, SCENE_BATCH_SIZE, (batch) =>
    sceneClass.updateDocuments(batch, { runythFogPolicy: true })
  );

  if (result.failed.length > 0) {
    logger.warn(
      `${operationCode}: ${result.failed.length} Scene update(s) failed after isolation.`,
      result.failed
    );
  }
  return result;
}

export function isActiveGmClient() {
  const activeGm = game.users?.activeGM;
  return activeGm ? activeGm.id === game.user?.id : game.user?.isActiveGM === true;
}

export function getAudit({ sceneIds = null } = {}) {
  const { scenes } = resolveScenes(sceneIds);
  return auditScenes(scenes, readPolicySettings());
}

export async function repairExistingScenes({ notify = true, sceneIds = null } = {}) {
  requireGm("Repairing Scene Fog Exploration");

  const settings = readPolicySettings();
  if (!settings.enabled) {
    return { updated: 0, failed: 0, missing: 0, reason: "disabled" };
  }

  const { scenes, missing } = resolveScenes(sceneIds);
  const updates = buildRepairUpdates(scenes, settings);
  if (updates.length === 0) {
    return {
      updated: 0,
      failed: 0,
      missing: missing.length,
      reason: "already-compliant"
    };
  }

  const result = await updateScenesResilient(updates, "RFP-REPAIR");
  const updated = result.succeeded.length;
  const failed = result.failed.length;

  if (notify && updated > 0) {
    ui.notifications.info(
      game.i18n.format("RUNYTH_FOG_POLICY.Notifications.Repaired", { count: updated })
    );
  }
  if (notify && failed > 0) {
    ui.notifications.error(
      game.i18n.format("RUNYTH_FOG_POLICY.Notifications.PartialFailure", {
        operation: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.RepairSelected"),
        count: failed
      }),
      { permanent: true }
    );
  }

  logger.info(
    `Disabled Fog Exploration on ${updated} managed Scene(s); ${failed} failed; ${missing.length} missing.`
  );
  return { updated, failed, missing: missing.length, reason: failed ? "partial" : "repaired" };
}

export function enforcePendingSceneCreate(scene) {
  const settings = readPolicySettings();
  if (!settings.enabled || !settings.enforceCreates || !isSceneManaged(scene, settings)) {
    return false;
  }

  if (scene?.fog?.exploration === false) return false;
  scene.updateSource({ "fog.exploration": false });
  return true;
}

export function enforcePendingSceneUpdate(scene, changes) {
  const settings = readPolicySettings();
  if (!settings.enabled || !settings.enforceUpdates || scene?.inCompendium) return false;

  const pendingExempt = getPendingExemption(
    scene,
    changes,
    settings,
    foundry.utils.getProperty
  );
  if (pendingExempt) return false;

  return forceFogExplorationDisabled(
    changes,
    foundry.utils.setProperty,
    foundry.utils.getProperty
  );
}

export async function repairSceneIfNeeded(scene) {
  if (!isActiveGmClient()) return false;

  const settings = readPolicySettings();
  if (!settings.enabled || !sceneNeedsRepair(scene, settings)) return false;

  try {
    await scene.update({ "fog.exploration": false }, { runythFogPolicy: true });
  } catch (error) {
    throw new FogPolicyError(
      "RFP-SCENE-REPAIR",
      `Could not repair Scene \"${scene?.name ?? scene?.id ?? "unknown"}\".`,
      { cause: error, details: { sceneId: scene?.id } }
    );
  }
  logger.info(`Repaired Scene \"${scene.name}\" after a non-compliant update.`);
  return true;
}

export async function setSceneExempt(sceneId, exempt) {
  const result = await setScenesExempt([sceneId], exempt);
  if (result.failed > 0) {
    throw new FogPolicyError("RFP-EXEMPT", `Could not update exemption for Scene ${sceneId}.`);
  }
  return { sceneId, exempt: exempt === true };
}

export async function setScenesExempt(sceneIds, exempt) {
  requireGm("Changing Scene exemptions");
  const { scenes, missing } = resolveScenes(sceneIds);
  const settings = readPolicySettings();
  const updates = scenes.map((scene) => {
    const update = {
      _id: scene.id,
      [`flags.${MODULE_ID}.${FLAGS.EXEMPT}`]: exempt === true
    };
    if (!exempt && settings.enabled && scene?.fog?.exploration !== false) {
      update["fog.exploration"] = false;
    }
    return update;
  });

  const result = await updateScenesResilient(updates, "RFP-EXEMPT");
  return {
    updated: result.succeeded.length,
    failed: result.failed.length,
    missing: missing.length,
    exempt: exempt === true
  };
}

function fogPairKey(sceneId, userId) {
  return `${sceneId}\u0000${userId}`;
}

async function discoverFogExplorationDocuments(sceneIds) {
  const fogClass = getFogClass();
  const users = game.users?.contents ?? [];
  const documentsById = new Map();
  const knownPairs = new Set();

  const collection = game.collections?.get?.(fogClass.documentName ?? "FogExploration");
  for (const document of collection?.contents ?? []) {
    if (!document?.id || !sceneIds.has(document.scene)) continue;
    documentsById.set(document.id, document);
    if (document.user) knownPairs.add(fogPairKey(document.scene, document.user));
  }

  const failures = [];
  let pending = [];

  async function flushPending() {
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    const loaded = await Promise.all(batch.map(async (query) => {
      try {
        return await fogClass.load(query);
      } catch (error) {
        failures.push({ query, error });
        logger.warn("Could not load a FogExploration document during purge discovery.", query, error);
        return null;
      }
    }));
    for (const document of loaded) {
      if (document?.id) documentsById.set(document.id, document);
    }
  }

  for (const sceneId of sceneIds) {
    for (const user of users) {
      const key = fogPairKey(sceneId, user.id);
      if (knownPairs.has(key)) continue;
      pending.push({ scene: sceneId, user: user.id });
      if (pending.length >= FOG_QUERY_CONCURRENCY) await flushPending();
    }
  }
  await flushPending();

  return { documents: [...documentsById.values()], failures };
}

export async function purgeStoredExploration({
  includeExempt = false,
  sceneIds = null
} = {}) {
  requireGm("Purging stored Fog Exploration");

  const settings = readPolicySettings();
  const { scenes, missing } = resolveScenes(sceneIds);
  const targetScenes = scenes.filter((scene) => {
    if (!settings.enabled && sceneIds === null) return false;
    if (includeExempt) return !scene.inCompendium;
    return isSceneManaged(scene, settings);
  });

  const targetIds = new Set(targetScenes.map((scene) => scene.id));
  if (targetIds.size === 0) {
    return {
      deleted: 0,
      failedDeletes: 0,
      discoveryFailures: 0,
      resetFailures: 0,
      scenes: 0,
      missing: missing.length
    };
  }

  const discovery = await discoverFogExplorationDocuments(targetIds);
  const ids = discovery.documents.map((document) => document.id).filter(Boolean);
  const fogClass = getFogClass();
  const deleteResult = await runResilientBatches(ids, FOG_DELETE_BATCH_SIZE, (batch) =>
    fogClass.deleteDocuments(batch, { runythFogPolicy: true })
  );

  const resetTimestamp = Date.now();
  const resetUpdates = targetScenes.map((scene) => ({
    _id: scene.id,
    "fog.reset": resetTimestamp
  }));
  const resetResult = await updateScenesResilient(resetUpdates, "RFP-FOG-RESET");

  if (
    globalThis.canvas?.ready &&
    targetIds.has(globalThis.canvas.scene?.id) &&
    globalThis.canvas.fog?.initialize
  ) {
    try {
      await globalThis.canvas.fog.initialize();
    } catch (error) {
      logger.warn("Fog canvas refresh failed after purge; a Scene reload will refresh it.", error);
    }
  }

  const result = {
    deleted: deleteResult.succeeded.length,
    failedDeletes: deleteResult.failed.length,
    discoveryFailures: discovery.failures.length,
    resetFailures: resetResult.failed.length,
    scenes: targetScenes.length,
    missing: missing.length
  };

  logger.info(
    `Purge finished: ${result.deleted} FogExploration record(s) deleted across ${result.scenes} Scene(s); ` +
      `${result.failedDeletes} delete failure(s), ${result.discoveryFailures} discovery failure(s), ` +
      `${result.resetFailures} reset failure(s).`
  );
  return result;
}

export async function restoreSceneStates(matches, {
  restoreExemptions = true,
  restoreFog = true
} = {}) {
  requireGm("Restoring Fog Policy backup");
  const settings = readPolicySettings();
  const updates = [];
  const conflicts = [];

  for (const match of matches) {
    const { imported, record } = match;
    const scene = game.scenes?.get(record.id);
    if (!scene) continue;

    const desiredExempt = restoreExemptions
      ? imported.exempt === true
      : getSceneExemptFlag(scene);
    const update = { _id: scene.id };

    if (restoreExemptions && typeof imported.exempt === "boolean") {
      update[`flags.${MODULE_ID}.${FLAGS.EXEMPT}`] = imported.exempt;
    }

    if (restoreFog && typeof imported.fogExploration === "boolean") {
      const wouldBeManaged = settings.enabled &&
        (!settings.allowSceneExemptions || !desiredExempt);
      const blocked = imported.fogExploration === true &&
        wouldBeManaged &&
        settings.enforceUpdates;

      if (blocked) {
        conflicts.push({
          sceneId: scene.id,
          sceneName: scene.name,
          reason: "policy-blocks-fog-enabled"
        });
        update["fog.exploration"] = false;
      } else {
        update["fog.exploration"] = imported.fogExploration;
      }
    } else if (!desiredExempt && settings.enabled && scene?.fog?.exploration !== false) {
      update["fog.exploration"] = false;
    }

    if (Object.keys(update).length > 1) updates.push(update);
  }

  const result = await updateScenesResilient(updates, "RFP-RESTORE");
  return {
    updated: result.succeeded.length,
    failed: result.failed.length,
    conflicts
  };
}

export function isSceneExempt(scene) {
  return getSceneExemptFlag(scene);
}
