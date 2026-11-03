import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Form";
import { EmptyState } from "../ui/EmptyState";
import { StatCard } from "../ui/StatCard";
import { LoadingBlock, ErrorBlock } from "../ui/Spinner";
import { ObligationCard } from "./ObligationCard";
import { ObligationFormModal } from "./ObligationFormModal";
import { ObligationPaymentModal } from "./ObligationPaymentModal";
import { PersonHistoryModal } from "./PersonHistoryModal";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";

export function ObligationPage({ config }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState(null);
  const [paymentItem, setPaymentItem] = useState(null);
  const [historyName, setHistoryName] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => config.api.list().then((result) => result.items),
    []
  );

  const items = data || [];

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.original = acc.original + item.originalAmount;
        acc.paid = acc.paid + item.paid;
        acc.remaining = acc.remaining + item.remaining;
        if (item.status === "completed") acc.completed += 1;
        else acc.pending += 1;
        return acc;
      },
      { original: 0, paid: 0, remaining: 0, completed: 0, pending: 0 }
    );
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      item.personName.toLowerCase().includes(term)
    );
  }, [items, search]);

  const filteredRemaining = filtered.reduce(
    (sum, item) => sum + item.remaining,
    0
  );

  async function handleDelete(item) {
    setDeletingItem(item._id);
    try {
      await config.api.remove(item._id);
      toast.success(`${config.singularLabel} moved to trash.`);
      reload();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeletingItem(null);
    }
  }

  async function handleDeletePayment(item, payment) {
    setDeletingPaymentId(payment._id);
    try {
      await config.api.deletePayment(item._id, payment._id);
      toast.success("Payment moved to trash.");
      reload();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeletingPaymentId(null);
    }
  }

  function handleSaved() {
    setFormState(null);
    reload();
  }

  function handlePaymentSaved() {
    setPaymentItem(null);
    reload();
  }

  return (
    <div className="space-y-5">
      <PageHeader title={config.title} description={config.description}>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setFormState({ mode: "create" })}
        >
          <Plus size={16} />
          {config.addButton}
        </Button>
      </PageHeader>

      {loading && !data ? (
        <LoadingBlock label={`Loading ${config.title.toLowerCase()}...`} />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label={config.outstandingLabel}
              value={formatCurrency(stats.remaining)}
              sub={`${stats.pending} pending ${
                stats.pending === 1 ? "transaction" : "transactions"
              }`}
              icon={Banknote}
              tone={config.tone}
              badge={
                <span className="text-[11px] text-slate-400">
                  of {formatCurrency(stats.original)} recorded
                </span>
              }
            />
            <StatCard
              label={`${config.paidLabel} total`}
              value={formatCurrency(stats.paid)}
              sub={`${stats.completed} completed ${
                stats.completed === 1 ? "transaction" : "transactions"
              }`}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              label="People & transactions"
              value={String(items.length)}
              sub={`${new Set(items.map((item) => item.personName.toLowerCase())).size} ${
                new Set(items.map((item) => item.personName.toLowerCase())).size === 1
                  ? "person"
                  : "people"
              } recorded`}
              icon={Users}
              tone="slate"
            />
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="pl-9"
                  aria-label="Search by person name"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {search.trim()
                  ? `${filtered.length} matching · ${formatCurrency(
                      filteredRemaining
                    )} ${config.remainingLabel.toLowerCase()}`
                  : `${items.length} transaction${
                      items.length === 1 ? "" : "s"
                    } · ${config.historyNoun.toLowerCase()} and payment history`}
              </p>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              icon={search.trim() ? Search : config.emptyIcon}
              title={
                search.trim()
                  ? `No results for "${search.trim()}"`
                  : config.emptyTitle
              }
              description={
                search.trim()
                  ? "Try a different name. Search matches person names."
                  : config.emptyDescription
              }
              action={
                !search.trim() ? (
                  <Button onClick={() => setFormState({ mode: "create" })}>
                    <Plus size={16} />
                    {config.addButton}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <ObligationCard
                  key={item._id}
                  item={item}
                  config={config}
                  onEdit={(target) =>
                    setFormState({ mode: "edit", item: target })
                  }
                  onDelete={handleDelete}
                  onPayment={setPaymentItem}
                  onHistory={setHistoryName}
                  onDeletePayment={handleDeletePayment}
                  deletingPaymentId={deletingPaymentId}
                  deletingItem={deletingItem}
                />
              ))}
            </div>
          )}
        </>
      )}

      {formState ? (
        <ObligationFormModal
          item={formState.item}
          config={config}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {paymentItem ? (
        <ObligationPaymentModal
          item={paymentItem}
          config={config}
          onClose={() => setPaymentItem(null)}
          onSaved={handlePaymentSaved}
        />
      ) : null}

      {historyName ? (
        <PersonHistoryModal
          name={historyName}
          config={config}
          onClose={() => setHistoryName(null)}
        />
      ) : null}
    </div>
  );
}
