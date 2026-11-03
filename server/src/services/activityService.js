import { MilkRecord } from "../models/MilkRecord.js";
import { MilkPayment } from "../models/MilkPayment.js";
import { MilkRate } from "../models/MilkRate.js";
import { Payable } from "../models/Payable.js";
import { PayablePayment } from "../models/PayablePayment.js";
import { Receivable } from "../models/Receivable.js";
import { ReceivablePayment } from "../models/ReceivablePayment.js";
import { BUYER_LABELS, MONTH_NAMES } from "../config/constants.js";
import { round2 } from "../utils/numbers.js";

function compactNumber(value) {
  const number = Number(value);
  if (Number.isInteger(number)) return String(number);
  return String(Math.round(number * 1000) / 1000);
}

export async function getRecentActivity(limit = 12) {
  const [
    milkRecords,
    milkPayments,
    rateChanges,
    payables,
    payablePayments,
    receivables,
    receivablePayments,
  ] = await Promise.all([
    MilkRecord.find({ isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    MilkPayment.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    MilkRate.find({ isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),
    Payable.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
    PayablePayment.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("payableId", "personName isDeleted")
      .lean(),
    Receivable.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
    ReceivablePayment.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("receivableId", "personName isDeleted")
      .lean(),
  ]);

  const events = [];

  for (const record of milkRecords) {
    const label = BUYER_LABELS[record.buyerType] || "Milk";
    events.push({
      id: `milk-${record._id}`,
      type: "milk",
      tone: "blue",
      title: `${label} milk ${compactNumber(record.quantityKg)} kg recorded`,
      subtitle: record.date,
      date: record.date,
      amount: round2(record.calculatedAmount),
      timestamp: record.updatedAt,
    });
  }

  for (const payment of milkPayments) {
    const label = BUYER_LABELS[payment.buyerType] || "Milk";
    events.push({
      id: `milk-payment-${payment._id}`,
      type: "milk-payment",
      tone: "green",
      title: `${label} milk payment received`,
      subtitle: `${MONTH_NAMES[payment.month - 1]} ${payment.year}`,
      date: payment.date,
      amount: round2(payment.amount),
      timestamp: payment.createdAt,
    });
  }

  for (const rate of rateChanges) {
    const label = BUYER_LABELS[rate.buyerType] || "Milk";
    events.push({
      id: `rate-${rate._id}`,
      type: "rate",
      tone: "slate",
      title: `${label} rate set to Rs. ${compactNumber(rate.ratePerKg)}/kg`,
      subtitle: `Effective ${rate.effectiveFrom}`,
      date: rate.effectiveFrom,
      amount: null,
      timestamp: rate.updatedAt,
    });
  }

  for (const payable of payables) {
    events.push({
      id: `payable-${payable._id}`,
      type: "payable",
      tone: "red",
      title: `Payable to ${payable.personName} added`,
      subtitle: payable.reason,
      date: payable.date,
      amount: round2(payable.originalAmount),
      timestamp: payable.createdAt,
    });
  }

  for (const payment of payablePayments) {
    if (!payment.payableId || payment.payableId.isDeleted) continue;
    events.push({
      id: `payable-payment-${payment._id}`,
      type: "payable-payment",
      tone: "green",
      title: `Paid ${payment.payableId.personName}`,
      subtitle: payment.note || "Payable installment",
      date: payment.date,
      amount: round2(payment.amount),
      timestamp: payment.createdAt,
    });
  }

  for (const receivable of receivables) {
    events.push({
      id: `receivable-${receivable._id}`,
      type: "receivable",
      tone: "amber",
      title: `Receivable from ${receivable.personName} added`,
      subtitle: receivable.reason,
      date: receivable.date,
      amount: round2(receivable.originalAmount),
      timestamp: receivable.createdAt,
    });
  }

  for (const payment of receivablePayments) {
    if (!payment.receivableId || payment.receivableId.isDeleted) continue;
    events.push({
      id: `receivable-payment-${payment._id}`,
      type: "receivable-payment",
      tone: "green",
      title: `Received from ${payment.receivableId.personName}`,
      subtitle: payment.note || "Receivable installment",
      date: payment.date,
      amount: round2(payment.amount),
      timestamp: payment.createdAt,
    });
  }

  return events
    .filter((event) => event.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}
