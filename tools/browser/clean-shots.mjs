import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shotsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
fs.rmSync(shotsDir, { recursive: true, force: true });
fs.mkdirSync(shotsDir, { recursive: true });
console.log(`Cleaned browser screenshots: ${shotsDir}`);
