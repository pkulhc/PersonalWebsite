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
    themeToggle.setAttribute("aria-label", theme === "dark" ? "切换浅色模式" : "切换暗色模式");
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
