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

const homeHero = `<section class="archive-hero" aria-labelledby="archive-hero-title"><div class="archive-hero-inner"><h1 id="archive-hero-title">Are You<br>Organized?</h1><div class="archive-hero-actions"><button class="archive-hero-button" type="button" data-video-open>Watch Video</button><a class="archive-hero-button" href="/contact/">Contact Us</a></div></div></section><dialog class="video-dialog" aria-label="iQabinet demo video"><button class="video-close" type="button" data-video-close aria-label="Close video">×</button><div class="video-frame"><iframe title="iQabinet demo video" data-vimeo-src="https://player.vimeo.com/video/104158849" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div><p class="video-fallback"><a href="https://vimeo.com/104158849" target="_blank" rel="noopener">Open the demo on Vimeo</a></p></dialog>`;
const contactPanel = `<section class="contact-panel" aria-labelledby="contact-panel-title"><details><summary id="contact-panel-title">Contact us</summary><div class="contact-panel-body"><p>For questions about iQabinet, connect with us on LinkedIn.</p><a class="contact-linkedin" href="https://www.linkedin.com/in/vadimsnitkovsky/" target="_blank" rel="noopener">Open LinkedIn <span aria-hidden="true">↗</span></a></div></details></section>`;

const titleFor = (route) => route === "/" ? "iQabinet" : `iQabinet | ${route.split("/").filter(Boolean).at(-1).replaceAll("-", " ")}`;

function cleanPage(html, route) {
  html = html.replace(/<div style="position:relative;z-index:99999[^>]*>Archived reconstruction[\s\S]*?<\/div>/i, "");
  html = html.replace(/<!--\s*Quick Cache[\s\S]*?-->/gi, "");
  html = html.replace(/<link rel="alternate"[^>]*>\s*/gi, "");
  html = html.replace(/<!--<style[^>]*bootstrap\.css[^>]*><\/style>-->\s*/gi, "");
  html = html.replace(/<link rel="EditURI"[^>]*>\s*/gi, "");
  html = html.replace(/<link rel="wlwmanifest"[^>]*>\s*/gi, "");
  html = html.replace(/<meta name="generator"[^>]*>\s*/gi, "");
  html = html.replace(/<link rel=['"]canonical['"][^>]*>\s*/gi, "");
  html = html.replace(/<link rel=['"]shortlink['"][^>]*>\s*/gi, "");
  html = html.replace(/<meta property="og:[^"]+"[^>]*>\s*/gi, "");
  html = html.replace(/url\(http:\/\/theme-fusion\.com\/avadaxml\/wp-content\/themes\/Avada\/images\/page_title_bg\.png\)/gi, "none");
  html = html.replace(/\.\.\/wayback\/assets\//g, "/media/");
  html = html.replace(/\.\/assets\//g, "/assets/");
  html = html.replace(/https?:\/\/(?:www\.)?iqabinet\.com/gi, canonical);
  html = html.replace(/<li\b[^>]*\bmenu-item-5078\b[^>]*>\s*<a\b[^>]*>Login<\/a>\s*<\/li>/gi, "");
  html = html.replace(/https?:\/\/app\.iqabinet\.com\/(?:login|signup)\.html/gi, "/contact/");
  html = html.replace(/www\.iqabinet\.com\/signup/gi, "/contact/");
  html = html.replace(/href=(['"])(?:\.\/)?\?page_id=4944\1/gi, 'href="/terms-of-service/"');
  html = html.replace(/href=(['"])(?:\.\/)?\?p=5053\1/gi, 'href="/privacy-and-security-bill-of-rights/"');
  html = html.replace(new RegExp(`href=(['"])${canonical}\\/(?:author\\/iqabinet|category\\/(?:organization|security))\\/\\1`, "gi"), 'href="/blog/"');
  for (const [file, target] of Object.entries(routes)) {
    html = html.replaceAll(`./${file}`, target);
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleFor(route)}</title>`);
  const meta = `\n<meta name="description" content="iQabinet brings important documents, accounts, and household information together in one secure place.">\n<meta property="og:title" content="${titleFor(route)}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${canonical}${route}">\n<meta property="og:site_name" content="iQabinet">\n<meta property="og:image" content="${canonical}/media/Logo150x46.png-704fd15d4a">\n<meta name="twitter:card" content="summary">\n<link rel="canonical" href="${canonical}${route}">`;
  html = html.replace(/<\/head>/i, `${meta}\n<link rel="stylesheet" href="/site.css">\n</head>`);
  if (route === "/contact/") {
    html = html.replace(/<form\b[\s\S]*?<\/form>/i, contactPanel);
  }
  html = html.replace(/(<a\b[^>]*href="\/contact\/"[^>]*>[\s\S]*?)\bSign Up\b([\s\S]*?<\/a>)/gi, "$1Contact Us$2");
  if (route.startsWith("/2014/")) {
    html = html.replace(/(<a\b[^>]*\brel="prev"[^>]*>)[\s\S]*?<\/a>/i, '$1<span class="blog-nav-arrow" aria-hidden="true">←</span><span>Previous article</span></a>');
    html = html.replace(/(<a\b[^>]*\brel="next"[^>]*>)[\s\S]*?<\/a>/i, '$1<span>Next article</span><span class="blog-nav-arrow" aria-hidden="true">→</span></a>');
  }
  if (route === "/") {
    html = html.replace(/\s*<div id="sliders-container">[\s\S]*?<\/div>\s*<div id="main"/i, `\n${homeHero}\n<div id="main"`);
  }
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

await writeFile(join(output, "site.js"), `document.querySelectorAll('a[href="#archived-action-disabled"]').forEach((link) => { link.href = '/contact/'; link.textContent = 'Contact'; });
document.querySelectorAll('.excerpt-container').forEach((excerpt) => { const post = excerpt.closest('.post'); const article = post?.querySelector('.entry-title a'); if (!article || !excerpt.textContent.includes('…')) return; excerpt.querySelectorAll('p').forEach((paragraph) => { const text = paragraph.textContent; const cutoff = text.indexOf('…'); if (cutoff < 0) return; const link = document.createElement('a'); link.className = 'article-ellipsis'; link.href = article.href; link.setAttribute('aria-label', 'Read the full article: ' + article.textContent.trim()); link.textContent = '…'; const visible = text.slice(0, cutoff).replace(' [', ' ').trimEnd(); paragraph.replaceChildren(document.createTextNode(visible + ' '), link); }); });
document.querySelectorAll('.entry-read-more a').forEach((link) => { link.textContent = 'Read More →'; });
const dialog = document.querySelector('.video-dialog'); const openVideo = document.querySelector('[data-video-open]'); const closeVideo = document.querySelector('[data-video-close]'); const frame = dialog?.querySelector('iframe'); const close = () => { dialog?.close(); if (frame) frame.src = ''; }; openVideo?.addEventListener('click', () => { if (frame) frame.src = frame.dataset.vimeoSrc; dialog?.showModal(); }); closeVideo?.addEventListener('click', close); dialog?.addEventListener('click', (event) => { if (event.target === dialog) close(); }); dialog?.addEventListener('close', () => { if (frame) frame.src = ''; });`);
await writeFile(join(output, "site.css"), `.skip-link{position:absolute;left:-999px;top:0;background:#fff;color:#222;padding:10px;z-index:10000}.skip-link:focus{left:0}.archive-hero{min-height:520px;background:linear-gradient(90deg,rgba(255,255,255,.9) 0%,rgba(255,255,255,.62) 38%,rgba(255,255,255,.04) 66%),url('/media/mainbackgroud-compressed-optimized.jpg-a1952d28c5') center/cover no-repeat;display:flex;align-items:center}.archive-hero-inner{width:1100px;margin:0 auto;padding:54px 30px}.archive-hero h1{margin:0;color:#409b00;font-size:60px;line-height:1.4}.archive-hero-actions{display:flex;gap:12px;margin-top:24px}.archive-hero-button{appearance:none;border:1px solid #409b00;border-radius:5px;background:#409b00;color:#fff;cursor:pointer;font:inherit;padding:12px 21px;text-decoration:none}.archive-hero-button:hover,.archive-hero-button:focus{background:transparent;color:#409b00}.video-dialog{border:0;box-shadow:0 18px 70px rgba(0,0,0,.42);max-width:min(960px,92vw);padding:0}.video-dialog::backdrop{background:rgba(0,0,0,.72)}.video-frame{width:min(960px,92vw);aspect-ratio:16/9}.video-frame iframe{border:0;height:100%;width:100%}.video-fallback{margin:0;padding:12px 16px;text-align:center}.video-fallback a{color:#409b00}.video-close{background:#fff;border:0;border-radius:50%;color:#222;cursor:pointer;font-size:30px;line-height:1;position:absolute;right:-14px;top:-14px;width:36px;height:36px}.contact-panel{margin:28px 0 48px;max-width:680px}.contact-panel details{background:#f6f6f6;border:1px solid #409b00;border-top-width:3px}.contact-panel summary{align-items:center;color:#333;cursor:pointer;display:flex;font-size:22px;font-weight:700;justify-content:space-between;list-style:none;padding:20px 24px}.contact-panel summary::-webkit-details-marker{display:none}.contact-panel summary::after{color:#409b00;content:'+';font-size:29px;font-weight:400;line-height:1}.contact-panel details[open] summary::after{content:'−'}.contact-panel-body{border-top:1px solid #d8d8d8;padding:4px 24px 24px}.contact-panel-body p{font-size:17px;line-height:1.6}.contact-linkedin{background:#409b00;border:1px solid #409b00;border-radius:4px;color:#fff;display:inline-block;font-weight:700;padding:11px 16px;text-decoration:none}.contact-linkedin:hover,.contact-linkedin:focus{background:#fff;color:#409b00}.single-navigation{align-items:center;display:flex!important;gap:12px;justify-content:space-between;margin:26px 0!important;padding:0!important}.single-navigation a{background:#409b00!important;border-radius:4px!important;color:#fff!important;display:inline-flex!important;align-items:center;gap:8px;justify-content:center;min-height:44px;padding:9px 14px!important;text-decoration:none!important}.single-navigation a[rel=next]{margin-left:auto}.blog-nav-arrow{font-size:21px;line-height:1}.single-navigation a[rel=prev]::before,.single-navigation a[rel=next]::after{content:none!important}.entry-read-more a::after{content:none!important}.article-ellipsis{color:#409b00;font-size:22px;font-weight:bold;text-decoration:none}.article-ellipsis:focus,.single-navigation a:focus,.archive-hero-button:focus,.video-close:focus,.contact-panel summary:focus,.contact-linkedin:focus{outline:3px solid #222;outline-offset:3px}@media (max-width:800px){#nav{display:block!important;float:none!important;clear:both!important;margin:0 auto 18px!important;text-align:center!important}#nav ul{display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:0!important}#nav ul li{float:none!important;display:block!important}#nav ul li a{padding:8px 10px!important;font-size:13px!important}#header .logo{float:none!important;display:block!important;margin:0 auto 12px!important;text-align:center!important}#header .logo a{display:inline-block!important}.archive-hero{min-height:420px;background-position:62% center}.archive-hero-inner{padding:42px 24px}.archive-hero h1{font-size:44px;line-height:1.2}.archive-hero-actions{flex-wrap:wrap}.contact-panel summary{padding:18px}.contact-panel-body{padding:4px 18px 20px}.single-navigation{flex-wrap:wrap;margin:20px 0!important}.single-navigation a{flex:1 1 180px}.single-navigation a[rel=next]{margin-left:0}}@media (prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`);
await writeFile(join(output, "404.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | iQabinet</title><meta name="robots" content="noindex"><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#f5f5f5;color:#333;font:18px/1.5 Arial,sans-serif}main{max-width:34rem;padding:3rem}a{color:#409b00}</style></head><body><main><img src="/media/Logo150x46.png-704fd15d4a" alt="iQabinet" width="150" height="46"><h1>Page not found</h1><p>The page you requested is not here.</p><p><a href="/">Return home</a></p></main></body></html>`);
await writeFile(join(output, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n`);
console.log(`Built ${Object.keys(routes).length} pages in ${output}`);
