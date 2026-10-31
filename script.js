const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const tabs = document.querySelectorAll(".tab");
const publications = document.querySelectorAll(".publication");
const pubSearchInput = document.getElementById("pub-search");
const pubEmptyMsg = document.getElementById("pub-empty");

// ── Header scroll state ──
const updateHeader = () => {
  if (!header) return;
  header.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// ── Mobile navigation toggle ──
navToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// ── Publications filtering & live search ──
let activeCategory = "featured";

function filterPublications() {
  const query = (pubSearchInput?.value || "").trim().toLowerCase();
  let visibleCount = 0;
  const seenTitles = new Set();

  publications.forEach((paper) => {
    const matchesCategory = activeCategory === "all" || paper.dataset.group === activeCategory;
    const textContent = paper.textContent.toLowerCase();
    const matchesQuery = !query || textContent.includes(query);

    // Deduplicate identical titles when showing "all" or searching across categories
    const titleText = paper.querySelector("h3")?.textContent.trim().toLowerCase() || "";
    const isDuplicateInAll = (activeCategory === "all" || query.length > 0) && seenTitles.has(titleText);

    const shouldShow = (query.length > 0 ? matchesQuery : matchesCategory && matchesQuery) && !isDuplicateInAll;

    paper.hidden = !shouldShow;
    if (shouldShow) {
      visibleCount++;
      if (titleText) seenTitles.add(titleText);
    }
  });

  if (pubEmptyMsg) {
    pubEmptyMsg.hidden = visibleCount > 0;
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = tab.dataset.filter || "featured";

    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    filterPublications();
  });
});

pubSearchInput?.addEventListener("input", () => {
  filterPublications();
});

// Initialize default publication filter
filterPublications();

// ── Enhance Impact Factor (IF) into styled badges & add PubMed links ──
document.querySelectorAll(".publication").forEach((pub) => {
  const metaP = pub.querySelector(".publication-meta p");
  if (metaP) {
    metaP.innerHTML = metaP.innerHTML.replace(
      /\bIF:\s*([\d.]+)/g,
      '<span class="if-badge" title="Journal Impact Factor">IF $1</span>'
    );
  }

  const titleEl = pub.querySelector(".publication-main h3");
  if (!titleEl) return;

  const isEn = document.documentElement.lang?.startsWith("en");
  const title = titleEl.textContent.trim();
  const link = document.createElement("a");
  link.href = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "pubmed-link";
  link.textContent = isEn ? "PubMed" : "PubMed 检索";
  link.setAttribute("aria-label", isEn ? `Search on PubMed: ${title}` : `在 PubMed 中搜索: ${title}`);

  pub.querySelector(".publication-main")?.appendChild(link);
});

// ── Scientific Figure Lightbox ──
const lightbox = document.getElementById("figure-lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxDesc = document.getElementById("lightbox-desc");

function openLightbox(figure) {
  if (!lightbox || !lightboxImg) return;
  const img = figure.querySelector("img");
  const title = figure.querySelector("h4")?.textContent || figure.querySelector("figcaption")?.textContent || "";
  const desc = figure.querySelector("figcaption p")?.textContent || "";

  if (!img) return;
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  if (lightboxTitle) lightboxTitle.textContent = title;
  if (lightboxDesc) lightboxDesc.textContent = desc;

  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.classList.remove("lightbox-open");
}

document.querySelectorAll(".profile-figure").forEach((fig) => {
  fig.addEventListener("click", () => openLightbox(fig));
  fig.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(fig);
    }
  });
});

document.querySelectorAll("[data-close-lightbox]").forEach((el) => {
  el.addEventListener("click", closeLightbox);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox && !lightbox.hidden) {
    closeLightbox();
  }
});

// ── Scroll-triggered entrance animations ──
const animatedElements = document.querySelectorAll(".animate-on-scroll, .animate-stagger");

const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: "0px 0px -40px 0px",
    threshold: 0.08,
  }
);

animatedElements.forEach((el) => scrollObserver.observe(el));

// ── Animated number counting for stats ──
function animateCount(el, target, duration = 1500) {
  if (el.dataset.noCount === "true") return;
  const numTarget = Number.parseInt(target, 10);
  if (Number.isNaN(numTarget)) return;

  const suffix = target.replace(/^\d+/, "");
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const current = Math.round(numTarget * eased);

    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

const statsSection = document.querySelector(".stats");
if (statsSection) {
  const statsNumbers = statsSection.querySelectorAll("strong");
  let counted = false;

  const statsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        statsNumbers.forEach((strong) => {
          animateCount(strong, strong.textContent.trim());
        });
        statsObserver.unobserve(statsSection);
      }
    },
    { threshold: 0.3 }
  );

  statsObserver.observe(statsSection);
}

// ── Nav scroll spy ──
const sectionMap = new Map();

navLinks.forEach((link) => {
  const href = link.getAttribute("href");
  if (href?.startsWith("#")) {
    const section = document.getElementById(href.slice(1));
    if (section) sectionMap.set(section, link);
  }
});

if (sectionMap.size > 0) {
  const sections = [...sectionMap.keys()];
  const intersectingSections = new Set();

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          intersectingSections.add(entry.target);
        } else {
          intersectingSections.delete(entry.target);
        }
      });

      let topSection = null;
      let minTop = Infinity;

      intersectingSections.forEach((section) => {
        const top = section.getBoundingClientRect().top;
        if (top < minTop) {
          minTop = top;
          topSection = section;
        }
      });

      navLinks.forEach((link) => link.classList.remove("active"));
      if (topSection) {
        const link = sectionMap.get(topSection);
        if (link) link.classList.add("active");
      }
    },
    {
      rootMargin: "-74px 0px -55% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => spyObserver.observe(section));
}

// ── Dark mode toggle ──
const themeToggle = document.querySelector(".theme-toggle");
const html = document.documentElement;

function getTheme() {
  const stored = localStorage.getItem("theme");
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (theme === "dark") {
    html.setAttribute("data-theme", "dark");
  } else {
    html.removeAttribute("data-theme");
  }
}

function updateToggleLabel(theme) {
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", theme === "dark" ? "切换浅色模式" : "切换暗色模式");
  }
}

const currentTheme = getTheme();
applyTheme(currentTheme);
updateToggleLabel(currentTheme);

themeToggle?.addEventListener("click", () => {
  const next = html.hasAttribute("data-theme") ? "light" : "dark";
  applyTheme(next);
  updateToggleLabel(next);
  localStorage.setItem("theme", next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    const systemTheme = e.matches ? "dark" : "light";
    applyTheme(systemTheme);
    updateToggleLabel(systemTheme);
  }
});

// ── Hero Canvas: Laminar Shear Stress Streamlines (Vascular Hemodynamics) ──
(function initLaminarCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  if (!hero) return;

  let animId = null;
  let time = 0;
  let nodes = [];

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnNodes() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    nodes = Array.from({ length: 24 }, (_, i) => ({
      x: Math.random() * w,
      y: (h * 0.18) + (Math.random() * h * 0.68),
      vx: 0.22 + Math.random() * 0.35,
      r: 1.5 + Math.random() * 2.2,
      phase: i * 0.7,
      amplitude: 8 + Math.random() * 14,
      hue: i % 3 === 0 ? "red" : i % 2 === 0 ? "green" : "blue",
    }));
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const dark = document.documentElement.hasAttribute("data-theme");

    ctx.clearRect(0, 0, w, h);

    // Subtle laminar flow streamlines
    const streamCount = 5;
    for (let s = 0; s < streamCount; s++) {
      const baseY = h * (0.24 + s * 0.13);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const wave =
          Math.sin(x * 0.0045 + time * 0.012 + s * 0.9) * (14 + s * 3) +
          Math.cos(x * 0.002 - time * 0.008) * 8;
        const y = baseY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = dark
        ? `rgba(82, 182, 149, ${0.045 + s * 0.008})`
        : `rgba(26, 99, 80, ${0.04 + s * 0.007})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // Drifting cellular/vesicle particles along laminar flow
    nodes.forEach((n) => {
      n.x += n.vx;
      if (n.x > w + 20) n.x = -20;
      const yOffset = Math.sin(n.x * 0.005 + time * 0.015 + n.phase) * n.amplitude;
      const cy = n.y + yOffset;

      ctx.beginPath();
      ctx.arc(n.x, cy, n.r, 0, Math.PI * 2);
      if (n.hue === "red") {
        ctx.fillStyle = dark ? "rgba(212, 123, 113, 0.26)" : "rgba(142, 53, 46, 0.18)";
      } else if (n.hue === "green") {
        ctx.fillStyle = dark ? "rgba(82, 182, 149, 0.28)" : "rgba(26, 99, 80, 0.20)";
      } else {
        ctx.fillStyle = dark ? "rgba(109, 161, 217, 0.24)" : "rgba(41, 82, 122, 0.16)";
      }
      ctx.fill();
    });

    time += 1;
    animId = requestAnimationFrame(draw);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  resize();
  spawnNodes();
  draw();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (animId) cancelAnimationFrame(animId);
      resize();
      spawnNodes();
      draw();
    }, 150);
  });
})();

// ── Fetch NCBI publication count ──
(async function fetchCitationCount() {
  const countEl = document.getElementById("ncbi-count") || document.querySelector(".stats strong");
  const inlineCountEl = document.querySelector(".pub-summary .inline-highlight");
  if (!countEl) return;

  const CACHE_KEY = "ncbi-pub-count";
  const fallback = countEl.textContent.trim();

  function applyCount(val) {
    countEl.textContent = val;
    if (inlineCountEl) {
      const isEn = document.documentElement.lang?.startsWith("en");
      inlineCountEl.textContent = isEn ? `${val} publications` : `${val} 篇`;
    }
  }

  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    applyCount(cached);
    return;
  }

  const apiQuery =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=haocheng+lu[Author]+AND+(Southern+University+of+Science+and+Technology[Affiliation]+OR+Michigan[Affiliation]+OR+Peking+University[Affiliation])&retmax=0";
  const urls = [
    apiQuery,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(apiQuery)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      const match = text.match(/<Count>(\d+)<\/Count>/);
      if (match && match[1]) {
        applyCount(match[1]);
        sessionStorage.setItem(CACHE_KEY, match[1]);
        return;
      }
    } catch {
      // try next URL
    }
  }

  applyCount(fallback);
})();
