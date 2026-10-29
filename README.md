# Free shipping progress: Shopify Checkout UI extension

A small, finished checkout extension that tells buyers how close they are to free shipping ("Add $24.00 more to get free shipping"), with a progress bar, then a success banner once they qualify. Built with the current Checkout UI extensions stack: API version `2026-10`, Polaris web components (`<s-progress>`, `<s-banner>`, ...) and Preact.

## The problem it solves (agency view)

"Add a free shipping bar" is one of the most common requests a Shopify agency gets, and it is usually built badly on the cart page only, with a hard-coded threshold and a float comparison that shows "$0.00 away" while the order still pays shipping. Doing it in checkout means the buyer sees it where the decision to leave or add one more item is made, and the merchant can change the threshold themselves in the checkout editor with no deploy.

## Behaviour

Rendered once, below the cart lines (`purchase.checkout.cart-line-list.render-after`):

| Situation | What the buyer sees |
|---|---|
| Subtotal below threshold | Text "Add *remaining* more to get free shipping" plus a progress bar |
| Subtotal at or above threshold | Success banner "You've unlocked free shipping" |
| Merchant left the threshold empty, or entered 0 / a negative / a non-number | Nothing renders |
| Buyer checks out in a currency other than the threshold currency (Shopify Markets) | Nothing renders: there is no exchange rate here, and showing a wrong amount is worse than showing nothing |

It updates live as the cart subtotal (which reflects discounts) or the merchant settings change.

Merchant settings (`shopify.extension.toml`): `threshold` (decimal) and `threshold_currency` (ISO 4217; falls back to the checkout currency when empty).

Detail worth noting: the bar is floored and capped at 99% until the threshold is actually met, so it never reads 100% while an amount is still outstanding. Money is rounded to the currency's minor unit (0 digits for JPY, 3 for KWD) before comparing, so `0.1 + 0.2` style float noise cannot flip the result.

## Accessibility

- Meaning is never colour-only: the remaining amount is always written out in text, and the unlocked state is a banner with a heading.
- `<s-progress>` gets an `accessibilityLabel` ("40% of the way to free shipping").
- No custom interactive controls, so keyboard and focus behaviour is Shopify's own. The extension cannot ship custom CSS in checkout, so contrast and focus styling come from the platform components.
- The local preview harness marks its stand-in bar as `role="progressbar"` with `aria-*` values and a visible focus style on its form controls.

Not done: no manual screen reader pass (NVDA/VoiceOver) and no automated axe run against a real checkout. Those need a live checkout.

## Architecture

```
extensions/free-shipping-progress/
  shopify.extension.toml     target, API version, merchant settings
  shopify.d.ts               types the `shopify` global for the target
  src/freeShipping.ts        pure logic: subtotal + settings -> state (no Shopify imports)
  src/FreeShippingProgress.tsx  presentational: state -> s-* elements
  src/Extension.tsx          the only file touching the host: reads signals, formats money
  src/index.tsx              entry: render(<Extension />, document.body)
harness/                     Vite page that runs Extension against a mocked checkout API
tests/                       vitest: logic fixtures + component/signal tests (jsdom)
```

Logic, presentation and host access are separate on purpose: the rules that matter (money rounding, currency mismatch, invalid settings) are plain functions tested with offline JSON fixtures (`tests/fixtures/carts.json`, 16 cases), and the host surface is one small file.

## Run the checks

```
npm ci
npm run check      # typecheck, lint, test, build
npm run preview:dev   # local harness at http://localhost:5173
```

No store, network or credentials are needed for any of the above.

## Run it in a real checkout (not done yet, described only)

1. Create a free development store in a Shopify Partner account, and an app in the Partner dashboard.
2. Install the Shopify CLI, run `npm ci`, then `shopify app config link` to attach `shopify.app.toml` to your app.
3. `shopify app dev`, pick the dev store, open the preview URL the CLI prints for the extension.
4. In the store, add products to a cart, and go to checkout. Place the extension in the checkout editor if it is not already visible, then set the threshold (and currency) in its settings.
5. Check Shopify's current docs for which store plans can run checkout UI extensions outside development previews; that was not verified here.

Copy `.env.example` only if you need to; the CLI manages real values and they must not be committed.

## Design decisions and trade-offs

- **Polaris web components + Preact**, not React. Shopify's docs state 2025-07 was the last API version supporting the React component set and that extensions need to be on 2026-01+ to keep deploying. Targeting `2026-10` avoids building on the deprecated path.
- **Signals via `.value`.** The `@shopify/ui-extensions/preact` import wires Preact signals, so reading `shopify.cost.subtotalAmount.value` in render is enough to be reactive. The tests prove the component reacts to signal changes, but with `@preact/signals` mocks, not Shopify's runtime.
- **Subtotal, not total.** Free shipping is conventionally judged on the merchandise subtotal (which includes discounts) before shipping and tax. Merchants with a different rule would need to change one line.
- **Hide on currency mismatch** instead of guessing a conversion. A follow-up could read the threshold from per-market metafields.
- **Hard-coded English strings.** A production version should use `shopify.i18n.translate` with a `locales/` folder. Left out to keep the demo small; it is the first thing I would add for a real client.
- **This does not change shipping rates.** It is purely informational. The actual free-shipping rule must be configured in Shopify shipping settings with the same threshold; the two can drift if someone edits only one. A real engagement would document that or use a Shipping Function.

## Status (honest)

Verified, locally, offline:
- `tsc --noEmit` (TypeScript strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) passes, including type-checking against the real `@shopify/ui-extensions` `2026.10.0` types for the target.
- ESLint passes. 23 vitest tests pass (logic fixtures and jsdom component tests).
- The extension entry bundles with Vite and the preview harness builds.

NOT done:
- **It has never run in a real Shopify checkout or on any store.** `shopify app dev` has not been run, no app is created or linked, and nothing was deployed.
- Target, component props and API shapes were checked against Shopify's docs and the shipped type definitions, not exercised against the live runtime. Runtime-only surprises (for example how `shopify.i18n.formatCurrency` formats in a given locale) are possible.
- The harness uses crude stand-in elements; it does not show what Shopify's components look like. No screenshots are included for that reason.
- No screen reader or contrast testing in a real checkout.
- CI workflow is written but has not run on GitHub (the repo has not been pushed).

## Licence

MIT, see `LICENSE`.
