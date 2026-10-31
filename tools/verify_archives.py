#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path


def sha256(path: Path) -> str:
  digest = hashlib.sha256()
  with path.open("rb") as handle:
    for block in iter(lambda: handle.read(1024 * 1024), b""):
      digest.update(block)
  return digest.hexdigest()


def assert_true(condition: bool, message: str) -> None:
  if not condition:
    raise AssertionError(message)


def main() -> int:
  root = Path(sys.argv[1]).resolve()
  manifest = json.loads((root / "module.json").read_text(encoding="utf-8"))
  version = manifest["version"]
  release_dir = root / "dist" / "releases"
  runtime_zip = release_dir / f"runyth-fog-policy-v{version}-mod.zip"
  source_zip = release_dir / f"runyth-fog-policy-v{version}-src.zip"
  docs_zip = release_dir / f"runyth-fog-policy-v{version}-doc.zip"
  source_root = f"runyth-fog-policy-v{version}-src"
  doc_root = f"runyth-fog-policy-v{version}-doc"

  for path in (runtime_zip, source_zip, docs_zip):
    assert_true(path.is_file(), f"Missing release archive: {path}")
    with zipfile.ZipFile(path) as zf:
      bad = zf.testzip()
      assert_true(bad is None, f"Corrupt ZIP entry in {path.name}: {bad}")

  with zipfile.ZipFile(runtime_zip) as zf:
    names = set(zf.namelist())
    assert_true("runyth-fog-policy/module.json" in names, "Install ZIP lacks module.json at expected root.")
    roots = {name.split("/", 1)[0] for name in names if name}
    assert_true(roots == {"runyth-fog-policy"}, "Install ZIP has unexpected root entries.")
    packed_manifest = json.loads(zf.read("runyth-fog-policy/module.json"))
    assert_true(packed_manifest["version"] == version, "Install ZIP version mismatch.")
    for path in packed_manifest.get("esmodules", []):
      assert_true(f"runyth-fog-policy/{path}" in names, f"Missing packed esmodule: {path}")
    for path in packed_manifest.get("styles", []):
      assert_true(f"runyth-fog-policy/{path}" in names, f"Missing packed stylesheet: {path}")
    for language in packed_manifest.get("languages", []):
      path = language["path"]
      assert_true(f"runyth-fog-policy/{path}" in names, f"Missing packed language file: {path}")
    for path in (
      "scripts/main.js",
      "scripts/policy.js",
      "scripts/dashboard.js",
      "scripts/help.js",
      "scripts/errors.js",
      "scripts/core/batch-core.js",
      "scripts/core/backup-core.js",
      "scripts/core/filter-core.js",
      "scripts/core/scene-index-core.js",
      "scripts/core/window-state-core.js",
      "scripts/services/backup-service.js",
      "scripts/services/file-service.js",
      "scripts/ui/virtual-list.js",
      "templates/dashboard.hbs",
      "templates/help.hbs",
      "styles/runyth-fog-policy.css",
      "lang/en.json",
      "lang/de.json",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
    ):
      assert_true(f"runyth-fog-policy/{path}" in names, f"Missing runtime file: {path}")

  with zipfile.ZipFile(source_zip) as zf:
    names = set(zf.namelist())
    assert_true(f"{source_root}/.git/HEAD" in names, "Source ZIP lacks .git/HEAD.")
    assert_true(f"{source_root}/.git/config" in names, "Source ZIP lacks portable Git config.")
    git_config = zf.read(f"{source_root}/.git/config").decode("utf-8")
    assert_true("filemode = true" in git_config, "Source ZIP Git config must use the closed publication set.")
    assert_true("example.invalid" not in git_config, "Source ZIP Git config must not contain a placeholder identity.")
    assert_true(
      any(name.startswith(f"{source_root}/.git/objects/") and not name.endswith("/") for name in names),
      "Source ZIP lacks Git objects/history."
    )
    assert_true(f"{source_root}/module.json" in names, "Source ZIP lacks module.json.")
    assert_true(not any("/dist/" in name for name in names), "Source ZIP incorrectly includes dist/.")
    package_mode = (zf.getinfo(f"{source_root}/tools/package_release.py").external_attr >> 16) & 0o777
    manifest_mode = (zf.getinfo(f"{source_root}/module.json").external_attr >> 16) & 0o777
    assert_true(package_mode == 0o755, "Source ZIP lost tracked executable mode for package_release.py.")
    assert_true(manifest_mode == 0o644, "Source ZIP has a non-canonical mode for module.json.")

  with zipfile.ZipFile(docs_zip) as zf:
    names = set(zf.namelist())
    assert_true(
      not any(name.endswith("/module.json") or name == "module.json" for name in names),
      "Documentation ZIP must not contain module.json."
    )
    assert_true(
      f"{doc_root}/docs/architecture.md" in names,
      "Documentation ZIP lacks architecture documentation."
    )
    assert_true(
      f"{doc_root}/docs/validation-report.md" in names,
      "Documentation ZIP lacks validation report."
    )

  sums = {
    runtime_zip.name: sha256(runtime_zip),
    source_zip.name: sha256(source_zip),
    docs_zip.name: sha256(docs_zip)
  }
  checksum_path = release_dir / f"runyth-fog-policy-v{version}-SHA256SUMS.txt"
  checksum_path.write_text(
    "".join(f"{digest}  {name}\n" for name, digest in sums.items()),
    encoding="utf-8"
  )

  print("Release verification passed.")
  for name, digest in sums.items():
    print(f"{digest}  {name}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
