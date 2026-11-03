import { MilkRate } from "../models/MilkRate.js";
import { MilkRecord } from "../models/MilkRecord.js";
import {
  BUYER_TYPES,
  BUYER_LABELS,
  DEFAULT_RATES,
  DEFAULT_RATE_EFFECTIVE_FROM,
  KG_PER_MANN,
} from "../config/constants.js";
import { isValidDateString } from "../utils/dates.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { round2 } from "../utils/numbers.js";

const LEGACY_DEFAULT_RATES = {
  morning: 9000,
  evening: 8800,
};

function assertBuyerType(buyerType) {
  if (!BUYER_TYPES.includes(buyerType)) {
    throw new ValidationError("Buyer type must be morning or evening.");
  }
}

function assertRate(ratePerKg) {
  const rate = Number(ratePerKg);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new ValidationError("Rate per kg must be greater than zero.");
  }
  return round2(rate);
}

export function normalizeRateDocument(doc) {
  if (doc.ratePerKg !== undefined && doc.ratePerKg !== null) {
    return doc;
  }

  const legacyRate = Number(doc.ratePerMann);
  const ratePerKg =
    Number.isFinite(legacyRate) && legacyRate > 0
      ? legacyRate === LEGACY_DEFAULT_RATES[doc.buyerType]
        ? DEFAULT_RATES[doc.buyerType]
        : round2(legacyRate / KG_PER_MANN)
      : DEFAULT_RATES[doc.buyerType];

  return { ...doc, ratePerKg, ratePerMann: undefined };
}

async function migrateLegacyRates() {
  const legacyRates = await MilkRate.collection
    .find({ ratePerKg: { $exists: false } })
    .toArray();

  for (const legacyRate of legacyRates) {
    const normalized = normalizeRateDocument(legacyRate);
    await MilkRate.collection.updateOne(
      { _id: legacyRate._id },
      {
        $set: { ratePerKg: normalized.ratePerKg },
        $unset: { ratePerMann: "" },
      }
    );
  }

  return legacyRates.length;
}

export async function ensureDefaultRates() {
  const migrated = await migrateLegacyRates();
  let changed = migrated > 0;

  for (const buyerType of BUYER_TYPES) {
    const count = await MilkRate.countDocuments({ buyerType, isDeleted: false });
    if (count === 0) {
      const existing = await MilkRate.findOne({
        buyerType,
        effectiveFrom: DEFAULT_RATE_EFFECTIVE_FROM,
      });
      if (existing) {
        existing.isDeleted = false;
        existing.deletedAt = null;
        existing.ratePerKg = DEFAULT_RATES[buyerType];
        await existing.save();
      } else {
        await MilkRate.create({
          buyerType,
          ratePerKg: DEFAULT_RATES[buyerType],
          effectiveFrom: DEFAULT_RATE_EFFECTIVE_FROM,
        });
      }
      changed = true;
    }
  }

  if (changed) {
    await recalculateMilkRecords("morning");
    await recalculateMilkRecords("evening");
  }
}

export async function getRateHistory(buyerType) {
  assertBuyerType(buyerType);
  return MilkRate.find({ buyerType, isDeleted: false })
    .sort({ effectiveFrom: -1 })
    .lean();
}

export async function getRatesOverview() {
  const rates = await MilkRate.find({ isDeleted: false })
    .sort({ buyerType: 1, effectiveFrom: -1 })
    .lean();

  const overview = {};
  for (const buyerType of BUYER_TYPES) {
    const history = rates.filter((rate) => rate.buyerType === buyerType);
    overview[buyerType] = {
      buyerType,
      label: BUYER_LABELS[buyerType],
      current: history[0] || {
        ratePerKg: DEFAULT_RATES[buyerType],
        effectiveFrom: DEFAULT_RATE_EFFECTIVE_FROM,
      },
      history,
    };
  }
  return overview;
}

export async function resolveRateForDate(buyerType, date, rateCache) {
  let rates = rateCache;
  if (!rates) {
    rates = await MilkRate.find({ buyerType, isDeleted: false })
      .sort({ effectiveFrom: 1 })
      .lean();
  } else {
    rates = rates.filter((rate) => rate.buyerType === buyerType);
    rates.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  }

  let applicable = null;
  for (const rate of rates) {
    if (rate.effectiveFrom <= date) applicable = rate;
    else break;
  }

  if (!applicable) {
    return {
      ratePerKg: DEFAULT_RATES[buyerType],
      rateId: null,
      effectiveFrom: DEFAULT_RATE_EFFECTIVE_FROM,
    };
  }

  return {
    ratePerKg: applicable.ratePerKg,
    rateId: applicable._id,
    effectiveFrom: applicable.effectiveFrom,
  };
}

export async function recalculateMilkRecords(buyerType) {
  assertBuyerType(buyerType);
  const rates = await MilkRate.find({ buyerType, isDeleted: false })
    .sort({ effectiveFrom: 1 })
    .lean();

  const records = await MilkRecord.find({ buyerType }).lean();
  if (records.length === 0) return 0;

  const operations = [];
  for (const record of records) {
    let applicable = null;
    for (const rate of rates) {
      if (rate.effectiveFrom <= record.date) applicable = rate;
      else break;
    }
    const ratePerKg = applicable ? applicable.ratePerKg : DEFAULT_RATES[buyerType];
    const rateId = applicable ? applicable._id : null;
    const calculatedAmount = round2(record.quantityKg * ratePerKg);

    if (
      record.applicableRate !== ratePerKg ||
      record.calculatedAmount !== calculatedAmount ||
      String(record.rateId || "") !== String(rateId || "")
    ) {
      operations.push({
        updateOne: {
          filter: { _id: record._id },
          update: {
            $set: {
              applicableRate: ratePerKg,
              calculatedAmount,
              rateId,
            },
          },
        },
      });
    }
  }

  if (operations.length > 0) {
    await MilkRecord.bulkWrite(operations);
  }
  return operations.length;
}

export async function createRate({ buyerType, ratePerKg, effectiveFrom }) {
  assertBuyerType(buyerType);
  const rate = assertRate(ratePerKg);
  if (!isValidDateString(effectiveFrom)) {
    throw new ValidationError("Please provide a valid effective date.");
  }

  const existing = await MilkRate.findOne({ buyerType, effectiveFrom });
  if (existing && !existing.isDeleted) {
    throw new ConflictError(
      `A ${BUYER_LABELS[buyerType].toLowerCase()} rate with this effective date already exists.`
    );
  }

  let saved;
  if (existing) {
    existing.ratePerKg = rate;
    existing.isDeleted = false;
    existing.deletedAt = null;
    saved = await existing.save();
  } else {
    saved = await MilkRate.create({ buyerType, ratePerKg: rate, effectiveFrom });
  }

  const recalculated = await recalculateMilkRecords(buyerType);
  return { rate: saved, recalculated };
}

export async function updateRate(id, { ratePerKg, effectiveFrom }) {
  const rateDoc = await MilkRate.findOne({ _id: id, isDeleted: false });
  if (!rateDoc) throw new NotFoundError("Rate not found.");

  const rate = assertRate(ratePerKg);
  if (!isValidDateString(effectiveFrom)) {
    throw new ValidationError("Please provide a valid effective date.");
  }

  const duplicate = await MilkRate.findOne({
    _id: { $ne: rateDoc._id },
    buyerType: rateDoc.buyerType,
    effectiveFrom,
    isDeleted: false,
  });
  if (duplicate) {
    throw new ConflictError("Another rate already uses this effective date.");
  }

  rateDoc.ratePerKg = rate;
  rateDoc.effectiveFrom = effectiveFrom;
  await rateDoc.save();

  const recalculated = await recalculateMilkRecords(rateDoc.buyerType);
  return { rate: rateDoc, recalculated };
}

export async function deleteRate(id) {
  const rateDoc = await MilkRate.findOne({ _id: id, isDeleted: false });
  if (!rateDoc) throw new NotFoundError("Rate not found.");

  rateDoc.isDeleted = true;
  rateDoc.deletedAt = new Date();
  await rateDoc.save();

  await ensureDefaultRates();
  const recalculated = await recalculateMilkRecords(rateDoc.buyerType);
  return { rate: rateDoc, recalculated };
}
