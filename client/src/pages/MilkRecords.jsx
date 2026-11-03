import { useState } from "react";
import {
  CalendarPlus,
  NotebookPen,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { MonthYearSelect } from "../components/ui/MonthYearSelect";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Form";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, ErrorBlock } from "../components/ui/Spinner";
import { MilkEntryForm } from "../components/milk/MilkEntryForm";
import { BulkMilkModal } from "../components/milk/BulkMilkModal";
import { YearOverview } from "../components/milk/YearOverview";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import {
  currentPeriod,
  datePeriod,
  formatDate,
  formatMonthYear,
} from "../utils/dates";
import { formatCurrency, formatKg, formatNumber } from "../utils/format";

function EditMilkModal({ record, onClose, onSaved }) {
  const toast = useToast();
  const [morningKg, setMorningKg] = useState(String(record.morningKg));
  const [eveningKg, setEveningKg] = useState(String(record.eveningKg));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(event) {
    event.preventDefault();
    setError("");
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
      await api.updateMilkRecord(record.date, {
        morningKg: morning,
        eveningKg: evening,
      });
      toast.success("Milk record updated.");
      onSaved();
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
      title={`Edit milk record · ${formatDate(record.date)}`}
      description="Amounts are recalculated from the rate effective on this date."
      size="sm"
      footer={
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
        <Field label="Morning kg" htmlFor="edit-morning">
          <Input
            id="edit-morning"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={morningKg}
            onChange={(event) => setMorningKg(event.target.value)}
            autoFocus
            required
          />
        </Field>
        <Field label="Evening kg" htmlFor="edit-evening">
          <Input
            id="edit-evening"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={eveningKg}
            onChange={(event) => setEveningKg(event.target.value)}
            required
          />
        </Field>
        {error ? (
          <p className="col-span-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function MilkRecords() {
  const toast = useToast();
  const [period, setPeriod] = useState(currentPeriod);
  const [editRecord, setEditRecord] = useState(null);
  const [deletingDate, setDeletingDate] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const records = useApi(
    () => api.getMilkRecords(period.month, period.year),
    [period.month, period.year]
  );
  const yearly = useApi(
    () => api.getYearlyMilkReport(period.year),
    [period.year]
  );

  function handleSaved(date) {
    const next = datePeriod(date);
    const sameMonth =
      next.month === period.month && next.year === period.year;
    const sameYear = next.year === period.year;
    setPeriod(next);
    if (sameMonth) {
      records.reload();
      yearly.reload();
    } else if (sameYear) {
      yearly.reload();
    }
  }

  async function handleDelete(date) {
    setDeletingDate(date);
    try {
      await api.deleteMilkRecord(date);
      toast.success("Milk record moved to trash.");
      records.reload();
      yearly.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingDate(null);
    }
  }

  function handleEditSaved() {
    setEditRecord(null);
    records.reload();
    yearly.reload();
  }

  function handleBulkSaved() {
    setBulkOpen(false);
    records.reload();
    yearly.reload();
  }

  const daily = records.data?.daily || [];
  const totals = records.data?.totals;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Milk Records"
        description="Daily milk for both buyers. Enter one date, edit records, or fill a whole month at once."
      >
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => setBulkOpen(true)}
          disabled={!records.data || records.loading}
        >
          <CalendarPlus size={16} />
          Fill whole month
        </Button>
        <MonthYearSelect
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </PageHeader>

      <MilkEntryForm onSaved={handleSaved} />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatMonthYear(period.month, period.year)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {daily.length} day{daily.length === 1 ? "" : "s"} with records
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Info size={13} />
            Rate is applied by record date
          </div>
        </div>

        {records.loading && !records.data ? (
          <div className="p-5">
            <LoadingBlock label="Loading milk records..." />
          </div>
        ) : records.error ? (
          <div className="p-5">
            <ErrorBlock message={records.error} onRetry={records.reload} />
          </div>
        ) : daily.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={NotebookPen}
              title="No milk records for this month."
              description="Use the form above to add the first record for this month."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Morning KG
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Evening KG
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Total KG
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Morning Amount
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Evening Amount
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Total Amount
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daily.map((day) => (
                    <tr
                      key={day.date}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        <div>{formatNumber(day.morningKg)}</div>
                        <div className="text-[10px] text-slate-400">
                          Rs. {formatNumber(day.morningRate)}/kg
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        <div>{formatNumber(day.eveningKg)}</div>
                        <div className="text-[10px] text-slate-400">
                          Rs. {formatNumber(day.eveningRate)}/kg
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatNumber(day.totalKg)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(day.morningAmount)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(day.eveningAmount)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(day.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setEditRecord(day)}
                            aria-label={`Edit ${day.date}`}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                            onClick={() => handleDelete(day.date)}
                            loading={deletingDate === day.date}
                            aria-label={`Delete ${day.date}`}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {totals ? (
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <td className="px-5 py-3">Month total</td>
                      <td className="px-3 py-3 text-right">
                        {formatNumber(totals.morning.kg)} kg
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatNumber(totals.evening.kg)} kg
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatNumber(totals.combined.kg)} kg
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(totals.morning.amount)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(totals.evening.amount)}
                      </td>
                      <td className="px-3 py-3 text-right text-brand-700 dark:text-brand-300">
                        {formatCurrency(totals.combined.amount)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {daily.map((day) => (
                <div key={day.date} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(day.date)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatKg(day.totalKg)} · {formatCurrency(day.totalAmount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setEditRecord(day)}
                        aria-label={`Edit ${day.date}`}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => handleDelete(day.date)}
                        loading={deletingDate === day.date}
                        aria-label={`Delete ${day.date}`}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-brand-50/60 dark:bg-brand-500/10 px-2.5 py-2">
                      <p className="text-[10px] font-semibold uppercase text-brand-700 dark:text-brand-300">
                        Morning
                      </p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(day.morningKg)} kg
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatCurrency(day.morningAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-violet-50/60 dark:bg-violet-500/10 px-2.5 py-2">
                      <p className="text-[10px] font-semibold uppercase text-violet-700 dark:text-violet-300">
                        Evening
                      </p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatNumber(day.eveningKg)} kg
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatCurrency(day.eveningAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {totals ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Morning total</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatKg(totals.morning.kg)} ·{" "}
                      {formatCurrency(totals.morning.amount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Evening total</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatKg(totals.evening.kg)} ·{" "}
                      {formatCurrency(totals.evening.amount)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span>Combined</span>
                    <span>
                      {formatKg(totals.combined.kg)} ·{" "}
                      {formatCurrency(totals.combined.amount)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </Card>

      <YearOverview
        year={period.year}
        months={yearly.data?.months || []}
        selectedMonth={period.month}
        loading={yearly.loading}
        onSelect={(month) => setPeriod({ ...period, month })}
      />

      {editRecord ? (
        <EditMilkModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={handleEditSaved}
        />
      ) : null}

      {bulkOpen ? (
        <BulkMilkModal
          month={period.month}
          year={period.year}
          existingDaily={daily}
          onClose={() => setBulkOpen(false)}
          onSaved={handleBulkSaved}
        />
      ) : null}
    </div>
  );
}
