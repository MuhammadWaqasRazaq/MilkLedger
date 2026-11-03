import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cx } from "../../utils/cx";

export function ThemeToggle({ variant = "sidebar" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700"
        aria-label={label}
        title={label}
        role="switch"
        aria-checked={isDark}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-xs font-semibold text-slate-200 transition hover:bg-white/10 active:bg-white/15"
      aria-label={label}
      title={label}
      role="switch"
      aria-checked={isDark}
    >
      <span className="flex items-center gap-2">
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
        {isDark ? "Light mode" : "Dark mode"}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          isDark ? "bg-brand-500" : "bg-slate-600"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white dark:bg-slate-900 shadow transition-all",
            isDark ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
