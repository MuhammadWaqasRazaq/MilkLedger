const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return numberFormatter.format(number);
}

export function formatCurrency(value) {
  return `Rs. ${formatNumber(value)}`;
}

export function formatKg(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${quantityFormatter.format(number)} kg`;
}

export function formatMann(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${quantityFormatter.format(number)} Mann`;
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

export function parseAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
