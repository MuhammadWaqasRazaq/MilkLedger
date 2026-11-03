import { MilkRecord } from "../models/MilkRecord.js";
import { MilkRate } from "../models/MilkRate.js";
import { MilkPayment } from "../models/MilkPayment.js";
import { Payable } from "../models/Payable.js";
import { PayablePayment } from "../models/PayablePayment.js";
import { Receivable } from "../models/Receivable.js";
import { ReceivablePayment } from "../models/ReceivablePayment.js";
import { BUYER_LABELS, KG_PER_MANN, MONTH_NAMES } from "../config/constants.js";
import { monthBounds, yearBounds, todayString } from "../utils/dates.js";
import { ValidationError } from "../utils/errors.js";
import { round2, round3 } from "../utils/numbers.js";
import {
  sendCsv,
  sendExcel,
  sendJsonDownload,
} from "../utils/export.js";
import {
  ensureDefaultRates,
  normalizeRateDocument,
  recalculateMilkRecords,
} from "../services/rateService.js";
import { payablesService } from "../services/payablesService.js";
import { receivablesService } from "../services/receivablesService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const DATE_COLUMNS = ["Date", "Buyer", "Quantity (KG)", "Mann", "Rate per KG (Rs.)", "Amount (Rs.)", "Created At"];

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function buildDateFilter({ month, year }) {
  if (month && year) {
    const bounds = monthBounds(year, month);
    return { $gte: bounds.start, $lte: bounds.end };
  }
  if (year) {
    const bounds = yearBounds(year);
    return { $gte: bounds.start, $lte: bounds.end };
  }
  return null;
}

function fileSuffix({ month, year }) {
  if (month && year) return `-${year}-${String(month).padStart(2, "0")}`;
  if (year) return `-${year}`;
  return `-${todayString()}`;
}

async function buildMilkRecordsDataset(filters) {
  const filter = { isDeleted: false };
  const dateFilter = buildDateFilter(filters);
  if (dateFilter) filter.date = dateFilter;

  const records = await MilkRecord.find(filter)
    .sort({ date: 1, buyerType: 1 })
    .lean();

  return {
    title: "Milk Records",
    baseName: `milk-records${fileSuffix(filters)}`,
    headers: DATE_COLUMNS,
    rows: records.map((record) => [
      record.date,
      BUYER_LABELS[record.buyerType],
      record.quantityKg,
      round3(record.quantityKg / KG_PER_MANN),
      record.applicableRate,
      round2(record.calculatedAmount),
      formatDateTime(record.createdAt),
    ]),
  };
}

async function buildMilkPaymentsDataset(filters) {
  const filter = { isDeleted: false };
  if (filters.month) filter.month = Number(filters.month);
  if (filters.year) filter.year = Number(filters.year);

  const payments = await MilkPayment.find(filter)
    .sort({ year: 1, month: 1, date: 1 })
    .lean();

  return {
    title: "Milk Payments",
    baseName: `milk-payments${fileSuffix(filters)}`,
    headers: [
      "Buyer",
      "Settlement Month",
      "Settlement Year",
      "Payment Date",
      "Amount (Rs.)",
      "Note",
      "Created At",
    ],
    rows: payments.map((payment) => [
      BUYER_LABELS[payment.buyerType],
      MONTH_NAMES[payment.month - 1],
      payment.year,
      payment.date,
      round2(payment.amount),
      payment.note,
      formatDateTime(payment.createdAt),
    ]),
  };
}

async function buildMilkRatesDataset() {
  const rates = await MilkRate.find({ isDeleted: false })
    .sort({ buyerType: 1, effectiveFrom: 1 })
    .lean();

  return {
    title: "Milk Rates",
    baseName: `milk-rates${fileSuffix({})}`,
    headers: ["Buyer", "Rate per KG (Rs.)", "Effective From", "Created At"],
    rows: rates.map((rate) => [
      BUYER_LABELS[rate.buyerType],
      round2(rate.ratePerKg),
      rate.effectiveFrom,
      formatDateTime(rate.createdAt),
    ]),
  };
}

async function buildPayablesDataset() {
  const items = await payablesService.list({});
  return {
    title: "Payables",
    baseName: `payables${fileSuffix({})}`,
    headers: [
      "Person",
      "Reason",
      "Original Amount (Rs.)",
      "Date",
      "Paid (Rs.)",
      "Remaining (Rs.)",
      "Status",
      "Notes",
      "Created At",
    ],
    rows: items.map((item) => [
      item.personName,
      item.reason,
      round2(item.originalAmount),
      item.date,
      round2(item.paid),
      round2(item.remaining),
      item.status,
      item.notes,
      formatDateTime(item.createdAt),
    ]),
  };
}

async function buildReceivablesDataset() {
  const items = await receivablesService.list({});
  return {
    title: "Receivables",
    baseName: `receivables${fileSuffix({})}`,
    headers: [
      "Person",
      "Reason",
      "Original Amount (Rs.)",
      "Date",
      "Received (Rs.)",
      "Remaining (Rs.)",
      "Status",
      "Notes",
      "Created At",
    ],
    rows: items.map((item) => [
      item.personName,
      item.reason,
      round2(item.originalAmount),
      item.date,
      round2(item.paid),
      round2(item.remaining),
      item.status,
      item.notes,
      formatDateTime(item.createdAt),
    ]),
  };
}

async function buildPayablePaymentsDataset() {
  const payments = await PayablePayment.find({ isDeleted: false })
    .sort({ date: 1 })
    .populate("payableId", "personName isDeleted")
    .lean();
  const active = payments.filter(
    (payment) => payment.payableId && !payment.payableId.isDeleted
  );
  return {
    title: "Payable Payments",
    baseName: `payable-payments${fileSuffix({})}`,
    headers: ["Person", "Payment Date", "Amount (Rs.)", "Note", "Created At"],
    rows: active.map((payment) => [
      payment.payableId.personName,
      payment.date,
      round2(payment.amount),
      payment.note,
      formatDateTime(payment.createdAt),
    ]),
  };
}

async function buildReceivablePaymentsDataset() {
  const payments = await ReceivablePayment.find({ isDeleted: false })
    .sort({ date: 1 })
    .populate("receivableId", "personName isDeleted")
    .lean();
  const active = payments.filter(
    (payment) => payment.receivableId && !payment.receivableId.isDeleted
  );
  return {
    title: "Receivable Payments",
    baseName: `receivable-payments${fileSuffix({})}`,
    headers: ["Person", "Payment Date", "Amount (Rs.)", "Note", "Created At"],
    rows: active.map((payment) => [
      payment.receivableId.personName,
      payment.date,
      round2(payment.amount),
      payment.note,
      formatDateTime(payment.createdAt),
    ]),
  };
}

const DATASETS = {
  "milk-records": buildMilkRecordsDataset,
  "milk-payments": buildMilkPaymentsDataset,
  "milk-rates": buildMilkRatesDataset,
  payables: buildPayablesDataset,
  receivables: buildReceivablesDataset,
  "payable-payments": buildPayablePaymentsDataset,
  "receivable-payments": buildReceivablePaymentsDataset,
};

export const listDatasets = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      datasets: Object.keys(DATASETS),
      formats: ["csv", "xls"],
    },
  });
});

export const exportDataset = asyncHandler(async (req, res) => {
  const { dataset } = req.params;
  const builder = DATASETS[dataset];
  if (!builder) throw new ValidationError("Unknown export dataset.");

  const format = String(req.query.format || "csv").toLowerCase();
  if (!["csv", "xls"].includes(format)) {
    throw new ValidationError("Export format must be csv or xls.");
  }

  const filters = {
    month: req.query.month ? Number(req.query.month) : null,
    year: req.query.year ? Number(req.query.year) : null,
  };

  const data = await builder(filters);
  if (format === "xls") {
    sendExcel(res, data.baseName, data.title, data.headers, data.rows);
  } else {
    sendCsv(res, data.baseName, data.headers, data.rows);
  }
});

export const downloadFullBackup = asyncHandler(async (req, res) => {
  const [
    milkRecords,
    milkRates,
    milkPayments,
    payables,
    payablePayments,
    receivables,
    receivablePayments,
  ] = await Promise.all([
    MilkRecord.find({}).lean(),
    MilkRate.find({}).lean(),
    MilkPayment.find({}).lean(),
    Payable.find({}).lean(),
    PayablePayment.find({}).lean(),
    Receivable.find({}).lean(),
    ReceivablePayment.find({}).lean(),
  ]);

  const data = {
    milkRecords,
    milkRates,
    milkPayments,
    payables,
    payablePayments,
    receivables,
    receivablePayments,
  };

  sendJsonDownload(res, `milk-ledger-backup-${todayString()}`, {
    meta: {
      app: "Milk Ledger",
      version: 2,
      exportedAt: new Date().toISOString(),
      counts: Object.fromEntries(
        Object.entries(data).map(([key, items]) => [key, items.length])
      ),
    },
    data,
  });
});

const RESTORE_COLLECTIONS = [
  { key: "milkRates", model: MilkRate },
  { key: "milkRecords", model: MilkRecord },
  { key: "milkPayments", model: MilkPayment },
  { key: "payables", model: Payable },
  { key: "payablePayments", model: PayablePayment },
  { key: "receivables", model: Receivable },
  { key: "receivablePayments", model: ReceivablePayment },
];

export const restoreFullBackup = asyncHandler(async (req, res) => {
  const payload = req.body?.data ? req.body.data : req.body;
  if (!payload || typeof payload !== "object") {
    throw new ValidationError("Backup file is empty or invalid.");
  }

  for (const collection of RESTORE_COLLECTIONS) {
    if (!Array.isArray(payload[collection.key])) {
      throw new ValidationError(
        `Backup file is missing the "${collection.key}" collection.`
      );
    }
  }

  payload.milkRates = payload.milkRates.map(normalizeRateDocument);

  const counts = {};
  for (const collection of RESTORE_COLLECTIONS) {
    await collection.model.deleteMany({});
    const items = payload[collection.key];
    if (items.length > 0) {
      await collection.model.insertMany(items, {
        ordered: true,
        timestamps: false,
      });
    }
    counts[collection.key] = items.length;
  }

  await ensureDefaultRates();
  await recalculateMilkRecords("morning");
  await recalculateMilkRecords("evening");

  res.json({
    success: true,
    message: "Backup restored successfully.",
    data: { counts },
  });
});
