import { MilkPayment } from "../models/MilkPayment.js";
import { BUYER_TYPES, BUYER_LABELS } from "../config/constants.js";
import { isValidDateString } from "../utils/dates.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { round2, toNumber } from "../utils/numbers.js";
import { getMilkSettlement } from "./milkService.js";

function assertBuyerType(buyerType) {
  if (!BUYER_TYPES.includes(buyerType)) {
    throw new ValidationError("Buyer type must be morning or evening.");
  }
}

export async function getMilkPaymentsForMonth(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    throw new ValidationError("Please provide a valid month.");
  }
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new ValidationError("Please provide a valid year.");
  }

  const settlement = await getMilkSettlement(m, y);
  const payments = await MilkPayment.find({
    isDeleted: false,
    month: m,
    year: y,
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  const byBuyer = {};
  for (const buyerType of BUYER_TYPES) {
    byBuyer[buyerType] = {
      buyerType,
      label: BUYER_LABELS[buyerType],
      summary: settlement[buyerType],
      payments: payments.filter((payment) => payment.buyerType === buyerType),
    };
  }

  return {
    period: { month: m, year: y },
    combined: settlement.combined,
    buyers: byBuyer,
  };
}

export async function addMilkPayment(input) {
  const { buyerType } = input;
  assertBuyerType(buyerType);
  const month = Number(input.month);
  const year = Number(input.year);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ValidationError("Please provide a valid month.");
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ValidationError("Please provide a valid year.");
  }
  if (!isValidDateString(input.date)) {
    throw new ValidationError("Please provide a valid payment date.");
  }

  const amount = round2(toNumber(input.amount, "Payment amount"));
  if (amount <= 0) {
    throw new ValidationError("Payment amount must be greater than zero.");
  }

  const settlement = await getMilkSettlement(month, year);
  const remaining = settlement[buyerType].remaining;
  if (amount > remaining + 0.001) {
    throw new ValidationError(
      `Payment cannot exceed the remaining amount (Rs. ${remaining}).`
    );
  }

  const payment = await MilkPayment.create({
    buyerType,
    month,
    year,
    date: input.date,
    amount,
    note: String(input.note || "").trim(),
  });

  return payment;
}

export async function deleteMilkPayment(id) {
  const payment = await MilkPayment.findOne({ _id: id, isDeleted: false });
  if (!payment) throw new NotFoundError("Payment not found.");
  payment.isDeleted = true;
  payment.deletedAt = new Date();
  await payment.save();
  return payment;
}
