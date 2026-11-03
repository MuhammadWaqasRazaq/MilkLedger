import { ArrowDownLeft } from "lucide-react";
import { ObligationPage } from "../components/obligations/ObligationPage";
import { api } from "../api/client";

const config = {
  title: "Receivables",
  description:
    "Money other people have to give you. Track each person's transactions and received installments.",
  singularLabel: "Receivable",
  historyNoun: "Receivable",
  addButton: "Add receivable",
  formDescription:
    "Record money someone owes you. You can add received installments later.",
  amountLabel: "Original amount (Rs.)",
  amountShortLabel: "Original",
  paidLabel: "Received",
  remainingLabel: "Remaining",
  paymentLabel: "Amount received",
  paymentButton: "Add received",
  reasonPlaceholder: "e.g. Money borrowed",
  transactionLabel: "Receivable",
  outstandingLabel: "Total to receive",
  emptyTitle: "No receivables recorded",
  emptyDescription:
    "When someone owes you money, add it here and track what has been received.",
  emptyIcon: ArrowDownLeft,
  searchPlaceholder: "Search by person name...",
  tone: "green",
  api: {
    list: () => api.getReceivables(),
    create: api.createReceivable,
    update: api.updateReceivable,
    remove: api.deleteReceivable,
    addPayment: api.addReceivablePayment,
    deletePayment: api.deleteReceivablePayment,
    personHistory: api.getReceivablePersonHistory,
  },
};

export default function Receivables() {
  return <ObligationPage config={config} />;
}
