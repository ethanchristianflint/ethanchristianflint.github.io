// Serves _site locally and runs axe-core (WCAG 2.0–2.2 A/AA + best practices) on every HTML page.
// Also checks the layout at 320px wide (WCAG 1.4.10 Reflow) for horizontal scrolling.
// Exits non-zero on any violation.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const ROOT = "_site";
const types = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2" };

function pages(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return pages(p);
    return p.endsWith(".html") ? [p.slice(ROOT.length).replace(/index\.html$/, "")] : [];
  });
}

const server = createServer(async (req, res) => {
  let path = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (path.endsWith("/")) path += "index.html";
  try {
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
let failures = 0;
for (const url of pages(ROOT)) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(base + url, { waitUntil: "networkidle0" });
  await page.evaluate(axeSource);
  const { violations } = await page.evaluate(() =>
    axe.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } })
  );
  await page.setViewport({ width: 320, height: 640 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (violations.length || overflow) failures++;
  console.log(`${violations.length || overflow ? "FAIL" : "pass"}  ${url}`);
  for (const v of violations) {
    console.log(`  - [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(" ")}`);
  }
  if (overflow) console.log("  - horizontal scrolling at 320px (WCAG 1.4.10 Reflow)");
  await page.close();
}
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
