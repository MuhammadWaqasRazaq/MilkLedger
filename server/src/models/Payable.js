import mongoose from "mongoose";

const payableSchema = new mongoose.Schema(
  {
    personName: {
      type: String,
      required: [true, "Person name is required."],
      trim: true,
      maxlength: 120,
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required."],
      trim: true,
      maxlength: 300,
    },
    originalAmount: {
      type: Number,
      required: [true, "Amount is required."],
      min: [0.01, "Amount must be greater than zero."],
    },
    date: {
      type: String,
      required: [true, "Date is required."],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format."],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
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

payableSchema.index({ personName: 1, isDeleted: 1 });
payableSchema.index({ date: -1 });

export const Payable = mongoose.model("Payable", payableSchema);
