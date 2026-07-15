// Types the `shopify` global per source module, same shape the Shopify CLI generates.
import '@shopify/ui-extensions/preact';

declare module './src/Extension' {
  const shopify: import('@shopify/ui-extensions/purchase.checkout.cart-line-list.render-after').Api;
}
