import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import { resolve, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignored = new Set([".git", "dist", "node_modules"]);

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) continue;
    const full = resolve(directory, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const files = walk(root);
const jsFiles = files.filter((file) => /\.(?:js|mjs)$/.test(file));
const jsonFiles = files.filter((file) => file.endsWith(".json"));

for (const file of jsFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  const source = readFileSync(file, "utf8");
  if (source.includes("\t")) throw new Error(`Tab indentation found in ${relative(root, file)}`);
}

const runtimeJsFiles = jsFiles.filter((file) => relative(root, file).startsWith("scripts/"));
for (const file of runtimeJsFiles) {
  const source = readFileSync(file, "utf8");
  if (/\bFormApplication\b/.test(source)) {
    throw new Error(`Deprecated FormApplication reference found in ${relative(root, file)}`);
  }
  if (/\b(?:TODO|FIXME)\b/.test(source)) {
    throw new Error(`Unresolved TODO/FIXME found in ${relative(root, file)}`);
  }
}

for (const file of jsonFiles) {
  JSON.parse(readFileSync(file, "utf8"));
}

const manifest = JSON.parse(readFileSync(resolve(root, "module.json"), "utf8"));
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
if (manifest.id !== "runyth-fog-policy") throw new Error("Unexpected manifest id.");
if (manifest.version !== pkg.version) throw new Error("Manifest/package version mismatch.");

for (const runtimePath of [
  ...(manifest.esmodules ?? []),
  ...(manifest.styles ?? []),
  ...(manifest.languages ?? []).map((entry) => entry.path),
  manifest.license
].filter(Boolean)) {
  if (!existsSync(resolve(root, runtimePath))) {
    throw new Error(`Manifest path does not exist: ${runtimePath}`);
  }
}

function flattenKeys(object, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

const en = JSON.parse(readFileSync(resolve(root, "lang/en.json"), "utf8"));
const de = JSON.parse(readFileSync(resolve(root, "lang/de.json"), "utf8"));
const enKeys = flattenKeys(en);
const deKeys = flattenKeys(de);
if (JSON.stringify(enKeys) !== JSON.stringify(deKeys)) {
  throw new Error("English and German localization keys differ.");
}

const runtimeSources = files
  .filter((file) => /\.(?:js|hbs)$/.test(file) && !relative(root, file).startsWith("tests/"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const referencedKeys = new Set(
  [...runtimeSources.matchAll(/RUNYTH_FOG_POLICY(?:\.[A-Za-z0-9_]+)+/g)].map((match) => match[0])
);
const availableKeys = new Set(enKeys);
for (const key of referencedKeys) {
  if (!availableKeys.has(key) && !key.endsWith(".Status")) {
    const dynamicStatus = key.startsWith("RUNYTH_FOG_POLICY.Dashboard.Status.");
    if (!dynamicStatus) throw new Error(`Missing localization key: ${key}`);
  }
}

console.log(`Lint passed: ${jsFiles.length} JavaScript files, ${jsonFiles.length} JSON files.`);
