import { browser } from 'k6/browser';
import { check, fail, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { summaryOutput } from './summary.js';

export const options = {
  cloud: {
    name: 'ensemble-grafana-faro-user-actions-browser'
  },
  scenarios: {
    storefront_actions: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium'
        }
      }
    }
  },
  thresholds: {
    checks: ['rate==1.0'],
    browser_web_vital_lcp: ['p(95)<4000'],
    browser_web_vital_cls: ['p(95)<0.1']
  },
  tags: {
    app: 'ensemble-grafana',
    test_type: 'faro-user-actions-browser'
  }
};

const baseUrl = __ENV.BASE_URL || 'https://ensemble-retail.com';
const storefrontUserActions = new Counter('storefront_user_actions');
const storefrontUserActionEvents = new Counter('storefront_user_action_events');
const shoppingCartAddItems = new Counter('shopping_cart_add_items');
const shoppingCartAddDetailItems = new Counter('shopping_cart_add_detail_items');
const shoppingCartAddSaleItems = new Counter('shopping_cart_add_sale_items');
const shoppingCartRemoveItems = new Counter('shopping_cart_remove_items');
const shoppingCartCheckout = new Counter('shopping_cart_checkout');
const regionLanguageExpectations = {
  US: { lang: 'en-US', language: 'American English', languageSlug: 'american-english', text: 'Cart' },
  CA: { lang: 'fr-CA', language: 'French', languageSlug: 'french', text: 'Panier' },
  CN: { lang: 'zh-CN', language: 'Mandarin', languageSlug: 'mandarin', text: '购物车' },
  UK: { lang: 'en-GB', language: 'British English', languageSlug: 'british-english', text: 'Basket', secondaryText: 'Trousers', forbiddenTextPattern: '\\bPants?\\b' },
  SE: { lang: 'sv-SE', language: 'Swedish', languageSlug: 'swedish', text: 'Varukorg', secondaryText: 'Herr' }
};
export const USER_ACTION_RATE_FAMILIES = [
  'navigate-brand-family:ensemble',
  'navigate-brand-family:outlet',
  'navigate-brand-family:trail-lab',
  'navigate-brand-family:regear',
  'navigate-sale:spring-collection-sale',
  'navigate-utility:find-store',
  'navigate-utility:help',
  'navigate-header:shop',
  'navigate-header:cart',
  'navigate-header:account',
  'navigate-hero:shop-new-arrivals',
  'navigate-sale:shop-all',
  'select-department:womens',
  'select-department:mens',
  'select-category:mens-mid-layers',
  'sort-products:price-low',
  'search-products',
  'select-region:SE',
  'select-language:swedish',
  'select-region:US',
  'select-language:american-english',
  'view-product',
  'shopping-cart:add-detail-item',
  'close-product-detail',
  'shopping-cart:add-item',
  'view-sale-product',
  'shopping-cart:add-sale-item',
  'shopping-cart:change-quantity',
  'shopping-cart:checkout',
  'checkout-dialog:close',
  'shopping-cart:remove-item',
  'save-account'
];
const USER_ACTION_PREFIX_FAMILIES = [
  'view-product:',
  'shopping-cart:add-detail-item:',
  'close-product-detail:',
  'shopping-cart:add-item:',
  'view-sale-product:',
  'shopping-cart:add-sale-item:',
  'shopping-cart:change-quantity:',
  'shopping-cart:remove-item:'
];

function byAction(name) {
  return `[data-faro-user-action-name="${name}"]`;
}

function recordActionTotals(actions) {
  storefrontUserActions.add(actions.length);
  actions.forEach(action => {
    storefrontUserActionEvents.add(1, {
      action_name: action,
      action_family: actionFamily(action)
    });
  });
  shoppingCartAddItems.add(actions.filter(action => action.startsWith('shopping-cart:add-item:')).length);
  shoppingCartAddDetailItems.add(actions.filter(action => action.startsWith('shopping-cart:add-detail-item:')).length);
  shoppingCartAddSaleItems.add(actions.filter(action => action.startsWith('shopping-cart:add-sale-item:')).length);
  shoppingCartRemoveItems.add(actions.filter(action => action.startsWith('shopping-cart:remove-item:')).length);
  shoppingCartCheckout.add(actions.filter(action => action === 'shopping-cart:checkout').length);
}

function actionFamily(action) {
  const prefix = USER_ACTION_PREFIX_FAMILIES.find(candidate => action.startsWith(candidate));
  return prefix ? prefix.replace(/:$/, '') : action;
}

async function recordUserActions(page) {
  await page.evaluate(() => {
    window.__k6UserActions = [];
    const record = (event, fallback) => {
      const actionElement = event.target.closest('[data-faro-user-action-name]');
      let actionName = actionElement?.getAttribute('data-faro-user-action-name') || fallback;
      if (event.type === 'change' || event.type === 'input') {
        if (event.target.id === 'region-selector') {
          const languages = {
            US: 'american-english',
            CA: 'french',
            CN: 'mandarin',
            UK: 'british-english',
            SE: 'swedish'
          };
          actionName = `select-region:${event.target.value}`;
          window.__k6UserActions.push({
            type: event.type,
            actionName: `select-language:${languages[event.target.value]}`,
            tagName: event.target.tagName,
            text: event.target.value || ''
          });
        }
        if (event.target.id === 'product-sort') actionName = `sort-products:${event.target.value}`;
        if (event.target.id === 'product-search') actionName = 'search-products';
      }
      if (actionName) {
        window.__k6UserActions.push({
          type: event.type,
          actionName,
          tagName: event.target.tagName,
          text: event.target.innerText || event.target.value || ''
        });
      }
    };

    document.addEventListener('click', event => record(event), true);
    document.addEventListener('input', event => record(event), true);
    document.addEventListener('change', event => record(event), true);
    document.addEventListener('submit', event => record(event, event.target.querySelector('[data-faro-user-action-name]')?.getAttribute('data-faro-user-action-name')), true);
  });
}

async function clickAction(page, actionName, options = {}) {
  const locator = page.locator(byAction(actionName)).first();
  await locator.waitFor({ state: 'visible', timeout: options.timeout || 10000 });
  await locator.click();
}

async function clickFirstMatchingAction(page, actionPrefix, options = {}) {
  const locator = page.locator(`[data-faro-user-action-name^="${actionPrefix}"]`).first();
  await locator.waitFor({ state: 'visible', timeout: options.timeout || 10000 });
  await locator.click();
  return locator;
}

async function domClickAction(page, actionName) {
  await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Missing action selector ${selector}`);
    }
    element.click();
  }, byAction(actionName));
}

async function actionState(page, actionName) {
  return page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element) {
      return {
        exists: false,
        visible: false,
        disabled: false,
        href: ''
      };
    }

    const style = window.getComputedStyle(element);
    return {
      exists: true,
      visible: style.visibility !== 'hidden' && style.display !== 'none',
      disabled: Boolean(element.disabled),
      href: element.href || ''
    };
  }, byAction(actionName));
}

async function selectAction(page, selector, value) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  await locator.selectOption(value);
}

async function validateRegionLanguage(page, region) {
  const expected = regionLanguageExpectations[region];
  sleep(0.2);
  const result = await page.evaluate(expectedLanguageText => {
    const selector = document.querySelector('#region-selector');
    return {
      region: selector ? selector.value : '',
      lang: document.documentElement.lang,
      bodyIncludesText: document.body.innerText.includes(expectedLanguageText),
      bodyText: document.body.innerText
    };
  }, expected.text);

  check(result, {
    [`${region} region selected`]: value => value.region === region,
    [`${region} document language is ${expected.lang}`]: value => value.lang === expected.lang,
    [`${region} localized text is visible`]: value => value.bodyIncludesText === true
  });

  if (expected.secondaryText) {
    check(result, {
      [`${region} regional vocabulary is visible`]: value => value.bodyText.includes(expected.secondaryText)
    });
  }

  if (expected.forbiddenTextPattern) {
    const forbiddenPattern = new RegExp(expected.forbiddenTextPattern);
    check(result, {
      [`${region} raw regional vocabulary is hidden`]: value => !forbiddenPattern.test(value.bodyText)
    });
  }
}

async function navigateWithRetry(page, action, description, retries = 2) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;
      console.warn(`${description} failed on attempt ${attempt}: ${error?.message || String(error)}`);
      if (attempt <= retries) {
        sleep(attempt);
      }
    }
  }

  throw lastError;
}

async function loadRegionForLanguageValidation(page, region) {
  // Reload per locale so full-page translation swaps do not pollute CLS thresholds.
  await page.evaluate(nextRegion => {
    localStorage.setItem('ensemble-region', nextRegion);
  }, region);
  await navigateWithRetry(
    page,
    () => page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }),
    `reload for ${region} localization`
  );
  await waitForStorefrontReady(page);
  await validateRegionLanguage(page, region);
}

async function waitForStorefrontReady(page) {
  await page.locator('#region-selector').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('[data-faro-user-action-name="select-department:mens"]').waitFor({ state: 'visible', timeout: 30000 });
}

async function fillField(page, selector, value) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout: 10000 });
  await locator.fill(value);
}

async function scrollTo(page, selector) {
  await page.evaluate(selectorToScroll => {
    document.querySelector(selectorToScroll)?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, selector);
}

export default async function () {
  const page = await browser.newPage();

  try {
    await navigateWithRetry(
      page,
      () => page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }),
      'initial storefront navigation'
    );
    await waitForStorefrontReady(page);
    await page.evaluate(() => {
      localStorage.removeItem('ensemble-cart');
      localStorage.setItem('ensemble-region', 'US');
    });
    await navigateWithRetry(
      page,
      () => page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }),
      'storefront reset reload'
    );
    await waitForStorefrontReady(page);

    await loadRegionForLanguageValidation(page, 'CA');
    await loadRegionForLanguageValidation(page, 'CN');
    await loadRegionForLanguageValidation(page, 'UK');
    await loadRegionForLanguageValidation(page, 'SE');
    await loadRegionForLanguageValidation(page, 'US');

    await recordUserActions(page);
    await clickAction(page, 'navigate-brand-family:ensemble');
    await clickAction(page, 'navigate-brand-family:outlet');
    await clickAction(page, 'navigate-brand-family:trail-lab');
    await clickAction(page, 'navigate-brand-family:regear');
    await clickAction(page, 'navigate-sale:spring-collection-sale');
    await scrollTo(page, '#account');
    await clickAction(page, 'navigate-utility:find-store');
    await clickAction(page, 'navigate-utility:help');
    await clickAction(page, 'navigate-header:shop');
    await clickAction(page, 'navigate-header:cart');
    await clickAction(page, 'navigate-header:account');
    await clickAction(page, 'navigate-hero:shop-new-arrivals');
    await scrollTo(page, '#sale');
    await clickAction(page, 'navigate-sale:shop-all');

    await selectAction(page, '#region-selector', 'SE');
    await validateRegionLanguage(page, 'SE');
    await selectAction(page, '#region-selector', 'US');
    await validateRegionLanguage(page, 'US');

    await clickAction(page, 'select-department:womens');
    await clickAction(page, 'select-department:mens');
    await clickAction(page, 'select-category:mens-mid-layers');
    await selectAction(page, '#product-sort', 'price-low');
    await fillField(page, '#product-search', 'fleece');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await clickFirstMatchingAction(page, 'view-product:');
    await clickFirstMatchingAction(page, 'shopping-cart:add-detail-item:');
    await clickFirstMatchingAction(page, 'close-product-detail:');
    await clickFirstMatchingAction(page, 'shopping-cart:add-item:');

    await scrollTo(page, '#sale');
    await clickFirstMatchingAction(page, 'view-sale-product:');
    await clickFirstMatchingAction(page, 'shopping-cart:add-detail-item:');
    await clickFirstMatchingAction(page, 'close-product-detail:');
    await scrollTo(page, '#sale');
    await clickFirstMatchingAction(page, 'shopping-cart:add-sale-item:');

    await scrollTo(page, '#cart');
    await page.locator('#cart input[type="number"]').first().fill('2');
    await page.keyboard.press('Tab');

    await domClickAction(page, 'shopping-cart:checkout');
    const grafanaTraceLink = await actionState(page, 'navigate-checkout:grafana');
    await clickAction(page, 'checkout-dialog:close');
    await clickFirstMatchingAction(page, 'shopping-cart:remove-item:');

    await scrollTo(page, '#account');
    const googleLoginState = await actionState(page, 'auth:google-login-start');

    await fillField(page, '#account-name', 'Synthetic Shopper');
    await fillField(page, '#account-email', 'synthetic.shopper@example.com');
    await fillField(page, '#shipping-address', '1 Synthetic Ridge');
    await fillField(page, '#shipping-city', 'Denver');
    await fillField(page, '#wallet-label', 'Visa ending 4242');
    await domClickAction(page, 'save-account');

    sleep(1);

    const actions = await page.evaluate(() => window.__k6UserActions.map(action => action.actionName));
    recordActionTotals(actions);
    if (__ENV.DEBUG_ACTIONS === '1') {
      console.log(JSON.stringify(actions));
    }
    const requiredExactActions = [
      'navigate-brand-family:ensemble',
      'navigate-brand-family:outlet',
      'navigate-brand-family:trail-lab',
      'navigate-brand-family:regear',
      'navigate-sale:spring-collection-sale',
      'navigate-utility:find-store',
      'navigate-utility:help',
      'navigate-header:shop',
      'navigate-header:cart',
      'navigate-header:account',
      'navigate-hero:shop-new-arrivals',
      'navigate-sale:shop-all',
      'select-department:womens',
      'select-department:mens',
      'select-category:mens-mid-layers',
      'sort-products:price-low',
      'search-products',
      'select-region:SE',
      'select-language:swedish',
      'select-region:US',
      'select-language:american-english',
      'shopping-cart:checkout',
      'checkout-dialog:close',
      'save-account'
    ];
    const requiredPrefixActions = [
      'view-product:',
      'shopping-cart:add-detail-item:',
      'close-product-detail:',
      'shopping-cart:add-item:',
      'view-sale-product:',
      'shopping-cart:add-sale-item:',
      'shopping-cart:change-quantity:',
      'shopping-cart:remove-item:'
    ];

    check(actions, {
      'all exact storefront actions fired': fired => requiredExactActions.every(action => fired.includes(action)),
      'all dynamic product/cart actions fired': fired => requiredPrefixActions.every(prefix => fired.some(action => action.startsWith(prefix)))
    });

    const checkoutVisible = await page.locator(byAction('shopping-cart:checkout')).isVisible();
    const accountSaveVisible = await page.locator(byAction('save-account')).isVisible();
    check({ checkoutVisible, accountSaveVisible, grafanaTraceLink, googleLoginState }, {
      'checkout remains reachable': result => result.checkoutVisible === true,
      'account save remains reachable': result => result.accountSaveVisible === true,
      'checkout Grafana trace link exists': result => result.grafanaTraceLink.exists === true && result.grafanaTraceLink.href.includes('orenlion.grafana.net'),
      'Google login action control exists': result => result.googleLoginState.exists === true && result.googleLoginState.visible === true
    });
  } catch (error) {
    check(error, {
      'scripted storefront journey completed': () => false
    });
    fail(error?.message || String(error));
  } finally {
    await page.close();
  }
}

export function handleSummary(data) {
  return summaryOutput(data, {
    testName: 'Browser action synthetic check',
    slug: 'browser-actions',
    source: 'k6-local',
    baseUrl
  });
}
