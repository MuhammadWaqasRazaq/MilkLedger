import { History, User } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Badge, StatusBadge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { formatCurrency } from "../../utils/format";
import { formatDate } from "../../utils/dates";
import { useApi } from "../../hooks/useApi";

export function PersonHistoryModal({ name, config, onClose }) {
  const { data, loading, error } = useApi(
    () => config.api.personHistory(name),
    [name]
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={`${name} · ${config.historyNoun} history`}
      description="All transactions and payment installments for this person."
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-slate-400">
          <Spinner /> Loading history...
        </div>
      ) : error ? (
        <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : !data?.transactions?.length ? (
        <EmptyState
          icon={History}
          title="No transactions found"
          description="This person has no active transactions."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Transactions
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                {data.summary.count}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {config.amountShortLabel}
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(data.summary.originalAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {config.paidLabel}
              </p>
              <p className="mt-0.5 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(data.summary.paid)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                {config.remainingLabel}
              </p>
              <p className="mt-0.5 text-sm font-bold text-amber-800 dark:text-amber-200">
                {formatCurrency(data.summary.remaining)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {transaction.reason}
                      </p>
                      <StatusBadge status={transaction.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <Badge tone={config.tone}>
                    {config.singularLabel}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {config.amountShortLabel}
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(transaction.originalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {config.paidLabel}
                    </p>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(transaction.paid)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {config.remainingLabel}
                    </p>
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      {formatCurrency(transaction.remaining)}
                    </p>
                  </div>
                </div>

                {transaction.payments?.length ? (
                  <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-950 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Payments
                    </p>
                    <ul className="space-y-1">
                      {transaction.payments.map((payment) => (
                        <li
                          key={payment._id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-500 dark:text-slate-400">
                            {formatDate(payment.date)}
                            {payment.note ? ` · ${payment.note}` : ""}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(payment.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">
                    No payments for this transaction.
                  </p>
                )}

                {transaction.notes ? (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Note: {transaction.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
