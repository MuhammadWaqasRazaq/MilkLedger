import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { StatCard } from "../ui/StatCard";
import { Badge } from "../ui/Badge";
import { formatCurrency } from "../../utils/format";

export function FinanceOverview({ payables, receivables, netReceivable }) {
  const netPositive = netReceivable >= 0;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Other money
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payables and receivables are kept separate from milk totals.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Money to pay"
          value={formatCurrency(payables.remaining)}
          sub={`${payables.pendingCount || 0} pending payable${
            payables.pendingCount === 1 ? "" : "s"
          }`}
          icon={ArrowUpRight}
          tone="red"
          badge={<Badge tone="red">Payable</Badge>}
        />
        <StatCard
          label="Money to receive"
          value={formatCurrency(receivables.remaining)}
          sub={`${receivables.pendingCount || 0} pending receivable${
            receivables.pendingCount === 1 ? "" : "s"
          }`}
          icon={ArrowDownLeft}
          tone="green"
          badge={<Badge tone="green">Receivable</Badge>}
        />
        <StatCard
          label="Net receivable"
          value={formatCurrency(netReceivable)}
          sub={
            netPositive
              ? "Receivable exceeds payable"
              : "Payable exceeds receivable"
          }
          icon={Scale}
          tone={netPositive ? "blue" : "amber"}
          badge={
            <Badge tone={netPositive ? "blue" : "amber"}>
              {netPositive ? "In your favour" : "You owe more"}
            </Badge>
          }
        />
      </div>
    </section>
  );
}
