---
name: add-region-localization
description: Add or update an Ensemble-Grafana storefront region, language, locale, and localized catalog copy. Use when a user asks to add a region such as Sweden, Germany, EU, or Japan; change region picker behavior; add page localization; update Faro region/language actions; or extend Playwright/k6 validation for a new storefront locale.
---

# Add Region Localization

## Inputs

Collect or infer these values before editing:

- Region code, such as `SE`.
- Region label, such as `Sweden`.
- Flag icon, such as `🇸🇪`.
- BCP 47 locale, such as `sv-SE`.
- Language display name, such as `Swedish`.
- Copy key, such as `sv`.
- Target language vocabulary requirements, such as British English `Trousers` instead of `Pants`.

Use ISO-style storefront codes when possible. Keep pricing, currency, tax, shipping, and inventory behavior unchanged unless the user explicitly asks for business-rule changes.

## Frontend Workflow

Update `frontend/src/App.jsx`:

- Add the new region to `regions` with `code`, `label`, `flag`, `locale`, `language`, and `copyKey`.
- Add a complete `copy.<copyKey>` block covering every existing UI string and function.
- Add `localizedCatalog.<copyKey>` for category labels, badges, colors, and product names.
- Confirm `document.documentElement.lang` updates to the new locale through existing region state.
- Confirm `changeRegion` emits:
  - `select-region:<code-lowercase>`
  - `select-language:<language-slug>`
  - Faro attributes `region`, `locale`, and `language`.
- Avoid changing product images or catalog inventory unless requested.

When translated labels are materially longer or shorter, stabilize layout in `frontend/src/styles.css` with fixed or minimum dimensions for header controls, tabs, product cards, and hero sections. Do this to keep screenshot baselines and k6 CLS thresholds meaningful.

## Test Coverage

Update `frontend/tests/e2e/storefront-actions.spec.js`:

- Extend the region/language picker test to select the new region.
- Assert `html lang` equals the new locale.
- Assert localized visible UI appears, such as cart/account/category labels.
- Assert Faro payloads include `select-region:<code-lowercase>` and `select-language:<language-slug>`.
- Add a vocabulary assertion when the region has known regional terminology.

Regenerate screenshot baselines only after reviewing layout impact:

```sh
cd frontend
npm run test:e2e -- --update-snapshots
```

## k6 Coverage

Update `load-tests/synthetic-browser-actions.js`:

- Add the region to `regionLanguageExpectations`.
- Add its language slug to the synthetic action recorder.
- Validate the region and language mapping.
- Require the new `select-region` and `select-language` actions when the test explicitly changes to the new region.
- Use reload-based language validation when cycling through full-page translations so intentional content replacement does not inflate CLS.

Update regional load scripts:

- `load-tests/grafana-cloud-20-user-regional.js`
- `load-tests/grafana-cloud-traffic-spikes.js`

Add the region to the rotation and request metadata headers/tags:

- `X-Region`
- `X-Locale`
- `X-Language`
- region, locale, and language tags.

## Documentation

Update:

- `README.md` region/language mapping and frontend validation instructions.
- `AGENTS.md` if the required validation region list changes.
- `skills/coding/SKILLS.md` validation expectations.
- This skill if the new region exposed a reusable localization lesson.
- `skills/observability/incident-placeholder-template/SKILL.md` only if the placeholder incident template itself changes.

Do not update `DIAGRAMS.md` for copy-only region additions because architecture, request flow, network boundaries, and telemetry flow are unchanged. If the change adds new services, identity providers, data stores, or routing, update diagrams and regenerate `docs/diagrams/` PNGs.

## Monthly Placeholder Incidents

For every new region, create monthly Grafana IRM placeholder incident review records before pushing incidents to Grafana. Use `skills/observability/incident-placeholder-template/SKILL.md`.

Generate one placeholder incident per month:

- Start with January 1, 2025.
- Continue up to and including the current month. Use the actual current date to determine the ending month. For example, on May 30, 2026, include January 2025 through May 2026.
- Use the first calendar day of each month as the unique incident date unless the user requests a different monthly date pattern.
- Start time: `{DATE} 00:01 EDT`.
- End time: `{DATE} 00:02 EDT`.
- Replace `region:{region}` with the new region in the request, such as `region:Sweden`, `region:SE`, or the exact region label/value the user asks to use in IRM.
- Keep the placeholder labels from the template:
  - `client_impact:multiple-clients`
  - `impact_type:availablity`

Create a review file first, such as:

```text
reports/irm-placeholders/<region>-monthly-placeholders-<yyyymmdd>.json
```

The review file must include title, description, resolution summary, severity, start time, end time, and labels for each month. Do not push placeholder incidents to Grafana until the user approves the review file or explicitly asks to push them.

## Validation

Run before deploy:

```sh
cd frontend && npm run build
cd frontend && npm run test:e2e
k6 inspect load-tests/synthetic-browser-actions.js
k6 inspect load-tests/grafana-cloud-20-user-regional.js
k6 inspect load-tests/grafana-cloud-traffic-spikes.js
BASE_URL=http://localhost:5173 k6 run load-tests/synthetic-browser-actions.js
```

Deploy frontend changes through the existing S3/CloudFront path, wait for invalidation, then run:

```sh
BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js
```

After the production k6 browser action test, run a `gcx` Faro user-action query and create a report under `reports/frontend-user-actions/`:

```sh
gcx logs query -d grafanacloud-logs '{kind="event", app_id="464"} |~ "event_name=(ensemble|faro)\\.user\\.action"' --since 2h --limit 0 -o json
```

The report must include:

- Total user-action events.
- Counts by action.
- Counts by region and locale.
- Faro user-action durations when present.
- Missing required post-change actions, if any.

## Review Checklist

- New region appears in the selector with flag and label.
- Localized UI copy covers all keys without falling back unexpectedly.
- Localized catalog covers product names, categories, badges, and colors.
- Document language uses the new BCP 47 locale.
- Faro actions and attributes include the new region and language.
- Playwright and k6 cover the new region.
- k6 browser action checks pass locally and in production after deployment.
- gcx Faro user-action report shows the new region action events.
- Monthly placeholder incident review file exists for the new region, covering January 2025 through the current month.
- README, AGENTS, and coding skill expectations are in sync.
