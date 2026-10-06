import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
execFileSync("python3", [resolve(root, "tools", "verify_archives.py"), root], {
  cwd: root,
  stdio: "inherit"
});
