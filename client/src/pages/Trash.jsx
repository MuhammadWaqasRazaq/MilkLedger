import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DatabaseBackup,
  RotateCcw,
  Trash2,
  Trash,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingBlock, ErrorBlock } from "../components/ui/Spinner";
import { useApi } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { formatCurrency } from "../utils/format";
import { formatDateTime } from "../utils/dates";

export default function TrashPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => api.getTrash(), []);
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  async function handleRestore(item) {
    const key = `${item.type}-${item.id}-restore`;
    setBusy(key);
    try {
      await api.restoreTrashItem(item.type, item.id);
      toast.success("Record restored.");
      reload();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function handlePermanentDelete(item) {
    const key = `${item.type}-${item.id}-delete`;
    setDeleting(key);
    try {
      await api.permanentlyDeleteTrashItem(item.type, item.id);
      toast.success("Record permanently deleted.");
      reload();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeleting("");
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trash"
        description="Deleted records are kept here until you restore or permanently delete them."
      >
        <Link to="/backup" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">
            <DatabaseBackup size={16} />
            Backup &amp; Export
          </Button>
        </Link>
      </PageHeader>

      {loading && !data ? (
        <LoadingBlock label="Loading trash..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data?.groups?.length ? (
        <EmptyState
          icon={Trash}
          title="Trash is empty"
          description="Records you delete will appear here and can be restored."
        />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 shadow-card">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {data.total} deleted record{data.total === 1 ? "" : "s"}.
            </span>{" "}
            Restoring puts a record back into its original section. Permanent
            deletion cannot be undone.
          </div>

          {data.groups.map((group) => (
            <Card key={group.type} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {group.label}
                </h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {group.count}
                </span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Deleted {formatDateTime(item.deletedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {item.amount !== null && item.amount !== undefined ? (
                        <span className="mr-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.amount)}
                        </span>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestore(item)}
                        loading={busy === `${item.type}-${item.id}-restore`}
                      >
                        <RotateCcw size={14} />
                        Restore
                      </Button>
                      <Button
                        variant="dangerSoft"
                        size="sm"
                        onClick={() => setPendingDelete(item)}
                        loading={
                          deleting === `${item.type}-${item.id}-delete`
                        }
                      >
                        <Trash2 size={14} />
                        Delete forever
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <ConfirmDialog
            open={Boolean(pendingDelete)}
            onClose={() => setPendingDelete(null)}
            onConfirm={() => handlePermanentDelete(pendingDelete)}
            title="Delete this record forever?"
            message={
              pendingDelete
                ? `"${pendingDelete.title}" will be permanently deleted. This cannot be undone.`
                : ""
            }
            confirmLabel="Delete forever"
            loading={Boolean(deleting)}
          />
        </>
      )}
    </div>
  );
}
