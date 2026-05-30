import { expect, test as base } from '@playwright/test';

const test = base.extend({
  faroBodies: async ({ page }, use) => {
    const bodies = [];
    await page.route(/(faro-collector-prod-us-east-3\.grafana\.net|127\.0\.0\.1:5173\/faro-test)/, async route => {
      bodies.push(route.request().postData() || '');
      await route.fulfill({
        status: 202,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': 'POST, OPTIONS'
        },
        contentType: 'application/json',
        body: '{}'
      });
    });
    await use(bodies);
  }
});

const actionNames = {
  viewProduct: 'view-product:mens-shell-alpha',
  addProduct: 'shopping-cart:add-item:mens-shell-alpha',
  addDetailProduct: 'shopping-cart:add-detail-item:mens-shell-alpha',
  closeProductDetail: 'close-product-detail:mens-shell-alpha',
  changeQuantity: 'shopping-cart:change-quantity:mens-shell-alpha',
  removeProduct: 'shopping-cart:remove-item:mens-shell-alpha',
  checkout: 'shopping-cart:checkout',
  googleLoginStart: 'auth:google-login-start',
  saveAccount: 'save-account'
};

test.describe('storefront browser behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://ensemble-grafana.auth.us-east-1.amazoncognito.com/oauth2/authorize**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Mock Google Login</title><h1>Mock Google Login</h1>'
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Layered systems|Layering systems/i })).toBeVisible();
  });

  test('every visible button exposes a Faro action name', async ({ page }) => {
    const missing = await page.locator('button:visible').evaluateAll(buttons => buttons
      .filter(button => !button.getAttribute('data-faro-user-action-name'))
      .map(button => button.textContent?.trim() || button.getAttribute('aria-label') || button.outerHTML));

    expect(missing).toEqual([]);
  });

  test('cart controls work and key actions are instrumented', async ({ page, faroBodies }) => {
    const shellCard = page.locator('.productCard', { has: page.getByRole('heading', { name: "Men's Alpine Shell Jacket" }) });
    await expectActionAttribute(shellCard.getByRole('button', { name: "View Men's Alpine Shell Jacket" }), actionNames.viewProduct);
    await expectActionAttribute(shellCard.getByRole('button', { name: 'Add' }), actionNames.addProduct);

    await shellCard.getByRole('button', { name: 'Add' }).click();
    await expectFaroAction(faroBodies, actionNames.addProduct);
    await expect(page.getByRole('link', { name: /Cart \(1\)/ })).toBeVisible();
    await page.getByRole('link', { name: /Cart \(1\)/ }).click();

    const quantity = page.getByRole('spinbutton', { name: /Quantity for Men's Alpine Shell Jacket/ });
    await expectActionAttribute(quantity, actionNames.changeQuantity);
    await quantity.fill('2');
    await expectFaroAction(faroBodies, actionNames.changeQuantity);
    await expect(page.locator('.checkout.totalLine strong')).toHaveText('$680');

    const checkout = page.getByRole('button', { name: 'Mock checkout' });
    await expectActionAttribute(checkout, actionNames.checkout);
    await checkout.click();
    await expectFaroAction(faroBodies, actionNames.checkout);
    const checkoutDialog = page.getByRole('dialog', { name: 'Grafana trace ready' });
    await expect(checkoutDialog).toBeVisible();
    await expect(checkoutDialog.getByRole('img', { name: 'Grafana logo' })).toBeVisible();
    const grafanaLink = checkoutDialog.getByRole('link', { name: 'Grafana' });
    await expect(grafanaLink).toHaveAttribute('href', 'https://orenlion.grafana.net/a/grafana-kowalski-app/apps/464/actions?var-Filters=');
    await expectActionAttribute(grafanaLink, 'navigate-checkout:grafana');
    const closeCheckoutDialog = checkoutDialog.getByRole('button', { name: 'Close' });
    await expectActionAttribute(closeCheckoutDialog, 'checkout-dialog:close');
    await closeCheckoutDialog.click();
    await expectFaroAction(faroBodies, 'checkout-dialog:close');
    await expect(checkoutDialog).toHaveCount(0);

    const remove = page.getByRole('button', { name: /Remove Men's Alpine Shell Jacket from cart/ });
    await expectActionAttribute(remove, actionNames.removeProduct);
    await remove.click();
    await expectFaroAction(faroBodies, actionNames.removeProduct);
    await expect(page.getByText('Your cart is empty.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Cart \(0\)/ })).toBeVisible();
  });

  test('product detail and sale actions are instrumented', async ({ page, faroBodies }) => {
    await page.getByRole('button', { name: "View Men's Alpine Shell Jacket" }).click();
    await expectFaroAction(faroBodies, 'view-product:product-grid-mens-shell-alpha');
    await expect(page.locator('.detail')).toBeVisible();

    const detailAdd = page.getByRole('button', { name: 'Add selected default' });
    await expectActionAttribute(detailAdd, actionNames.addDetailProduct);
    await detailAdd.click();
    await expectFaroAction(faroBodies, actionNames.addDetailProduct);

    const close = page.getByRole('button', { name: 'Close' });
    await expectActionAttribute(close, actionNames.closeProductDetail);
    await close.click();
    await expectFaroAction(faroBodies, actionNames.closeProductDetail);
    await expect(page.locator('.detail')).toHaveCount(0);

    await page.getByRole('link', { name: 'Spring Collection Sale' }).click();
    await expect(page.locator('#sale')).toBeInViewport();
    const saleAdd = page.locator('#sale button[data-faro-user-action-name^="shopping-cart:add-sale-item:"]').first();
    await expect(saleAdd).toBeVisible();
    const saleActionName = await saleAdd.getAttribute('data-faro-user-action-name');
    await saleAdd.click();
    await expectFaroAction(faroBodies, saleActionName);
  });

  test('Google login button starts the hosted UI flow', async ({ page, faroBodies }) => {
    await page.getByRole('link', { name: 'Account' }).click();
    const login = page.getByRole('button', { name: 'Sign in with Google' });
    await expect(login).toBeEnabled();
    await expectActionAttribute(login, actionNames.googleLoginStart);
    await login.click();
    await expectFaroAction(faroBodies, actionNames.googleLoginStart);
    await expect(page).toHaveURL(/ensemble-grafana\.auth\.us-east-1\.amazoncognito\.com\/oauth2\/authorize/);
    await expect(page.getByRole('heading', { name: 'Mock Google Login' })).toBeVisible();
  });

  test('region and language picker updates visible locale and terms', async ({ page, faroBodies }) => {
    const regionPicker = page.getByLabel('Region selector');
    await expect(regionPicker).toHaveAttribute('data-faro-user-action-name', 'open-region-selector');

    await regionPicker.selectOption('CA');
    await expectFaroAction(faroBodies, 'select-region:ca');
    await expectFaroAction(faroBodies, 'select-language:french');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CA');
    await expect(page.getByRole('button', { name: 'Hommes' })).toBeVisible();

    await page.getByLabel('Sélecteur de région').selectOption('CN');
    await expectFaroAction(faroBodies, 'select-region:cn');
    await expectFaroAction(faroBodies, 'select-language:mandarin');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.getByRole('button', { name: '男士', exact: true })).toBeVisible();

    await page.getByLabel('地区选择器').selectOption('UK');
    await expectFaroAction(faroBodies, 'select-region:uk');
    await expectFaroAction(faroBodies, 'select-language:british-english');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.getByRole('link', { name: /Basket \(0\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trousers', exact: true })).toBeVisible();
  });

  test('account save is instrumented', async ({ page, faroBodies }) => {
    await page.getByRole('link', { name: 'Account' }).click();
    const save = page.getByRole('button', { name: 'Save account' });
    await expectActionAttribute(save, actionNames.saveAccount);
    await save.click();
    await expectFaroAction(faroBodies, actionNames.saveAccount);
  });

  test('no storefront images are broken', async ({ page }) => {
    await expect(page.locator('img')).not.toHaveCount(0);
    await page.waitForFunction(() => Array.from(document.images).every(image => image.complete));
    const brokenImages = await page.locator('img').evaluateAll(images => images
      .filter(image => !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0)
      .map(image => image.getAttribute('src') || image.getAttribute('alt') || 'unknown image'));

    expect(brokenImages).toEqual([]);
  });

  test('desktop and mobile layouts remain screenshot-stable', async ({ page }, testInfo) => {
    await page.addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
    });
    await expect(page).toHaveScreenshot(`storefront-${testInfo.project.name}.png`, {
      animations: 'disabled'
    });
  });
});

async function expectActionAttribute(locator, actionName) {
  await expect(locator).toHaveAttribute('data-faro-user-action-name', actionName);
}

async function expectFaroAction(faroBodies, actionName) {
  await expect.poll(() => faroBodies.join('\n')).toContain(actionName);
}
