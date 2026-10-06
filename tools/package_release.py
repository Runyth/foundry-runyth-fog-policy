#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

FIXED_TIME = (2026, 1, 1, 0, 0, 0)
FILE_MODE = 0o100644 << 16
EXEC_MODE = 0o100755 << 16
DIR_MODE = 0o40755 << 16


def zip_info(name: str, is_dir: bool = False, executable: bool = False) -> zipfile.ZipInfo:
  if is_dir and not name.endswith("/"):
    name += "/"
  info = zipfile.ZipInfo(name, FIXED_TIME)
  info.create_system = 3
  info.compress_type = zipfile.ZIP_DEFLATED
  info.external_attr = DIR_MODE if is_dir else (EXEC_MODE if executable else FILE_MODE)
  return info


def add_tree(zf: zipfile.ZipFile, source: Path, archive_root: str, exclude=None) -> None:
  exclude = exclude or (lambda _p: False)
  directories = set()
  files = []
  for path in source.rglob("*"):
    rel = path.relative_to(source)
    if exclude(rel):
      continue
    if path.is_dir():
      directories.add(rel)
    elif path.is_file():
      files.append(rel)
      parent = rel.parent
      while parent != Path("."):
        directories.add(parent)
        parent = parent.parent

  zf.writestr(zip_info(f"{archive_root}/", is_dir=True), b"")
  for rel in sorted(directories, key=lambda p: p.as_posix()):
    zf.writestr(zip_info(f"{archive_root}/{rel.as_posix()}", is_dir=True), b"")

  for rel in sorted(files, key=lambda p: p.as_posix()):
    path = source / rel
    executable = os.access(path, os.X_OK)
    zf.writestr(zip_info(f"{archive_root}/{rel.as_posix()}", executable=executable), path.read_bytes())


def add_selected(zf: zipfile.ZipFile, root: Path, archive_root: str, entries: list[str]) -> None:
  zf.writestr(zip_info(f"{archive_root}/", is_dir=True), b"")
  dirs = set()
  files = []
  for entry in entries:
    path = root / entry
    if path.is_dir():
      for child in path.rglob("*"):
        rel = child.relative_to(root)
        if child.is_dir():
          dirs.add(rel)
        elif child.is_file():
          files.append(rel)
          parent = rel.parent
          while parent != Path("."):
            dirs.add(parent)
            parent = parent.parent
    elif path.is_file():
      files.append(Path(entry))

  for rel in sorted(dirs, key=lambda p: p.as_posix()):
    zf.writestr(zip_info(f"{archive_root}/{rel.as_posix()}", is_dir=True), b"")
  for rel in sorted(set(files), key=lambda p: p.as_posix()):
    path = root / rel
    zf.writestr(zip_info(f"{archive_root}/{rel.as_posix()}", executable=os.access(path, os.X_OK)), path.read_bytes())


def main() -> int:
  root = Path(sys.argv[1]).resolve()
  manifest = json.loads((root / "module.json").read_text(encoding="utf-8"))
  version = manifest["version"]
  release_dir = root / "dist" / "releases"
  runtime_dir = root / "dist" / "runyth-fog-policy"
  release_dir.mkdir(parents=True, exist_ok=True)

  runtime_zip = release_dir / f"runyth-fog-policy-{version}.zip"
  source_zip = release_dir / f"runyth-fog-policy-source-{version}.zip"
  docs_zip = release_dir / f"runyth-fog-policy-docs-{version}.zip"

  for archive in (runtime_zip, source_zip, docs_zip):
    archive.unlink(missing_ok=True)

  with zipfile.ZipFile(runtime_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    add_tree(zf, runtime_dir, "runyth-fog-policy")

  def source_exclude(rel: Path) -> bool:
    parts = rel.parts
    if not parts:
      return False
    if parts[0] in {"dist", "node_modules"}:
      return True
    if rel.as_posix() in {".git/index.lock", ".git/packed-refs.lock"}:
      return True
    return any(part in {"__pycache__"} for part in parts) or rel.suffix in {".pyc"}

  with zipfile.ZipFile(source_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    add_tree(zf, root, "runyth-fog-policy", exclude=source_exclude)

  with zipfile.ZipFile(docs_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    add_selected(
      zf,
      root,
      "runyth-fog-policy-docs",
      ["README.md", "CHANGELOG.md", "LICENSE", "CONTRIBUTING.md", "docs"]
    )

  print(runtime_zip)
  print(source_zip)
  print(docs_zip)
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
