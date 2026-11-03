import express from "express";
import { createObligationController } from "../controllers/obligationsController.js";
import { payablesService } from "../services/payablesService.js";

const router = express.Router();
const controller = createObligationController(payablesService, "Payable");

router.get("/", controller.list);
router.get("/person/:name", controller.personHistory);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/payments", controller.addPayment);
router.delete("/:id/payments/:paymentId", controller.deletePayment);

export default router;
