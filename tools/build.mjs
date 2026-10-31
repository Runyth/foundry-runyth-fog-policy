// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist", "runyth-fog-policy");

await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(out, { recursive: true });

const runtimeEntries = [
  "module.json",
  "scripts",
  "templates",
  "styles",
  "lang",
  "README.md",
  "CHANGELOG.md",
  "LICENSE"
];

for (const entry of runtimeEntries) {
  await cp(resolve(root, entry), resolve(out, entry), { recursive: true });
}

const manifest = JSON.parse(await readFile(resolve(out, "module.json"), "utf8"));
await writeFile(resolve(out, "module.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Built runtime tree at ${out}`);
