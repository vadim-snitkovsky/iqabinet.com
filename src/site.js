// Progressive enhancement only. Every page reads and navigates without this file.

// Mobile navigation.
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");

navToggle?.addEventListener("click", () => {
  const open = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !siteNav?.classList.contains("is-open")) return;
  siteNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.focus();
});

// Demo video, loaded only once the dialog opens.
const dialog = document.querySelector(".video-dialog");
const frame = dialog?.querySelector("iframe");
const closeDialog = () => {
  dialog.close();
  frame.src = "";
};

// The trigger is a real link to Vimeo, so it still works with JavaScript off.
document.querySelector("[data-video-open]")?.addEventListener("click", (event) => {
  event.preventDefault();
  frame.src = frame.dataset.vimeoSrc;
  dialog.showModal();
});
document.querySelector("[data-video-close]")?.addEventListener("click", closeDialog);
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog?.addEventListener("close", () => { frame.src = ""; });

// WordPress truncated excerpts end in a bare ellipsis. Make it open the article.
document.querySelectorAll(".excerpt-container").forEach((excerpt) => {
  const article = excerpt.closest("article, .post")?.querySelector("h2 a, h4 a");
  if (!article) return;

  excerpt.querySelectorAll("p").forEach((paragraph) => {
    const cutoff = paragraph.textContent.indexOf("…");
    if (cutoff < 0) return;

    const link = document.createElement("a");
    link.className = "article-ellipsis";
    link.href = article.href;
    link.textContent = "…";
    link.setAttribute("aria-label", `Read the full article: ${article.textContent.trim()}`);

    const visible = paragraph.textContent.slice(0, cutoff).replace(" [", " ").trimEnd();
    paragraph.replaceChildren(document.createTextNode(`${visible} `), link);
  });
});
