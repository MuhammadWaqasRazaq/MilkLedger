import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { MilkRecord } from "./models/MilkRecord.js";
import { MilkRate } from "./models/MilkRate.js";
import { MilkPayment } from "./models/MilkPayment.js";
import { Payable } from "./models/Payable.js";
import { PayablePayment } from "./models/PayablePayment.js";
import { Receivable } from "./models/Receivable.js";
import { ReceivablePayment } from "./models/ReceivablePayment.js";
import { ensureDefaultRates } from "./services/rateService.js";
import { upsertMilkDay } from "./services/milkService.js";
import { addMilkPayment } from "./services/milkPaymentService.js";
import { payablesService } from "./services/payablesService.js";
import { receivablesService } from "./services/receivablesService.js";
import { round2 } from "./utils/numbers.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/milk_ledger";

const MORNING = [13, 14, 12.5, 15, 0, 13.5, 12.25, 10.75, 14.5, 12, 13.75, 11.5];
const EVENING = [12, 11, 13, 12.5, 0, 10.75, 12.25, 13.5, 11, 12.75, 13, 10.5];

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateString(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

async function clearAll() {
  await Promise.all([
    MilkRecord.deleteMany({}),
    MilkRate.deleteMany({}),
    MilkPayment.deleteMany({}),
    Payable.deleteMany({}),
    PayablePayment.deleteMany({}),
    Receivable.deleteMany({}),
    ReceivablePayment.deleteMany({}),
  ]);
  await ensureDefaultRates();
  console.log("[seed] all records cleared. Default rates restored.");
}

async function seed() {
  const existing = await MilkRecord.countDocuments({});
  if (existing > 0) {
    console.log(
      "[seed] database already contains milk records. Run `npm run seed:clear` first if you want to reseed."
    );
    return;
  }

  await ensureDefaultRates();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const periods = [
    { year, month, lastDay: today },
    { year: month === 1 ? year - 1 : year, month: month === 1 ? 12 : month - 1, lastDay: null },
    {
      year: month <= 2 ? year - 1 : year,
      month: month <= 2 ? month + 10 : month - 2,
      lastDay: null,
    },
  ];

  let recordCount = 0;
  for (const period of periods) {
    const lastDay = period.lastDay || daysInMonth(period.year, period.month);
    for (let day = 1; day <= lastDay; day += 1) {
      await upsertMilkDay({
        date: dateString(period.year, period.month, day),
        morningKg: MORNING[(day - 1) % MORNING.length],
        eveningKg: EVENING[(day - 1) % EVENING.length],
      });
      recordCount += 1;
    }
  }

  const previous = periods[1];
  const current = periods[0];

  const { getMilkSettlement } = await import("./services/milkService.js");
  const currentSettlement = await getMilkSettlement(current.month, current.year);
  for (const buyerType of ["morning", "evening"]) {
    const firstPayment = round2(currentSettlement[buyerType].remaining * 0.4);
    if (firstPayment > 0) {
      await addMilkPayment({
        buyerType,
        month: current.month,
        year: current.year,
        date: dateString(current.year, current.month, Math.min(today, 3)),
        amount: firstPayment,
        note: "First payment",
      });
    }
  }

  const prevSettlement = await getMilkSettlement(previous.month, previous.year);
  for (const buyerType of ["morning", "evening"]) {
    const remaining = prevSettlement[buyerType].remaining;
    if (remaining > 0) {
      await addMilkPayment({
        buyerType,
        month: previous.month,
        year: previous.year,
        date: dateString(current.year, current.month, 1),
        amount: remaining,
        note: "Previous month settlement",
      });
    }
  }

  const ahmed = await payablesService.create({
    personName: "Ahmed",
    reason: "Tractor repair",
    originalAmount: 20000,
    date: dateString(year, month, Math.min(today, 2)),
    notes: "Paid in installments",
  });
  await payablesService.addPayment(ahmed._id, {
    date: dateString(year, month, Math.min(today, 3)),
    amount: 5000,
    note: "First installment",
  });

  await payablesService.create({
    personName: "Bilal",
    reason: "Fertilizer purchase",
    originalAmount: 12000,
    date: dateString(year, month, Math.min(today, 1)),
  });

  const ali = await receivablesService.create({
    personName: "Ali",
    reason: "Money borrowed",
    originalAmount: 30000,
    date: dateString(year, month, Math.min(today, 1)),
  });
  await receivablesService.addPayment(ali._id, {
    date: dateString(year, month, Math.min(today, 3)),
    amount: 10000,
    note: "Part payment",
  });

  await receivablesService.create({
    personName: "Usman",
    reason: "Milk sold on credit",
    originalAmount: 8500,
    date: dateString(year, month, Math.min(today, 2)),
  });

  console.log(
    `[seed] sample data created: ${recordCount} daily records, 2 payables, 2 receivables, milk payments.`
  );
}

async function main() {
  await connectDatabase(MONGODB_URI);
  if (process.argv.includes("--clear")) {
    await clearAll();
  } else {
    await seed();
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[seed error]", error);
  await mongoose.disconnect();
  process.exit(1);
});
