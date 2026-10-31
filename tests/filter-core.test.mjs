// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";

import { filterSceneRecords, normalizeText, parseSearchQuery } from "../scripts/core/filter-core.js";

const records = [
  {
    id: "a1",
    status: "compliant",
    exploration: false,
    exempt: false,
    folderId: "f1",
    searchName: normalizeText("Old Mill"),
    searchFolder: normalizeText("Balenos / Velia"),
    searchId: "a1",
    searchText: normalizeText("Old Mill Balenos Velia a1")
  },
  {
    id: "b2",
    status: "nonCompliant",
    exploration: true,
    exempt: false,
    folderId: "f2",
    searchName: normalizeText("Crypt Depths"),
    searchFolder: normalizeText("Dungeons / Crypt"),
    searchId: "b2",
    searchText: normalizeText("Crypt Depths Dungeons Crypt b2")
  }
];

test("search parser supports quoted field values", () => {
  assert.deepEqual(parseSearchQuery('folder:"Balenos / Velia" name:Mill'), [
    { field: "folder", value: "balenos / velia", rawField: "folder" },
    { field: "name", value: "mill", rawField: "name" }
  ]);
});

test("filter combines free text and structured fields", () => {
  const result = filterSceneRecords(records, {
    query: "crypt fog:on",
    statuses: new Set(),
    fogStates: new Set(),
    folderIds: new Set(),
    selectedIds: new Set(),
    descendantFolderIds: new Set()
  });
  assert.deepEqual(result.map((record) => record.id), ["b2"]);
});

test("folder and selected-only filters scale independently of search syntax", () => {
  const result = filterSceneRecords(records, {
    query: "",
    statuses: new Set(["compliant"]),
    fogStates: new Set(["disabled"]),
    folderIds: new Set(["f1"]),
    descendantFolderIds: new Set(["f1"]),
    selectedIds: new Set(["a1"]),
    selectedOnly: true,
    includeDescendants: true
  });
  assert.deepEqual(result.map((record) => record.id), ["a1"]);
});

test("unknown field prefixes remain literal instead of broadening search", () => {
  const [token] = parseSearchQuery("tag:boss");
  assert.equal(token.field, null);
  assert.equal(token.value, "tag:boss");
});
