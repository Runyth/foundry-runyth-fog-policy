import { MODULE_ID, FLAGS } from "./constants.js";
import { logger } from "./logger.js";
import { readPolicySettings } from "./settings.js";
import {
  auditScenes,
  buildRepairUpdates,
  chunk,
  forceFogExplorationDisabled,
  getPendingExemption,
  getSceneExemptFlag,
  isSceneManaged,
  sceneNeedsRepair
} from "./policy-core.js";

function assertGm() {
  if (!game.user?.isGM) {
    throw new Error("Runyth Fog Policy operations require a GM user.");
  }
}

export function isActiveGmClient() {
  return game.user?.isActiveGM === true;
}

export function getAudit() {
  return auditScenes(game.scenes?.contents ?? [], readPolicySettings());
}

export async function repairExistingScenes({ notify = true } = {}) {
  assertGm();

  const settings = readPolicySettings();
  if (!settings.enabled) {
    return { updated: 0, reason: "disabled" };
  }

  const updates = buildRepairUpdates(game.scenes?.contents ?? [], settings);
  if (updates.length === 0) {
    return { updated: 0, reason: "already-compliant" };
  }

  const sceneClass = CONFIG.Scene.documentClass;
  await sceneClass.updateDocuments(updates, { runythFogPolicy: true });

  if (notify) {
    ui.notifications.info(
      game.i18n.format("RUNYTH_FOG_POLICY.Notifications.Repaired", { count: updates.length })
    );
  }

  logger.info(`Disabled Fog Exploration on ${updates.length} managed Scene(s).`);
  return { updated: updates.length, reason: "repaired" };
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

  await scene.update({ "fog.exploration": false }, { runythFogPolicy: true });
  logger.info(`Repaired Scene \"${scene.name}\" after a non-compliant update.`);
  return true;
}

export async function setSceneExempt(sceneId, exempt) {
  assertGm();

  const scene = game.scenes?.get(sceneId);
  if (!scene) throw new Error(`Scene ${sceneId} does not exist.`);

  await scene.setFlag(MODULE_ID, FLAGS.EXEMPT, exempt === true);

  if (!exempt) {
    await repairSceneIfNeeded(scene);
  }

  return { sceneId, exempt: exempt === true };
}

async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function discoverFogExplorationDocuments(sceneIds) {
  const fogClass = CONFIG.FogExploration.documentClass;
  const users = game.users?.contents ?? [];
  const queries = [];

  for (const sceneId of sceneIds) {
    for (const user of users) {
      queries.push({ scene: sceneId, user: user.id });
    }
  }

  const loaded = await mapWithConcurrency(queries, 8, async (query) => {
    try {
      return await fogClass.load(query);
    } catch (error) {
      logger.warn("Could not load a FogExploration document during purge discovery.", query, error);
      return null;
    }
  });

  const documentsById = new Map();
  for (const document of loaded) {
    if (document?.id) documentsById.set(document.id, document);
  }

  const collection = game.collections?.get("FogExploration");
  for (const document of collection?.contents ?? []) {
    if (document?.id && sceneIds.has(document.scene)) {
      documentsById.set(document.id, document);
    }
  }

  return [...documentsById.values()];
}

export async function purgeStoredExploration({ includeExempt = false } = {}) {
  assertGm();

  const settings = readPolicySettings();
  const scenes = game.scenes?.contents ?? [];
  const targetScenes = scenes.filter((scene) => {
    if (!settings.enabled) return false;
    if (includeExempt) return !scene.inCompendium;
    return isSceneManaged(scene, settings);
  });

  const sceneIds = new Set(targetScenes.map((scene) => scene.id));
  if (sceneIds.size === 0) {
    return { deleted: 0, scenes: 0 };
  }

  const documents = await discoverFogExplorationDocuments(sceneIds);
  const ids = documents.map((document) => document.id).filter(Boolean);
  const fogClass = CONFIG.FogExploration.documentClass;

  for (const idsChunk of chunk(ids, 100)) {
    await fogClass.deleteDocuments(idsChunk, { runythFogPolicy: true });
  }

  const resetTimestamp = Date.now();
  const resetUpdates = targetScenes.map((scene) => ({
    _id: scene.id,
    "fog.reset": resetTimestamp
  }));

  if (resetUpdates.length > 0) {
    await CONFIG.Scene.documentClass.updateDocuments(resetUpdates, { runythFogPolicy: true });
  }

  if (
    globalThis.canvas?.ready &&
    sceneIds.has(globalThis.canvas.scene?.id) &&
    globalThis.canvas.fog?.initialize
  ) {
    await globalThis.canvas.fog.initialize();
  }

  logger.info(
    `Purged ${ids.length} FogExploration document(s) across ${targetScenes.length} Scene(s).`
  );

  return { deleted: ids.length, scenes: targetScenes.length };
}

export function isSceneExempt(scene) {
  return getSceneExemptFlag(scene);
}
