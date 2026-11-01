// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import { filterSceneRecords } from "../scripts/core/filter-core.js";
import { buildFolderIndex, buildSceneRecords, expandSelectedFolders } from "../scripts/core/scene-index-core.js";

const settings = { enabled: true, allowSceneExemptions: true };
const isManaged = () => true;
const getExempt = () => false;

test("indexing and filtering thousands of Scenes remains bounded", () => {
  const folders = Array.from({ length: 500 }, (_, index) => ({
    id: `f${index}`,
    name: `Folder ${index}`,
    type: "Scene",
    folder: index === 0 ? null : `f${Math.floor((index - 1) / 5)}`
  }));
  const scenes = Array.from({ length: 10_000 }, (_, index) => ({
    id: `s${index}`,
    name: `Scene ${index}`,
    folder: `f${index % folders.length}`,
    fog: { exploration: index % 3 === 0 }
  }));

  const started = performance.now();
  const folderIndex = buildFolderIndex(folders);
  const records = buildSceneRecords(scenes, folderIndex, settings, isManaged, getExempt);
  const descendants = expandSelectedFolders(new Set(["f1"]), folderIndex);
  const filtered = filterSceneRecords(records, {
    query: "scene folder:Folder",
    statuses: new Set(),
    fogStates: new Set(),
    folderIds: new Set(["f1"]),
    descendantFolderIds: descendants,
    selectedIds: new Set(),
    includeDescendants: true
  });
  const elapsed = performance.now() - started;

  assert.equal(records.length, 10_000);
  assert.ok(filtered.length > 0);
  assert.ok(elapsed < 2500, `Synthetic scale test took ${elapsed.toFixed(1)} ms`);
});
