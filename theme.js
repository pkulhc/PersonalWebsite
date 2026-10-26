(() => {
  let theme;
  try {
    theme = localStorage.getItem("theme");
  } catch {
    // Private browsing can disable storage; system preference still works.
  }
  const dark = theme === "dark" || (theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
})();
