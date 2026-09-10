import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const source = join(root, "reconstructed");
const assets = join(root, "wayback", "assets");
const output = join(root, "dist");
const canonical = "https://iqabinet.snitko.org";

const routes = {
  "index.html": "/",
  "product.html": "/product/",
  "security.html": "/security/",
  "privacy-and-security-bill-of-rights.html": "/privacy-and-security-bill-of-rights/",
  "terms-of-service.html": "/terms-of-service/",
  "contact.html": "/contact/",
  "blog.html": "/blog/",
  "2014--05--01--are-you-organized.html": "/2014/05/01/are-you-organized/",
  "2014--06--05--privacy-and-security-bill-of-rights.html": "/2014/06/05/privacy-and-security-bill-of-rights/",
  "2014--08--04--welcome-manilla-users.html": "/2014/08/04/welcome-manilla-users/",
};

const titleFor = (route) => route === "/" ? "iQabinet" : `iQabinet | ${route.split("/").filter(Boolean).at(-1).replaceAll("-", " ")}`;

function cleanPage(html, route) {
  html = html.replace(/<div style="position:relative;z-index:99999[^>]*>Archived reconstruction[\s\S]*?<\/div>/i, "");
  html = html.replace(/<!--\s*Quick Cache[\s\S]*?-->/gi, "");
  html = html.replace(/<link rel="alternate"[^>]*>\s*/gi, "");
  html = html.replace(/<link rel="EditURI"[^>]*>\s*/gi, "");
  html = html.replace(/<link rel="wlwmanifest"[^>]*>\s*/gi, "");
  html = html.replace(/<meta name="generator"[^>]*>\s*/gi, "");
  html = html.replace(/<link rel=['"]canonical['"][^>]*>\s*/gi, "");
  html = html.replace(/<link rel=['"]shortlink['"][^>]*>\s*/gi, "");
  html = html.replace(/<meta property="og:[^"]+"[^>]*>\s*/gi, "");
  html = html.replace(/\.\.\/wayback\/assets\//g, "/media/");
  html = html.replace(/\.\/assets\//g, "/assets/");
  html = html.replace(/https?:\/\/(?:www\.)?iqabinet\.com/gi, canonical);
  html = html.replace(/https?:\/\/app\.iqabinet\.com\/(?:login|signup)\.html/gi, "/contact/");
  html = html.replace(/href="\/?\?page_id=4944"/gi, 'href="/terms-of-service/"');
  html = html.replace(/href="\/?\?p=5053"/gi, 'href="/privacy-and-security-bill-of-rights/"');
  for (const [file, target] of Object.entries(routes)) {
    html = html.replaceAll(`./${file}`, target);
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleFor(route)}</title>`);
  const meta = `\n<meta name="description" content="iQabinet brings important documents, accounts, and household information together in one secure place.">\n<meta property="og:title" content="${titleFor(route)}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${canonical}${route}">\n<meta property="og:site_name" content="iQabinet">\n<meta property="og:image" content="${canonical}/media/Logo150x46.png-704fd15d4a">\n<meta name="twitter:card" content="summary">\n<link rel="canonical" href="${canonical}${route}">`;
  html = html.replace(/<\/head>/i, `${meta}\n<link rel="stylesheet" href="/site.css">\n</head>`);
  html = html.replace(/<form data-archive-copy="true" onsubmit="return false" action="" method="post">/i, '<form id="contact-form" action="mailto:support@iqabinet.com" method="post" enctype="text/plain">');
  html = html.replace(/<a([^>]+href="\/contact\/"[^>]*)>Login<\/a>/gi, '<a$1>Contact</a>');
  html = html.replace(/<body([^>]*)>/i, `<body$1><a class="skip-link" href="#main">Skip to content</a>`);
  html = html.replace(/<\/body>/i, '<script src="/site.js" defer></script></body>');
  return html;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(assets, join(output, "media"), { recursive: true });
await cp(join(source, "assets"), join(output, "assets"), { recursive: true });

for (const [file, route] of Object.entries(routes)) {
  const page = cleanPage(await readFile(join(source, file), "utf8"), route);
  const destination = route === "/" ? join(output, "index.html") : join(output, route, "index.html");
  await mkdir(new URL(".", `file://${destination}`).pathname, { recursive: true });
  await writeFile(destination, page);
}

await writeFile(join(output, "site.js"), `document.querySelectorAll('a[href="#archived-action-disabled"]').forEach((link) => { link.href = '/contact/'; link.textContent = 'Contact'; });`);
await writeFile(join(output, "site.css"), `.skip-link{position:absolute;left:-999px;top:0;background:#fff;color:#222;padding:10px;z-index:10000}.skip-link:focus{left:0}@media (max-width:800px){#nav{display:block!important;float:none!important;clear:both!important;margin:0 auto 18px!important;text-align:center!important}#nav ul{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:0!important}#nav ul li{float:none!important;display:block!important}#nav ul li a{padding:8px 10px!important;font-size:13px!important}#header .logo{float:none!important;display:block!important;margin:0 auto 12px!important;text-align:center!important}#header .logo a{display:inline-block!important}}@media (prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`);
await writeFile(join(output, "404.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | iQabinet</title><meta name="robots" content="noindex"><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#f5f5f5;color:#333;font:18px/1.5 Arial,sans-serif}main{max-width:34rem;padding:3rem}a{color:#409b00}</style></head><body><main><img src="/media/Logo150x46.png-704fd15d4a" alt="iQabinet" width="150" height="46"><h1>Page not found</h1><p>The page you requested is not here.</p><p><a href="/">Return home</a></p></main></body></html>`);
await writeFile(join(output, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n`);
console.log(`Built ${Object.keys(routes).length} pages in ${output}`);
