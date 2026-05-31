# Faro User Action Execution Totals

Generated: 2026-05-31T22:58:50.886Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 60419

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 3650 |
| select-language:swedish | normal | unset | 2962 |
| select-language:american-english | normal | unset | 2960 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2944 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2944 |
| sort-products:price-low | normal | unset | 2116 |
| navigate-utility:help | normal | unset | 1482 |
| navigate-brand-family:ensemble | normal | unset | 1481 |
| navigate-brand-family:outlet | normal | unset | 1481 |
| navigate-brand-family:regear | normal | unset | 1481 |
| navigate-brand-family:trail-lab | normal | unset | 1481 |
| navigate-header:shop | normal | unset | 1481 |
| navigate-hero:shop-new-arrivals | normal | unset | 1481 |
| navigate-sale:spring-collection-sale | normal | unset | 1481 |
| navigate-utility:find-store | normal | unset | 1481 |
| select-department:mens | normal | unset | 1481 |
| select-department:womens | normal | unset | 1481 |
| select-region:se | normal | unset | 1481 |
| navigate-header:account | normal | unset | 1480 |
| navigate-header:cart | normal | unset | 1480 |
| navigate-sale:shop-all | normal | unset | 1480 |
| select-region:us | normal | unset | 1480 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1474 |
| select-category:mens-mid-layers | normal | unset | 1473 |
| checkout-dialog:close | normal | unset | 1472 |
| edit-account-email | normal | unset | 1472 |
| edit-shipping-address | normal | unset | 1472 |
| save-account | critical | unset | 1472 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1472 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1472 |
| shopping-cart:checkout | critical | unset | 1472 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1472 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1472 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1472 |
| edit-account-name | normal | unset | 1471 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
