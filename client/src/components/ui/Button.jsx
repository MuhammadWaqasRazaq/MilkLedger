import { Loader2 } from "lucide-react";
import { cx } from "../../utils/cx";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-800",
  subtle:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-700",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800",
  dangerSoft:
    "border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/15 active:bg-rose-100 dark:active:bg-rose-500/20",
  ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700",
};

const SIZES = {
  sm: "h-11 gap-1.5 px-3 text-xs sm:h-8",
  md: "h-11 gap-2 px-4 text-sm sm:h-10",
  lg: "h-12 gap-2 px-5 text-sm sm:h-11",
  icon: "h-11 w-11 justify-center sm:h-9 sm:w-9",
  iconSm: "h-11 w-11 justify-center sm:h-8 sm:w-8",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading = false,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex select-none items-center justify-center rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-ring",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
