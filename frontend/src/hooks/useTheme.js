import { useEffect, useState } from "react";

const STORAGE_KEY = "roomie-theme";

// Reads the .dark class the blocking script in index.html already set
// (before first paint) rather than re-deriving it from localStorage/
// matchMedia here - a second, independent check could disagree with what
// index.html decided and cause a flash/flicker on mount.
function getInitialTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Manual toggle overrides the OS preference and persists to localStorage
// (a per-device UI preference, not sensitive data). Does not itself listen
// for OS-level prefers-color-scheme changes after mount - once someone has
// an explicit choice stored, that choice should stick regardless of what
// their OS does later; only a user actually unset from localStorage (e.g.
// clearing site data) goes back to following the OS.
export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage can throw (private browsing, blocked storage) - theme
      // still applies for this page load, it just won't persist.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, toggleTheme };
}
