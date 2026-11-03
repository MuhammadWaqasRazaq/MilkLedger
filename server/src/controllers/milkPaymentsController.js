import { parsePeriod } from "../utils/dates.js";
import {
  addMilkPayment,
  deleteMilkPayment,
  getMilkPaymentsForMonth,
} from "../services/milkPaymentService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMilkPayments = asyncHandler(async (req, res) => {
  const { month, year } = parsePeriod(req.query.month, req.query.year);
  const data = await getMilkPaymentsForMonth(month, year);
  res.json({ success: true, data });
});

export const createMilkPayment = asyncHandler(async (req, res) => {
  const payment = await addMilkPayment(req.body);
  res.status(201).json({
    success: true,
    message: "Payment recorded.",
    data: payment,
  });
});

export const removeMilkPayment = asyncHandler(async (req, res) => {
  await deleteMilkPayment(req.params.id);
  res.json({
    success: true,
    message: "Payment moved to trash.",
  });
});
