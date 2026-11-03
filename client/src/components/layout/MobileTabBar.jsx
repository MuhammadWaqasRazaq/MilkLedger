import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  LayoutDashboard,
  NotebookPen,
  Wallet,
} from "lucide-react";
import { cx } from "../../utils/cx";

const MOBILE_TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/milk-records", label: "Milk", icon: NotebookPen },
  { to: "/milk-payments", label: "Payments", icon: Wallet },
  { to: "/payables", label: "Payables", icon: ArrowUpRight },
  { to: "/receivables", label: "Receivables", icon: ArrowDownLeft },
];

function isFormField(element) {
  return element instanceof HTMLElement && element.matches("input, select, textarea");
}

export function MobileTabBar() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const onFocusIn = (event) => {
      if (isFormField(event.target)) setKeyboardOpen(true);
    };
    const onFocusOut = () => {
      window.requestAnimationFrame(() => {
        setKeyboardOpen(isFormField(document.activeElement));
      });
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <nav
      aria-label="Primary navigation"
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95 lg:hidden safe-bottom",
        keyboardOpen && "hidden"
      )}
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cx(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold leading-none tracking-tight transition-colors",
                  isActive
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-500 active:text-slate-800 dark:text-slate-400 dark:active:text-slate-100"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute inset-x-4 top-0 h-0.5 rounded-full transition-colors",
                      isActive ? "bg-brand-600 dark:bg-brand-400" : "bg-transparent"
                    )}
                  />
                  <span
                    className={cx(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      isActive
                        ? "bg-brand-50 dark:bg-brand-500/15"
                        : "bg-transparent"
                    )}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span className="max-w-full truncate">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
