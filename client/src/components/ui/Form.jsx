import { cx } from "../../utils/cx";

const CONTROL =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base text-slate-800 placeholder:text-slate-400 transition focus-ring disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-500 dark:text-slate-200 dark:placeholder:text-slate-500 dark:disabled:text-slate-400 sm:px-3 sm:py-2 sm:text-sm";

export function Field({ label, hint, error, htmlFor, className, children }) {
  return (
    <div className={cx("space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cx(CONTROL, "h-12 sm:h-10", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(CONTROL, "h-12 cursor-pointer sm:h-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cx(CONTROL, "min-h-[96px] resize-y sm:min-h-[76px]", className)}
      {...props}
    />
  );
}

export function FormActions({ children, className }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-2 pt-1", className)}>
      {children}
    </div>
  );
}
