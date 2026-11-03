import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Form";
import { useToast } from "../../context/ToastContext";
import { todayString, isValidDateString } from "../../utils/dates";

export function ObligationFormModal({ item, config, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(item);
  const [personName, setPersonName] = useState(item?.personName || "");
  const [reason, setReason] = useState(item?.reason || "");
  const [originalAmount, setOriginalAmount] = useState(
    item ? String(item.originalAmount) : ""
  );
  const [date, setDate] = useState(item?.date || todayString());
  const [notes, setNotes] = useState(item?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!personName.trim()) {
      setError("Person name is required.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    const amount = Number(originalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!isValidDateString(date)) {
      setError("Please choose a valid date.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        personName: personName.trim(),
        reason: reason.trim(),
        originalAmount: amount,
        date,
        notes: notes.trim(),
      };
      if (isEdit) {
        await config.api.update(item._id, payload);
        toast.success(`${config.singularLabel} updated.`);
      } else {
        await config.api.create(payload);
        toast.success(`${config.singularLabel} added.`);
      }
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
      title={`${isEdit ? "Edit" : "Add"} ${config.singularLabel.toLowerCase()}`}
      description={
        isEdit
          ? "Update the transaction details. Payment history is not affected."
          : config.formDescription
      }
      footer={
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {isEdit ? "Save changes" : config.addButton}
          </Button>
        </div>
      }
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Field label="Person name" htmlFor="obligation-person">
          <Input
            id="obligation-person"
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            placeholder="e.g. Ahmed"
            maxLength={120}
            autoFocus
            required
          />
        </Field>
        <Field label="Date" htmlFor="obligation-date">
          <Input
            id="obligation-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </Field>
        <Field
          label={config.amountLabel}
          htmlFor="obligation-amount"
          hint={
            isEdit
              ? `Already ${config.paidLabel.toLowerCase()}: ${item.paid}`
              : undefined
          }
        >
          <Input
            id="obligation-amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            value={originalAmount}
            onChange={(event) => setOriginalAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Reason" htmlFor="obligation-reason">
          <Input
            id="obligation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={config.reasonPlaceholder}
            maxLength={300}
            required
          />
        </Field>
        <Field
          label="Notes (optional)"
          htmlFor="obligation-notes"
          className="sm:col-span-2"
        >
          <Textarea
            id="obligation-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any extra detail..."
            maxLength={1000}
          />
        </Field>
        {error ? (
          <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300 sm:col-span-2">
            {error}
          </p>
        ) : null}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
