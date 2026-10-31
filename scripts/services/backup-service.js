// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import { MODULE_ID, MODULE_VERSION, SETTINGS } from "../constants.js";
import {
  buildBackupData,
  buildSelectionData,
  matchImportedScenes,
  validateImportData,
  BACKUP_SCHEMA,
  SELECTION_SCHEMA
} from "../core/backup-core.js";
import { FogPolicyError } from "../errors.js";
import { downloadJson, readJsonFile } from "./file-service.js";
import { readPolicySettings } from "../settings.js";

function worldMetadata() {
  return {
    id: game.world?.id ?? "",
    title: game.world?.title ?? ""
  };
}

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function exportableWorldSettings() {
  const settings = readPolicySettings();
  return {
    enabled: settings.enabled,
    repairOnReady: settings.repairOnReady,
    enforceCreates: settings.enforceCreates,
    enforceUpdates: settings.enforceUpdates,
    allowSceneExemptions: settings.allowSceneExemptions
  };
}

export function exportBackup(records, { includeSettings = true, prefix = "backup" } = {}) {
  const data = buildBackupData({
    moduleVersion: MODULE_VERSION,
    world: worldMetadata(),
    scenes: records,
    settings: exportableWorldSettings(),
    includeSettings
  });
  downloadJson(data, `runyth-fog-policy-${prefix}-${timestampForFilename()}.json`);
  return data;
}

export function exportSelection(records) {
  const data = buildSelectionData({
    moduleVersion: MODULE_VERSION,
    world: worldMetadata(),
    scenes: records
  });
  downloadJson(data, `runyth-fog-policy-selection-${timestampForFilename()}.json`);
  return data;
}

export async function loadImportFile(file, currentRecords) {
  let data;
  try {
    data = validateImportData(await readJsonFile(file));
  } catch (error) {
    if (error instanceof FogPolicyError) throw error;
    throw new FogPolicyError("RFP-IMPORT-VALIDATION", error.message, { cause: error });
  }

  const sameWorld = Boolean(data.world?.id) && data.world.id === game.world?.id;
  const matches = matchImportedScenes(data.scenes, currentRecords, { allowIdMatch: sameWorld });
  return Object.freeze({ data, matches, sameWorld });
}

export async function restoreGlobalSettings(settings) {
  if (!settings || typeof settings !== "object") return { updated: 0 };

  const supported = [
    [SETTINGS.ENABLED, "enabled"],
    [SETTINGS.REPAIR_ON_READY, "repairOnReady"],
    [SETTINGS.ENFORCE_CREATES, "enforceCreates"],
    [SETTINGS.ENFORCE_UPDATES, "enforceUpdates"],
    [SETTINGS.ALLOW_EXEMPTIONS, "allowSceneExemptions"]
  ];

  const changed = [];
  try {
    for (const [settingKey, dataKey] of supported) {
      if (typeof settings[dataKey] !== "boolean") continue;
      const previous = game.settings.get(MODULE_ID, settingKey);
      if (previous === settings[dataKey]) continue;
      await game.settings.set(MODULE_ID, settingKey, settings[dataKey]);
      changed.push({ settingKey, previous });
    }
    return { updated: changed.length };
  } catch (error) {
    const rollbackFailures = [];
    for (const change of [...changed].reverse()) {
      try {
        await game.settings.set(MODULE_ID, change.settingKey, change.previous);
      } catch (rollbackError) {
        rollbackFailures.push({ settingKey: change.settingKey, error: rollbackError });
      }
    }
    throw new FogPolicyError(
      "RFP-SETTINGS-RESTORE",
      rollbackFailures.length > 0
        ? `World setting restore failed and ${rollbackFailures.length} rollback(s) also failed.`
        : "World setting restore failed; previously changed settings were rolled back.",
      { cause: error, details: { rollbackFailures } }
    );
  }
}

export function assertBackupImport(data) {
  if (data.schema !== BACKUP_SCHEMA) {
    throw new FogPolicyError(
      "RFP-IMPORT-TYPE",
      `This action requires a policy backup file, not ${data.schema === SELECTION_SCHEMA ? "a selection file" : "this file type"}.`
    );
  }
}

export function assertSelectionImport(data) {
  if (![SELECTION_SCHEMA, BACKUP_SCHEMA].includes(data.schema)) {
    throw new FogPolicyError("RFP-IMPORT-TYPE", "This file cannot be used to restore a Scene selection.");
  }
}
