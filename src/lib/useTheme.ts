import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "scibased-theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#F5F7F4",
  dark: "#07100D",
};

function readStoredTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  // theme-init.js runs before React and sets this class from storage or the
  // operating-system preference, so it is the most reliable first paint signal.
  if (document.documentElement.classList.contains("dark")) return "dark";

  return readStoredTheme() ?? getSystemTheme();
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(
    () => readStoredTheme() !== null,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", THEME_COLORS[theme]);

    if (!hasExplicitPreference) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private browsing; the toggle still works.
    }
  }, [theme, hasExplicitPreference]);

  // Until someone chooses a theme, follow the operating-system setting live.
  useEffect(() => {
    if (hasExplicitPreference || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [hasExplicitPreference]);

  const toggleTheme = useCallback(() => {
    setHasExplicitPreference(true);
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
