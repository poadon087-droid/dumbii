import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] || "all";
const tmpRoot = path.join(os.tmpdir(), "buo-tests");
fs.rmSync(tmpRoot, { recursive: true, force: true });
fs.mkdirSync(tmpRoot, { recursive: true });

const configs = {
  all: [
    { label: "sim", file: "tests/sim.ts", output: "hedde-sim.mjs" },
    { label: "features", file: "tests/features.test.ts", output: "hedde-feat.mjs" },
    { label: "render", file: "tests/render.test.ts", output: "hedde-render.mjs" },
  ],
  perf: [{ label: "perf", file: "tests/perf.ts", output: "hedde-perf.mjs" }],
};

const entries = configs[mode];
if (!entries) {
  console.error(`Unknown test mode: ${mode}`);
  process.exit(1);
}

const runShellCommand = (command) => {
  const shell = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "/bin/sh";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-lc", command];
  const result = spawnSync(shell, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

for (const entry of entries) {
  const outFile = path.join(tmpRoot, entry.output).replace(/\\/g, "/");
  const buildCommand = `npx esbuild ${entry.file} --bundle --platform=node --format=esm --outfile=${outFile} --log-level=error`;

  runShellCommand(buildCommand);

  const run = spawnSync(process.execPath, [outFile], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
}

console.log(`Completed ${mode} test run in ${tmpRoot}`);
