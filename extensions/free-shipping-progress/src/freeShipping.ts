export interface Money {
  amount: number;
  currencyCode: string;
}

export type FreeShippingState =
  | { kind: 'hidden'; reason: 'no-threshold' | 'invalid-threshold' | 'currency-mismatch' }
  | { kind: 'progress'; remaining: Money; percent: number }
  | { kind: 'unlocked' };

export interface FreeShippingInput {
  subtotal: Money;
  /** Raw merchant setting; undefined until the merchant fills it in. */
  threshold: unknown;
  /** Raw merchant setting, ISO 4217. Defaults to the checkout currency when empty. */
  thresholdCurrency: unknown;
}

/** Minor-unit digits for a currency (USD 2, JPY 0, KWD 3). Falls back to 2. */
export function currencyDigits(currencyCode: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Round to the currency's minor unit so 19.99 + 0.01 compares equal to 20. */
export function roundToCurrency(amount: number, currencyCode: string): number {
  const factor = 10 ** currencyDigits(currencyCode);
  return Math.round(amount * factor) / factor;
}

function parseThreshold(raw: unknown): number | undefined | null {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function computeFreeShipping({ subtotal, threshold, thresholdCurrency }: FreeShippingInput): FreeShippingState {
  const parsed = parseThreshold(threshold);
  if (parsed === undefined) return { kind: 'hidden', reason: 'no-threshold' };
  if (parsed === null) return { kind: 'hidden', reason: 'invalid-threshold' };

  const currency =
    typeof thresholdCurrency === 'string' && thresholdCurrency.trim() !== ''
      ? thresholdCurrency.trim().toUpperCase()
      : subtotal.currencyCode;
  // Comparing across currencies without a rate would show a wrong number to the buyer.
  if (currency !== subtotal.currencyCode) return { kind: 'hidden', reason: 'currency-mismatch' };

  const target = roundToCurrency(parsed, currency);
  const current = roundToCurrency(subtotal.amount, currency);
  if (current >= target) return { kind: 'unlocked' };

  const remaining = roundToCurrency(target - current, currency);
  // Floor so the bar never reads 100% while an amount is still outstanding.
  const percent = Math.min(99, Math.max(0, Math.floor((current / target) * 100)));
  return { kind: 'progress', remaining: { amount: remaining, currencyCode: currency }, percent };
}
