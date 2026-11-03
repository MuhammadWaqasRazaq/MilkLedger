import {
  getMonthlyRecords,
  getYearlyMilkBreakdown,
} from "../services/milkService.js";
import { getMilkPaymentsForMonth } from "../services/milkPaymentService.js";
import { parsePeriod } from "../utils/dates.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getYearlyMilkReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const data = await getYearlyMilkBreakdown(year);
  res.json({ success: true, data });
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = parsePeriod(req.query.month, req.query.year);
  const [milk, payments] = await Promise.all([
    getMonthlyRecords(month, year),
    getMilkPaymentsForMonth(month, year),
  ]);
  res.json({ success: true, data: { milk, payments } });
});
