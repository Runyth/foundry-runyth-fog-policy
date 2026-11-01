// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
export const BACKUP_SCHEMA = "runyth-fog-policy-backup";
export const SELECTION_SCHEMA = "runyth-fog-policy-selection";
export const DATA_SCHEMA_VERSION = 1;
export const MAX_IMPORT_SCENES = 100_000;

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function validateSceneEntries(entries, label) {
  if (!Array.isArray(entries)) throw new TypeError(`${label} scenes must be an array.`);
  if (entries.length > MAX_IMPORT_SCENES) {
    throw new RangeError(`${label} contains more than ${MAX_IMPORT_SCENES} Scene entries.`);
  }
  const seenIds = new Set();
  for (const [index, entry] of entries.entries()) {
    assertPlainObject(entry, `${label} scene ${index + 1}`);
    if (typeof entry.id !== "string" || !entry.id) {
      throw new TypeError(`${label} scene ${index + 1} has no valid id.`);
    }
    if (seenIds.has(entry.id)) {
      throw new TypeError(`${label} contains duplicate Scene id ${entry.id}.`);
    }
    seenIds.add(entry.id);
    if (typeof entry.name !== "string") {
      throw new TypeError(`${label} scene ${index + 1} has no valid name.`);
    }
    if (entry.folderPath != null && typeof entry.folderPath !== "string") {
      throw new TypeError(`${label} scene ${index + 1} has an invalid folderPath.`);
    }
    if (entry.fogExploration != null && typeof entry.fogExploration !== "boolean") {
      throw new TypeError(`${label} scene ${index + 1} has an invalid fogExploration value.`);
    }
    if (entry.exempt != null && typeof entry.exempt !== "boolean") {
      throw new TypeError(`${label} scene ${index + 1} has an invalid exempt value.`);
    }
  }
}

function validateSettings(settings) {
  if (settings == null) return;
  assertPlainObject(settings, "Import data settings");
  for (const key of [
    "enabled",
    "repairOnReady",
    "enforceCreates",
    "enforceUpdates",
    "allowSceneExemptions"
  ]) {
    if (key in settings && typeof settings[key] !== "boolean") {
      throw new TypeError(`Import data setting ${key} must be a boolean.`);
    }
  }
}

export function validateImportData(value) {
  assertPlainObject(value, "Import data");
  if (![BACKUP_SCHEMA, SELECTION_SCHEMA].includes(value.schema)) {
    throw new TypeError("Unsupported Runyth Fog Policy import file schema.");
  }
  if (value.schemaVersion !== DATA_SCHEMA_VERSION) {
    throw new RangeError(
      `Unsupported schema version ${String(value.schemaVersion)}; expected ${DATA_SCHEMA_VERSION}.`
    );
  }
  validateSceneEntries(value.scenes, "Import data");
  if (value.world != null) {
    assertPlainObject(value.world, "Import data world");
    if (value.world.id != null && typeof value.world.id !== "string") {
      throw new TypeError("Import data world id must be a string.");
    }
    if (value.world.title != null && typeof value.world.title !== "string") {
      throw new TypeError("Import data world title must be a string.");
    }
  }
  validateSettings(value.settings);
  return value;
}

export function buildBackupData({ moduleVersion, world, scenes, settings, includeSettings = true }) {
  return {
    schema: BACKUP_SCHEMA,
    schemaVersion: DATA_SCHEMA_VERSION,
    moduleVersion,
    createdAt: new Date().toISOString(),
    world: {
      id: String(world?.id ?? ""),
      title: String(world?.title ?? "")
    },
    settings: includeSettings ? { ...settings } : null,
    scenes: scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      folderId: scene.folderId ?? null,
      folderPath: scene.folderPath ?? "",
      fogExploration: scene.exploration === true,
      exempt: scene.exempt === true
    }))
  };
}

export function buildSelectionData({ moduleVersion, world, scenes }) {
  return {
    schema: SELECTION_SCHEMA,
    schemaVersion: DATA_SCHEMA_VERSION,
    moduleVersion,
    createdAt: new Date().toISOString(),
    world: {
      id: String(world?.id ?? ""),
      title: String(world?.title ?? "")
    },
    scenes: scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      folderPath: scene.folderPath ?? ""
    }))
  };
}

export function matchImportedScenes(importedScenes, currentRecords, { allowIdMatch = true } = {}) {
  const byId = new Map(currentRecords.map((record) => [record.id, record]));
  const byFallback = new Map();

  for (const record of currentRecords) {
    const key = `${record.folderPath}\u0000${record.name}`;
    const values = byFallback.get(key) ?? [];
    values.push(record);
    byFallback.set(key, values);
  }

  const matched = [];
  const unmatched = [];
  const ambiguous = [];

  for (const imported of importedScenes) {
    const exact = allowIdMatch ? byId.get(imported.id) : null;
    if (exact) {
      matched.push({ imported, record: exact, matchedBy: "id" });
      continue;
    }

    const key = `${String(imported.folderPath ?? "")}\u0000${imported.name}`;
    const candidates = byFallback.get(key) ?? [];
    if (candidates.length === 1) {
      matched.push({ imported, record: candidates[0], matchedBy: "name-folder" });
    } else if (candidates.length > 1) {
      ambiguous.push({ imported, candidates });
    } else {
      unmatched.push(imported);
    }
  }

  return Object.freeze({ matched, unmatched, ambiguous });
}
