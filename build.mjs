import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const source = join(root, "reconstructed");
const assets = join(root, "wayback", "assets");
const styles = join(root, "src");
const output = join(root, "dist");
const canonical = "https://iqabinet.snitko.org";

const description =
  "iQabinet brings important documents, accounts, and household information together in one secure place.";

const pages = {
  "index.html": {
    route: "/",
    title: "iQabinet",
    nav: "/",
    description,
  },
  "product.html": {
    route: "/product/",
    title: "Product | iQabinet",
    nav: "/product/",
    description:
      "Nine iQabinet capabilities: a guided interview, finish-later reminders, automatic statement retrieval, uploads, search, sharing, ownership tags, storage-location tags, and archiving.",
  },
  "security.html": {
    route: "/security/",
    title: "Security | iQabinet",
    nav: "/security/",
    layout: "prose",
    description:
      "How iQabinet secured customer records: AES-128 encryption with a per-user key, HMAC-hashed index fields, SSL on every connection, and Amazon S3 durability.",
  },
  "privacy-and-security-bill-of-rights.html": {
    route: "/privacy-and-security-bill-of-rights/",
    title: "Privacy and Security Bill of Rights | iQabinet",
    nav: "/privacy-and-security-bill-of-rights/",
    layout: "prose",
    description:
      "Ten commitments iQabinet made to its customers, starting with the first one: you are our customer, not our product.",
  },
  "terms-of-service.html": {
    route: "/terms-of-service/",
    title: "Terms of Service | iQabinet",
    nav: null,
    layout: "prose",
    description: "The iQabinet terms of service, last updated March 4, 2014.",
  },
  "contact.html": {
    route: "/contact/",
    title: "Contact | iQabinet",
    nav: "/contact/",
    description: "Get in touch about iQabinet.",
  },
  "blog.html": {
    route: "/blog/",
    title: "Blog | iQabinet",
    nav: "/blog/",
    description: "Announcements and writing from the iQabinet team.",
  },
  "2014--05--01--are-you-organized.html": {
    route: "/2014/05/01/are-you-organized/",
    title: "Are You Organized? | iQabinet",
    nav: "/blog/",
    layout: "prose",
    description:
      "The question that started iQabinet, asked after running out of filing-cabinet space in a home office.",
  },
  "2014--06--05--privacy-and-security-bill-of-rights.html": {
    route: "/2014/06/05/privacy-and-security-bill-of-rights/",
    title: "Privacy and Security Bill of Rights | iQabinet",
    nav: "/blog/",
    layout: "prose",
    description:
      "Why iQabinet wrote its privacy policy as a set of customer rights rather than a legal disclaimer.",
  },
  "2014--08--04--welcome-manilla-users.html": {
    route: "/2014/08/04/welcome-manilla-users/",
    title: "Welcome Manilla Users | iQabinet",
    nav: "/blog/",
    layout: "prose",
    description:
      "What iQabinet built for Manilla customers after that service announced it would shut down on September 30, 2014.",
  },
};

const navigation = [
  ["/", "Home"],
  ["/product/", "Product"],
  ["/security/", "Security"],
  ["/privacy-and-security-bill-of-rights/", "Bill of Rights"],
  ["/blog/", "Blog"],
  ["/contact/", "Contact Us"],
];

const mediaAliases = [
  ["iqab_banner_fb-320x202.jpg-7a1246aeb9", "blog-welcome.jpg"],
  ["bill-of-rights-hero-lg-320x202.jpg-6224cd0ceb", "blog-bill-of-rights.jpg"],
  ["Are-you-organized-blog2-320x202.png-93aae262d3", "blog-organized.png"],
];

const logo = "/media/Logo150x46.png-704fd15d4a";

const socialIcons = {
  Facebook:
    '<path d="M13.5 22v-8h2.69l.4-3.12H13.5V8.89c0-.9.25-1.52 1.55-1.52h1.65V4.58a22 22 0 0 0-2.4-.12c-2.38 0-4.01 1.45-4.01 4.11v2.31H7.6V14h2.69v8Z"/>',
  Twitter:
    '<path d="M22 5.92c-.74.33-1.53.55-2.36.65a4.12 4.12 0 0 0 1.8-2.27c-.8.47-1.69.81-2.63 1a4.11 4.11 0 0 0-7.03 3.75A11.67 11.67 0 0 1 3.4 4.75a4.11 4.11 0 0 0 1.28 5.49c-.67-.02-1.3-.21-1.86-.51v.05a4.12 4.12 0 0 0 3.3 4.03 4.2 4.2 0 0 1-1.86.07 4.12 4.12 0 0 0 3.85 2.86A8.26 8.26 0 0 1 2 18.43a11.65 11.65 0 0 0 6.29 1.84c7.55 0 11.68-6.25 11.68-11.67l-.01-.53A8.3 8.3 0 0 0 22 5.92Z"/>',
};

const socialLinks = [
  ["Facebook", "https://www.facebook.com/iqabinet"],
  ["Twitter", "https://twitter.com/iQabinet"],
];

/* ---------- fragments ---------- */

function header(nav, exact) {
  const items = navigation
    .map(([href, label]) => {
      // aria-current="page" is only true for an exact match; a blog post just
      // highlights its section.
      const current = nav === href ? (exact ? ' aria-current="page"' : ' class="is-section"') : "";
      return `<li><a href="${href}"${current}>${label}</a></li>`;
    })
    .join("");

  return `<header class="site-header">
<div class="wrap site-header-inner">
<a class="brand" href="/"><img src="${logo}" alt="iQabinet" width="150" height="46"></a>
<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><svg class="nav-toggle-icon" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path class="bar-top" d="M2.5 5.5h15"/><path class="bar-mid" d="M2.5 10h15"/><path class="bar-bot" d="M2.5 14.5h15"/></svg><span>Menu</span></button>
<nav id="site-nav" class="site-nav" aria-label="Primary"><ul>${items}</ul></nav>
</div>
</header>`;
}

function footer(note) {
  const links = navigation
    .concat([["/terms-of-service/", "Terms of Use"]])
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join("");

  const social = socialLinks
    .map(
      ([name, href]) =>
        `<li><a href="${href}" target="_blank" rel="noopener" aria-label="iQabinet on ${name}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${socialIcons[name]}</svg></a></li>`,
    )
    .join("");

  return `<footer class="site-footer">
<div class="wrap">
<div class="site-footer-top">
<p class="footer-note">${note}</p>
<nav class="footer-nav" aria-label="Footer"><h2>iQabinet</h2><ul>${links}</ul></nav>
</div>
<div class="site-footer-bottom">
<p>Copyright 2015 iQabinet &middot; <a href="/terms-of-service/">Terms of Use</a> &middot; <a href="/privacy-and-security-bill-of-rights/">Privacy Policy</a></p>
<ul class="social">${social}</ul>
</div>
</div>
</footer>`;
}

const homeHero = `<section class="hero" aria-labelledby="hero-title">
<div class="hero-inner">
<p class="hero-eyebrow">Personal, financial and medical records</p>
<h1 id="hero-title">Are You<br><span class="accent">Organized?</span></h1>
<p class="hero-lede">iQabinet is the simple, flexible and intelligent way to manage your important records.</p>
<div class="hero-actions"><a class="btn" href="https://vimeo.com/104158849" target="_blank" rel="noopener" data-video-open>Watch the video</a><a class="btn btn-ghost" href="/contact/">Contact us</a></div>
</div>
<div class="hero-media"><img src="/media/home-hero.jpg" alt="" width="1024" height="685" fetchpriority="high" decoding="async"></div>
</section>
<dialog class="video-dialog" aria-label="iQabinet demo video">
<button class="video-close" type="button" data-video-close aria-label="Close video">&times;</button>
<div class="video-frame"><iframe title="iQabinet demo video" data-vimeo-src="https://player.vimeo.com/video/104158849" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
<p class="video-fallback"><a href="https://vimeo.com/104158849" target="_blank" rel="noopener">Open the demo on Vimeo</a></p>
</dialog>
<section class="home-demo" aria-labelledby="home-demo-title">
<div class="wrap home-demo-inner">
<div><p class="home-demo-kicker">iQabinet demo</p><h2 id="home-demo-title">See iQabinet in action</h2><p>A short walkthrough of the service.</p></div>
<div class="home-demo-video"><iframe title="iQabinet demo video" src="https://player.vimeo.com/video/104158849" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
</div>
</section>`;

const contactPanel = `<section class="contact-panel" aria-labelledby="contact-panel-title"><details><summary id="contact-panel-title">Contact us</summary><div class="contact-panel-body"><p>For questions about iQabinet, connect with us on LinkedIn.</p><a class="contact-linkedin" href="https://www.linkedin.com/in/vadimsnitkovsky/" target="_blank" rel="noopener">Open LinkedIn <span aria-hidden="true">&#8599;</span></a></div></details></section>`;

/* ---------- transforms ---------- */

// Drop the 2014 Avada theme's stylesheets, scripts and inline styling so the
// markup falls through to src/site.css instead of fighting 388 KB of theme CSS.
function stripTheme(html) {
  html = html.replace(
    /<div style="position:relative;z-index:99999[^>]*>Archived reconstruction[\s\S]*?<\/div>/i,
    "",
  );
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<link\b[^>]*rel=['"]?stylesheet['"]?[^>]*>\s*/gi, "");
  html = html.replace(/<link\b[^>]*rel=['"](?:alternate|EditURI|wlwmanifest|canonical|shortlink)['"][^>]*>\s*/gi, "");
  html = html.replace(/<meta\b[^>]*(?:name="generator"|property="og:)[^>]*>\s*/gi, "");
  html = html.replace(/<!--\[if[\s\S]*?\[endif\]-->\s*/gi, "");
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->\s*/g, "");

  // maximum-scale=1 blocks pinch zoom.
  html = html.replace(
    /<meta name="viewport"[^>]*>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
  );

  // Keep the brand green that lived in inline styles before dropping the rest.
  // Only a real `color:` counts - `border-color: #409b00` would tint whole sections.
  html = html.replace(/<(\w+)([^>]*\sstyle="[^"]*#409b00[^"]*"[^>]*)>/gi, (match, tag, attrs) => {
    const declarations = attrs.match(/\sstyle="([^"]*)"/i)?.[1] ?? "";
    if (!/(?:^|;)\s*color:\s*#409b00/i.test(declarations)) return match;
    return / class="/.test(attrs)
      ? `<${tag}${attrs.replace(/ class="/, ' class="accent ')}>`
      : `<${tag} class="accent"${attrs}>`;
  });

  // WordPress microformat markers that were already hidden.
  html = html.replace(/<span class="entry-title" style="display: none;">[\s\S]*?<\/span>\s*/gi, "");
  html = html.replace(/<span class="vcard"[\s\S]*?<\/span>\s*<\/span>\s*/gi, "");
  html = html.replace(/<span class="updated" style="display:none;">[\s\S]*?<\/span>\s*/gi, "");

  html = html.replace(/ style="[^"]*"/gi, "");
  html = html.replace(/ style(?= class=)/gi, "");
  return html;
}

function rewriteLinks(html) {
  html = html.replace(/\.\.\/wayback\/assets\//g, "/media/");
  html = html.replace(/\.\/assets\//g, "/assets/");
  for (const [sourceName, outputName] of mediaAliases) {
    html = html.replaceAll(`/media/${sourceName}`, `/media/${outputName}`);
  }
  html = html.replace(
    /url\(http:\/\/theme-fusion\.com\/avadaxml\/wp-content\/themes\/Avada\/images\/page_title_bg\.png\)/gi,
    "none",
  );
  html = html.replace(/https?:\/\/(?:www\.)?iqabinet\.com/gi, canonical);
  html = html.replace(/https?:\/\/app\.iqabinet\.com\/(?:login|signup)\.html/gi, "/contact/");
  html = html.replace(/www\.iqabinet\.com\/signup/gi, "/contact/");
  html = html.replace(/href=(['"])(?:\.\/)?\?page_id=4944\1/gi, 'href="/terms-of-service/"');
  html = html.replace(/href=(['"])(?:\.\/)?\?p=5053\1/gi, 'href="/privacy-and-security-bill-of-rights/"');
  html = html.replace(
    new RegExp(`href=(['"])${canonical}\\/(?:author\\/iqabinet|category\\/(?:organization|security))\\/\\1`, "gi"),
    'href="/blog/"',
  );

  for (const [file, page] of Object.entries(pages)) {
    html = html.replaceAll(`./${file}`, page.route);
  }

  // Internal absolute links become root-relative.
  html = html.replaceAll(`href="${canonical}/`, 'href="/');
  html = html.replaceAll(`href="${canonical}"`, 'href="/"');
  return html;
}

function tidyContent(html) {
  // Social sharing row: the targets are dead and the icons were an icon font.
  html = html.replace(
    /<div class="fusion-sharing-box share-box">[\s\S]*?<\/div>\s*(?:<div class="fusion-clearfix"><\/div>)?\s*<\/div>/i,
    "",
  );

  // Images that WordPress buried inside headings and paragraphs.
  html = html.replace(/<h2>\s*(<img\b[^>]*>)\s*<\/h2>/gi, "$1");
  html = html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, "$1");

  // Spacer headings and paragraphs from the 2014 page builder.
  html = html.replace(/<h([1-6])>\s*(?:&nbsp;|\s)*<\/h\1>\s*/gi, "");
  html = html.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>\s*/gi, "");
  html = html.replace(/<h3>\s*<\/h3>\s*/gi, "");

  // Every run of one-third columns becomes one card grid.
  html = html.replace(
    /((?:<div class="fusion-one-third[\s\S]*?<\/div>\s*)+)<div class="fusion-clearfix"><\/div>/g,
    '<div class="feature-grid">$1</div>',
  );

  html = html.replace(/<div class="fusion-clearfix"><\/div>\s*/g, "");
  html = html.replace(/<div class="fusion-sep-clear"><\/div>\s*/g, "");
  html = html.replace(/<div class="fusion-separator[^"]*"><\/div>\s*/g, "");
  html = html.replace(/<span class="meta-separator">\|<\/span>\s*/g, "");

  // "Get it Together!" reading box, which shipped two duplicate buttons.
  html = html.replace(
    /<div class="fusion-reading-box-container[^"]*"><section class="reading-box">([\s\S]*?)<\/section><\/div>/gi,
    (match, inner) => {
      const heading = inner.match(/<h[23]>(?:<strong>)?([\s\S]*?)(?:<\/strong>)?<\/h[23]>/i)?.[1] ?? "";
      const body = inner.match(/<p>([\s\S]*?)<\/p>/i)?.[1] ?? "";
      const action = inner.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      const button = action ? `<a class="btn" href="${action[1]}">${action[2]}</a>` : "";
      return `<aside class="cta"><div class="cta-text"><h2>${heading}</h2><p>${body}</p></div>${button}</aside>`;
    },
  );

  return html;
}

function rewriteBlogCards(html) {
  return html.replace(
    /<div class="blog-medium-slideshow-container">([\s\S]*?)<div class="post-content-container">/g,
    (match, slider) => {
      const src = slider.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1] ?? "";
      const href = slider.match(/class="icon link-icon" href="([^"]+)"/i)?.[1] ?? "";
      const tag = slider.match(/<h4><a\b[^>]*>([\s\S]*?)<\/a><\/h4>/i)?.[1]?.trim() ?? "";

      // The card title is the accessible link; the image duplicates it.
      const media = href
        ? `<a class="post-card-media" href="${href}" tabindex="-1" aria-hidden="true"><img src="${src}" alt="" width="320" height="202" loading="lazy"></a>`
        : "";
      const chip = tag ? `<p class="post-card-tag">${tag}</p>` : "";
      return `${media}<div class="post-content-container">${chip}`;
    },
  );
}

// Return [start, end) of the div that opens at `start`, balancing nested divs.
function divSpan(html, start) {
  const tag = /<(\/?)div\b[^>]*>/g;
  tag.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tag.exec(html))) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return [start, match.index + match[0].length];
  }
  return null;
}

// The related-posts carousel needed jQuery. The links inside it are still good.
function rewriteRelatedPosts(html) {
  const start = html.indexOf('<div class="related-posts');
  if (start < 0) return html;
  const span = divSpan(html, start);
  if (!span) return html;

  const items = [...html.slice(...span).matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map(([, item]) => {
      const src = item.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
      const link = item.match(/<h3><a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3>/i);
      if (!src || !link) return "";
      return `<li><a class="related-card" href="${link[1]}"><img src="${src}" alt="" width="180" height="138" loading="lazy"><span>${link[2].trim()}</span></a></li>`;
    })
    .join("");

  const replacement = items
    ? `<aside class="related-posts"><h2>Related posts</h2><ul class="related-list">${items}</ul></aside>`
    : "";
  return html.slice(0, span[0]) + replacement + html.slice(span[1]);
}

function rewriteSinglePost(html) {
  html = html.replace(
    /<div class="fusion-flexslider flexslider post-slideshow">[\s\S]*?<\/div>/i,
    (slider) => {
      const src = slider.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
      return src ? `<figure class="post-hero"><img src="${src}" alt="" width="700" height="442"></figure>` : "";
    },
  );
  html = html.replace(/<h2 class="entry-title">([\s\S]*?)<\/h2>/i, '<h1 class="entry-title">$1</h1>');
  html = html.replace(
    /(<a\b[^>]*\brel="prev"[^>]*>)[\s\S]*?<\/a>/i,
    '$1<span aria-hidden="true">&#8592;</span><span>Previous article</span></a>',
  );
  html = html.replace(
    /(<a\b[^>]*\brel="next"[^>]*>)[\s\S]*?<\/a>/i,
    '$1<span>Next article</span><span aria-hidden="true">&#8594;</span></a>',
  );
  return rewriteRelatedPosts(html);
}

// Apply a transform to the page body only, leaving the generated header and
// footer alone.
function inMain(html, transform) {
  const start = html.indexOf('<div id="main"');
  const end = html.indexOf('<footer class="site-footer">');
  if (start < 0 || end < 0) return html;
  return html.slice(0, start) + transform(html.slice(start, end)) + html.slice(end);
}

// Each page needs exactly one h1, and the levels below it must not skip.
function fixHeadings(html, page) {
  if (page.route === "/") {
    // The hero supplies the h1, so every heading in the body drops one level.
    return inMain(html, (main) => main.replace(/<(\/?)h2\b/gi, "<$1h3").replace(/<(\/?)h1\b/gi, "<$1h2"));
  }
  if (page.route === "/blog/") {
    return html.replace('<div class="fusion-blog-shortcode', '<h1>Blog</h1><div class="fusion-blog-shortcode');
  }
  if (page.route === "/contact/") {
    return inMain(html, (main) => main.replace(/<h2>([\s\S]*?)<\/h2>/i, "<h1>$1</h1>"));
  }
  return html;
}

const footerNote =
  "iQabinet is secured from the ground up. Your communications with our systems utilize the most secure form of SSL encryption. In addition, all of your data stored on our servers is encrypted with Military grade security.";

function buildPage(html, page, version) {
  html = stripTheme(html);
  html = rewriteLinks(html);

  html = html.replace(
    /<div class="header-wrapper">[\s\S]*?<header id="header-sticky"[\s\S]*?<\/header>/i,
    header(page.nav, page.nav === page.route),
  );
  html = html.replace(/<footer class="footer-area">[\s\S]*<\/footer>/i, footer(footerNote));

  html = fixHeadings(html, page);
  html = tidyContent(html);
  html = rewriteBlogCards(html);
  if (page.route.startsWith("/2014/")) html = rewriteSinglePost(html);

  html = html.replace(/(<a\b[^>]*href="\/contact\/"[^>]*>[^<]*)\bSign Up\b([^<]*<\/a>)/g, "$1Contact Us$2");

  if (page.route === "/contact/") {
    html = html.replace(/<div class="shortcode-map[^>]*><\/div>/i, "");
    html = html.replace(/<form\b[\s\S]*?<\/form>/i, contactPanel);
    html = html.replace(/<div id="contact_info-widget-2"[\s\S]*?<\/div>\s*<\/div>/i, "");
    html = html.replace(/<div id="sidebar">\s*<\/div>/i, "");
  }

  if (page.route === "/") {
    html = html.replace(/\s*<div id="sliders-container">[\s\S]*?<\/div>\s*<div id="main"/i, `\n${homeHero}\n<div id="main"`);
  }

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title}</title>`);
  const head = [
    `<meta name="description" content="${page.description}">`,
    `<meta property="og:title" content="${page.title}">`,
    `<meta property="og:description" content="${page.description}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${canonical}${page.route}">`,
    '<meta property="og:site_name" content="iQabinet">',
    `<meta property="og:image" content="${canonical}${logo}">`,
    '<meta name="twitter:card" content="summary">',
    '<meta name="theme-color" content="#409b00">',
    `<link rel="canonical" href="${canonical}${page.route}">`,
    `<link rel="stylesheet" href="/site.css?v=${version}">`,
    '<script>document.documentElement.classList.add("js")</script>',
  ].join("\n");
  html = html.replace(/<\/head>/i, `${head}\n</head>`);

  const layout = page.layout ? ` data-layout="${page.layout}"` : "";
  html = html.replace(
    /<body([^>]*)>/i,
    `<body$1${layout}><a class="skip-link" href="#main">Skip to content</a>`,
  );
  html = html.replace(/<\/body>/i, `<script src="/site.js?v=${version}" defer></script></body>`);

  return html.replace(/\n{3,}/g, "\n\n");
}

/* ---------- build ---------- */

const css = await readFile(join(styles, "site.css"), "utf8");
const js = await readFile(join(styles, "site.js"), "utf8");
const version = createHash("sha256").update(css).update(js).digest("hex").slice(0, 10);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await cp(assets, join(output, "media"), { recursive: true });
await cp(join(assets, "mainbackgroud-compressed-optimized.jpg-a1952d28c5"), join(output, "media", "home-hero.jpg"));
for (const [sourceName, outputName] of mediaAliases) {
  await cp(join(assets, sourceName), join(output, "media", outputName));
}

await writeFile(join(output, "site.css"), css);
await writeFile(join(output, "site.js"), js);

for (const [file, page] of Object.entries(pages)) {
  const html = buildPage(await readFile(join(source, file), "utf8"), page, version);
  const destination = page.route === "/" ? join(output, "index.html") : join(output, page.route, "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html);
}

await writeFile(
  join(output, "404.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | iQabinet</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/site.css?v=${version}">
<style>.notfound{display:grid;place-items:center;min-height:100vh;text-align:center}.notfound>div{max-width:34rem;padding:3rem var(--gutter)}.notfound img{margin:0 auto 2rem}</style>
</head>
<body>
<main class="notfound">
<div>
<img src="${logo}" alt="iQabinet" width="150" height="46">
<h1>Page not found</h1>
<p>The page you requested is not here.</p>
<p><a class="btn" href="/">Return home</a></p>
</div>
</main>
</body>
</html>`,
);

await writeFile(
  join(output, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN

/media/*
  Cache-Control: public, max-age=31536000, immutable

/site.css
  Cache-Control: public, max-age=31536000, immutable

/site.js
  Cache-Control: public, max-age=31536000, immutable
`,
);

console.log(`Built ${Object.keys(pages).length} pages in ${output} (assets v${version})`);
