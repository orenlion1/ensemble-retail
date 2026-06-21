import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { saveAccount, saveCart } from '../src/api.js';

const originalFetch = globalThis.fetch;
const originalApiEnabled = globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS;

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function mockFetch(responseBody = {}) {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return responseBody;
      }
    };
  };
  return calls;
}

describe('frontend API persistence auth', () => {
  beforeEach(() => {
    globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS = true;
    globalThis.localStorage = createLocalStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (typeof originalApiEnabled === 'undefined') {
      delete globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS;
    } else {
      globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS = originalApiEnabled;
    }
    delete globalThis.localStorage;
  });

  it('keeps anonymous cart writes local instead of calling the protected API', async () => {
    const fetchCalls = mockFetch();
    const cart = [{ productId: 'mens-shell-alpha', quantity: 1 }];

    await saveCart(cart, null);

    assert.equal(fetchCalls.length, 0);
    assert.equal(localStorage.getItem('ensemble-cart'), JSON.stringify(cart));
  });

  it('sends signed-in cart writes with a bearer token and shopper id', async () => {
    const fetchCalls = mockFetch();
    const cart = [{ productId: 'mens-shell-alpha', quantity: 1 }];

    await saveCart(cart, {
      accessToken: 'access-token-123',
      user: { id: 'shopper-123' }
    });

    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].path, '/api/cart/carts/shopper-123');
    assert.equal(fetchCalls[0].options.method, 'PUT');
    assert.equal(fetchCalls[0].options.headers.Authorization, 'Bearer access-token-123');
    assert.equal(fetchCalls[0].options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
      shopperId: 'shopper-123',
      items: cart
    });
  });

  it('keeps anonymous account writes local instead of calling the protected API', async () => {
    const fetchCalls = mockFetch();
    const account = {
      name: 'Demo Shopper',
      email: 'demo@example.com',
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
    };

    const saved = await saveAccount(account, null);

    assert.equal(fetchCalls.length, 0);
    assert.equal(saved, account);
    assert.equal(localStorage.getItem('ensemble-account'), JSON.stringify(account));
  });
});
