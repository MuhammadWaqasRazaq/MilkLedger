import { getMilkSettlement, getYearlyMilkBreakdown } from "./milkService.js";
import { payablesService } from "./payablesService.js";
import { receivablesService } from "./receivablesService.js";
import { getRecentActivity } from "./activityService.js";
import { monthName } from "../utils/dates.js";
import { round2 } from "../utils/numbers.js";

export async function getDashboard(month, year) {
  const [settlement, payables, receivables, yearly, recentActivity] =
    await Promise.all([
      getMilkSettlement(month, year),
      payablesService.getOutstandingTotal(),
      receivablesService.getOutstandingTotal(),
      getYearlyMilkBreakdown(year),
      getRecentActivity(12),
    ]);

  const netReceivable = round2(
    receivables.remaining - payables.remaining
  );

  return {
    period: {
      month: Number(month),
      year: Number(year),
      monthName: monthName(month),
    },
    milk: {
      morning: settlement.morning,
      evening: settlement.evening,
      combined: settlement.combined,
    },
    payables: { remaining: payables.remaining, ...payables },
    receivables: { remaining: receivables.remaining, ...receivables },
    netReceivable,
    yearly,
    recentActivity,
  };
}
