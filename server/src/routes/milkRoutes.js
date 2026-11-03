import express from "express";
import {
  bulkUpsertMilkRecords,
  createMilkRecord,
  deleteMilkRecord,
  listMilkRecords,
  updateMilkRecord,
} from "../controllers/milkRecordsController.js";
import {
  createMilkRate,
  deleteMilkRate,
  listRates,
  updateMilkRate,
} from "../controllers/milkRatesController.js";
import {
  createMilkPayment,
  listMilkPayments,
  removeMilkPayment,
} from "../controllers/milkPaymentsController.js";

const router = express.Router();

router.get("/records", listMilkRecords);
router.post("/records", createMilkRecord);
router.post("/records/bulk", bulkUpsertMilkRecords);
router.put("/records/:date", updateMilkRecord);
router.delete("/records/:date", deleteMilkRecord);

router.get("/rates", listRates);
router.post("/rates", createMilkRate);
router.put("/rates/:id", updateMilkRate);
router.delete("/rates/:id", deleteMilkRate);

router.get("/payments", listMilkPayments);
router.post("/payments", createMilkPayment);
router.delete("/payments/:id", removeMilkPayment);

export default router;
