import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Form";
import { StatusBadge } from "../ui/Badge";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";
import { todayString, isValidDateString } from "../../utils/dates";

export function ObligationPaymentModal({ item, config, onClose, onSaved }) {
  const toast = useToast();
  const [date, setDate] = useState(todayString());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError(`${config.paymentLabel} must be greater than zero.`);
      return;
    }
    if (paymentAmount > item.remaining) {
      setError(
        `${config.paymentLabel} cannot exceed the remaining amount (${formatCurrency(
          item.remaining
        )}).`
      );
      return;
    }
    if (!isValidDateString(date)) {
      setError("Please choose a valid payment date.");
      return;
    }

    setSaving(true);
    try {
      await config.api.addPayment(item._id, {
        date,
        amount: paymentAmount,
        note: note.trim(),
      });
      toast.success("Payment recorded.");
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
      title={`${config.paymentLabel} · ${item.personName}`}
      description={item.reason}
      size="sm"
      footer={
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={submit}
            loading={saving}
            disabled={item.remaining <= 0}
          >
            Save payment
          </Button>
        </div>
      }
    >
      <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{config.amountShortLabel}</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency(item.originalAmount)}
          </p>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{config.paidLabel}</p>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(item.paid)}
          </p>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {config.remainingLabel}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(item.remaining)}
            </p>
            <StatusBadge status={item.status} />
          </div>
        </div>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Payment date" htmlFor="obligation-payment-date">
          <Input
            id="obligation-payment-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </Field>
        <Field
          label={`${config.paymentLabel} (Rs.)`}
          htmlFor="obligation-payment-amount"
          hint={`Maximum ${formatCurrency(item.remaining)}`}
        >
          <Input
            id="obligation-payment-amount"
            type="number"
            min="0.01"
            max={item.remaining}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            autoFocus
            required
          />
        </Field>
        <Field label="Note (optional)" htmlFor="obligation-payment-note">
          <Textarea
            id="obligation-payment-note"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Cash, bank transfer..."
            maxLength={300}
          />
        </Field>
        {error ? (
          <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
