import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { MonthYearSelect } from "../components/ui/MonthYearSelect";
import { LoadingBlock, ErrorBlock } from "../components/ui/Spinner";
import { QuickAddMilk } from "../components/dashboard/QuickAddMilk";
import { MilkBuyerCard } from "../components/dashboard/MilkBuyerCard";
import { CombinedMilkCard } from "../components/dashboard/CombinedMilkCard";
import { FinanceOverview } from "../components/dashboard/FinanceOverview";
import { YearlyTotals } from "../components/dashboard/YearlyTotals";
import { YearlyCharts } from "../components/dashboard/YearlyCharts";
import { MonthlyComparison } from "../components/dashboard/MonthlyComparison";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { useApi } from "../hooks/useApi";
import { api } from "../api/client";
import { currentPeriod, datePeriod } from "../utils/dates";

export default function Dashboard() {
  const [period, setPeriod] = useState(currentPeriod);
  const { data, loading, error, reload } = useApi(
    () => api.getDashboard(period.month, period.year),
    [period.month, period.year]
  );

  function handleSaved(date) {
    const next = datePeriod(date);
    const same = next.month === period.month && next.year === period.year;
    setPeriod(next);
    if (same) reload();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Your milk business at a glance. Morning and evening are tracked separately."
      >
        <MonthYearSelect
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </PageHeader>

      {loading && !data ? (
        <LoadingBlock label="Loading dashboard..." />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <QuickAddMilk
              onSaved={handleSaved}
              className="order-first sm:col-span-2 xl:order-last xl:col-span-1"
            />
            <MilkBuyerCard
              buyerType="morning"
              label="Morning"
              data={data.milk.morning}
            />
            <MilkBuyerCard
              buyerType="evening"
              label="Evening"
              data={data.milk.evening}
            />
          </section>

          <CombinedMilkCard combined={data.milk.combined} />

          <FinanceOverview
            payables={data.payables}
            receivables={data.receivables}
            netReceivable={data.netReceivable}
          />

          <section className="grid gap-4 xl:grid-cols-2">
            <MonthlyComparison
              month={period.month}
              year={period.year}
              milk={data.milk}
            />
            <RecentActivity items={data.recentActivity} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-800">
                <CalendarRange size={16} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {data.yearly.year} yearly insights
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly totals and buyer comparison for the whole year
                </p>
              </div>
            </div>
            <YearlyTotals yearly={data.yearly} />
            <YearlyCharts yearly={data.yearly} />
          </section>

          <p className="pb-2 text-center text-[11px] text-slate-400">
            Every amount is calculated as milk quantity in kg multiplied by the
            rate effective on each record date.
          </p>
        </>
      ) : null}
    </div>
  );
}
