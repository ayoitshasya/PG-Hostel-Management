import React from "react";
import useTheme from "../hooks/useTheme";

// Minimal hand-drawn sun/moon glyphs (not an icon font/library) - small
// enough that a stroke-based geometric shape reads clearly at 16px.
function SunIcon(props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <line x1="8" y1="0.5" x2="8" y2="2.3" />
        <line x1="8" y1="13.7" x2="8" y2="15.5" />
        <line x1="0.5" y1="8" x2="2.3" y2="8" />
        <line x1="13.7" y1="8" x2="15.5" y2="8" />
        <line x1="2.6" y1="2.6" x2="3.9" y2="3.9" />
        <line x1="12.1" y1="12.1" x2="13.4" y2="13.4" />
        <line x1="2.6" y1="13.4" x2="3.9" y2="12.1" />
        <line x1="12.1" y1="3.9" x2="13.4" y2="2.6" />
      </g>
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" {...props}>
      <path
        d="M13.5 9.7A6 6 0 1 1 6.3 2.5a5 5 0 0 0 7.2 7.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      // Styled to match Header's current (pre-redesign) light-only
      // palette, not the new --fg/--border semantic tokens - Header itself
      // isn't migrated until Step 2, and stays a hardcoded white bg
      // regardless of the .dark class this button toggles. Using the new
      // tokens here would flip this icon to light-on-light and make it
      // vanish against Header's still-white background whenever dark mode
      // is active. Update this alongside Header in Step 2.
      className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:text-primary-dark hover:border-primary-dark transition-colors"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
