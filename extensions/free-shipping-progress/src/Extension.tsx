import { FreeShippingProgress } from './FreeShippingProgress';
import { computeFreeShipping, type Money } from './freeShipping';

/**
 * Reads the host's signals. `.value` is tracked by the Preact signals
 * integration that `@shopify/ui-extensions/preact` wires up, so the bar
 * re-renders when the cart, a discount, or a merchant setting changes.
 */
export function Extension() {
  const settings = shopify.settings.value;
  const subtotal = shopify.cost.subtotalAmount.value;

  const state = computeFreeShipping({
    subtotal: { amount: subtotal.amount, currencyCode: subtotal.currencyCode },
    threshold: settings.threshold,
    thresholdCurrency: settings.threshold_currency,
  });

  const formatMoney = ({ amount, currencyCode }: Money) =>
    shopify.i18n.formatCurrency(amount, { currency: currencyCode });

  return <FreeShippingProgress state={state} formatMoney={formatMoney} />;
}
