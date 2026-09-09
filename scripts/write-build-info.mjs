// Writes build-time deployment metadata consumed by /api/system-status.
// Runs automatically before every `npm run build` via the `prebuild` hook
// (including builds on Hostinger), so the live site always reports WHICH
// commit is actually serving traffic — no more guessing whether a deploy
// picked up the latest code. The output file is gitignored by design.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function git(command) {
  try {
    return execSync(`git ${command}`, { cwd: root, encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

const info = {
  commit: git("rev-parse --short HEAD"),
  commitFull: git("rev-parse HEAD"),
  branch: git("rev-parse --abbrev-ref HEAD"),
  builtAt: new Date().toISOString(),
};

writeFileSync(path.join(root, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(`[build-info] commit=${info.commit || "unknown"} branch=${info.branch || "unknown"}`);
