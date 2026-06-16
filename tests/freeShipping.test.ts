import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/carts.json';
import { computeFreeShipping, currencyDigits, type FreeShippingState } from '../extensions/free-shipping-progress/src/freeShipping';

describe('computeFreeShipping (fixtures)', () => {
  it.each(fixtures)('$name', ({ subtotal, threshold, thresholdCurrency, expect: want }) => {
    const got: FreeShippingState = computeFreeShipping({ subtotal, threshold, thresholdCurrency });
    expect(got.kind).toBe(want.kind);
    if (got.kind === 'progress' && 'remaining' in want) {
      expect(got.remaining.amount).toBeCloseTo(want.remaining, 6);
      expect(got.remaining.currencyCode).toBe(subtotal.currencyCode);
      expect(got.percent).toBe(want.percent);
    }
    if (got.kind === 'hidden' && 'reason' in want) expect(got.reason).toBe(want.reason);
  });
});

describe('currencyDigits', () => {
  it('knows minor units', () => {
    expect(currencyDigits('USD')).toBe(2);
    expect(currencyDigits('JPY')).toBe(0);
    expect(currencyDigits('KWD')).toBe(3);
  });
  it('falls back to 2 for an invalid code', () => {
    expect(currencyDigits('not-a-currency')).toBe(2);
  });
});
