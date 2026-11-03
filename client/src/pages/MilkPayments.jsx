import { useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Trash2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { MonthYearSelect } from "../components/ui/MonthYearSelect";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Form";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { LoadingBlock, ErrorBlock } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { currentPeriod, formatDate, formatMonthYear, todayString } from "../utils/dates";
import { formatCurrency, formatKg, formatMann } from "../utils/format";
import { cx } from "../utils/cx";

const BUYER_META = {
  morning: {
    label: "Morning",
    tone: "blue",
    active: "border-brand-300 dark:border-brand-500/40 bg-brand-50/50 dark:bg-brand-500/10 ring-1 ring-brand-200 dark:ring-brand-400/20",
    chip: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300",
    bar: "blue",
  },
  evening: {
    label: "Evening",
    tone: "violet",
    active: "border-violet-300 dark:border-violet-500/40 bg-violet-50/50 dark:bg-violet-500/10 ring-1 ring-violet-200",
    chip: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300",
    bar: "violet",
  },
};

function CombinedStrip({ combined }) {
  return (
    <Card className="overflow-hidden border-0 bg-slate-900 text-white dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
            Combined milk settlement
          </p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(combined.amount)}</p>
          <p className="mt-1 text-xs text-slate-400">
            Paid {formatCurrency(combined.paid)} · Remaining{" "}
            {formatCurrency(combined.remaining)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Milk
            </p>
            <p className="text-sm font-semibold">{formatKg(combined.kg)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Mann
            </p>
            <p className="text-sm font-semibold">{formatMann(combined.mann)}</p>
          </div>
          <span
            className={cx(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              combined.remaining > 0
                ? "bg-amber-400/15 text-amber-300"
                : "bg-emerald-400/15 text-emerald-300"
            )}
          >
            {combined.remaining > 0 ? "Pending" : "Completed"}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function MilkPayments() {
  const toast = useToast();
  const [period, setPeriod] = useState(currentPeriod);
  const [activeTab, setActiveTab] = useState("morning");
  const [date, setDate] = useState(todayString());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => api.getMilkPayments(period.month, period.year),
    [period.month, period.year]
  );

  const buyer = data?.buyers?.[activeTab];
  const summary = buyer?.summary;

  useEffect(() => {
    setAmount("");
    setNote("");
    setFormError("");
  }, [activeTab, period.month, period.year]);

  async function handleAddPayment(event) {
    event.preventDefault();
    setFormError("");
    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setFormError("Payment amount must be greater than zero.");
      return;
    }
    if (summary && paymentAmount > summary.remaining) {
      setFormError(
        `Payment cannot exceed the remaining amount (${formatCurrency(
          summary.remaining
        )}).`
      );
      return;
    }
    setSaving(true);
    try {
      await api.addMilkPayment({
        buyerType: activeTab,
        month: period.month,
        year: period.year,
        date,
        amount: paymentAmount,
        note,
      });
      toast.success("Payment recorded.");
      setAmount("");
      setNote("");
      reload();
    } catch (requestError) {
      setFormError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(paymentId) {
    setDeletingId(paymentId);
    try {
      await api.deleteMilkPayment(paymentId);
      toast.success("Payment moved to trash.");
      reload();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Milk Payments"
        description="Track installments from each buyer. Morning and evening payments are kept separate."
      >
        <MonthYearSelect
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </PageHeader>

      {loading && !data ? (
        <LoadingBlock label="Loading milk payments..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : data ? (
        <>
          <CombinedStrip combined={data.combined} />

          <div className="grid gap-3 sm:grid-cols-2">
            {["morning", "evening"].map((key) => {
              const meta = BUYER_META[key];
              const item = data.buyers[key];
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cx(
                    "rounded-2xl border bg-white dark:bg-slate-900 p-4 text-left shadow-card transition hover:shadow-md",
                    isActive
                      ? meta.active
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold",
                          meta.chip
                        )}
                      >
                        {meta.label}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Viewing
                        </span>
                      ) : null}
                    </div>
                    <StatusBadge status={item.summary.status} />
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.summary.amount)}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Paid {formatCurrency(item.summary.paid)}</span>
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      Remaining {formatCurrency(item.summary.remaining)}
                    </span>
                  </div>
                  <ProgressBar
                    value={item.summary.paid}
                    max={item.summary.amount}
                    tone={meta.bar}
                    className="mt-2"
                  />
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <Card className="h-fit">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Banknote size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Add {BUYER_META[activeTab].label.toLowerCase()} payment
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatMonthYear(period.month, period.year)} settlement
                  </p>
                </div>
              </div>
              <form onSubmit={handleAddPayment} className="space-y-3 p-5">
                <Field label="Payment date" htmlFor="payment-date">
                  <Input
                    id="payment-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                  />
                </Field>
                <Field
                  label="Amount (Rs.)"
                  htmlFor="payment-amount"
                  hint={
                    summary
                      ? `Remaining: ${formatCurrency(summary.remaining)}`
                      : undefined
                  }
                >
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </Field>
                <Field label="Note (optional)" htmlFor="payment-note">
                  <Textarea
                    id="payment-note"
                    rows={2}
                    placeholder="First payment, bank transfer..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={300}
                  />
                </Field>
                {formError ? (
                  <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                    {formError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  loading={saving}
                  disabled={!summary || summary.remaining <= 0}
                >
                  <CircleDollarSign size={16} />
                  Record payment
                </Button>
                {summary && summary.remaining <= 0 ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} /> This month is fully paid.
                  </p>
                ) : null}
              </form>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Payment history
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {BUYER_META[activeTab].label} buyer ·{" "}
                    {formatMonthYear(period.month, period.year)}
                  </p>
                </div>
                <Badge tone={activeTab === "morning" ? "blue" : "violet"}>
                  {summary ? formatCurrency(summary.paid) : "Rs. 0"} paid
                </Badge>
              </div>

              {!buyer?.payments?.length ? (
                <div className="p-5">
                  <EmptyState
                    icon={Wallet}
                    title="No payment history yet."
                    description="Installments recorded for this month will appear here."
                  />
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <th className="px-5 py-3 font-semibold">Date</th>
                          <th className="px-3 py-3 text-right font-semibold">
                            Amount
                          </th>
                          <th className="px-3 py-3 font-semibold">Note</th>
                          <th className="px-5 py-3 text-right font-semibold" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {buyer.payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                            <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                              {formatDate(payment.date)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                              {payment.note || "—"}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="iconSm"
                                className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                onClick={() => handleDelete(payment._id)}
                                loading={deletingId === payment._id}
                                aria-label="Delete payment"
                              >
                                <Trash2 size={15} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
                    {buyer.payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="flex items-start justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(payment.date)}
                          </p>
                          {payment.note ? (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {payment.note}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => handleDelete(payment._id)}
                          loading={deletingId === payment._id}
                          aria-label="Delete payment"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
