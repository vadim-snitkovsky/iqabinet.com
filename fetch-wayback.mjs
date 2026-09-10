#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./wayback/", import.meta.url));
const cdxPath = join(root, "cdx-all.json");
const manifestPath = join(root, "manifest.json");
const cutoff = "20220216205551";
const userAgent = "snitko.org research archive/1.0";
const pagePaths = new Set([
  "/",
  "/product",
  "/security",
  "/privacy-and-security-bill-of-rights",
  "/blog",
  "/contact",
  "/terms-of-service",
  "/2014/05/01/are-you-organized",
  "/2014/06/05/privacy-and-security-bill-of-rights",
  "/2014/08/04/welcome-manilla-users",
]);

await mkdir(join(root, "pages"), { recursive: true });
await mkdir(join(root, "assets"), { recursive: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(url, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent },
        redirect: "follow",
      });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
    } catch (error) {
      lastError = error;
    }
    await delay(attempt * 1500);
  }
  throw lastError;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function normalizedPath(url) {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  return path || "/";
}

function urlKey(url) {
  const parsed = new URL(url);
  return `${parsed.hostname.replace(/^www\./, "").toLowerCase()}${parsed.pathname}${parsed.search}`;
}

function urlPathKey(url) {
  const parsed = new URL(url);
  return `${parsed.hostname.replace(/^www\./, "").toLowerCase()}${parsed.pathname}`;
}

function pageSlug(url) {
  const path = normalizedPath(url).replace(/^\/+|\/+$/g, "");
  return path ? path.replaceAll("/", "--") : "home";
}

function assetName(url) {
  const parsed = new URL(url);
  const rawBase = decodeURIComponent(basename(parsed.pathname)) || "asset";
  const extension = extname(rawBase).slice(0, 12);
  const stem = rawBase.slice(0, Math.max(1, 90 - extension.length)).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
  return `${stem}-${hash}${extension && !stem.endsWith(extension) ? extension : ""}`;
}

function extractAssets(text, baseUrl) {
  const urls = new Set();
  const add = (candidate) => {
    if (!candidate || candidate.startsWith("data:") || candidate.startsWith("#")) return;
    try {
      const url = new URL(candidate.replaceAll("&amp;", "&"), baseUrl);
      if (
        ["http:", "https:"].includes(url.protocol) &&
        /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|eot|ttf|otf|pdf)$/i.test(url.pathname)
      ) {
        urls.add(url.href);
      }
    } catch {}
  };

  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const candidate = match[1];
    if (/\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|eot|ttf|otf|pdf)(?:\?|$)/i.test(candidate)) add(candidate);
  }
  for (const match of text.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) add(candidate.trim().split(/\s+/)[0]);
  }
  for (const match of text.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/gi)) {
    add(match[1] || match[2] || match[3]);
  }
  return urls;
}

const cdx = JSON.parse(await readFile(cdxPath, "utf8"));
const [header, ...rows] = cdx;
const columns = Object.fromEntries(header.map((name, index) => [name, index]));
const eligibleRows = rows.filter((row) => row[columns.timestamp] <= cutoff);

const archiveIndex = new Map();
const archivePathIndex = new Map();
for (const row of eligibleRows) {
  const key = urlKey(row[columns.original]);
  const pathKey = urlPathKey(row[columns.original]);
  const current = archiveIndex.get(key);
  if (!current || current[columns.timestamp] < row[columns.timestamp]) archiveIndex.set(key, row);
  const pathCurrent = archivePathIndex.get(pathKey);
  if (!pathCurrent || pathCurrent[columns.timestamp] < row[columns.timestamp]) {
    archivePathIndex.set(pathKey, row);
  }
}

const latestPages = new Map();
for (const row of eligibleRows) {
  if (row[columns.mimetype] !== "text/html") continue;
  const path = normalizedPath(row[columns.original]);
  if (!pagePaths.has(path)) continue;
  const current = latestPages.get(path);
  if (!current || current[columns.timestamp] < row[columns.timestamp]) latestPages.set(path, row);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  archive: "Internet Archive Wayback Machine",
  domain: "www.iqabinet.com",
  cutoff,
  cutoffReason: "Last complete iQabinet site capture before parked-domain pages appeared",
  capturesIndexed: rows.length,
  selection: "latest successful capture at or before the cutoff for each selected content page",
  pagesSaved: latestPages.size,
  files: [],
};

const assetQueue = new Map();
for (const row of latestPages.values()) {
  const timestamp = row[columns.timestamp];
  const original = row[columns.original];
  const archiveUrl = `https://web.archive.org/web/${timestamp}id_/${original}`;
  const response = await request(archiveUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const slug = pageSlug(original);
  const localPath = join("pages", slug, `${timestamp}.html`);
  await mkdir(join(root, "pages", slug), { recursive: true });
  await writeFile(join(root, localPath), buffer);
  manifest.files.push({
    kind: "page",
    timestamp,
    sourceUrl: original,
    archiveUrl,
    localPath,
    contentType: response.headers.get("content-type"),
    bytes: buffer.length,
    sha256: sha256(buffer),
  });
  for (const assetUrl of extractAssets(buffer.toString("utf8"), original)) {
    if (!assetQueue.has(assetUrl)) assetQueue.set(assetUrl, timestamp);
  }
  await delay(200);
}

for (const [sourceUrl, pageTimestamp] of assetQueue) {
  const indexed = archiveIndex.get(urlKey(sourceUrl)) || archivePathIndex.get(urlPathKey(sourceUrl));
  const timestamp = indexed?.[columns.timestamp] || pageTimestamp;
  const archivedOriginal = indexed?.[columns.original] || sourceUrl;
  const archiveUrl = `https://web.archive.org/web/${timestamp}id_/${archivedOriginal}`;
  let response;
  try {
    response = await request(archiveUrl, 3);
  } catch (error) {
    manifest.files.push({
      kind: "asset",
      timestamp,
      sourceUrl,
      archiveUrl,
      obtainedFrom: "unavailable",
      error: error.message,
    });
    continue;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const localPath = join("assets", assetName(sourceUrl));
  await writeFile(join(root, localPath), buffer);
  manifest.files.push({
    kind: "asset",
    timestamp,
    sourceUrl,
    archiveUrl,
    obtainedFrom: "wayback",
    localPath,
    contentType: response.headers.get("content-type"),
    bytes: buffer.length,
    sha256: sha256(buffer),
  });
  if (/\.css(?:\?|$)/i.test(sourceUrl)) {
    for (const nestedUrl of extractAssets(buffer.toString("utf8"), sourceUrl)) {
      if (!assetQueue.has(nestedUrl)) assetQueue.set(nestedUrl, timestamp);
    }
  }
  await delay(200);
}

manifest.fileCount = manifest.files.length;
manifest.totalBytes = manifest.files.reduce((sum, file) => sum + (file.bytes || 0), 0);
manifest.unavailableCount = manifest.files.filter((file) => file.obtainedFrom === "unavailable").length;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Saved ${manifest.pagesSaved} pages and ${manifest.fileCount - manifest.pagesSaved} asset records. ${manifest.unavailableCount} unavailable.`,
);
