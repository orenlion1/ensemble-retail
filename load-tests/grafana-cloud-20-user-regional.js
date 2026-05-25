import tempo from 'https://jslib.k6.io/http-instrumentation-tempo/1.0.0/index.js';
import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

tempo.instrumentHTTP({
  propagator: 'w3c'
});

export const options = {
  cloud: {
    name: 'ensemble-grafana-20-user-regional'
  },
  scenarios: {
    regional_shoppers: {
      executor: 'constant-vus',
      vus: 20,
      duration: __ENV.TEST_DURATION || '10m',
      gracefulStop: '30s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<900', 'p(99)<1500'],
    api_latency: ['p(95)<750'],
    cart_updates: ['count>20'],
    checkout_attempts: ['count>5'],
    region_changes: ['count>20']
  },
  tags: {
    app: 'ensemble-grafana',
    test_type: 'regional-shopping-load'
  }
};

const storefrontBaseUrl = (__ENV.STOREFRONT_BASE_URL || __ENV.BASE_URL || 'https://ensemble-grafana.com').replace(/\/$/, '');
const apiBaseUrl = (__ENV.API_BASE_URL || __ENV.BASE_URL || 'https://api.ensemble-grafana.com').replace(/\/$/, '');
const apiKey = __ENV.API_TEST_KEY || '';
const regions = ['US', 'CA', 'CN', 'UK'];
const regionProfiles = {
  US: { language: 'American English', locale: 'en-US', city: 'Denver', addressRegion: 'CO', postalCode: '80202' },
  CA: { language: 'French', locale: 'fr-CA', city: 'Montreal', addressRegion: 'QC', postalCode: 'H3B 1A7' },
  CN: { language: 'Mandarin', locale: 'zh-CN', city: 'Shanghai', addressRegion: 'SH', postalCode: '200001' },
  UK: { language: 'British English', locale: 'en-GB', city: 'London', addressRegion: 'LND', postalCode: 'SW1A 1AA' }
};
const personas = ['browser', 'cart_builder', 'account_manager', 'sale_hunter', 'checkout'];

const apiLatency = new Trend('api_latency');
const cartUpdates = new Counter('cart_updates');
const checkoutAttempts = new Counter('checkout_attempts');
const regionChanges = new Counter('region_changes');

function headers(region, shopperId) {
  const profile = regionProfiles[region] || regionProfiles.US;
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
    'X-Region': region,
    'X-Locale': profile.locale,
    'X-Language': profile.language,
    'X-Shopper-Id': shopperId
  };
}

function personaForVu() {
  return personas[(__VU - 1) % personas.length];
}

function regionForIteration() {
  return regions[(__VU + __ITER) % regions.length];
}

function requestTags(region, persona, name) {
  const profile = regionProfiles[region] || regionProfiles.US;
  return {
    tags: {
      region,
      locale: profile.locale,
      language: profile.language,
      persona,
      name
    }
  };
}

function getJson(path, region, persona, shopperId, name) {
  const response = http.get(`${apiBaseUrl}${path}`, {
    headers: headers(region, shopperId),
    ...requestTags(region, persona, name)
  });
  apiLatency.add(response.timings.duration, { region, persona, name });
  return response;
}

function putJson(path, body, region, persona, shopperId, name) {
  const response = http.put(`${apiBaseUrl}${path}`, JSON.stringify(body), {
    headers: headers(region, shopperId),
    ...requestTags(region, persona, name)
  });
  apiLatency.add(response.timings.duration, { region, persona, name });
  return response;
}

function selectProduct(products, persona) {
  const saleProducts = products.filter(product => product.originalPrice);
  const mensProducts = products.filter(product => product.department === 'mens');
  const womensProducts = products.filter(product => product.department === 'womens');

  if (persona === 'sale_hunter' && saleProducts.length) return saleProducts[__ITER % saleProducts.length];
  if (persona === 'cart_builder' && mensProducts.length) return mensProducts[__ITER % mensProducts.length];
  if (persona === 'account_manager' && womensProducts.length) return womensProducts[__ITER % womensProducts.length];
  return products[__ITER % products.length];
}

function buildCart(shopperId, product, quantity = 1) {
  const size = product.sizes?.[0] || 'M';
  const color = product.colors?.[0] || 'Graphite';

  return {
    shopperId,
    items: [{
      key: `${product.id}-${size}-${color}`,
      productId: product.id,
      name: product.name,
      originalPrice: product.originalPrice,
      price: product.price,
      size,
      color,
      image: product.image,
      quantity
    }]
  };
}

function saveAccount(region, persona, shopperId) {
  const profile = regionProfiles[region] || regionProfiles.US;
  const account = putJson(`/api/account/accounts/${shopperId}`, {
    shopperId,
    name: `Regional Shopper ${__VU}`,
    email: `${shopperId}@example.com`,
    shippingAddress: {
      line1: `${100 + __VU} Load Test Ridge`,
      city: profile.city,
      region: profile.addressRegion,
      postalCode: profile.postalCode,
      country: region
    },
    wallet: {
      label: 'Visa ending 4242',
      billingPostalCode: profile.postalCode
    }
  }, region, persona, shopperId, 'PUT /api/account/accounts/:shopperId');

  check(account, {
    'account saved': response => response.status === 200
  }, { region, persona });
}

export default function () {
  if (!apiKey) {
    fail('API_TEST_KEY is required for the regional k6 load test because cart and account workflows are protected.');
  }

  const persona = personaForVu();
  const region = regionForIteration();
  const shopperId = `regional-${persona}-${region.toLowerCase()}-${__VU}`;
  regionChanges.add(1, { region, persona });

  group('regional shopper journey', () => {
    const home = http.get(`${storefrontBaseUrl}/?region=${region}`, requestTags(region, persona, 'GET /'));
    check(home, {
      'storefront loaded': response => response.status === 200
    }, { region, persona });

    const categories = getJson('/api/inventory/categories', region, persona, shopperId, 'GET /api/inventory/categories');
    check(categories, {
      'categories loaded': response => response.status === 200
    }, { region, persona });

    const productsResponse = getJson('/api/inventory/products', region, persona, shopperId, 'GET /api/inventory/products');
    check(productsResponse, {
      'products loaded': response => response.status === 200
    }, { region, persona });

    const products = productsResponse.json();
    const product = selectProduct(products, persona);

    if (!product) {
      return;
    }

    if (persona === 'browser') {
      sleep(1);
      return;
    }

    if (persona === 'account_manager') {
      saveAccount(region, persona, shopperId);
      sleep(2);
      return;
    }

    const quantity = persona === 'cart_builder' ? 2 : 1;
    const cart = putJson(`/api/cart/carts/${shopperId}`, buildCart(shopperId, product, quantity), region, persona, shopperId, 'PUT /api/cart/carts/:shopperId');
    cartUpdates.add(1, { region, persona, product_category: product.category });
    check(cart, {
      'cart saved': response => response.status === 200
    }, { region, persona });

    if (persona === 'checkout') {
      saveAccount(region, persona, shopperId);
      checkoutAttempts.add(1, { region, persona });
    }

    if (persona === 'sale_hunter') {
      sleep(1);
    } else {
      sleep(2);
    }
  });
}
