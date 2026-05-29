# Coding Replication Skill

Use this skill when recreating the Ensemble-Grafana application pattern for a future app. The goal is a demonstrable ecommerce-style platform with clear frontend behavior, service boundaries, data ownership, security, and testability.

## Application Shape

Use a frontend plus microservice backend:

- JavaScript/React frontend.
- Spring Boot `inventory-service`.
- Spring Boot `cart-service`.
- Spring Boot `account-service`.
- Postgres for inventory/catalog data.
- DynamoDB for shopper state.
- Static assets and product images served through CloudFront.
- `/api/*` routed separately from static assets.

## Frontend Patterns

Build the actual app as the first screen:

- Product categories.
- Top-level departments such as men's and women's.
- Product cards with image, category, price, original price, discount percent, and add button.
- Product detail view.
- Sale section linked from top banner.
- Cart with add, remove, quantity change, subtotal, original subtotal, discount line, and checkout button.
- Account form with profile, shipping address, and wallet metadata.
- Region selector with flags and values such as US, Canada, UK.

Implementation guidance:

- Store local demo cart/account state in local storage.
- Keep API wrappers in a small `api.js`.
- Keep seed data in a structured `data.js`.
- Avoid hard-coded string parsing when structured data is available.
- Add `data-faro-user-action-name` to user-action controls.
- Use accessible labels on buttons, selects, and inputs.
- Test for broken images.

## Frontend Observability Hooks

Every meaningful button or control should be traceable:

- Navigation links.
- Region selector.
- Department/category tabs.
- Search and sort controls.
- Product image/detail open.
- Detail close.
- Add from product grid.
- Add from detail view.
- Add from sale grid.
- Cart quantity change.
- Cart remove.
- Checkout.
- Account save.

Use stable, machine-readable action names:

```text
select-region:US
select-category:mens-mid-layers
shopping-cart:add-item:mens-midlayer-grid
shopping-cart:remove-item:mens-midlayer-grid
shopping-cart:checkout
save-account
```

## Backend Service Boundaries

### `inventory-service`

Owns:

- Categories.
- Product details.
- Images.
- Stock.
- Pricing.
- Sale metadata.

Stores durable catalog data in Postgres.

### `cart-service`

Owns:

- Cart state.
- Cart item updates.
- Checkout preparation.
- Idempotency records where needed.

Stores shopper cart state in DynamoDB.

### `account-service`

Owns:

- Profile.
- Shipping addresses.
- Wallet metadata.
- Auth-linked account state.

Stores account state in DynamoDB.

Wallet rule:

- Store payment metadata only.
- Do not implement real payment processing in the base pattern.

## Spring Boot Baseline

For each service:

- Use Maven.
- Include actuator.
- Expose Prometheus metrics.
- Configure CORS for frontend/API route needs.
- Support API key auth for automation/test clients where appropriate.
- Make log level configurable.
- Include Dockerfile.
- Keep service-specific package names and ownership clear.

Recommended endpoints:

- `GET /api/inventory/categories`
- `GET /api/inventory/products`
- `PUT /api/cart/carts/{shopperId}`
- `PUT /api/account/accounts/{shopperId}`

## Data Modeling

Product model should support:

- `id`
- `name`
- `department`
- `category`
- `price`
- `originalPrice`
- `discountPercent` or calculated equivalent
- `colors`
- `sizes`
- `image`
- `stock`
- `rating`
- `badge`

Cart item should preserve:

- Product ID.
- Display name.
- Original price.
- Discounted price.
- Size/color.
- Quantity.
- Image.

Account should include:

- Shopper ID.
- Name.
- Email.
- Shipping address.
- Wallet metadata label and billing postal code.

## Testing Patterns

Include:

- Frontend build test.
- Playwright browser regression test after each frontend UI or behavior change.
- Broken image test using browser/devtools automation.
- k6 API test.
- k6 browser action synthetic test.
- k6 regional and spike tests for Cloud.
- Security predeploy script.

Playwright test expectations:

- Run `cd frontend && npm run test:e2e` after each frontend change.
- Verify every visible button has `data-faro-user-action-name`.
- Verify Faro action payloads are emitted for cart add/remove/quantity/checkout, product detail, sale add, region/language changes, Google login, and account save.
- Verify the cart delete icon removes the item and the cart returns to empty state.
- Verify Google login starts the Cognito Hosted UI flow without reaching the real provider in tests.
- Verify region and language changes for US, Canada, China, and UK, including British English retail terms such as `Basket` and `Trousers`.
- Verify no storefront images are broken.
- Verify desktop and mobile screenshot baselines unless the layout change intentionally updates them.

Browser action test expectations:

- It should click through real controls.
- It should assert required action names fired.
- It should include checkout and add/remove cart flows.
- It should fail clearly when required actions are missing.
- Run it after every frontend deployment against the deployed URL once CloudFront invalidation or cache refresh completes: `BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js`.

## Security And Config

Include:

- `.env.example` files.
- Secret example manifests.
- Real secrets ignored by git.
- API key protection for write APIs.
- CORS scoped to expected headers and origins.
- WAF and HTTPS expectations documented.

Never commit:

- Real API keys.
- Grafana tokens.
- Google client secrets.
- Terraform state files for shared repos.
- Private probe tokens.

## Documentation Requirements

When coding changes affect infrastructure, observability, API flow, or user-visible behavior:

- Update `README.md`.
- Update `DIAGRAMS.md` if request, network, telemetry, or dependency flow changes.
- Add run commands and validation status.

## Validation Checklist

- Frontend builds.
- Playwright e2e tests pass after frontend changes: `cd frontend && npm run test:e2e`.
- k6 browser-action validation passes after each frontend deployment: `BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js`.
- Local app can load categories/products.
- Cart add/remove/checkout path works.
- Account save path works.
- Discounts display original price, sale price, and percent off.
- Region selector changes visible locale/region behavior.
- Faro user context and action names are configured.
- Backend service endpoints expose metrics.
- k6 scripts inspect cleanly.
- README and diagrams match the current system.
