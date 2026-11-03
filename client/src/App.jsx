import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import MilkRecords from "./pages/MilkRecords";
import MilkPayments from "./pages/MilkPayments";
import Payables from "./pages/Payables";
import Receivables from "./pages/Receivables";
import MilkRates from "./pages/MilkRates";
import Backup from "./pages/Backup";
import TrashPage from "./pages/Trash";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="milk-records" element={<MilkRecords />} />
              <Route path="milk-payments" element={<MilkPayments />} />
              <Route path="payables" element={<Payables />} />
              <Route path="receivables" element={<Receivables />} />
              <Route path="milk-rates" element={<MilkRates />} />
              <Route path="backup" element={<Backup />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
