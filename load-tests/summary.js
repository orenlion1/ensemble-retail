export function buildSummary(data, metadata) {
  const metricValues = name => data.metrics?.[name]?.values || {};
  const count = name => metricValues(name).count ?? (
    Number.isFinite(metricValues(name).passes) && Number.isFinite(metricValues(name).fails)
      ? metricValues(name).passes + metricValues(name).fails
      : null
  );
  const failedCount = name => metricValues(name).passes ?? null;
  const rate = name => metricValues(name).rate ?? null;
  const p95 = name => metricValues(name)['p(95)'] ?? null;
  const httpFailureMetric = data.metrics?.http_req_failed ? 'http_req_failed' : 'browser_http_req_failed';
  const httpDurationMetric = data.metrics?.http_req_duration ? 'http_req_duration' : 'browser_http_req_duration';

  return {
    generatedAt: new Date().toISOString(),
    ...metadata,
    totals: {
      httpRequests: count('http_reqs') ?? count(httpFailureMetric),
      httpFailures: failedCount(httpFailureMetric),
      httpFailureRate: rate(httpFailureMetric),
      httpDurationP95Ms: p95(httpDurationMetric),
      checksTotal: count('checks'),
      checksPassRate: rate('checks')
    },
    userActions: {
      total: count('storefront_user_actions'),
      shoppingCartAddItems: count('shopping_cart_add_items'),
      shoppingCartAddDetailItems: count('shopping_cart_add_detail_items'),
      shoppingCartAddSaleItems: count('shopping_cart_add_sale_items'),
      shoppingCartRemoveItems: count('shopping_cart_remove_items'),
      shoppingCartCheckout: count('shopping_cart_checkout')
    },
    businessCounters: {
      cartUpdates: count('cart_updates') ?? count('spike_cart_updates'),
      checkoutAttempts: count('checkout_attempts') ?? count('spike_checkout_attempts'),
      regionChanges: count('region_changes') ?? count('spike_region_changes'),
      categoriesSeen: metricValues('categories_seen')
    },
    metrics: data.metrics
  };
}

export function summaryOutput(data, metadata) {
  const report = buildSummary(data, metadata);
  const defaultName = `reports/load-tests/k6-local-summary-${metadata.slug}-${Date.now()}.json`;
  const summaryPath = __ENV.LOAD_TEST_SUMMARY_PATH || defaultName;
  return {
    [summaryPath]: JSON.stringify(report, null, 2),
    stdout: [
      `k6 summary written to ${summaryPath}`,
      `total HTTP requests: ${report.totals.httpRequests ?? 'n/a'}`,
      `cart add item actions: ${report.userActions.shoppingCartAddItems ?? 'n/a'}`,
      `cart remove item actions: ${report.userActions.shoppingCartRemoveItems ?? 'n/a'}`,
      ''
    ].join('\n')
  };
}
