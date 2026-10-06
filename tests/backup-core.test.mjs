import test from "node:test";
import assert from "node:assert/strict";

import {
  BACKUP_SCHEMA,
  DATA_SCHEMA_VERSION,
  buildBackupData,
  buildSelectionData,
  matchImportedScenes,
  validateImportData
} from "../scripts/core/backup-core.js";

const records = [
  { id: "scene-a", name: "Velia", folderPath: "Balenos", exploration: false, exempt: false },
  { id: "scene-b", name: "Crypt", folderPath: "Dungeons", exploration: true, exempt: true }
];

test("backup contains only explicit policy state for selected Scenes", () => {
  const backup = buildBackupData({
    moduleVersion: "1.0.1",
    world: { id: "world", title: "World" },
    scenes: records,
    settings: { enabled: true },
    includeSettings: true
  });
  assert.equal(backup.schema, BACKUP_SCHEMA);
  assert.equal(backup.schemaVersion, DATA_SCHEMA_VERSION);
  assert.equal(backup.scenes.length, 2);
  assert.equal(backup.scenes[1].exempt, true);
  assert.deepEqual(backup.settings, { enabled: true });
});

test("selection export omits mutable policy state", () => {
  const selection = buildSelectionData({
    moduleVersion: "1.0.1",
    world: { id: "world", title: "World" },
    scenes: records
  });
  assert.equal(selection.scenes[0].fogExploration, undefined);
  assert.equal(selection.scenes[0].exempt, undefined);
});

test("same-world matching prefers stable Scene IDs", () => {
  const result = matchImportedScenes(
    [{ id: "scene-a", name: "Renamed", folderPath: "Other" }],
    records,
    { allowIdMatch: true }
  );
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].matchedBy, "id");
});

test("cross-world matching falls back to unique name and folder path", () => {
  const result = matchImportedScenes(
    [{ id: "foreign", name: "Crypt", folderPath: "Dungeons" }],
    records,
    { allowIdMatch: false }
  );
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].record.id, "scene-b");
  assert.equal(result.matched[0].matchedBy, "name-folder");
});

test("import validation rejects unsupported schemas", () => {
  assert.throws(() => validateImportData({ schema: "other", schemaVersion: 1, scenes: [] }));
});

test("cross-world ambiguous name and folder matches are never guessed", () => {
  const candidates = [
    ...records,
    { id: "scene-c", name: "Crypt", folderPath: "Dungeons", exploration: false, exempt: false }
  ];
  const result = matchImportedScenes(
    [{ id: "foreign", name: "Crypt", folderPath: "Dungeons" }],
    candidates,
    { allowIdMatch: false }
  );
  assert.equal(result.matched.length, 0);
  assert.equal(result.ambiguous.length, 1);
});

test("import validation rejects malformed Scene entries before mutation", () => {
  assert.throws(() =>
    validateImportData({
      schema: BACKUP_SCHEMA,
      schemaVersion: DATA_SCHEMA_VERSION,
      moduleVersion: "1.0.1",
      world: { id: "world", title: "World" },
      scenes: [{ id: 42, name: "Invalid", folderPath: "" }]
    })
  );
});

test("import validation rejects duplicate Scene IDs", () => {
  assert.throws(() =>
    validateImportData({
      schema: BACKUP_SCHEMA,
      schemaVersion: DATA_SCHEMA_VERSION,
      scenes: [
        { id: "duplicate", name: "A", folderPath: "" },
        { id: "duplicate", name: "B", folderPath: "" }
      ]
    })
  );
});

test("import validation rejects malformed known world settings", () => {
  assert.throws(() =>
    validateImportData({
      schema: BACKUP_SCHEMA,
      schemaVersion: DATA_SCHEMA_VERSION,
      scenes: [],
      settings: { enabled: "yes" }
    })
  );
});
