import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Weight } from "lucide-react";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { MONTH_SHORT } from "../../utils/dates";
import { formatCurrency, formatKg, formatNumber } from "../../utils/format";
import { useTheme } from "../../context/ThemeContext";

function amountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
}

function kgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}: {formatKg(item.value)}
        </p>
      ))}
    </div>
  );
}

function compact(value) {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

export function YearlyCharts({ yearly }) {
  const { isDark } = useTheme();
  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const cursorFill = isDark ? "#1e293b" : "#f1f5f9";
  const legendStyle = {
    fontSize: 11,
    paddingTop: 8,
    color: isDark ? "#cbd5e1" : "#475569",
  };

  const data = yearly.months.map((month) => ({
    label: MONTH_SHORT[month.month - 1],
    morningAmount: month.morningAmount,
    eveningAmount: month.eveningAmount,
    morningKg: month.morningKg,
    eveningKg: month.eveningKg,
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader
          icon={BarChart3}
          title={`${yearly.year} milk amount`}
          description="Monthly income by buyer"
          action={
            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {formatCurrency(yearly.totals.amount)}
            </span>
          }
        />
        <CardBody className="pt-4">
          <div className="h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={compact}
                />
                <Tooltip content={amountTooltip} cursor={{ fill: cursorFill }} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={legendStyle}
                />
                <Bar
                  dataKey="morningAmount"
                  name="Morning"
                  fill="#2563eb"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="eveningAmount"
                  name="Evening"
                  fill="#8b5cf6"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardHeader
          icon={Weight}
          title={`${yearly.year} milk quantity`}
          description="Monthly kilograms by buyer"
          action={
            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {formatNumber(yearly.totals.kg)} kg
            </span>
          }
        />
        <CardBody className="pt-4">
          <div className="h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={compact}
                />
                <Tooltip content={kgTooltip} cursor={{ fill: cursorFill }} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={legendStyle}
                />
                <Bar
                  dataKey="morningKg"
                  name="Morning"
                  fill="#0ea5e9"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="eveningKg"
                  name="Evening"
                  fill="#f59e0b"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
