import { parsePeriod } from "../utils/dates.js";
import {
  getMonthlyRecords,
  softDeleteMilkDay,
  updateMilkDay,
  upsertMilkDay,
  upsertMilkMonth,
} from "../services/milkService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMilkRecords = asyncHandler(async (req, res) => {
  const { month, year } = parsePeriod(req.query.month, req.query.year);
  const data = await getMonthlyRecords(month, year);
  res.json({ success: true, data });
});

export const createMilkRecord = asyncHandler(async (req, res) => {
  const records = await upsertMilkDay(req.body);
  res.status(201).json({
    success: true,
    message: "Milk record saved.",
    data: records,
  });
});

export const bulkUpsertMilkRecords = asyncHandler(async (req, res) => {
  const result = await upsertMilkMonth(req.body);
  res.status(201).json({
    success: true,
    message: `${result.days} day${result.days === 1 ? "" : "s"} saved.`,
    data: result,
  });
});

export const updateMilkRecord = asyncHandler(async (req, res) => {
  const records = await updateMilkDay(req.params.date, req.body);
  res.json({
    success: true,
    message: "Milk record updated.",
    data: records,
  });
});

export const deleteMilkRecord = asyncHandler(async (req, res) => {
  const deleted = await softDeleteMilkDay(req.params.date);
  res.json({
    success: true,
    message:
      deleted > 0
        ? "Milk record moved to trash."
        : "No active milk record found for this date.",
    data: { deleted },
  });
});
