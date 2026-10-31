// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFolderIndex,
  buildSceneRecords,
  expandSelectedFolders
} from "../scripts/core/scene-index-core.js";

const settings = { enabled: true, allowSceneExemptions: true };
const isManaged = (scene) => scene.exempt !== true;
const getExempt = (scene) => scene.exempt === true;

test("folder index creates hierarchical paths and descendant sets", () => {
  const index = buildFolderIndex([
    { id: "a", name: "World", type: "Scene", folder: null },
    { id: "b", name: "Town", type: "Scene", folder: "a" },
    { id: "c", name: "Inn", type: "Scene", folder: "b" }
  ]);

  assert.equal(index.getPath("c"), "World / Town / Inn");
  assert.deepEqual([...expandSelectedFolders(new Set(["b"]), index)].sort(), ["b", "c"]);
});

test("cyclic folder data remains finite and visible", () => {
  const index = buildFolderIndex([
    { id: "a", name: "A", type: "Scene", folder: "b" },
    { id: "b", name: "B", type: "Scene", folder: "a" }
  ]);
  assert.equal(index.flattened.length, 2);
  assert.ok(index.descendants.get("a").has("a"));
  assert.ok(index.descendants.get("b").has("b"));
});

test("scene records cache searchable names, folder paths, and status", () => {
  const index = buildFolderIndex([{ id: "a", name: "Town", type: "Scene", folder: null }]);
  const records = buildSceneRecords([
    { id: "s", name: "Market", folder: "a", fog: { exploration: true }, exempt: false }
  ], index, settings, isManaged, getExempt);

  assert.equal(records[0].folderPath, "Town");
  assert.equal(records[0].status, "nonCompliant");
  assert.match(records[0].searchText, /market/);
});
