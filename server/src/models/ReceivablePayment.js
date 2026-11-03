import mongoose from "mongoose";

const receivablePaymentSchema = new mongoose.Schema(
  {
    receivableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receivable",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: [true, "Payment date is required."],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Payment date must use YYYY-MM-DD format."],
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required."],
      min: [0.01, "Payment amount must be greater than zero."],
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

receivablePaymentSchema.index({ receivableId: 1, date: 1 });

export const ReceivablePayment = mongoose.model(
  "ReceivablePayment",
  receivablePaymentSchema
);
