import {
  History,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  User,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { formatCurrency } from "../../utils/format";
import { formatDate } from "../../utils/dates";
import { cx } from "../../utils/cx";

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ObligationCard({
  item,
  config,
  onEdit,
  onDelete,
  onPayment,
  onHistory,
  onDeletePayment,
  deletingPaymentId,
  deletingItem,
}) {
  const accent = config.tone === "red"
    ? { avatar: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400", amount: "text-rose-700 dark:text-rose-300" }
    : { avatar: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", amount: "text-emerald-700 dark:text-emerald-300" };

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                accent.avatar
              )}
            >
              {initials(item.personName) || <User size={16} />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.personName}
                </h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {item.reason}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {config.transactionLabel} dated {formatDate(item.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onHistory(item.personName)}
            >
              <History size={14} />
              History
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.personName}`}
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              onClick={() => onDelete(item)}
              loading={deletingItem === item._id}
              aria-label={`Delete ${item.personName}`}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {config.amountShortLabel}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(item.originalAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {config.paidLabel}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(item.paid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {config.remainingLabel}
            </p>
            <p
              className={cx(
                "mt-0.5 text-sm font-bold",
                item.remaining > 0 ? accent.amount : "text-emerald-700 dark:text-emerald-300"
              )}
            >
              {formatCurrency(item.remaining)}
            </p>
          </div>
        </div>

        <ProgressBar
          value={item.paid}
          max={item.originalAmount}
          tone="green"
          className="mt-3"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400">
            {item.paymentCount} payment{item.paymentCount === 1 ? "" : "s"}{" "}
            recorded
          </p>
          <Button
            variant="success"
            size="sm"
            onClick={() => onPayment(item)}
            disabled={item.remaining <= 0}
          >
            <Plus size={14} />
            {config.paymentButton}
          </Button>
        </div>

        {item.notes ? (
          <p className="mt-3 rounded-lg bg-amber-50/70 dark:bg-amber-500/10 px-3 py-2 text-[11px] leading-4 text-amber-800 dark:text-amber-200">
            Note: {item.notes}
          </p>
        ) : null}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-5 py-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <Receipt size={12} /> Payment history
        </p>
        {!item.payments?.length ? (
          <p className="py-1 text-xs text-slate-400">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {item.payments.map((payment) => (
              <li
                key={payment._id}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(payment.date)}
                    {payment.note ? (
                      <span className="ml-1.5 font-normal text-slate-400">
                        · {payment.note}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(payment.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => onDeletePayment(item, payment)}
                    loading={deletingPaymentId === payment._id}
                    aria-label="Delete payment"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
