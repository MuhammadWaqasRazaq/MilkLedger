import { Link } from "react-router-dom";
import { Home, Milk } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <Milk size={26} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for does not exist in Milk Ledger.
      </p>
      <Link to="/" className="mt-5">
        <Button>
          <Home size={16} />
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
