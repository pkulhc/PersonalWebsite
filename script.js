const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const tabs = document.querySelectorAll(".tab");
const publications = document.querySelectorAll(".publication");

const updateHeader = () => {
  header.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const filter = tab.dataset.filter;

    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    publications.forEach((paper) => {
      paper.hidden = paper.dataset.group !== filter;
    });
  });
});

publications.forEach((paper) => {
  paper.hidden = paper.dataset.group !== "featured";
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
    rootMargin: "0px 0px -48px 0px",
    threshold: 0.08,
  }
);

animatedElements.forEach((el) => scrollObserver.observe(el));

// ── Animated number counting for stats ──
function animateCount(el, target, duration = 1800) {
  const hasSuffix = !/^\d+$/.test(target);
  const numTarget = Number.parseInt(target, 10);
  if (Number.isNaN(numTarget)) return;

  const suffix = target.replace(/^\d+/, "");
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
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

      // Find the topmost intersecting section
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
    const isEnglish = document.documentElement.lang?.startsWith("en");
    const label = isEnglish
      ? theme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode"
      : theme === "dark"
        ? "切换浅色模式"
        : "切换暗色模式";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
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

// ── Hero canvas particle background ──
(function initParticleCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  if (!hero) return;

  const COUNT = 60;
  const CONNECT_DIST = 140;
  const SPEED = 0.35;

  let particles = [];
  let animId = null;

  function palette(hue, alpha) {
    const dark = document.documentElement.hasAttribute("data-theme");
    if (hue === "green") {
      const [r, g, b] = dark ? [77, 172, 140] : [31, 111, 91];
      return `rgba(${r},${g},${b},${alpha})`;
    }
    const [r, g, b] = dark ? [96, 147, 207] : [49, 95, 156];
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: Math.random() * 2 + 1.2,
      alpha: Math.random() * 0.35 + 0.18,
      hue: Math.random() > 0.7 ? "green" : "blue",
    }));
  }

  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = palette("blue", (1 - dist / CONNECT_DIST) * 0.12);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Dots
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = palette(p.hue, p.alpha);
      ctx.fill();
    });
  }

  function update() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    });
  }

  function animate() {
    update();
    draw();
    animId = requestAnimationFrame(animate);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  resize();
  spawn();
  animate();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (animId) cancelAnimationFrame(animId);
      resize();
      spawn();
      animate();
    }, 150);
  });
})();

// ── Fetch NCBI citation count ──
(async function fetchCitationCount() {
  const countEl = document.querySelector(".stats strong");
  if (!countEl) return;

  const fallback = countEl.textContent.trim();

  // Query with affiliation filter to exclude other researchers with the same name
  const apiQuery = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=haocheng+lu[Author]+AND+(Southern+University+of+Science+and+Technology[Affiliation]+OR+Michigan[Affiliation]+OR+Peking+University[Affiliation])&retmax=0";
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
        countEl.textContent = match[1];
        return;
      }
    } catch {
      // try next URL
    }
  }

  countEl.textContent = fallback;
})();

// ── Add PubMed search links to publications ──
document.querySelectorAll(".publication").forEach((pub) => {
  const titleEl = pub.querySelector(".publication-main h3");
  if (!titleEl) return;

  const title = titleEl.textContent.trim();
  const link = document.createElement("a");
  link.href = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "pubmed-link";
  link.textContent = "PubMed";
  link.setAttribute("aria-label", `在 PubMed 中搜索: ${title}`);

  pub.querySelector(".publication-main")?.appendChild(link);
});
