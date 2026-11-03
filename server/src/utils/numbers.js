import { ValidationError } from "./errors.js";

export function toNumber(value, fieldName = "Value") {
  if (value === "" || value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError(`${fieldName} must be a valid number.`);
  }
  return number;
}

export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function round3(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}
