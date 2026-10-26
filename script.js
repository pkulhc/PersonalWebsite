const en = document.documentElement.lang.startsWith("en");
const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const themeToggle = document.querySelector(".theme-toggle");
const tabs = [...document.querySelectorAll(".tab")];
const papers = [...document.querySelectorAll(".publication")];
const search = document.querySelector("#publication-search");
const year = document.querySelector("#publication-year");
const count = document.querySelector("#publication-count");
const resultPanel = document.querySelector("#publication-results");
const empty = document.querySelector(".publication-empty");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const runningMotions = new Map();
const revealedNodes = new WeakSet();
let revealObserver;
let category = "featured";

// Content stays visible by default; animation never controls whether it can be read.
function animateNode(node, frames, options = {}) {
  runningMotions.get(node)?.cancel();
  if (reducedMotion.matches || !node || typeof node.animate !== "function") return;
  const animation = node.animate(frames, {
    duration: 620,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "backwards",
    ...options,
  });
  runningMotions.set(node, animation);
  const forget = () => {
    if (runningMotions.get(node) === animation) runningMotions.delete(node);
  };
  animation.addEventListener("finish", forget, { once: true });
  animation.addEventListener("cancel", forget, { once: true });
}

const riseFrames = [
  { opacity: 0, transform: "translateY(16px)" },
  { opacity: 1, transform: "translateY(0)" },
];

function setupScrollReveals() {
  revealObserver?.disconnect();
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const targets = [...document.querySelectorAll(
    ".stats > div, #about > div:not(.profile-visuals), .section-heading, .publications-heading, .animate-stagger > *, .two-columns > *, .contact-section > *"
  )];
  const delays = new Map(targets.map(node => {
    const siblings = [...node.parentElement.children].filter(sibling => targets.includes(sibling));
    return [node, Math.min(siblings.indexOf(node) * 85, 255)];
  }));
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || revealedNodes.has(entry.target)) return;
      revealedNodes.add(entry.target);
      revealObserver.unobserve(entry.target);
      if (!entry.target.contains(document.activeElement)) {
        animateNode(entry.target, riseFrames, { delay: delays.get(entry.target) });
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px 32px 0px" });
  targets.filter(node => !revealedNodes.has(node)).forEach(node => revealObserver.observe(node));
}

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    runningMotions.forEach(animation => animation.cancel());
    runningMotions.clear();
    revealObserver?.disconnect();
  } else {
    setupScrollReveals();
  }
});

function setMenu(open, returnFocus = false) {
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  const label = en ? (open ? "Close navigation menu" : "Open navigation menu") : (open ? "关闭导航菜单" : "打开导航菜单");
  navToggle.setAttribute("aria-label", label);
  navToggle.title = label;
  navToggle.querySelector("img").src = `assets/icons/${open ? "x" : "menu"}.svg`;
  if (open) animateNode(nav, [
    { opacity: 0, transform: "translateY(-8px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 240 });
  else runningMotions.get(nav)?.cancel();
  if (returnFocus) navToggle.focus();
}
navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("nav-open")) setMenu(false, true);
});
document.addEventListener("click", event => {
  if (!header.contains(event.target) && document.body.classList.contains("nav-open")) setMenu(false);
});
document.addEventListener("focusin", event => {
  if (!header.contains(event.target) && document.body.classList.contains("nav-open")) setMenu(false);
  runningMotions.forEach((animation, node) => {
    if (node.contains(event.target)) animation.cancel();
  });
});
matchMedia("(min-width: 901px)").addEventListener("change", event => {
  if (event.matches) setMenu(false);
});

function savedTheme() {
  try { return localStorage.getItem("theme"); } catch { return null; }
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  const label = en ? (dark ? "Switch to light mode" : "Switch to dark mode") : (dark ? "切换浅色模式" : "切换暗色模式");
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
  themeToggle.querySelector("img").src = `assets/icons/${dark ? "sun" : "moon"}.svg`;
}
applyTheme(document.documentElement.dataset.theme || "light");
themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  animateNode(themeToggle.querySelector("img"), [
    { transform: "rotate(-60deg) scale(0.7)", opacity: 0.4 },
    { transform: "rotate(0) scale(1)", opacity: 1 },
  ], { duration: 320 });
  try { localStorage.setItem("theme", theme); } catch { /* Theme still works without persistence. */ }
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
  if (!["light", "dark"].includes(savedTheme())) applyTheme(event.matches ? "dark" : "light");
});

// Normalize accents and punctuation for title, author, journal and PMID searches.
const normalize = text => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const searchable = new Map(papers.map(paper => [paper, normalize(paper.textContent)]));
function filterPapers(animateResults = false) {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const paper of papers) {
    const matches = paper.dataset.groups.split(" ").includes(category)
      && (year.value === "all" || paper.dataset.year === year.value)
      && terms.every(term => searchable.get(paper).includes(term));
    paper.hidden = !matches;
    visible += Number(matches);
  }
  const active = tabs.find(tab => tab.dataset.filter === category);
  count.textContent = en ? `${visible} publication${visible === 1 ? "" : "s"}` : `${visible} 篇论文`;
  empty.hidden = visible !== 0;
  resultPanel.setAttribute("aria-labelledby", active.id);
  if (animateResults === true) animateNode(visible ? resultPanel : empty, [
    { opacity: 0.35, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 260 });
  updateScroll();
}
function selectCategory(tab) {
  category = tab.dataset.filter;
  tabs.forEach(item => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  filterPapers(true);
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectCategory(tab));
  tab.addEventListener("keydown", event => {
    const indices = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(event.key in indices)) return;
    event.preventDefault();
    const next = tabs[indices[event.key]];
    selectCategory(next);
    next.focus();
  });
});
search.addEventListener("input", filterPapers);
year.addEventListener("change", () => filterPapers(true));
document.querySelector(".reset-filters").addEventListener("click", () => {
  search.value = "";
  year.value = "all";
  filterPapers(true);
  search.focus();
});
document.querySelector(".publication-controls").hidden = false;
resultPanel.setAttribute("role", "tabpanel");

let scrollFrame = 0;
function updateScroll() {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    header.dataset.scrolled = String(window.scrollY > 12);
    const height = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${height > 0 ? Math.max(0, Math.min(scrollY / height, 1)) : 0})`;
    let current;
    navLinks.forEach(link => {
      const section = document.querySelector(link.getAttribute("href"));
      if (section && section.getBoundingClientRect().top <= 150) current = link;
    });
    navLinks.forEach(link => {
      link.classList.toggle("active", link === current);
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  });
}
window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll, { passive: true });
window.addEventListener("load", updateScroll);
filterPapers();

document.querySelectorAll(".hero-copy > *").forEach((node, index) => {
  animateNode(node, riseFrames, { duration: 720, delay: index * 80 });
});
animateNode(document.querySelector(".portrait-wrap"), [
  { opacity: 0, transform: "translateY(12px) scale(1.025)" },
  { opacity: 1, transform: "translateY(0) scale(1)" },
], { duration: 900, delay: 120 });
setupScrollReveals();
