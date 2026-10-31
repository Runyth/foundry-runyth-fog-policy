// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
execFileSync("python3", [resolve(root, "tools", "package_release.py"), root], {
  cwd: root,
  stdio: "inherit"
});
