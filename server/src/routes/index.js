import express from "express";
import milkRoutes from "./milkRoutes.js";
import payablesRoutes from "./payablesRoutes.js";
import receivablesRoutes from "./receivablesRoutes.js";
import { getDashboardData } from "../controllers/dashboardController.js";
import {
  getMonthlyReport,
  getYearlyMilkReport,
} from "../controllers/reportsController.js";
import {
  downloadFullBackup,
  exportDataset,
  listDatasets,
  restoreFullBackup,
} from "../controllers/backupController.js";
import {
  listTrash,
  permanentlyDeleteTrashItem,
  restoreTrashItem,
} from "../controllers/trashController.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "Milk Ledger API is running." });
});

router.use("/milk", milkRoutes);
router.use("/payables", payablesRoutes);
router.use("/receivables", receivablesRoutes);

router.get("/dashboard", getDashboardData);
router.get("/reports/milk", getYearlyMilkReport);
router.get("/reports/monthly", getMonthlyReport);

router.get("/backup", downloadFullBackup);
router.post("/backup/restore", restoreFullBackup);
router.get("/backup/datasets", listDatasets);
router.get("/backup/export/:dataset", exportDataset);

router.get("/trash", listTrash);
router.post("/trash/:type/:id/restore", restoreTrashItem);
router.delete("/trash/:type/:id", permanentlyDeleteTrashItem);

export default router;
