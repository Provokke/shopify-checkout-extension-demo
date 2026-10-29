import type { FreeShippingState, Money } from './freeShipping';

export interface FreeShippingProgressProps {
  state: FreeShippingState;
  formatMoney: (money: Money) => string;
}

/**
 * Purely presentational. The message is always text, so meaning never depends
 * on colour; <s-progress> carries an accessibilityLabel for screen readers.
 */
export function FreeShippingProgress({ state, formatMoney }: FreeShippingProgressProps) {
  if (state.kind === 'hidden') return null;

  if (state.kind === 'unlocked') {
    return <s-banner tone="success" heading="You've unlocked free shipping" />;
  }

  const message = `Add ${formatMoney(state.remaining)} more to get free shipping`;
  return (
    <s-stack direction="block" gap="small-200">
      <s-text>{message}</s-text>
      <s-progress value={state.percent} max={100} accessibilityLabel={`${state.percent}% of the way to free shipping`} />
    </s-stack>
  );
}
