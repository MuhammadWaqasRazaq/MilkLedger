import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DatabaseBackup,
  LayoutDashboard,
  Menu,
  Milk,
  NotebookPen,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { MobileTabBar } from "./MobileTabBar";
import { cx } from "../../utils/cx";

const MAIN_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/milk-records", label: "Milk Records", icon: NotebookPen },
  { to: "/milk-payments", label: "Milk Payments", icon: Wallet },
  { to: "/payables", label: "Payables", icon: ArrowUpRight },
  { to: "/receivables", label: "Receivables", icon: ArrowDownLeft },
  { to: "/milk-rates", label: "Milk Rates", icon: Tag },
];

const SYSTEM_NAV = [
  { to: "/backup", label: "Backup & Export", icon: DatabaseBackup },
  { to: "/trash", label: "Trash", icon: Trash2 },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
          isActive
            ? "bg-white/10 text-white shadow-inner"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={cx(
              "shrink-0 transition",
              isActive ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200"
            )}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-900/30">
          <Milk size={22} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Milk Ledger</p>
          <p className="text-[11px] text-slate-400">Family business accounts</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Main
        </p>
        {MAIN_NAV.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Data
        </p>
        {SYSTEM_NAV.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 pb-1">
        <ThemeToggle />
      </div>

      <div className="m-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-[11px] font-semibold text-slate-200">
          Morning &amp; Evening
        </p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          Both buyers are tracked separately with their own rates and payments.
        </p>
      </div>
      <p className="px-5 pb-4 text-[10px] text-slate-500 dark:text-slate-400">
        Milk Ledger v1.0 · 1 Mann = 40 kg
      </p>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-900 lg:block dark:border-r dark:border-slate-800">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-72 max-w-[85%] bg-slate-900 pt-[env(safe-area-inset-top,0px)] shadow-2xl safe-bottom">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Milk size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Milk Ledger</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Family business accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="mobile" />
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-7">
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
