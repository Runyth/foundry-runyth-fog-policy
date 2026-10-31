// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("manifest identity and version match package metadata", () => {
  assert.equal(manifest.id, "runyth-fog-policy");
  assert.equal(manifest.version, pkg.version);
});

test("manifest is intentionally restricted to Foundry v13", () => {
  assert.equal(manifest.compatibility.minimum, "13");
  assert.equal(manifest.compatibility.verified, "13");
  assert.equal(manifest.compatibility.maximum, "13");
});

test("runtime uses ES modules and two localizations", () => {
  assert.deepEqual(manifest.esmodules, ["scripts/main.js"]);
  assert.deepEqual(
    manifest.languages.map((language) => language.lang),
    ["en", "de"]
  );
});
