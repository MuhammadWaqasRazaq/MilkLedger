import { MilkRecord } from "../models/MilkRecord.js";
import { MilkRate } from "../models/MilkRate.js";
import { MilkPayment } from "../models/MilkPayment.js";
import { Payable } from "../models/Payable.js";
import { PayablePayment } from "../models/PayablePayment.js";
import { Receivable } from "../models/Receivable.js";
import { ReceivablePayment } from "../models/ReceivablePayment.js";
import { BUYER_LABELS, MONTH_NAMES } from "../config/constants.js";
import { formatDisplayDate } from "../utils/dates.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { round2 } from "../utils/numbers.js";
import { recalculateMilkRecords } from "../services/rateService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const TYPE_CONFIG = {
  "milk-records": {
    label: "Milk Records",
    model: MilkRecord,
    describe(doc) {
      return {
        title: `${BUYER_LABELS[doc.buyerType]} milk · ${formatDisplayDate(doc.date)}`,
        subtitle: `${doc.quantityKg} kg`,
        amount: round2(doc.calculatedAmount),
        date: doc.date,
      };
    },
  },
  "milk-payments": {
    label: "Milk Payments",
    model: MilkPayment,
    describe(doc) {
      return {
        title: `${BUYER_LABELS[doc.buyerType]} milk payment`,
        subtitle: `${MONTH_NAMES[doc.month - 1]} ${doc.year} · paid ${formatDisplayDate(doc.date)}`,
        amount: round2(doc.amount),
        date: doc.date,
      };
    },
  },
  "milk-rates": {
    label: "Milk Rates",
    model: MilkRate,
    describe(doc) {
      return {
        title: `${BUYER_LABELS[doc.buyerType]} rate · Rs. ${doc.ratePerKg}/kg`,
        subtitle: `Effective ${formatDisplayDate(doc.effectiveFrom)}`,
        amount: null,
        date: doc.effectiveFrom,
      };
    },
  },
  payables: {
    label: "Payables",
    model: Payable,
    describe(doc) {
      return {
        title: `${doc.personName} · Payable`,
        subtitle: doc.reason,
        amount: round2(doc.originalAmount),
        date: doc.date,
      };
    },
  },
  "payable-payments": {
    label: "Payable Payments",
    model: PayablePayment,
    populate: { path: "payableId", select: "personName isDeleted" },
    describe(doc) {
      return {
        title: `Payment to ${doc.payableId?.personName || "unknown person"}`,
        subtitle: doc.note || `Paid ${formatDisplayDate(doc.date)}`,
        amount: round2(doc.amount),
        date: doc.date,
        skip: !doc.payableId || doc.payableId.isDeleted,
      };
    },
  },
  receivables: {
    label: "Receivables",
    model: Receivable,
    describe(doc) {
      return {
        title: `${doc.personName} · Receivable`,
        subtitle: doc.reason,
        amount: round2(doc.originalAmount),
        date: doc.date,
      };
    },
  },
  "receivable-payments": {
    label: "Receivable Payments",
    model: ReceivablePayment,
    populate: { path: "receivableId", select: "personName isDeleted" },
    describe(doc) {
      return {
        title: `Received from ${doc.receivableId?.personName || "unknown person"}`,
        subtitle: doc.note || `Received ${formatDisplayDate(doc.date)}`,
        amount: round2(doc.amount),
        date: doc.date,
        skip: !doc.receivableId || doc.receivableId.isDeleted,
      };
    },
  },
};

function getConfig(type) {
  const config = TYPE_CONFIG[type];
  if (!config) throw new ValidationError("Unknown trash record type.");
  return config;
}

export const listTrash = asyncHandler(async (req, res) => {
  const groups = [];

  for (const [type, config] of Object.entries(TYPE_CONFIG)) {
    let query = config.model.find({ isDeleted: true }).sort({ deletedAt: -1 }).limit(200);
    if (config.populate) query = query.populate(config.populate);
    const docs = await query.lean();

    const items = docs
      .map((doc) => {
        const described = config.describe(doc);
        if (described.skip) return null;
        return {
          id: doc._id,
          type,
          ...described,
          deletedAt: doc.deletedAt,
        };
      })
      .filter(Boolean);

    if (items.length > 0) {
      groups.push({
        type,
        label: config.label,
        count: items.length,
        items,
      });
    }
  }

  const total = groups.reduce((sum, group) => sum + group.count, 0);
  res.json({ success: true, data: { total, groups } });
});

export const restoreTrashItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const config = getConfig(type);
  const doc = await config.model.findOne({ _id: id, isDeleted: true });
  if (!doc) throw new NotFoundError("Deleted record not found.");

  if (type === "milk-records") {
    const conflict = await MilkRecord.findOne({
      date: doc.date,
      buyerType: doc.buyerType,
      isDeleted: false,
      _id: { $ne: doc._id },
    });
    if (conflict) {
      throw new ConflictError(
        "An active milk record already exists for this date and buyer. Move that record to trash first."
      );
    }
  }

  if (type === "milk-rates") {
    const conflict = await MilkRate.findOne({
      buyerType: doc.buyerType,
      effectiveFrom: doc.effectiveFrom,
      isDeleted: false,
      _id: { $ne: doc._id },
    });
    if (conflict) {
      throw new ConflictError(
        "An active rate already exists for this buyer and effective date."
      );
    }
  }

  if (type === "payable-payments") {
    const parent = await Payable.findOne({
      _id: doc.payableId,
      isDeleted: false,
    });
    if (!parent) {
      throw new ConflictError("Restore the parent payable before this payment.");
    }
    const otherPayments = await PayablePayment.find({
      payableId: doc.payableId,
      isDeleted: false,
    }).lean();
    const paid = otherPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (paid + doc.amount > parent.originalAmount + 0.001) {
      throw new ConflictError(
        "Restoring this payment would exceed the payable amount."
      );
    }
  }

  if (type === "receivable-payments") {
    const parent = await Receivable.findOne({
      _id: doc.receivableId,
      isDeleted: false,
    });
    if (!parent) {
      throw new ConflictError("Restore the parent receivable before this payment.");
    }
    const otherPayments = await ReceivablePayment.find({
      receivableId: doc.receivableId,
      isDeleted: false,
    }).lean();
    const paid = otherPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (paid + doc.amount > parent.originalAmount + 0.001) {
      throw new ConflictError(
        "Restoring this payment would exceed the receivable amount."
      );
    }
  }

  doc.isDeleted = false;
  doc.deletedAt = null;
  await doc.save();

  if (type === "milk-rates") {
    await recalculateMilkRecords(doc.buyerType);
  }

  res.json({ success: true, message: "Record restored." });
});

export const permanentlyDeleteTrashItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const config = getConfig(type);
  const doc = await config.model.findOne({ _id: id, isDeleted: true });
  if (!doc) throw new NotFoundError("Deleted record not found.");

  if (type === "payables") {
    await PayablePayment.deleteMany({ payableId: doc._id });
  }
  if (type === "receivables") {
    await ReceivablePayment.deleteMany({ receivableId: doc._id });
  }

  await config.model.deleteOne({ _id: doc._id });
  res.json({ success: true, message: "Record permanently deleted." });
});
