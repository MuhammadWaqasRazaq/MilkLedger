import { useState } from "react";
import {
  ArrowRight,
  Info,
  PencilLine,
  Sunrise,
  Sunset,
  Tag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, ErrorBlock } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { formatDate, todayString } from "../utils/dates";
import { formatCurrency } from "../utils/format";
import { cx } from "../utils/cx";

const BUYER_META = {
  morning: {
    label: "Morning",
    icon: Sunrise,
    iconClass: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
    accent: "text-brand-700 dark:text-brand-300",
  },
  evening: {
    label: "Evening",
    icon: Sunset,
    iconClass: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accent: "text-violet-700 dark:text-violet-300",
  },
};

function RateCard({ buyerType, data, onChanged }) {
  const toast = useToast();
  const meta = BUYER_META[buyerType];
  const Icon = meta.icon;
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayString());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const rateValue = Number(rate);
    if (!Number.isFinite(rateValue) || rateValue <= 0) {
      setError("Rate per kg must be greater than zero.");
      return;
    }
    if (!effectiveFrom) {
      setError("Effective date is required.");
      return;
    }
    setSaving(true);
    try {
      await api.createMilkRate({
        buyerType,
        ratePerKg: rateValue,
        effectiveFrom,
      });
      toast.success(
        `${meta.label} rate saved. Milk records were recalculated by date.`
      );
      setRate("");
      onChanged();
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.deleteMilkRate(id);
      toast.success("Rate moved to trash. Milk records were recalculated.");
      onChanged();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              meta.iconClass
            )}
          >
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {meta.label} rate
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Per kilogram</p>
          </div>
        </div>
        <Badge tone={buyerType === "morning" ? "blue" : "violet"}>
          Latest
        </Badge>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-900 p-4 text-white dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Current rate
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(data.current.ratePerKg)}
            <span className="ml-1 text-xs font-medium text-slate-400">/kg</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Effective {formatDate(data.current.effectiveFrom)}
          </p>
          <div className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[11px] text-slate-300">
            Amount = milk quantity in kg × rate per kg
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="New rate (Rs. per kg)" htmlFor={`rate-${buyerType}`}>
            <Input
              id={`rate-${buyerType}`}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder={String(data.current.ratePerKg)}
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              required
            />
          </Field>
          <Field label="Effective from" htmlFor={`effective-${buyerType}`}>
            <Input
              id={`effective-${buyerType}`}
              type="date"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              required
            />
          </Field>
          {error ? (
            <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={saving}>
            <PencilLine size={15} />
            Save rate change
          </Button>
        </form>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <Tag size={12} /> Rate history
        </p>
        {!data.history.length ? (
          <EmptyState
            icon={Tag}
            title="No rates recorded"
            description="Add the first rate for this buyer using the form above."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.history.map((historyItem) => (
              <li
                key={historyItem._id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(historyItem.effectiveFrom)}
                  </span>
                  <ArrowRight size={13} className="text-slate-300" />
                  <span className={cx("font-semibold", meta.accent)}>
                    {formatCurrency(historyItem.ratePerKg)}/kg
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => handleDelete(historyItem._id)}
                  loading={deletingId === historyItem._id}
                  aria-label="Delete rate"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function MilkRates() {
  const { data, loading, error, reload } = useApi(() => api.getMilkRates(), []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Milk Rates"
        description="Rates are per kg and apply to each milk record based on its date."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 dark:border-brand-500/30 bg-brand-50/70 dark:bg-brand-500/10 px-4 py-3 text-xs text-brand-800 dark:text-brand-200">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p className="leading-5">
          Changing a rate does not rewrite history. A milk record uses the rate
          whose effective date is on or before that record&apos;s date. If you
          add a rate with a past effective date, existing records are
          recalculated automatically.
        </p>
      </div>

      {loading && !data ? (
        <LoadingBlock label="Loading milk rates..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <RateCard
            buyerType="morning"
            data={data.morning}
            onChanged={reload}
          />
          <RateCard
            buyerType="evening"
            data={data.evening}
            onChanged={reload}
          />
        </div>
      ) : null}
    </div>
  );
}
