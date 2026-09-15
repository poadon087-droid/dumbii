// Writes the sandboxed-iframe wrapper into dist/ so the probe can load it same-host.
import { writeFileSync } from "fs";
writeFileSync(new URL("../../dist/__probe_wrapper.html", import.meta.url),
  `<!doctype html><meta charset="utf-8"><iframe id="f" sandbox="allow-scripts" src="/" style="width:960px;height:540px"></iframe>`);
console.log("wrapper written to dist/__probe_wrapper.html");
