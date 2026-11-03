import { Receivable } from "../models/Receivable.js";
import { ReceivablePayment } from "../models/ReceivablePayment.js";
import { createObligationService } from "./obligationService.js";

export const receivablesService = createObligationService({
  model: Receivable,
  paymentModel: ReceivablePayment,
  paymentForeignKey: "receivableId",
  amountField: "originalAmount",
  actionLabel: "Amount received",
});
