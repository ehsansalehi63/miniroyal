import { spawn } from "child_process";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface DeployRecord {
  id: string;
  commit: string;
  branch: string;
  author: string;
  message: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "success" | "failed";
  duration?: number;
  error?: string;
}

const HISTORY_FILE = path.join(process.cwd(), ".deploy-history.json");

async function loadHistory(): Promise<DeployRecord[]> {
  try {
    return JSON.parse(await readFile(HISTORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function saveHistory(history: DeployRecord[]) {
  await writeFile(HISTORY_FILE, JSON.stringify(history.slice(-20), null, 2), "utf8");
}

function run(command: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, env: { ...process.env, FORCE_COLOR: "0" } });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (data) => { stdout = `${stdout}${data}`.slice(-20_000); });
    child.stderr.on("data", (data) => { stderr = `${stderr}${data}`.slice(-20_000); });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}

export async function performDeploy(payload: Pick<DeployRecord, "commit" | "branch" | "author" | "message">) {
  const started = Date.now();
  const record: DeployRecord = {
    ...payload,
    id: `deploy-${Date.now()}`,
    startedAt: new Date().toISOString(),
    status: "running",
  };
  const history = await loadHistory();
  history.push(record);
  await saveHistory(history);
  const repoPath = process.env.DEPLOY_REPO_PATH || process.cwd();

  try {
    const steps: Array<[string, string[], number]> = [
      ["git", ["fetch", "origin", payload.branch], 60_000],
      ["git", ["pull", "--ff-only", "origin", payload.branch], 60_000],
      ["npm", ["ci", "--prefer-offline", "--no-audit"], 180_000],
      ["npm", ["run", "build"], 300_000],
    ];
    for (const [command, args, timeout] of steps) {
      const result = await run(command, args, repoPath, timeout);
      if (result.exitCode !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-1000)}`);
    }
    const restartCommand = (process.env.RESTART_COMMAND || "pm2 restart miniroyal").trim().split(/\s+/);
    const restart = await run(restartCommand[0], restartCommand.slice(1), repoPath, 30_000);
    if (restart.exitCode !== 0) throw new Error(`restart failed: ${restart.stderr.slice(-1000)}`);

    record.status = "success";
    record.completedAt = new Date().toISOString();
    record.duration = Date.now() - started;
    await saveHistory(history);
    return { success: true, duration: record.duration };
  } catch (error) {
    record.status = "failed";
    record.completedAt = new Date().toISOString();
    record.duration = Date.now() - started;
    record.error = error instanceof Error ? error.message : "Unknown deploy error";
    await saveHistory(history);
    return { success: false, duration: record.duration, error: record.error };
  }
}

export async function getLastDeployStatus() {
  const history = await loadHistory();
  return history.at(-1) || null;
}
