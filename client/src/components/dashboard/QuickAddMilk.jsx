import { useState } from "react";
import { CalendarDays, Milk, Plus } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Form";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";
import { isValidDateString, todayString } from "../../utils/dates";
import { cx } from "../../utils/cx";

export function QuickAddMilk({ onSaved, className }) {
  const toast = useToast();
  const [date, setDate] = useState(todayString());
  const [morningKg, setMorningKg] = useState("0");
  const [eveningKg, setEveningKg] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isValidDateString(date)) {
      setError("Please choose a valid date.");
      return;
    }
    const morning = Number(morningKg);
    const evening = Number(eveningKg);
    if (!Number.isFinite(morning) || morning < 0) {
      setError("Morning quantity must be zero or greater.");
      return;
    }
    if (!Number.isFinite(evening) || evening < 0) {
      setError("Evening quantity must be zero or greater.");
      return;
    }

    setSaving(true);
    try {
      await api.saveMilkRecord({
        date,
        morningKg: morning,
        eveningKg: evening,
      });
      toast.success("Milk record saved.");
      setMorningKg("0");
      setEveningKg("0");
      onSaved?.(date);
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={cx("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Milk size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick add milk</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Record both buyers at once</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3 p-5">
        <Field label="Date" htmlFor="quick-date">
          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              id="quick-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="pl-9"
              required
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Morning kg" htmlFor="quick-morning">
            <Input
              id="quick-morning"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={morningKg}
              onChange={(event) => setMorningKg(event.target.value)}
              placeholder="0"
              required
            />
          </Field>
          <Field label="Evening kg" htmlFor="quick-evening">
            <Input
              id="quick-evening"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={eveningKg}
              onChange={(event) => setEveningKg(event.target.value)}
              placeholder="0"
              required
            />
          </Field>
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : (
          <p className="text-[11px] leading-4 text-slate-400">
            Saving an existing date updates that day. Amounts use the rate
            effective on the selected date.
          </p>
        )}

        <Button
          type="submit"
          className="mt-auto w-full"
          loading={saving}
          disabled={saving}
        >
          <Plus size={16} />
          Save milk record
        </Button>
      </form>
    </Card>
  );
}
