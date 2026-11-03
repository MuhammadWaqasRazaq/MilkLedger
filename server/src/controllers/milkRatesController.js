import {
  createRate,
  deleteRate,
  getRatesOverview,
  updateRate,
} from "../services/rateService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listRates = asyncHandler(async (req, res) => {
  const data = await getRatesOverview();
  res.json({ success: true, data });
});

export const createMilkRate = asyncHandler(async (req, res) => {
  const result = await createRate(req.body);
  res.status(201).json({
    success: true,
    message: "Rate saved. Milk records were recalculated by date.",
    data: result,
  });
});

export const updateMilkRate = asyncHandler(async (req, res) => {
  const result = await updateRate(req.params.id, req.body);
  res.json({
    success: true,
    message: "Rate updated. Milk records were recalculated by date.",
    data: result,
  });
});

export const deleteMilkRate = asyncHandler(async (req, res) => {
  const result = await deleteRate(req.params.id);
  res.json({
    success: true,
    message: "Rate moved to trash. Milk records were recalculated by date.",
    data: result,
  });
});
