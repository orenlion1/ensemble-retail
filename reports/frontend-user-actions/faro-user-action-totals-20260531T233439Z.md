# Faro User Action Execution Totals

Generated: 2026-05-31T23:34:39.662Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 60493

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 3654 |
| select-language:swedish | normal | unset | 2967 |
| select-language:american-english | normal | unset | 2964 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2946 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2946 |
| sort-products:price-low | normal | unset | 2117 |
| select-department:womens | normal | unset | 1484 |
| navigate-utility:help | normal | unset | 1483 |
| select-department:mens | normal | unset | 1483 |
| select-region:se | normal | unset | 1483 |
| navigate-brand-family:ensemble | normal | unset | 1482 |
| navigate-brand-family:outlet | normal | unset | 1482 |
| navigate-brand-family:regear | normal | unset | 1482 |
| navigate-brand-family:trail-lab | normal | unset | 1482 |
| navigate-header:shop | normal | unset | 1482 |
| navigate-hero:shop-new-arrivals | normal | unset | 1482 |
| navigate-sale:spring-collection-sale | normal | unset | 1482 |
| navigate-utility:find-store | normal | unset | 1482 |
| select-region:us | normal | unset | 1482 |
| navigate-header:account | normal | unset | 1481 |
| navigate-header:cart | normal | unset | 1481 |
| navigate-sale:shop-all | normal | unset | 1481 |
| select-category:mens-mid-layers | normal | unset | 1476 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1475 |
| checkout-dialog:close | normal | unset | 1473 |
| edit-account-email | normal | unset | 1473 |
| edit-shipping-address | normal | unset | 1473 |
| save-account | critical | unset | 1473 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1473 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1473 |
| shopping-cart:checkout | critical | unset | 1473 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1473 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1473 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1473 |
| edit-account-name | normal | unset | 1472 |
| select-language:british-english | normal | unset | 4 |
| select-language:mandarin | normal | unset | 4 |
| select-category:mens-all | normal | unset | 2 |
| select-category:mens-packs | normal | unset | 2 |
| select-category:mens-pants | normal | unset | 2 |
| select-category:mens-shells | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-region:cn | normal | unset | 2 |
| select-region:uk | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-category:womens-accessories | normal | unset | 1 |
| select-category:womens-all | normal | unset | 1 |
| select-category:womens-base-layers | normal | unset | 1 |
| select-category:womens-pants | normal | unset | 1 |
| select-category:womens-shells | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
