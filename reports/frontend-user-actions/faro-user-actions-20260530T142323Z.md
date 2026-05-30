# Faro Frontend User Action Metrics

Generated: 2026-05-30T14:23:23.396Z
Source: `gcx logs query -d grafanacloud-logs '{kind="event", app_id="464"} |~ "event_name=(ensemble|faro)\\.user\\.action"' --since 30m --limit 0 -o json`
Window: last 30m at generation time
Observed event timestamps: 2026-05-30T13:57:07.569Z to 2026-05-30T14:21:39.834Z

## Summary

- Total user-action log events: 100
- Event types: faro.user.action=54, ensemble.user.action=46
- Required post-frontend-change actions missing: none
- k6 browser validation traffic present: yes

## Counts By Action

| action | count |
|---|---:|
| search-products | 12 |
| close-product-detail:mens-midlayer-grid | 8 |
| shopping-cart:add-detail-item:mens-midlayer-grid | 8 |
| edit-account-name | 6 |
| checkout-dialog:close | 4 |
| edit-account-email | 4 |
| edit-shipping-address | 4 |
| save-account | 4 |
| select-category:mens-mid-layers | 4 |
| shopping-cart:add-item:mens-midlayer-grid | 4 |
| shopping-cart:add-sale-item:mens-midlayer-grid | 4 |
| shopping-cart:change-quantity:mens-midlayer-grid | 4 |
| shopping-cart:checkout | 4 |
| shopping-cart:remove-item:mens-midlayer-grid | 4 |
| sort-products:price-low | 4 |
| view-product:product-grid-mens-midlayer-grid | 4 |
| view-product:sale-grid-mens-midlayer-grid | 4 |
| select-language:american-english | 3 |
| select-language:swedish | 3 |
| select-department:mens | 2 |
| select-department:womens | 2 |
| select-region:se | 2 |
| select-region:us | 2 |

## Counts By Region

| region | count |
|---|---:|
| US | 75 |
| (missing) | 20 |
| SE | 5 |

## Counts By Locale

| locale | count |
|---|---:|
| en-US | 75 |
| (missing) | 20 |
| sv-SE | 5 |

## Faro User Action Duration

Durations are reported by Faro in milliseconds.

| action | samples | avg_ms | max_ms |
|---|---:|---:|---:|
| search-products | 8 | 6.30 | 9.50 |
| close-product-detail:mens-midlayer-grid | 4 | 7.90 | 8.20 |
| edit-account-name | 4 | 4.55 | 7.50 |
| shopping-cart:add-detail-item:mens-midlayer-grid | 4 | 7.20 | 8.20 |
| checkout-dialog:close | 2 | 8.45 | 8.70 |
| edit-account-email | 2 | 0.40 | 0.40 |
| edit-shipping-address | 2 | 0.35 | 0.40 |
| save-account | 2 | 0.95 | 1.00 |
| select-category:mens-mid-layers | 2 | 2.15 | 2.50 |
| select-language:american-english | 2 | 1.95 | 2.00 |
| select-language:swedish | 2 | 3.80 | 3.90 |
| shopping-cart:add-item:mens-midlayer-grid | 2 | 7.60 | 7.90 |
| shopping-cart:add-sale-item:mens-midlayer-grid | 2 | 8.10 | 8.60 |
| shopping-cart:change-quantity:mens-midlayer-grid | 2 | 7.15 | 12.30 |
| shopping-cart:checkout | 2 | 0.65 | 0.70 |
| shopping-cart:remove-item:mens-midlayer-grid | 2 | 5.40 | 6.80 |
| sort-products:price-low | 2 | 3.20 | 3.80 |
| view-product:product-grid-mens-midlayer-grid | 2 | 7.70 | 7.80 |
| view-product:sale-grid-mens-midlayer-grid | 2 | 7.50 | 7.90 |
| select-department:mens | 1 | 8.40 | 8.40 |
| select-department:womens | 1 | 5.30 | 5.30 |
| select-region:se | 1 | 0.30 | 0.30 |
| select-region:us | 1 | 0.10 | 0.10 |
