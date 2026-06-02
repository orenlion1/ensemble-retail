import { fallbackProducts } from './data.js';

const viteEnv = import.meta.env || {};

function isApiEnabled() {
  if (typeof globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS === 'boolean') {
    return globalThis.__ENSEMBLE_API_ENABLED_FOR_TESTS;
  }
  return viteEnv.VITE_API_ENABLED === 'true' || (viteEnv.PROD && viteEnv.VITE_API_ENABLED !== 'false');
}

async function request(path, options) {
  const { accessToken, headers = {}, ...fetchOptions } = options || {};
  const response = await fetch(path, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function loadProducts() {
  if (!isApiEnabled()) return fallbackProducts;
  try {
    return await request('/api/inventory/products');
  } catch {
    return fallbackProducts;
  }
}

export async function loadCategories() {
  if (!isApiEnabled()) return fallbackCategories();
  try {
    return await request('/api/inventory/categories');
  } catch {
    return fallbackCategories();
  }
}

export async function saveCart(cart, authSession) {
  if (!isApiEnabled() || !hasRemoteAuthSession(authSession)) {
    localStorage.setItem('ensemble-cart', JSON.stringify(cart));
    return;
  }
  try {
    const shopperId = authSession.user.id;
    await request(`/api/cart/carts/${encodeURIComponent(shopperId)}`, {
      method: 'PUT',
      accessToken: authSession.accessToken,
      body: JSON.stringify({ shopperId, items: cart })
    });
  } catch {
    localStorage.setItem('ensemble-cart', JSON.stringify(cart));
  }
}

export async function saveAccount(account, authSession) {
  if (containsFullCardNumber(account?.wallet?.label)) {
    throw new Error('Wallet may only store payment metadata.');
  }
  if (!isApiEnabled() || !hasRemoteAuthSession(authSession)) {
    localStorage.setItem('ensemble-account', JSON.stringify(account));
    return account;
  }
  try {
    const shopperId = authSession.user.id;
    return await request(`/api/account/accounts/${encodeURIComponent(shopperId)}`, {
      method: 'PUT',
      accessToken: authSession.accessToken,
      body: JSON.stringify(account)
    });
  } catch {
    localStorage.setItem('ensemble-account', JSON.stringify(account));
    return account;
  }
}

function hasRemoteAuthSession(authSession) {
  return Boolean(authSession?.accessToken && authSession?.user?.id);
}

function containsFullCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 13;
}

function fallbackCategories() {
  return fallbackProducts.reduce((departments, product) => {
    const existing = departments.find(item => item.department === product.department);
    if (existing) {
      existing.categories = [...new Set([...existing.categories, product.category])];
      return departments;
    }
    return [...departments, { department: product.department, categories: [product.category] }];
  }, []);
}
