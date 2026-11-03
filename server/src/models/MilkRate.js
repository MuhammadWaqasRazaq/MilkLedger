import mongoose from "mongoose";
import { BUYER_TYPES } from "../config/constants.js";

const milkRateSchema = new mongoose.Schema(
  {
    buyerType: {
      type: String,
      enum: BUYER_TYPES,
      required: true,
      index: true,
    },
    ratePerKg: {
      type: Number,
      required: [true, "Rate per kg is required."],
      min: [0.01, "Rate per kg must be greater than zero."],
    },
    effectiveFrom: {
      type: String,
      required: [true, "Effective date is required."],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Effective date must use YYYY-MM-DD format."],
      index: true,
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

milkRateSchema.index({ buyerType: 1, effectiveFrom: 1 }, { unique: true });
milkRateSchema.index({ buyerType: 1, effectiveFrom: -1, isDeleted: 1 });

export const MilkRate = mongoose.model("MilkRate", milkRateSchema);
