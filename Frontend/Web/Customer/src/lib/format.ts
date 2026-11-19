const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return inr.format(amount);
}

/** Name printed on a jersey: letters, spaces, dots, hyphens and apostrophes, max 12 characters. */
export function sanitizePrintName(value: string) {
  return value
    .replace(/[^a-zA-Z .'-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 12);
}

/** Number printed on a jersey: up to two digits. */
export function sanitizePrintNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}
