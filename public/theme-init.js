(function () {
  var saved = null;
  try {
    saved = window.localStorage.getItem("scibased-theme");
  } catch (error) {
    // Storage can be blocked in private browsing; the OS preference still works.
  }

  var prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  var dark = saved === "dark" || (saved !== "light" && prefersDark);

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";

  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", dark ? "#07100D" : "#F5F7F4");
  }
})();
