import { MONTH_NAMES } from "../config/constants.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function isValidDateString(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function monthBounds(year, month) {
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    start: `${y}-${pad2(m)}-01`,
    end: `${y}-${pad2(m)}-${pad2(lastDay)}`,
    year: y,
    month: m,
  };
}

export function yearBounds(year) {
  const y = Number(year);
  return { start: `${y}-01-01`, end: `${y}-12-31`, year: y };
}

export function monthKeyFromDate(dateString) {
  return dateString.slice(0, 7);
}

export function monthName(month) {
  return MONTH_NAMES[Number(month) - 1] || "";
}

export function parsePeriod(rawMonth, rawYear, fallbackDate = new Date()) {
  const month = Number(rawMonth);
  const year = Number(rawYear);
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12;
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100;
  return {
    month: validMonth ? month : fallbackDate.getMonth() + 1,
    year: validYear ? year : fallbackDate.getFullYear(),
  };
}

export function formatDisplayDate(dateString) {
  if (!isValidDateString(dateString)) return dateString || "";
  const [y, m, d] = dateString.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
}
