// @vitest-environment jsdom
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { signal } from '@preact/signals';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FreeShippingProgress } from '../extensions/free-shipping-progress/src/FreeShippingProgress';
import { Extension } from '../extensions/free-shipping-progress/src/Extension';

const fmt = ({ amount, currencyCode }: { amount: number; currencyCode: string }) => `${currencyCode} ${amount.toFixed(2)}`;
let root: HTMLElement;

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
});
afterEach(() => {
  render(null, root);
  root.remove();
});

describe('FreeShippingProgress', () => {
  it('renders nothing when hidden', () => {
    render(<FreeShippingProgress state={{ kind: 'hidden', reason: 'no-threshold' }} formatMoney={fmt} />, root);
    expect(root.innerHTML).toBe('');
  });

  it('shows a text message AND a labelled progress element (not colour-only)', () => {
    render(
      <FreeShippingProgress state={{ kind: 'progress', remaining: { amount: 45, currencyCode: 'USD' }, percent: 40 }} formatMoney={fmt} />,
      root,
    );
    expect(root.textContent).toContain('Add USD 45.00 more to get free shipping');
    const bar = root.querySelector('s-progress');
    expect(bar).not.toBeNull();
    expect(JSON.stringify([...(bar?.attributes ?? [])].map((a) => [a.name.toLowerCase(), a.value]))).toContain(
      '["accessibilitylabel","40% of the way to free shipping"]',
    );
    expect(bar?.getAttribute('value')).toBe('40');
  });

  it('shows a success banner with a heading when unlocked', () => {
    render(<FreeShippingProgress state={{ kind: 'unlocked' }} formatMoney={fmt} />, root);
    const banner = root.querySelector('s-banner');
    expect(banner?.getAttribute('tone')).toBe('success');
    expect(banner?.getAttribute('heading')).toContain('free shipping');
  });
});

describe('Extension (host signals)', () => {
  const subtotal = signal({ amount: 30, currencyCode: 'USD' });
  const settings = signal<Record<string, unknown>>({ threshold: 75, threshold_currency: 'USD' });

  beforeEach(() => {
    subtotal.value = { amount: 30, currencyCode: 'USD' };
    settings.value = { threshold: 75, threshold_currency: 'USD' };
    Object.assign(globalThis, {
      shopify: {
        settings,
        cost: { subtotalAmount: subtotal },
        i18n: { formatCurrency: (n: number, o: { currency: string }) => `${o.currency} ${n.toFixed(2)}` },
      },
    });
  });

  it('re-renders when the cart subtotal signal changes, through to unlocked', async () => {
    render(<Extension />, root);
    expect(root.textContent).toContain('Add USD 45.00 more');
    await act(() => {
      subtotal.value = { amount: 60, currencyCode: 'USD' };
    });
    expect(root.textContent).toContain('Add USD 15.00 more');
    await act(() => {
      subtotal.value = { amount: 80, currencyCode: 'USD' };
    });
    expect(root.querySelector('s-banner')).not.toBeNull();
  });

  it('reacts to a merchant setting change and hides when unset', async () => {
    render(<Extension />, root);
    await act(() => {
      settings.value = {};
    });
    expect(root.innerHTML).toBe('');
  });
});
