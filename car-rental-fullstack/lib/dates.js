export const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateRentalDays(pickupDate, returnDate) {
  const difference = returnDate.getTime() - pickupDate.getTime();
  if (difference < 0) return 0;
  return Math.max(1, Math.ceil(difference / DAY_MS));
}

export function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}
