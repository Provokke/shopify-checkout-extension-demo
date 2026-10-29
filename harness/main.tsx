import { render } from 'preact';
import { signal } from '@preact/signals';
import { Extension } from '../extensions/free-shipping-progress/src/Extension';

const subtotal = signal({ amount: 30, currencyCode: 'USD' });
const settings = signal<Record<string, unknown>>({ threshold: 75, threshold_currency: 'USD' });

// A minimal fake of the parts of the checkout API this extension reads.
Object.assign(globalThis, {
  shopify: {
    settings,
    cost: { subtotalAmount: subtotal },
    i18n: {
      formatCurrency: (n: number, o: { currency: string }) =>
        new Intl.NumberFormat(navigator.language, { style: 'currency', currency: o.currency }).format(n),
    },
  },
});

function input<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
}

const subtotalEl = input<HTMLInputElement>('subtotal');
const currencyEl = input<HTMLSelectElement>('currency');
const thresholdEl = input<HTMLInputElement>('threshold');
const thresholdCurrencyEl = input<HTMLInputElement>('thresholdCurrency');

function sync() {
  subtotal.value = { amount: Number(subtotalEl.value), currencyCode: currencyEl.value };
  settings.value = {
    threshold: thresholdEl.value === '' ? undefined : Number(thresholdEl.value),
    threshold_currency: thresholdCurrencyEl.value || undefined,
  };
}
for (const el of [subtotalEl, currencyEl, thresholdEl, thresholdCurrencyEl]) el.addEventListener('input', sync);
sync();

render(<Extension />, input('mount'));

// Drive the stand-in progress bar's width from its `value`/`max` attributes.
new MutationObserver(() => {
  for (const bar of document.querySelectorAll('s-progress')) {
    const pct = (Number(bar.getAttribute('value')) / Number(bar.getAttribute('max') || 1)) * 100;
    (bar as HTMLElement).style.setProperty('--pct', String(pct));
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', String(bar.getAttribute('value')));
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(bar.getAttribute('max')));
    bar.setAttribute('aria-label', bar.getAttribute('accessibilitylabel') ?? '');
  }
}).observe(input('mount'), { childList: true, subtree: true, attributes: true });
