import mongoose from "mongoose";
import { isValidDateString } from "../utils/dates.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { round2, toNumber } from "../utils/numbers.js";
import { escapeRegex } from "../utils/regex.js";

export function createObligationService({
  model,
  paymentModel,
  paymentForeignKey,
  amountField = "originalAmount",
  actionLabel = "Payment",
}) {
  const modelName = model.modelName;

  function decorate(doc) {
    const paid = round2(
      (doc.payments || []).reduce((sum, payment) => sum + payment.amount, 0)
    );
    const originalAmount = round2(doc[amountField] || 0);
    const remaining = round2(Math.max(0, originalAmount - paid));
    return {
      ...doc,
      [amountField]: originalAmount,
      paid,
      remaining,
      status: remaining <= 0 ? "completed" : "pending",
      paymentCount: (doc.payments || []).length,
    };
  }

  function validatePartyInput(input, { partial = false } = {}) {
    const result = {};
    if (!partial || input.personName !== undefined) {
      const personName = String(input.personName || "").trim();
      if (!personName) throw new ValidationError("Person name is required.");
      if (personName.length > 120) {
        throw new ValidationError("Person name is too long.");
      }
      result.personName = personName;
    }
    if (!partial || input.reason !== undefined) {
      const reason = String(input.reason || "").trim();
      if (!reason) throw new ValidationError("Reason is required.");
      if (reason.length > 300) throw new ValidationError("Reason is too long.");
      result.reason = reason;
    }
    if (!partial || input.originalAmount !== undefined) {
      const amount = toNumber(input.originalAmount, "Amount");
      if (amount <= 0) throw new ValidationError("Amount must be greater than zero.");
      result[amountField] = round2(amount);
    }
    if (!partial || input.date !== undefined) {
      if (!isValidDateString(input.date)) {
        throw new ValidationError("Please provide a valid date.");
      }
      result.date = input.date;
    }
    if (!partial || input.notes !== undefined) {
      result.notes = String(input.notes || "").trim();
    }
    return result;
  }

  async function list({ search = "" } = {}) {
    const match = { isDeleted: false };
    const term = String(search || "").trim();
    if (term) {
      match.personName = { $regex: escapeRegex(term), $options: "i" };
    }

    const docs = await model.aggregate([
      { $match: match },
      {
        $lookup: {
          from: paymentModel.collection.name,
          localField: "_id",
          foreignField: paymentForeignKey,
          as: "payments",
          pipeline: [
            { $match: { isDeleted: false } },
            { $sort: { date: 1, createdAt: 1 } },
          ],
        },
      },
      { $sort: { date: -1, createdAt: -1 } },
    ]);

    return docs.map(decorate);
  }

  function toObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(`${modelName} not found.`);
    }
    return new mongoose.Types.ObjectId(id);
  }

  async function getById(id) {
    const docs = await model.aggregate([
      { $match: { _id: toObjectId(id), isDeleted: false } },
      {
        $lookup: {
          from: paymentModel.collection.name,
          localField: "_id",
          foreignField: paymentForeignKey,
          as: "payments",
          pipeline: [
            { $match: { isDeleted: false } },
            { $sort: { date: 1, createdAt: 1 } },
          ],
        },
      },
    ]);
    if (docs.length === 0) throw new NotFoundError(`${modelName} not found.`);
    return decorate(docs[0]);
  }

  async function create(input) {
    const data = validatePartyInput(input);
    const doc = await model.create({ ...data, isDeleted: false });
    return getById(doc._id);
  }

  async function update(id, input) {
    const doc = await model.findOne({ _id: id, isDeleted: false });
    if (!doc) throw new NotFoundError(`${modelName} not found.`);
    const data = validatePartyInput(input, { partial: true });

    const current = await getById(id);
    if (data[amountField] !== undefined && data[amountField] < current.paid) {
      throw new ValidationError(
        `Amount cannot be less than the amount already paid (Rs. ${current.paid}).`
      );
    }

    Object.assign(doc, data);
    await doc.save();
    return getById(id);
  }

  async function remove(id) {
    const doc = await model.findOne({ _id: id, isDeleted: false });
    if (!doc) throw new NotFoundError(`${modelName} not found.`);
    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();
    return doc;
  }

  async function addPayment(id, input) {
    const party = await getById(id);
    if (!isValidDateString(input.date)) {
      throw new ValidationError("Please provide a valid payment date.");
    }
    const amount = round2(toNumber(input.amount, "Payment amount"));
    if (amount <= 0) {
      throw new ValidationError(`${actionLabel} amount must be greater than zero.`);
    }
    if (amount > party.remaining + 0.001) {
      throw new ValidationError(
        `${actionLabel} cannot exceed the remaining amount (Rs. ${party.remaining}).`
      );
    }

    await paymentModel.create({
      [paymentForeignKey]: party._id,
      date: input.date,
      amount,
      note: String(input.note || "").trim(),
    });

    return getById(id);
  }

  async function deletePayment(id, paymentId) {
    const payment = await paymentModel.findOne({
      _id: paymentId,
      [paymentForeignKey]: id,
      isDeleted: false,
    });
    if (!payment) throw new NotFoundError("Payment not found.");
    payment.isDeleted = true;
    payment.deletedAt = new Date();
    await payment.save();
    return getById(id);
  }

  async function getPersonHistory(personName) {
    const name = String(personName || "").trim();
    if (!name) throw new ValidationError("Person name is required.");

    const docs = await model.aggregate([
      {
        $match: {
          isDeleted: false,
          personName: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
        },
      },
      {
        $lookup: {
          from: paymentModel.collection.name,
          localField: "_id",
          foreignField: paymentForeignKey,
          as: "payments",
          pipeline: [
            { $match: { isDeleted: false } },
            { $sort: { date: 1, createdAt: 1 } },
          ],
        },
      },
      { $sort: { date: 1, createdAt: 1 } },
    ]);

    const transactions = docs.map(decorate);
    const summary = transactions.reduce(
      (acc, item) => {
        acc.originalAmount = round2(acc.originalAmount + item[amountField]);
        acc.paid = round2(acc.paid + item.paid);
        acc.remaining = round2(acc.remaining + item.remaining);
        return acc;
      },
      { originalAmount: 0, paid: 0, remaining: 0 }
    );

    return {
      personName: docs[0]?.personName || name,
      transactions,
      summary: { ...summary, count: transactions.length },
    };
  }

  async function getOutstandingTotal() {
    const rows = await model.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: paymentModel.collection.name,
          localField: "_id",
          foreignField: paymentForeignKey,
          as: "payments",
          pipeline: [
            { $match: { isDeleted: false } },
            { $project: { amount: 1 } },
          ],
        },
      },
      {
        $project: {
          remaining: {
            $max: [
              0,
              {
                $subtract: [
                  `$${amountField}`,
                  { $sum: "$payments.amount" },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$remaining" },
          completed: {
            $sum: { $cond: [{ $lte: ["$remaining", 0] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $gt: ["$remaining", 0] }, 1, 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const row = rows[0] || { total: 0, completed: 0, pending: 0, count: 0 };
    return {
      remaining: round2(row.total || 0),
      completedCount: row.completed || 0,
      pendingCount: row.pending || 0,
      count: row.count || 0,
    };
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
    addPayment,
    deletePayment,
    getPersonHistory,
    getOutstandingTotal,
  };
}
