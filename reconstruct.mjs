#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const detailRoot = fileURLToPath(new URL("./", import.meta.url));
const archiveRoot = join(detailRoot, "wayback");
const outputRoot = join(detailRoot, "reconstructed");
const outputAssets = join(outputRoot, "assets");
const manifest = JSON.parse(await readFile(join(archiveRoot, "manifest.json"), "utf8"));
const availableAssets = manifest.files.filter(
  (file) => file.kind === "asset" && file.obtainedFrom !== "unavailable",
);

await mkdir(outputAssets, { recursive: true });

const assetByUrl = new Map(availableAssets.map((file) => [file.sourceUrl, file]));
const assetByPath = new Map();
for (const file of availableAssets) {
  const parsed = new URL(file.sourceUrl);
  assetByPath.set(`${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`, file);
}

function findAsset(url) {
  const exact = assetByUrl.get(url);
  if (exact) return exact;
  const parsed = new URL(url);
  return assetByPath.get(`${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`);
}

function rewriteCss(css, sourceUrl) {
  return css.replace(
    /url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi,
    (whole, doubleQuoted, singleQuoted, bare) => {
      const candidate = doubleQuoted || singleQuoted || bare;
      try {
        const absolute = new URL(candidate, sourceUrl).href;
        const asset = findAsset(absolute);
        return asset ? `url("../../wayback/${asset.localPath}")` : whole;
      } catch {
        return whole;
      }
    },
  );
}

const cssOutputs = new Map();
for (const asset of availableAssets.filter((file) => file.contentType?.startsWith("text/css"))) {
  const outputName = `${basename(asset.localPath)}.css`;
  const css = await readFile(join(archiveRoot, asset.localPath), "utf8");
  await writeFile(join(outputAssets, outputName), rewriteCss(css, asset.sourceUrl));
  cssOutputs.set(asset.sourceUrl, `./assets/${outputName}`);
}

const pages = manifest.files.filter((file) => file.kind === "page");
const routeNames = new Map();
for (const page of pages) {
  const parsed = new URL(page.sourceUrl);
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const slug = path === "/" ? "index" : path.replace(/^\//, "").replaceAll("/", "--");
  routeNames.set(path, `${slug}.html`);
}

for (const page of pages) {
  let html = await readFile(join(archiveRoot, page.localPath), "utf8");
  for (const asset of availableAssets) {
    const replacement = cssOutputs.get(asset.sourceUrl) || `../wayback/${asset.localPath}`;
    html = html.replaceAll(asset.sourceUrl, replacement);
  }
  for (const [route, name] of routeNames) {
    html = html.replaceAll(`href="${route}/"`, `href="./${name}"`);
    html = html.replaceAll(`href="${route}"`, `href="./${name}"`);
  }
  html = html.replace(/href="(?:https?:\/\/www\.iqabinet\.com)?\/(?:login|signup)\.html"/gi, 'href="#archived-action-disabled"');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<form\b/gi, '<form data-archive-copy="true" onsubmit="return false"');
  html = html.replace(
    /<body([^>]*)>/i,
    `<body$1><div style="position:relative;z-index:99999;padding:10px 16px;background:#fff3a6;color:#161616;font:600 14px/1.4 system-ui;text-align:center">Archived reconstruction. Forms and tracking scripts are disabled. ${manifest.unavailableCount} legacy theme references were not preserved by the archive.</div>`,
  );
  const route = new URL(page.sourceUrl).pathname.replace(/\/+$/, "") || "/";
  await writeFile(join(outputRoot, routeNames.get(route)), html);
}

console.log(`Reconstructed ${pages.length} pages in ${outputRoot}`);
