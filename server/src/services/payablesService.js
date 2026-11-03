import { Payable } from "../models/Payable.js";
import { PayablePayment } from "../models/PayablePayment.js";
import { createObligationService } from "./obligationService.js";

export const payablesService = createObligationService({
  model: Payable,
  paymentModel: PayablePayment,
  paymentForeignKey: "payableId",
  amountField: "originalAmount",
  actionLabel: "Payment",
});
