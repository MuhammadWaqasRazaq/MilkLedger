import { MilkRecord } from "../models/MilkRecord.js";
import { MilkPayment } from "../models/MilkPayment.js";
import { BUYER_TYPES, KG_PER_MANN } from "../config/constants.js";
import { isValidDateString, monthBounds } from "../utils/dates.js";
import { ValidationError } from "../utils/errors.js";
import { round2, round3, toNumber } from "../utils/numbers.js";
import { resolveRateForDate } from "./rateService.js";

const EMPTY_BUYER = { kg: 0, mann: 0, amount: 0 };

export function assertQuantity(value, label) {
  const quantity = toNumber(value, label);
  if (quantity < 0) {
    throw new ValidationError(`${label} cannot be negative.`);
  }
  return round3(quantity);
}

export function emptyBuyerSummary() {
  return { ...EMPTY_BUYER, paid: 0, remaining: 0, status: "completed" };
}

export function buildBuyerSummary(kg, amount, paid = 0) {
  const roundedKg = round3(kg || 0);
  const roundedAmount = round2(amount || 0);
  const roundedPaid = round2(paid || 0);
  const remaining = round2(Math.max(0, roundedAmount - roundedPaid));
  return {
    kg: roundedKg,
    mann: round3(roundedKg / KG_PER_MANN),
    amount: roundedAmount,
    paid: roundedPaid,
    remaining,
    status: remaining <= 0 ? "completed" : "pending",
  };
}

export async function upsertMilkDay({ date, morningKg, eveningKg }) {
  if (!isValidDateString(date)) {
    throw new ValidationError("Please provide a valid date.");
  }
  const quantities = {
    morning: assertQuantity(morningKg, "Morning quantity"),
    evening: assertQuantity(eveningKg, "Evening quantity"),
  };

  const savedRecords = [];
  for (const buyerType of BUYER_TYPES) {
    const { ratePerKg, rateId } = await resolveRateForDate(buyerType, date);
    const quantityKg = quantities[buyerType];
    const calculatedAmount = round2(quantityKg * ratePerKg);

    const record = await MilkRecord.findOneAndUpdate(
      { date, buyerType },
      {
        $set: {
          quantityKg,
          applicableRate: ratePerKg,
          calculatedAmount,
          rateId,
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    savedRecords.push(record);
  }

  return savedRecords;
}

export async function updateMilkDay(date, { morningKg, eveningKg }) {
  if (!isValidDateString(date)) {
    throw new ValidationError("Please provide a valid date.");
  }
  return upsertMilkDay({ date, morningKg, eveningKg });
}

export async function upsertMilkMonth({ month, year, days }) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    throw new ValidationError("Please provide a valid month.");
  }
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new ValidationError("Please provide a valid year.");
  }
  if (!Array.isArray(days) || days.length === 0) {
    throw new ValidationError("Please enter at least one day.");
  }
  if (days.length > 31) {
    throw new ValidationError("A month cannot contain more than 31 days.");
  }

  const bounds = monthBounds(y, m);
  const seen = new Set();
  const entries = [];

  for (const item of days) {
    const date = item?.date;
    if (
      !isValidDateString(date) ||
      date < bounds.start ||
      date > bounds.end
    ) {
      throw new ValidationError("Every date must belong to the selected month.");
    }
    if (seen.has(date)) {
      throw new ValidationError("Each date can only appear once.");
    }
    seen.add(date);

    entries.push({
      date,
      morningKg: assertQuantity(item.morningKg, "Morning quantity"),
      eveningKg: assertQuantity(item.eveningKg, "Evening quantity"),
    });
  }

  const records = [];
  for (const entry of entries) {
    const saved = await upsertMilkDay(entry);
    records.push(...saved);
  }

  return { days: entries.length, records };
}

export async function softDeleteMilkDay(date) {
  if (!isValidDateString(date)) {
    throw new ValidationError("Please provide a valid date.");
  }
  const result = await MilkRecord.updateMany(
    { date, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
  return result.modifiedCount;
}

export function summarizeRecords(records) {
  const result = {};
  for (const buyerType of BUYER_TYPES) {
    result[buyerType] = { kg: 0, amount: 0 };
  }
  for (const record of records) {
    if (!result[record.buyerType]) continue;
    result[record.buyerType].kg += record.quantityKg || 0;
    result[record.buyerType].amount += record.calculatedAmount || 0;
  }
  for (const buyerType of BUYER_TYPES) {
    result[buyerType].kg = round3(result[buyerType].kg);
    result[buyerType].amount = round2(result[buyerType].amount);
  }
  return result;
}

export async function getMonthlyRecords(month, year) {
  const { start, end } = monthBounds(year, month);
  const records = await MilkRecord.find({
    isDeleted: false,
    date: { $gte: start, $lte: end },
  })
    .sort({ date: 1, buyerType: 1 })
    .lean();

  const byDate = new Map();
  for (const record of records) {
    if (!byDate.has(record.date)) {
      byDate.set(record.date, {
        date: record.date,
        morningKg: 0,
        eveningKg: 0,
        morningAmount: 0,
        eveningAmount: 0,
        morningRate: null,
        eveningRate: null,
      });
    }
    const day = byDate.get(record.date);
    if (record.buyerType === "morning") {
      day.morningKg = record.quantityKg;
      day.morningAmount = record.calculatedAmount;
      day.morningRate = record.applicableRate;
    } else if (record.buyerType === "evening") {
      day.eveningKg = record.quantityKg;
      day.eveningAmount = record.calculatedAmount;
      day.eveningRate = record.applicableRate;
    }
  }

  const daily = [...byDate.values()]
    .map((day) => ({
      ...day,
      totalKg: round3(day.morningKg + day.eveningKg),
      totalAmount: round2(day.morningAmount + day.eveningAmount),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const summary = summarizeRecords(records);
  const morning = summary.morning;
  const evening = summary.evening;

  return {
    period: { month: Number(month), year: Number(year), start, end },
    daily,
    totals: {
      morning: buildBuyerSummary(morning.kg, morning.amount),
      evening: buildBuyerSummary(evening.kg, evening.amount),
      combined: {
        kg: round3(morning.kg + evening.kg),
        mann: round3((morning.kg + evening.kg) / KG_PER_MANN),
        amount: round2(morning.amount + evening.amount),
      },
    },
    records,
  };
}

export async function getMonthlyBuyerTotals(month, year) {
  const { start, end } = monthBounds(year, month);
  const rows = await MilkRecord.aggregate([
    { $match: { isDeleted: false, date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$buyerType",
        kg: { $sum: "$quantityKg" },
        amount: { $sum: "$calculatedAmount" },
      },
    },
  ]);

  const byBuyer = {};
  for (const buyerType of BUYER_TYPES) {
    const row = rows.find((item) => item._id === buyerType);
    byBuyer[buyerType] = {
      kg: round3(row?.kg || 0),
      amount: round2(row?.amount || 0),
    };
  }
  return byBuyer;
}

export async function getMonthlyPaymentTotals(month, year) {
  const rows = await MilkPayment.aggregate([
    {
      $match: {
        isDeleted: false,
        month: Number(month),
        year: Number(year),
      },
    },
    { $group: { _id: "$buyerType", paid: { $sum: "$amount" } } },
  ]);

  const byBuyer = {};
  for (const buyerType of BUYER_TYPES) {
    const row = rows.find((item) => item._id === buyerType);
    byBuyer[buyerType] = round2(row?.paid || 0);
  }
  return byBuyer;
}

export async function getMilkSettlement(month, year) {
  const totals = await getMonthlyBuyerTotals(month, year);
  const payments = await getMonthlyPaymentTotals(month, year);

  const settlement = {};
  for (const buyerType of BUYER_TYPES) {
    settlement[buyerType] = buildBuyerSummary(
      totals[buyerType].kg,
      totals[buyerType].amount,
      payments[buyerType]
    );
  }

  settlement.combined = {
    kg: round3(totals.morning.kg + totals.evening.kg),
    mann: round3((totals.morning.kg + totals.evening.kg) / KG_PER_MANN),
    amount: round2(totals.morning.amount + totals.evening.amount),
    paid: round2(payments.morning + payments.evening),
    remaining: round2(
      settlement.morning.remaining + settlement.evening.remaining
    ),
  };

  return settlement;
}

export async function getYearlyMilkBreakdown(year) {
  const y = Number(year);
  const rows = await MilkRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: `${y}-01-01`, $lte: `${y}-12-31` },
      },
    },
    {
      $group: {
        _id: {
          month: { $substr: ["$date", 5, 2] },
          buyerType: "$buyerType",
        },
        kg: { $sum: "$quantityKg" },
        amount: { $sum: "$calculatedAmount" },
      },
    },
  ]);

  const months = [];
  const totals = {
    kg: 0,
    morningKg: 0,
    eveningKg: 0,
    amount: 0,
    morningAmount: 0,
    eveningAmount: 0,
    daysWithRecords: 0,
  };

  for (let month = 1; month <= 12; month += 1) {
    const key = String(month).padStart(2, "0");
    const morningRow = rows.find(
      (row) => row._id.month === key && row._id.buyerType === "morning"
    );
    const eveningRow = rows.find(
      (row) => row._id.month === key && row._id.buyerType === "evening"
    );
    const morningKg = round3(morningRow?.kg || 0);
    const eveningKg = round3(eveningRow?.kg || 0);
    const morningAmount = round2(morningRow?.amount || 0);
    const eveningAmount = round2(eveningRow?.amount || 0);
    const kg = round3(morningKg + eveningKg);
    const amount = round2(morningAmount + eveningAmount);

    months.push({
      month,
      morningKg,
      eveningKg,
      morningAmount,
      eveningAmount,
      kg,
      mann: round3(kg / KG_PER_MANN),
      amount,
    });

    totals.kg = round3(totals.kg + kg);
    totals.morningKg = round3(totals.morningKg + morningKg);
    totals.eveningKg = round3(totals.eveningKg + eveningKg);
    totals.amount = round2(totals.amount + amount);
    totals.morningAmount = round2(totals.morningAmount + morningAmount);
    totals.eveningAmount = round2(totals.eveningAmount + eveningAmount);
    if (kg > 0) totals.daysWithRecords += 1;
  }

  totals.mann = round3(totals.kg / KG_PER_MANN);

  const daysRows = await MilkRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: `${y}-01-01`, $lte: `${y}-12-31` },
      },
    },
    { $group: { _id: "$date" } },
    { $count: "count" },
  ]);

  return {
    year: y,
    months,
    totals: {
      ...totals,
      daysWithRecords: daysRows[0]?.count || 0,
    },
  };
}
