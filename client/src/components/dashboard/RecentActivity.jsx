import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  History,
  Milk,
  Tag,
  Wallet,
} from "lucide-react";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { formatCurrency } from "../../utils/format";
import { formatDateTime } from "../../utils/dates";
import { cx } from "../../utils/cx";

const ICONS = {
  milk: Milk,
  "milk-payment": Wallet,
  rate: Tag,
  payable: ArrowUpRight,
  "payable-payment": Banknote,
  receivable: ArrowDownLeft,
  "receivable-payment": Banknote,
};

const TONE_CLASSES = {
  blue: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
  green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  red: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

export function RecentActivity({ items }) {
  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <History size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest changes and payments</p>
          </div>
        </div>
      </div>

      {!items?.length ? (
        <div className="p-5">
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Add a milk record or a payment and it will appear here."
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const Icon = ICONS[item.type] || History;
            return (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                <span
                  className={cx(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    TONE_CLASSES[item.tone] || TONE_CLASSES.slate
                  )}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {item.subtitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.amount ? (
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.amount)}
                    </p>
                  ) : null}
                  <p className="text-[10px] text-slate-400">
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
