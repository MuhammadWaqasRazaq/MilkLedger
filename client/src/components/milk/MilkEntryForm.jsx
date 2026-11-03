import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Form";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";
import { isValidDateString, todayString } from "../../utils/dates";

export function MilkEntryForm({ onSaved, defaultDate }) {
  const toast = useToast();
  const [date, setDate] = useState(defaultDate || todayString());
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
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <CalendarDays size={16} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Add or update a daily record
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Any previous date can be entered. Decimals are supported.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end">
          <Field label="Date" htmlFor="entry-date">
            <Input
              id="entry-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Morning kg" htmlFor="entry-morning">
            <Input
              id="entry-morning"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={morningKg}
              onChange={(event) => setMorningKg(event.target.value)}
              required
            />
          </Field>
          <Field label="Evening kg" htmlFor="entry-evening">
            <Input
              id="entry-evening"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={eveningKg}
              onChange={(event) => setEveningKg(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={saving} className="lg:mb-0">
            <Plus size={16} />
            Save
          </Button>
        </div>
        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
