// Node check of the editor's pure coordinate/manifest core, extracted from the
// HTML's <script id="editor-core"> block (no DOM needed).
import fs from "node:fs";

const html = fs.readFileSync(new URL("./hotspot_editor.html", import.meta.url), "utf8");
const m = html.match(/<script id="editor-core">([\s\S]*?)<\/script>/);
if (!m) { console.error("editor-core block not found"); process.exit(1); }
eval(m[1]); // defines globalThis.EditorCore
const EC = globalThis.EditorCore;

let pass = 0, tot = 0;
const ok = (label, cond, detail = "") => {
  tot++; if (cond) pass++;
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${label}  ${detail}`);
};

const a = EC.displayToMaster({ x: 100, y: 50, w: 200, h: 100 }, { w: 800, h: 450 }, { w: 1600, h: 900 });
ok("displayToMaster scales display->master", a.x === 200 && a.y === 100 && a.w === 400 && a.h === 200, JSON.stringify(a));

const b = EC.displayToMaster({ x: 300, y: 150, w: -200, h: -100 }, { w: 800, h: 450 }, { w: 1600, h: 900 });
ok("displayToMaster normalises an inverted drag", b.x === 200 && b.y === 100 && b.w === 400 && b.h === 200, JSON.stringify(b));

const c = EC.displayToMaster({ x: 700, y: 400, w: 400, h: 200 }, { w: 800, h: 450 }, { w: 1600, h: 900 });
ok("displayToMaster clamps to image bounds", c.x + c.w <= 1600 && c.y + c.h <= 900, JSON.stringify(c));

const man = EC.regionsToManifest("doc-workshop", { w: 1600, h: 900 },
  [{ name: "vat", x: 700, y: 300, w: 200, h: 200, critical: true }]);
ok("manifest keeps size + region + critical", man.size[0] === 1600 && man.regions[0].name === "vat" && man.regions[0].critical === true);
ok("manifest hotspot anchor is the region centre", man.hotspots[0].x === 800 && man.hotspots[0].y === 400, JSON.stringify(man.hotspots[0]));

console.log(`\n${pass}/${tot} editor-core checks passed`);
process.exit(pass === tot ? 0 : 1);
