import { useState } from "react";
import { CalendarPlus, Eraser } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Form";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";
import { formatMonthYear } from "../../utils/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildRows(month, year, existingDaily) {
  const byDate = new Map(
    (existingDaily || []).map((record) => [record.date, record])
  );
  const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    const existing = byDate.get(date);
    return {
      date,
      day,
      weekday: WEEKDAYS[new Date(Date.UTC(Number(year), Number(month) - 1, day)).getUTCDay()],
      morning: existing ? String(existing.morningKg) : "",
      evening: existing ? String(existing.eveningKg) : "",
    };
  });
}

export function BulkMilkModal({ month, year, existingDaily, onClose, onSaved }) {
  const toast = useToast();
  const [rows, setRows] = useState(() => buildRows(month, year, existingDaily));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filledRows = rows.filter(
    (row) => row.morning.trim() !== "" || row.evening.trim() !== ""
  );

  function updateRow(date, field, value) {
    setRows((current) =>
      current.map((row) =>
        row.date === date ? { ...row, [field]: value } : row
      )
    );
  }

  function clearAll() {
    setRows((current) =>
      current.map((row) => ({ ...row, morning: "", evening: "" }))
    );
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const days = [];
    for (const row of rows) {
      const morningRaw = row.morning.trim();
      const eveningRaw = row.evening.trim();
      if (morningRaw === "" && eveningRaw === "") continue;

      const morning = morningRaw === "" ? 0 : Number(morningRaw);
      const evening = eveningRaw === "" ? 0 : Number(eveningRaw);
      if (!Number.isFinite(morning) || morning < 0) {
        setError(`Day ${row.day}: morning quantity must be zero or greater.`);
        return;
      }
      if (!Number.isFinite(evening) || evening < 0) {
        setError(`Day ${row.day}: evening quantity must be zero or greater.`);
        return;
      }

      days.push({ date: row.date, morningKg: morning, eveningKg: evening });
    }

    if (days.length === 0) {
      setError("Enter at least one day's milk quantity.");
      return;
    }

    setSaving(true);
    try {
      const result = await api.saveMilkMonth({ month, year, days });
      toast.success(
        `${result.days} day${result.days === 1 ? "" : "s"} saved for ${formatMonthYear(month, year)}.`
      );
      onSaved?.();
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Fill ${formatMonthYear(month, year)}`}
      description="Enter morning and evening kg for as many days as needed. Blank rows are skipped."
      size="xl"
      footer={
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="bulk-milk-form"
            loading={saving}
            disabled={filledRows.length === 0}
          >
            Save {filledRows.length} day{filledRows.length === 1 ? "" : "s"}
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Existing records are pre-filled. Leave both fields blank to leave a
          date unchanged; enter 0 to save a zero-kilo day.
        </p>
        <Button variant="ghost" size="sm" onClick={clearAll} disabled={saving}>
          <Eraser size={14} />
          Clear all
        </Button>
      </div>

      <form id="bulk-milk-form" onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="sticky top-0 z-10 grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <span>Day</span>
            <span className="text-center">Morning kg</span>
            <span className="text-center">Evening kg</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <div
                key={row.date}
                className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {row.day}
                  </p>
                  <p className="text-[10px] text-slate-400">{row.weekday}</p>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={row.morning}
                  onChange={(event) =>
                    updateRow(row.date, "morning", event.target.value)
                  }
                  aria-label={`${row.date} morning kg`}
                  className="px-2 text-center"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  value={row.evening}
                  onChange={(event) =>
                    updateRow(row.date, "evening", event.target.value)
                  }
                  aria-label={`${row.date} evening kg`}
                  className="px-2 text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <CalendarPlus size={13} />
          Existing rates are applied automatically to each date.
        </div>
      </form>
    </Modal>
  );
}
