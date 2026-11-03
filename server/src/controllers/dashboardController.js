import { parsePeriod } from "../utils/dates.js";
import { getDashboard } from "../services/dashboardService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getDashboardData = asyncHandler(async (req, res) => {
  const { month, year } = parsePeriod(req.query.month, req.query.year);
  const data = await getDashboard(month, year);
  res.json({ success: true, data });
});
