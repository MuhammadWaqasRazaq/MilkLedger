import { ArrowUpRight } from "lucide-react";
import { ObligationPage } from "../components/obligations/ObligationPage";
import { api } from "../api/client";

const config = {
  title: "Payables",
  description:
    "Money you have to pay other people. Each person's transactions and installments stay together.",
  singularLabel: "Payable",
  historyNoun: "Payable",
  addButton: "Add payable",
  formDescription:
    "Record money you owe. You can add installment payments later.",
  amountLabel: "Original amount (Rs.)",
  amountShortLabel: "Original",
  paidLabel: "Paid",
  remainingLabel: "Remaining",
  paymentLabel: "Payment amount",
  paymentButton: "Add payment",
  reasonPlaceholder: "e.g. Tractor repair",
  transactionLabel: "Payable",
  outstandingLabel: "Total to pay",
  emptyTitle: "No payables recorded",
  emptyDescription:
    "When you owe someone money, add it here and track installments until it is settled.",
  emptyIcon: ArrowUpRight,
  searchPlaceholder: "Search by person name...",
  tone: "red",
  api: {
    list: () => api.getPayables(),
    create: api.createPayable,
    update: api.updatePayable,
    remove: api.deletePayable,
    addPayment: api.addPayablePayment,
    deletePayment: api.deletePayablePayment,
    personHistory: api.getPayablePersonHistory,
  },
};

export default function Payables() {
  return <ObligationPage config={config} />;
}
