import mongoose from "mongoose";
import { BUYER_TYPES } from "../config/constants.js";

const milkRecordSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, "Date is required."],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format."],
      index: true,
    },
    buyerType: {
      type: String,
      enum: BUYER_TYPES,
      required: true,
      index: true,
    },
    quantityKg: {
      type: Number,
      required: true,
      min: [0, "Milk quantity cannot be negative."],
    },
    applicableRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    calculatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilkRate",
      default: null,
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

milkRecordSchema.index({ date: 1, buyerType: 1 }, { unique: true });
milkRecordSchema.index({ date: -1, buyerType: 1, isDeleted: 1 });

export const MilkRecord = mongoose.model("MilkRecord", milkRecordSchema);
