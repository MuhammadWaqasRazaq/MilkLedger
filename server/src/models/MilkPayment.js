import mongoose from "mongoose";
import { BUYER_TYPES } from "../config/constants.js";

const milkPaymentSchema = new mongoose.Schema(
  {
    buyerType: {
      type: String,
      enum: BUYER_TYPES,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
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

milkPaymentSchema.index({ buyerType: 1, year: -1, month: -1, date: 1 });

export const MilkPayment = mongoose.model("MilkPayment", milkPaymentSchema);
