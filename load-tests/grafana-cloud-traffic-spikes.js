import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { regionalJourney } from './grafana-cloud-20-user-regional.js';
import { summaryOutput } from './summary.js';
import storefrontActions, { USER_ACTION_RATE_FAMILIES } from './synthetic-browser-actions.js';

const baseSpikeUsers = Number(__ENV.BASE_SPIKE_USERS || 100);
const spikeMultiplier = Number(__ENV.SPIKE_MULTIPLIER || 2);
const spikeTwoUsers = Math.ceil(baseSpikeUsers * spikeMultiplier);
const spikeThreeUsers = Math.ceil(spikeTwoUsers * spikeMultiplier);
const regionalShopperVus = Number(__ENV.REGIONAL_SHOPPER_VUS || 30);
const userActionTargetRps = Number(__ENV.USER_ACTION_TARGET_RPS || 5);
const browserActionVus = Number(__ENV.BROWSER_ACTION_VUS || 60);
const browserActionDuration = __ENV.BROWSER_ACTION_DURATION || __ENV.TEST_DURATION || '10m';
const userActionRateThresholds = Object.fromEntries(
  USER_ACTION_RATE_FAMILIES.map(actionFamily => [
    `storefront_user_action_events{action_family:${actionFamily}}`,
    [`rate>=${userActionTargetRps}`]
  ])
);

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
        { duration: '30s', target: baseSpikeUsers },
        { duration: '1m', target: baseSpikeUsers },
        { duration: '1m', target: Math.ceil(baseSpikeUsers * 0.25) },
        { duration: '30s', target: spikeTwoUsers },
        { duration: '1m', target: spikeTwoUsers },
        { duration: '1m', target: Math.ceil(baseSpikeUsers * 0.25) },
        { duration: '30s', target: spikeThreeUsers },
        { duration: '1m', target: spikeThreeUsers },
        { duration: '1m', target: 0 }
      ],
      gracefulRampDown: '30s'
    },
    regional_shoppers: {
      exec: 'regionalJourneyScenario',
      executor: 'constant-vus',
      vus: regionalShopperVus,
      duration: __ENV.TEST_DURATION || '10m',
      gracefulStop: '30s'
    },
    storefront_actions: {
      exec: 'storefrontActionsScenario',
      executor: 'constant-vus',
      vus: browserActionVus,
      duration: browserActionDuration,
      gracefulStop: '30s',
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
    api_latency: ['p(95)<750'],
    cart_updates: ['count>20'],
    checkout_attempts: ['count>5'],
    region_changes: ['count>20'],
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
    user_action_target_rps: String(userActionTargetRps),
    browser_action_vus: String(browserActionVus),
    browser_action_duration: browserActionDuration
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
const spikeCartUpdates = new Counter('spike_cart_updates');
const spikeCheckoutAttempts = new Counter('spike_checkout_attempts');
const spikeRegionChanges = new Counter('spike_region_changes');

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

    const categories = getJson('/api/inventory/categories', region, persona, shopperId, 'GET /api/inventory/categories', spike);
    check(categories, {
      'categories loaded during spike': response => response.status === 200
    }, { region, persona, spike });

    const productsResponse = getJson('/api/inventory/products', region, persona, shopperId, 'GET /api/inventory/products', spike);
    check(productsResponse, {
      'products loaded during spike': response => response.status === 200
    }, { region, persona, spike });

    const products = productsResponse.json();
    const product = selectProduct(products, persona);
    if (!product) return;

    if (persona === 'browser') {
      sleep(1);
      return;
    }

    if (persona === 'account_manager') {
      saveAccount(region, persona, shopperId, spike);
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
    spikeCartUpdates.add(1, { region, persona, spike, product_category: product.category });
    check(cart, {
      'cart saved during spike': response => response.status === 200
    }, { region, persona, spike });

    if (persona === 'checkout') {
      saveAccount(region, persona, shopperId, spike);
      spikeCheckoutAttempts.add(1, { region, persona, spike });
    }

    sleep(persona === 'sale_hunter' ? 1 : 2);
  });
}

export function regionalJourneyScenario() {
  regionalJourney();
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
    userActionTargetRps,
    browserActionVus,
    browserActionDuration
  });
}
