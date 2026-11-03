export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatDate(value) {
  if (!isValidDateString(value)) return value || "";
  const [year, month, day] = value.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

export function formatShortDate(value) {
  if (!isValidDateString(value)) return value || "";
  const [, month, day] = value.split("-").map(Number);
  return `${day} ${MONTH_SHORT[month - 1]}`;
}

export function formatMonthYear(month, year) {
  return `${MONTH_NAMES[Number(month) - 1] || ""} ${year}`;
}

export function monthLabel(month) {
  return MONTH_SHORT[Number(month) - 1] || "";
}

export function datePeriod(dateString) {
  const [year, month] = dateString.split("-").map(Number);
  return { month, year };
}

export function yearOptions(currentYear = new Date().getFullYear()) {
  const start = Math.min(2020, currentYear - 2);
  const end = currentYear + 1;
  const years = [];
  for (let year = end; year >= start; year -= 1) years.push(year);
  return years;
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = MONTH_SHORT[date.getMonth()];
  const hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${day} ${month}, ${hour12}:${minutes} ${suffix}`;
}
