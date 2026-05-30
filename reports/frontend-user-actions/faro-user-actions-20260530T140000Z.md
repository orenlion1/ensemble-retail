# Faro Frontend User Action Metrics

Generated: 2026-05-30T14:00:00Z
Source: `gcx logs query -d grafanacloud-logs '{kind="event", app_id="464"} |~ "event_name=(ensemble|faro)\\.user\\.action"' --since 2h --limit 0 -o json`
Window: last 2h at generation time
Observed event timestamps: 2026-05-30T13:38:45.981Z to 2026-05-30T13:57:08.86Z

## Summary

- Total user-action log events: 100
- Event types: faro.user.action=55, ensemble.user.action=45
- Required post-frontend-change actions missing: none
- k6 browser validation traffic present: yes

## Counts By Action

| action | count |
|---|---:|
| checkout-dialog:close | 8 |
| edit-account-name | 6 |
| search-products | 6 |
| select-language:american-english | 6 |
| shopping-cart:checkout | 6 |
| close-product-detail:mens-midlayer-grid | 4 |
| edit-account-email | 4 |
| edit-shipping-address | 4 |
| save-account | 4 |
| select-region:us | 4 |
| shopping-cart:add-detail-item:mens-midlayer-grid | 4 |
| shopping-cart:change-quantity:mens-midlayer-grid | 4 |
| shopping-cart:remove-item:mens-midlayer-grid | 4 |
| select-language:british-english | 3 |
| select-language:mandarin | 3 |
| select-language:swedish | 3 |
| auth:google-login-complete | 2 |
| auth:google-login-start | 2 |
| select-category:mens-mid-layers | 2 |
| select-department:mens | 2 |
| select-department:womens | 2 |
| select-region:cn | 2 |
| select-region:se | 2 |
| select-region:uk | 2 |
| shopping-cart:add-item:mens-midlayer-grid | 2 |
| shopping-cart:add-sale-item:mens-midlayer-grid | 2 |
| sort-products:price-low | 2 |
| view-product:product-grid-mens-midlayer-grid | 2 |
| view-product:sale-grid-mens-midlayer-grid | 2 |
| select-language:french | 1 |

## Counts By Region

| region | count |
|---|---:|
| US | 69 |
| (missing) | 15 |
| CN | 5 |
| SE | 5 |
| UK | 5 |
| CA | 1 |

## Counts By Locale

| locale | count |
|---|---:|
| en-US | 69 |
| (missing) | 15 |
| en-GB | 5 |
| sv-SE | 5 |
| zh-CN | 5 |
| fr-CA | 1 |

## Faro User Action Duration

Durations are reported by Faro in milliseconds.

| action | samples | avg_ms | max_ms |
|---|---:|---:|---:|
| checkout-dialog:close | 4 | 35.65 | 114.70 |
| edit-account-name | 4 | 5.00 | 7.10 |
| search-products | 4 | 6.30 | 9.50 |
| select-language:american-english | 4 | 5.70 | 6.20 |
| shopping-cart:checkout | 3 | 39.77 | 116.80 |
| close-product-detail:mens-midlayer-grid | 2 | 7.65 | 8.20 |
| edit-account-email | 2 | 0.35 | 0.40 |
| edit-shipping-address | 2 | 0.30 | 0.30 |
| save-account | 2 | 0.85 | 1.00 |
| select-language:british-english | 2 | 5.65 | 5.70 |
| select-language:mandarin | 2 | 19.60 | 19.60 |
| select-language:swedish | 2 | 2.80 | 3.00 |
| select-region:us | 2 | 0.20 | 0.20 |
| shopping-cart:add-detail-item:mens-midlayer-grid | 2 | 6.80 | 8.20 |
| shopping-cart:change-quantity:mens-midlayer-grid | 2 | 7.50 | 12.30 |
| shopping-cart:remove-item:mens-midlayer-grid | 2 | 4.15 | 4.30 |
| auth:google-login-complete | 1 | 3.10 | 3.10 |
| auth:google-login-start | 1 | 115.50 | 115.50 |
| select-category:mens-mid-layers | 1 | 2.50 | 2.50 |
| select-department:mens | 1 | 8.30 | 8.30 |
| select-department:womens | 1 | 8.60 | 8.60 |
| select-language:french | 1 | 5.40 | 5.40 |
| select-region:cn | 1 | 0.20 | 0.20 |
| select-region:se | 1 | 0.20 | 0.20 |
| select-region:uk | 1 | 0.10 | 0.10 |
| shopping-cart:add-item:mens-midlayer-grid | 1 | 7.30 | 7.30 |
| shopping-cart:add-sale-item:mens-midlayer-grid | 1 | 8.60 | 8.60 |
| sort-products:price-low | 1 | 2.60 | 2.60 |
| view-product:product-grid-mens-midlayer-grid | 1 | 7.80 | 7.80 |
| view-product:sale-grid-mens-midlayer-grid | 1 | 7.10 | 7.10 |
