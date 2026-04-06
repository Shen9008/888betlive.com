import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const MOVES = [
  ["index.html", "888bet-guide"],
  ["slots.html", "888bet-slots-guide"],
  ["live-casino.html", "888bet-live-guide"],
  ["table-games.html", "888bet-tables-guide"],
  ["promotions.html", "888bet-promos-guide"],
  ["about-us.html", "about-888bet-live"],
  ["help-center.html", "888bet-help-guide"],
];

for (const [file, id] of MOVES) {
  const p = path.join(ROOT, file);
  let text = fs.readFileSync(p, "utf8");
  const re = new RegExp(
    `(\\s*<section\\b[^>]*\\bid="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>[\\s\\S]*?<\\/section>\\s*)`,
    "i"
  );
  const m = text.match(re);
  if (!m) {
    console.error("NOT FOUND", file, id);
    process.exitCode = 1;
    continue;
  }
  const block = m[1];
  text = text.replace(re, "");
  const idx = text.lastIndexOf("</main>");
  if (idx === -1) {
    console.error("NO </main>", file);
    process.exitCode = 1;
    continue;
  }
  text = text.slice(0, idx) + block + "\n" + text.slice(idx);
  fs.writeFileSync(p, text, "utf8");
  console.log("OK", file, id);
}
