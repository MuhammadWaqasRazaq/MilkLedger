import { cx } from "../../utils/cx";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
          <Icon size={22} />
        </span>
      ) : null}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
