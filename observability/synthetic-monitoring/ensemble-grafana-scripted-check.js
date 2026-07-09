import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 1,
  iterations: 1,
};

const baseUrl = 'https://ensemble-grafana.com';
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 401, 403));

function safeJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export default function () {
  let res = http.get(baseUrl, {
    tags: { name: 'GET /' },
  });

  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 3000,
    'homepage serves storefront shell': (r) => r.body.includes('Ensemble-Grafana') || r.body.includes('root'),
  });

  sleep(1);

  res = http.get(`${baseUrl}/api/inventory/products`, {
    headers: {
      'X-Region': 'US',
      'X-Locale': 'en-US',
      'X-Language': 'American English',
    },
    tags: { name: 'GET /api/inventory/products' },
  });

  const products = safeJson(res);
  check(res, {
    'inventory status 200': (r) => r.status === 200,
    'inventory returns products': () => Array.isArray(products) && products.length > 0,
  });

  sleep(1);

  const productId = Array.isArray(products) && products[0]?.id ? products[0].id : 'mens-midlayer-grid';
  res = http.get(`${baseUrl}/api/inventory/products/${productId}`, {
    tags: { name: 'GET /api/inventory/products/:id' },
  });

  const product = safeJson(res);
  check(res, {
    'product detail status 200': (r) => r.status === 200,
    'product detail matches requested id': () => product?.id === productId,
  });

  sleep(1);

  res = http.get(`${baseUrl}/api/cart/carts/sm-scripted-check`, {
    tags: { name: 'GET /api/cart/carts/:shopperId unauthenticated' },
  });

  check(res, {
    'cart API rejects unauthenticated request': (r) => r.status === 401 || r.status === 403,
  });
}
