# Free shipping progress: Shopify Checkout UI extension

A small checkout extension that tells buyers how close they are to free shipping ("Add $24.00 more to get free shipping") with a progress bar, then shows a success banner once they qualify. It uses API version `2026-10`, Polaris web components (`<s-progress>`, `<s-banner>`) and Preact.

The threshold is a merchant setting, so it can be changed in the checkout editor without a deploy.

## Behaviour

Rendered once, below the cart lines (`purchase.checkout.cart-line-list.render-after`).

| Situation | What the buyer sees |
|---|---|
| Subtotal below threshold | "Add *remaining* more to get free shipping" and a progress bar |
| Subtotal at or above threshold | Success banner "You've unlocked free shipping" |
| Threshold empty, 0, negative or not a number | Nothing |
| Checkout currency differs from the threshold currency | Nothing (no exchange rate here, and a wrong amount is worse than none) |

It updates live as the cart subtotal or the merchant settings change. Settings live in `shopify.extension.toml`: `threshold` (decimal) and `threshold_currency` (ISO 4217, falls back to the checkout currency when empty).

The bar is capped at 99% until the threshold is met, and money is rounded to the currency's minor unit before comparing, so float noise like `0.1 + 0.2` can't flip the result.

## Layout

```
extensions/free-shipping-progress/
  shopify.extension.toml        target, API version, merchant settings
  shopify.d.ts                  types for the `shopify` global
  src/freeShipping.ts           pure logic: subtotal + settings -> state
  src/FreeShippingProgress.tsx  presentational: state -> s-* elements
  src/Extension.tsx             the only file that touches the host
  src/index.tsx                 entry point
harness/                        Vite page running the extension against a mocked checkout API
tests/                          vitest: logic fixtures and jsdom component tests
```

## Run the checks

```
npm ci
npm run check         # typecheck, lint, test, build
npm run preview:dev   # local harness at http://localhost:5173
```

No store, network or credentials needed.

## Running in a real checkout (not done)

1. Create a development store and an app in a Shopify Partner account.
2. Install the Shopify CLI, run `npm ci`, then `shopify app config link` to attach `shopify.app.toml` to your app.
3. Run `shopify app dev`, pick the dev store and open the preview URL it prints.
4. Add products to a cart and go to checkout. Place the extension in the checkout editor if needed and set the threshold.

Copy `.env.example` only if you need to. The CLI manages the real values and they shouldn't be committed.

## Notes and caveats

- Preact and web components rather than React, since Shopify's docs say 2025-07 was the last API version with the React component set.
- It compares the merchandise subtotal (after discounts, before shipping and tax). Change one line for a different rule.
- Strings are hard-coded English. A real version should use `shopify.i18n.translate`.
- It only displays a message and doesn't change shipping rates. The actual free shipping rule has to be set in Shopify with the same threshold, and the two can drift.
- Passes `tsc --noEmit` (strict) against the real `@shopify/ui-extensions` `2026.10.0` types, ESLint, 23 vitest tests, and the Vite builds.
- It has never run in a real checkout or on any store. Component props and API shapes were checked against the docs and type definitions only, and the harness uses crude stand-in elements.
- No screen reader or contrast testing. CI has not run on GitHub.

## Licence

MIT, see `LICENSE`.
