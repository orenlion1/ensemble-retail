import tempo from 'https://jslib.k6.io/http-instrumentation-tempo/1.0.0/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { summaryOutput } from './summary.js';

tempo.instrumentHTTP({
  propagator: 'w3c'
});

export const options = {
  scenarios: {
    shoppers: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 15 },
        { duration: '3m', target: 38 },
        { duration: '1m', target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<750']
  }
};

const baseUrl = (__ENV.API_BASE_URL || __ENV.BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const apiKey = __ENV.API_TEST_KEY || 'local-dev';
const categoriesSeen = new Trend('categories_seen');

export default function () {
  const headers = { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' };
  const shopperId = `load-user-${__VU}-${__ITER}`;

  const categories = http.get(`${baseUrl}/api/inventory/categories`, {
    headers,
    tags: { name: 'GET /api/inventory/categories' }
  });
  check(categories, { 'categories loaded': response => response.status === 200 });
  const categoryList = categories.json();
  categoriesSeen.add(categoryList.length);

  const products = http.get(`${baseUrl}/api/inventory/products`, {
    headers,
    tags: { name: 'GET /api/inventory/products' }
  });
  check(products, { 'products loaded': response => response.status === 200 });
  const product = products.json()[__ITER % products.json().length];

  const productDetail = http.get(`${baseUrl}/api/inventory/products/${product.id}`, {
    headers,
    tags: { name: 'GET /api/inventory/products/:id' }
  });
  check(productDetail, {
    'product detail loaded': response => response.status === 200,
    'product detail matches id': response => response.json().id === product.id
  });

  const cart = http.put(`${baseUrl}/api/cart/carts/${shopperId}`, JSON.stringify({
    shopperId,
    items: [{
      key: `${product.id}-M-Graphite`,
      productId: product.id,
      name: product.name,
      price: product.price,
      size: 'M',
      color: product.colors[0],
      image: product.image,
      quantity: 1
    }]
  }), {
    headers,
    tags: { name: 'PUT /api/cart/carts/:shopperId' }
  });
  check(cart, { 'cart saved': response => response.status === 200 });

  const account = http.put(`${baseUrl}/api/account/accounts/${shopperId}`, JSON.stringify({
    shopperId,
    name: 'Load Test Shopper',
    email: `${shopperId}@example.com`,
    shippingAddress: {
      line1: '100 Test Ridge',
      city: 'Denver',
      region: 'CO',
      postalCode: '80202',
      country: 'US'
    },
    wallet: {
      label: 'Visa ending 4242',
      billingPostalCode: '80202'
    }
  }), {
    headers,
    tags: { name: 'PUT /api/account/accounts/:shopperId' }
  });
  check(account, { 'account saved': response => response.status === 200 });

  sleep(1);
}

export function handleSummary(data) {
  return summaryOutput(data, {
    testName: 'API flow load test',
    slug: 'api-flow',
    source: 'k6-local',
    apiBaseUrl: baseUrl
  });
}
