import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Form";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import {
  api,
  backupPath,
  downloadFile,
  exportPath,
} from "../api/client";
import { MONTH_NAMES, todayString, yearOptions } from "../utils/dates";

const DATASETS = [
  {
    key: "milk-records",
    label: "Milk Records",
    description: "Daily morning and evening quantities, rates and amounts.",
    periodFilter: true,
  },
  {
    key: "milk-payments",
    label: "Milk Payments",
    description: "Buyer installments with settlement month and notes.",
    periodFilter: true,
  },
  {
    key: "milk-rates",
    label: "Milk Rates",
    description: "Rate history with effective dates for both buyers.",
    periodFilter: false,
  },
  {
    key: "payables",
    label: "Payables",
    description: "All payables with paid and remaining amounts.",
    periodFilter: false,
  },
  {
    key: "payable-payments",
    label: "Payable Payments",
    description: "Every installment paid to payable people.",
    periodFilter: false,
  },
  {
    key: "receivables",
    label: "Receivables",
    description: "All receivables with received and remaining amounts.",
    periodFilter: false,
  },
  {
    key: "receivable-payments",
    label: "Receivable Payments",
    description: "Every installment received from receivable people.",
    periodFilter: false,
  },
];

function filenameFor(key, format, filters) {
  const suffix = filters.year
    ? `-${filters.year}${
        filters.month ? `-${String(filters.month).padStart(2, "0")}` : ""
      }`
    : "";
  return `${key}${suffix}.${format === "xls" ? "xls" : "csv"}`;
}

export default function Backup() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [filters, setFilters] = useState({ year: "", month: "" });
  const [downloading, setDownloading] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);

  const years = useMemo(() => yearOptions(new Date().getFullYear()), []);

  async function handleBackupDownload() {
    setBackupBusy(true);
    try {
      await downloadFile(
        backupPath(),
        `milk-ledger-backup-${todayString()}.json`
      );
      toast.success("Full backup downloaded.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleExport(key, format) {
    const loader = `${key}-${format}`;
    setDownloading(loader);
    try {
      const queryFilters = {};
      if (filters.year) queryFilters.year = filters.year;
      if (filters.year && filters.month) queryFilters.month = filters.month;
      await downloadFile(
        exportPath(key, format, queryFilters),
        filenameFor(key, format, queryFilters)
      );
      toast.success("Export downloaded.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDownloading("");
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Backup file is too large (maximum 50 MB).");
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const data = payload?.data || payload;
      if (!data || typeof data !== "object") {
        throw new Error("This file does not contain backup data.");
      }
      const required = [
        "milkRecords",
        "milkRates",
        "milkPayments",
        "payables",
        "payablePayments",
        "receivables",
        "receivablePayments",
      ];
      const missing = required.filter((key) => !Array.isArray(data[key]));
      if (missing.length > 0) {
        throw new Error(
          `Backup is missing collections: ${missing.join(", ")}.`
        );
      }
      setPendingRestore({ payload, filename: file.name, meta: payload?.meta });
    } catch (error) {
      toast.error(error.message || "Could not read the backup file.");
    }
  }

  async function handleRestore() {
    if (!pendingRestore) return;
    setRestoring(true);
    try {
      const result = await api.restoreBackup(pendingRestore.payload);
      setRestoreResult(result);
      setPendingRestore(null);
      toast.success("Backup restored successfully.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRestoring(false);
    }
  }

  const totalBackupRecords = pendingRestore?.meta?.counts
    ? Object.values(pendingRestore.meta.counts).reduce(
        (sum, count) => sum + Number(count || 0),
        0
      )
    : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Backup & Export"
        description="Protect your financial records with a full backup, CSV files, or Excel-compatible exports."
      >
        <Link to="/trash" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">
            <Trash2 size={16} />
            Open Trash
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Database size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Full backup
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Downloads a JSON file with every collection, including trash
                items. Keep a copy somewhere safe.
              </p>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleBackupDownload}
            loading={backupBusy}
          >
            <Download size={16} />
            Download full backup
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Upload size={20} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Restore full backup
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Restores a previously downloaded JSON backup. This replaces all
                current data.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileJson size={16} />
            Choose backup file
          </Button>
          {restoreResult ? (
            <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
              <p className="font-semibold">Restore complete</p>
              <p className="mt-0.5">
                {Object.entries(restoreResult.counts || {})
                  .map(([key, value]) => `${value} ${key}`)
                  .join(" · ")}
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              CSV &amp; Excel exports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download individual record sets. Excel files open directly in
              Excel.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label
                htmlFor="export-year"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Year
              </label>
              <Select
                id="export-year"
                value={filters.year}
                onChange={(event) =>
                  setFilters({ year: event.target.value, month: "" })
                }
                className="h-11 min-w-[110px] text-base sm:h-9 sm:text-xs"
              >
                <option value="">All time</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label
                htmlFor="export-month"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Month
              </label>
              <Select
                id="export-month"
                value={filters.month}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    month: event.target.value,
                  }))
                }
                disabled={!filters.year}
                className="h-11 min-w-[120px] text-base sm:h-9 sm:text-xs"
              >
                <option value="">Full year</option>
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {DATASETS.map((dataset) => (
            <li
              key={dataset.key}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {dataset.label}
                  {dataset.periodFilter && filters.year ? (
                    <span className="ml-2 rounded bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                      filtered
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{dataset.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport(dataset.key, "csv")}
                  loading={downloading === `${dataset.key}-csv`}
                >
                  <FileSpreadsheet size={14} />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExport(dataset.key, "xls")}
                  loading={downloading === `${dataset.key}-xls`}
                >
                  <FileSpreadsheet size={14} />
                  Excel
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                What the backup includes
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li>Milk records and rate history for both buyers</li>
                <li>Milk payments and settlement months</li>
                <li>Payables and payable installments</li>
                <li>Receivables and receivable installments</li>
                <li>Soft-deleted items currently in Trash</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Restore warning
              </h3>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">
                Restoring a backup deletes the current records and replaces them
                with the backup contents. Download a fresh backup first if you
                are not sure.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        onClose={() => setPendingRestore(null)}
        onConfirm={handleRestore}
        title="Restore this backup?"
        message={`${
          pendingRestore?.filename ? `"${pendingRestore.filename}" ` : ""
        }will replace all current data${
          totalBackupRecords !== null
            ? ` with ${totalBackupRecords} backed-up records`
            : ""
        }. This cannot be undone unless you have another backup.`}
        confirmLabel="Restore backup"
        loading={restoring}
      />
    </div>
  );
}
