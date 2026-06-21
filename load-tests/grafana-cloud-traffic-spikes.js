import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { regionalJourney } from './grafana-cloud-20-user-regional.js';
import { summaryOutput } from './summary.js';
import storefrontActions, { USER_ACTION_RATE_FAMILIES } from './synthetic-browser-actions.js';

// Cloud k6 worker env injection:
//   set -a && source .env && set +a
//   K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
//     -e API_TEST_KEY="$API_TEST_KEY" \
//     -e STOREFRONT_BASE_URL=https://ensemble-grafana.com \
//     -e API_BASE_URL=https://ensemble-grafana.com \
//     load-tests/grafana-cloud-traffic-spikes.js
// Plain shell env assignments before `k6 cloud run` authenticate the uploader, but
// `-e` is what injects protected app env vars into the remote cloud workers.

const baseSpikeUsers = Number(__ENV.BASE_SPIKE_USERS || 100);
const spikeMultiplier = Number(__ENV.SPIKE_MULTIPLIER || 2);
const spikeTwoUsers = Math.ceil(baseSpikeUsers * spikeMultiplier);
const spikeThreeUsers = Math.ceil(spikeTwoUsers * spikeMultiplier);
const regionalShopperVus = Number(__ENV.REGIONAL_SHOPPER_VUS || 30);
const apiRequestRate = Number(__ENV.API_REQUEST_RPS || 100);
const userActionTargetRps = Number(__ENV.USER_ACTION_TARGET_RPS || 0.18);
const browserActionVus = Number(__ENV.BROWSER_ACTION_VUS || 5);
const inventoryRequestInterval = Math.max(1, Number(__ENV.INVENTORY_REQUEST_INTERVAL || 3));
const accountWriteInterval = Math.max(1, Number(__ENV.ACCOUNT_WRITE_INTERVAL || 3));
const benchmarkDuration = __ENV.TEST_DURATION || '10m';
const benchmarkDurationSeconds = durationToSeconds(benchmarkDuration);
const apiRequestRateMinimumCount = Math.floor(apiRequestRate * benchmarkDurationSeconds * 0.95);
const browserActionRampUp = __ENV.BROWSER_ACTION_RAMP_UP || '2m';
const browserActionHold = __ENV.BROWSER_ACTION_HOLD || '6m';
const browserActionRampDown = __ENV.BROWSER_ACTION_RAMP_DOWN || '2m';
const browserActionDuration = __ENV.BROWSER_ACTION_DURATION || benchmarkDuration;
const userActionRateThresholds = Object.fromEntries(
  USER_ACTION_RATE_FAMILIES.map(actionFamily => [
    `storefront_user_action_events{action_family:${actionFamily}}`,
    [`rate>=${userActionTargetRps}`]
  ])
);

function durationToSeconds(value) {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
  if (!match) return 600;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === 'ms') return amount / 1000;
  if (unit === 's') return amount;
  if (unit === 'm') return amount * 60;
  return amount * 3600;
}

export const options = {
  cloud: {
    name: 'ensemble-grafana-traffic-spikes'
  },
  scenarios: {
    traffic_spikes: {
      exec: 'trafficSpikeJourney',
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: Math.ceil(baseSpikeUsers * 0.25) },
        { duration: '20s', target: baseSpikeUsers },
        { duration: '1m20s', target: baseSpikeUsers },
        { duration: '1m', target: Math.ceil(baseSpikeUsers * 0.25) },
        { duration: '20s', target: spikeTwoUsers },
        { duration: '1m20s', target: spikeTwoUsers },
        { duration: '1m', target: Math.ceil(baseSpikeUsers * 0.25) },
        { duration: '20s', target: spikeThreeUsers },
        { duration: '1m20s', target: spikeThreeUsers },
        { duration: '2m', target: 0 }
      ],
      gracefulRampDown: '30s'
    },
    regional_shoppers: {
      exec: 'regionalJourneyScenario',
      executor: 'constant-vus',
      vus: regionalShopperVus,
      duration: benchmarkDuration,
      gracefulStop: '30s'
    },
    api_request_rate: {
      exec: 'apiRequestRateScenario',
      executor: 'constant-arrival-rate',
      rate: apiRequestRate,
      timeUnit: '1s',
      duration: benchmarkDuration,
      preAllocatedVUs: Number(__ENV.API_REQUEST_PRE_ALLOCATED_VUS || 60),
      maxVUs: Number(__ENV.API_REQUEST_MAX_VUS || 180),
      gracefulStop: '30s'
    },
    storefront_actions: {
      exec: 'storefrontActionsScenario',
      executor: 'ramping-vus',
      stages: [
        { duration: browserActionRampUp, target: browserActionVus },
        { duration: browserActionHold, target: browserActionVus },
        { duration: browserActionRampDown, target: 0 }
      ],
      gracefulRampDown: '30s',
      options: {
        browser: {
          type: 'chromium'
        }
      }
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200', 'p(99)<2000'],
    spike_api_latency: ['p(95)<1000'],
    spike_cart_updates: ['count>20'],
    spike_checkout_attempts: ['count>5'],
    spike_region_changes: ['count>30'],
    spike_non_json_responses: ['count==0'],
    api_latency: ['p(95)<750'],
    cart_updates: ['count>20'],
    checkout_attempts: ['count>5'],
    region_changes: ['count>20'],
    api_request_rate_requests: [`count>=${apiRequestRateMinimumCount}`],
    api_request_rate_latency: ['p(95)<1000'],
    storefront_user_actions: ['count>300'],
    ...userActionRateThresholds,
    shopping_cart_add_items: ['count>10'],
    shopping_cart_add_detail_items: ['count>10'],
    shopping_cart_add_sale_items: ['count>10'],
    shopping_cart_remove_items: ['count>10'],
    shopping_cart_checkout: ['count>10'],
    browser_web_vital_lcp: ['p(95)<4000'],
    browser_web_vital_cls: ['p(95)<0.1']
  },
  tags: {
    app: 'ensemble-grafana',
    test_type: 'traffic-spike-benchmark',
    spike_one_users: String(baseSpikeUsers),
    spike_two_users: String(spikeTwoUsers),
    spike_three_users: String(spikeThreeUsers),
    spike_multiplier: String(spikeMultiplier),
    api_request_rps: String(apiRequestRate),
    user_action_target_rps: String(userActionTargetRps),
    browser_action_vus: String(browserActionVus),
    inventory_request_interval: String(inventoryRequestInterval),
    account_write_interval: String(accountWriteInterval),
    browser_action_duration: browserActionDuration,
    browser_action_ramp_up: browserActionRampUp,
    browser_action_hold: browserActionHold,
    browser_action_ramp_down: browserActionRampDown
  }
};

const storefrontBaseUrl = (__ENV.STOREFRONT_BASE_URL || __ENV.BASE_URL || 'https://ensemble-grafana.com').replace(/\/$/, '');
const apiBaseUrl = (__ENV.API_BASE_URL || __ENV.STOREFRONT_BASE_URL || __ENV.BASE_URL || 'https://ensemble-grafana.com').replace(/\/$/, '');
const apiKey = __ENV.API_TEST_KEY || '';
const regions = ['US', 'CA', 'CN', 'UK', 'SE'];
const regionProfiles = {
  US: { language: 'American English', locale: 'en-US', city: 'Denver', addressRegion: 'CO', postalCode: '80202' },
  CA: { language: 'French', locale: 'fr-CA', city: 'Montreal', addressRegion: 'QC', postalCode: 'H3B 1A7' },
  CN: { language: 'Mandarin', locale: 'zh-CN', city: 'Shanghai', addressRegion: 'SH', postalCode: '200001' },
  UK: { language: 'British English', locale: 'en-GB', city: 'London', addressRegion: 'LND', postalCode: 'SW1A 1AA' },
  SE: { language: 'Swedish', locale: 'sv-SE', city: 'Stockholm', addressRegion: 'AB', postalCode: '111 22' }
};
const personas = ['browser', 'cart_builder', 'account_manager', 'sale_hunter', 'checkout'];

const spikeApiLatency = new Trend('spike_api_latency');
const apiRequestRateLatency = new Trend('api_request_rate_latency');
const apiRequestRateRequests = new Counter('api_request_rate_requests');
const spikeCartUpdates = new Counter('spike_cart_updates');
const spikeCheckoutAttempts = new Counter('spike_checkout_attempts');
const spikeRegionChanges = new Counter('spike_region_changes');
const spikeNonJsonResponses = new Counter('spike_non_json_responses');

const steadyProduct = {
  id: 'mens-midlayer-grid',
  name: "Men's Grid Fleece Midlayer",
  category: 'mens-mid-layers',
  originalPrice: 128.00,
  price: 109.00,
  sizes: ['M'],
  colors: ['Pine'],
  image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80'
};

function activeSpike() {
  if (__VU <= baseSpikeUsers) return 'spike_1';
  if (__VU <= spikeTwoUsers) return 'spike_2';
  return 'spike_3';
}

function personaForVu() {
  return personas[(__VU - 1) % personas.length];
}

function regionForIteration() {
  return regions[(__VU + __ITER) % regions.length];
}

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

function requestOptions(region, persona, name, spike) {
  const profile = regionProfiles[region] || regionProfiles.US;
  return {
    tags: {
      region,
      locale: profile.locale,
      language: profile.language,
      persona,
      name,
      spike
    }
  };
}

function getJson(path, region, persona, shopperId, name, spike) {
  const response = http.get(`${apiBaseUrl}${path}`, {
    headers: headers(region, shopperId),
    ...requestOptions(region, persona, name, spike)
  });
  spikeApiLatency.add(response.timings.duration, { region, persona, name, spike });
  return response;
}

function parseJsonResponse(response, context) {
  const contentType = String(response.headers['Content-Type'] || response.headers['content-type'] || '');
  if (response.status !== 200 || !contentType.includes('application/json')) {
    spikeNonJsonResponses.add(1, context);
    const bodyPrefix = String(response.body || '').slice(0, 120).replace(/\s+/g, ' ');
    console.error(`Expected JSON for ${context.name}, got status=${response.status}, content_type=${contentType || 'unset'}, body_prefix=${bodyPrefix}`);
    return null;
  }

  try {
    const parsed = response.json();
    spikeNonJsonResponses.add(0, context);
    return parsed;
  } catch (error) {
    spikeNonJsonResponses.add(1, context);
    console.error(`Failed to parse JSON for ${context.name}: ${String(error)}`);
    return null;
  }
}

function putJson(path, body, region, persona, shopperId, name, spike) {
  const response = http.put(`${apiBaseUrl}${path}`, JSON.stringify(body), {
    headers: headers(region, shopperId),
    ...requestOptions(region, persona, name, spike)
  });
  spikeApiLatency.add(response.timings.duration, { region, persona, name, spike });
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

function shouldRefreshInventory() {
  return __ITER % inventoryRequestInterval === 0;
}

function shouldWriteAccount() {
  return __ITER % accountWriteInterval === 0;
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

function productCategoryTag(product) {
  return String(product.category || 'uncategorized');
}

function saveAccount(region, persona, shopperId, spike) {
  const profile = regionProfiles[region] || regionProfiles.US;
  const account = putJson(`/api/account/accounts/${shopperId}`, {
    shopperId,
    name: `Spike Shopper ${__VU}`,
    email: `${shopperId}@example.com`,
    shippingAddress: {
      line1: `${200 + __VU} Spike Ridge`,
      city: profile.city,
      region: profile.addressRegion,
      postalCode: profile.postalCode,
      country: region
    },
    wallet: {
      label: 'Visa ending 4242',
      billingPostalCode: profile.postalCode
    }
  }, region, persona, shopperId, 'PUT /api/account/accounts/:shopperId', spike);

  check(account, {
    'account saved during spike': response => response.status === 200
  }, { region, persona, spike });
}

export function trafficSpikeJourney() {
  if (!apiKey) {
    fail('API_TEST_KEY is required for the spike benchmark because cart and account workflows are protected.');
  }

  const spike = activeSpike();
  const persona = personaForVu();
  const region = regionForIteration();
  const shopperId = `spike-${spike}-${persona}-${region.toLowerCase()}-${__VU}`;
  spikeRegionChanges.add(1, { region, persona, spike });

  group('traffic spike shopper journey', () => {
    const home = http.get(`${storefrontBaseUrl}/?region=${region}&spike=${spike}`, requestOptions(region, persona, 'GET /', spike));
    check(home, {
      'storefront loaded during spike': response => response.status === 200
    }, { region, persona, spike });

    let products = [steadyProduct];

    if (shouldRefreshInventory()) {
      const categories = getJson('/api/inventory/categories', region, persona, shopperId, 'GET /api/inventory/categories', spike);
      check(categories, {
        'categories loaded during spike': response => response.status === 200
      }, { region, persona, spike });

      const productsResponse = getJson('/api/inventory/products', region, persona, shopperId, 'GET /api/inventory/products', spike);
      check(productsResponse, {
        'products loaded during spike': response => response.status === 200
      }, { region, persona, spike });

      const parsedProducts = parseJsonResponse(productsResponse, {
        region,
        persona,
        spike,
        name: 'GET /api/inventory/products'
      });
      if (!Array.isArray(parsedProducts)) return;
      products = parsedProducts;
    }

    const product = selectProduct(products, persona);
    if (!product) return;

    if (persona === 'browser') {
      sleep(1);
      return;
    }

    if (persona === 'account_manager') {
      if (shouldWriteAccount()) {
        saveAccount(region, persona, shopperId, spike);
      }
      sleep(2);
      return;
    }

    const cart = putJson(
      `/api/cart/carts/${shopperId}`,
      buildCart(shopperId, product, persona === 'cart_builder' ? 2 : 1),
      region,
      persona,
      shopperId,
      'PUT /api/cart/carts/:shopperId',
      spike
    );
    spikeCartUpdates.add(1, { region, persona, spike, product_category: productCategoryTag(product) });
    check(cart, {
      'cart saved during spike': response => response.status === 200
    }, { region, persona, spike });

    if (persona === 'checkout') {
      if (shouldWriteAccount()) {
        saveAccount(region, persona, shopperId, spike);
      }
      spikeCheckoutAttempts.add(1, { region, persona, spike });
    }

    sleep(persona === 'sale_hunter' ? 1 : 2);
  });
}

export function regionalJourneyScenario() {
  regionalJourney();
}

export function apiRequestRateScenario() {
  if (!apiKey) {
    fail('API_TEST_KEY is required for the API request-rate scenario because cart and account workflows are protected.');
  }

  const region = regionForIteration();
  const persona = personaForVu();
  const shopperId = `steady-${region.toLowerCase()}-${__VU}-${__ITER}`;
  const mode = __ITER % 10;
  let response;
  let requestName = 'GET /';

  if (mode === 0) {
    requestName = 'GET /';
    response = http.get(`${storefrontBaseUrl}/?region=${region}&steady=api-rate`, requestOptions(region, persona, 'GET /', 'steady_api_rate'));
  } else if (mode === 1) {
    requestName = 'GET /api/inventory/categories';
    response = getJson('/api/inventory/categories', region, persona, shopperId, 'GET /api/inventory/categories', 'steady_api_rate');
  } else if (mode === 2) {
    requestName = 'GET /api/inventory/products';
    response = getJson('/api/inventory/products', region, persona, shopperId, 'GET /api/inventory/products', 'steady_api_rate');
  } else if (mode <= 8) {
    requestName = 'PUT /api/cart/carts/:shopperId';
    response = putJson(`/api/cart/carts/${shopperId}`, buildCart(shopperId, steadyProduct, 1), region, persona, shopperId, 'PUT /api/cart/carts/:shopperId', 'steady_api_rate');
  } else {
    requestName = 'PUT /api/account/accounts/:shopperId';
    response = putJson(`/api/account/accounts/${shopperId}`, {
      shopperId,
      name: `Steady Shopper ${__VU}`,
      email: `${shopperId}@example.com`,
      shippingAddress: {
        line1: `${300 + __VU} Rate Trail`,
        city: 'Denver',
        region: 'CO',
        postalCode: '80202',
        country: region
      },
      wallet: {
        label: 'Visa ending 4242',
        billingPostalCode: '80202'
      }
    }, region, persona, shopperId, 'PUT /api/account/accounts/:shopperId', 'steady_api_rate');
  }

  apiRequestRateRequests.add(1, { region, persona });
  apiRequestRateLatency.add(response.timings.duration, { region, persona, name: requestName });
  check(response, {
    'steady API request succeeded': result => result.status >= 200 && result.status < 400
  }, { region, persona });
}

export async function storefrontActionsScenario() {
  await storefrontActions();
}

export default trafficSpikeJourney;

export function handleSummary(data) {
  return summaryOutput(data, {
    testName: 'Combined traffic spike, regional, and browser-action benchmark',
    slug: 'traffic-spikes',
    source: 'k6-local',
    storefrontBaseUrl,
    apiBaseUrl,
    spikeUsers: {
      spikeOne: baseSpikeUsers,
      spikeTwo: spikeTwoUsers,
      spikeThree: spikeThreeUsers
    },
    spikeMultiplier,
    regionalShopperVus,
    apiRequestRate,
    userActionTargetRps,
    browserActionVus,
    inventoryRequestInterval,
    accountWriteInterval,
    browserActionDuration,
    browserActionRampUp,
    browserActionHold,
    browserActionRampDown
  });
}
