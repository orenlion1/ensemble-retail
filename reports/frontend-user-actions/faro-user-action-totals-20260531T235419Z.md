# Faro User Action Execution Totals

Generated: 2026-05-31T23:54:19.716Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 59217

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 3442 |
| select-language:swedish | normal | unset | 2909 |
| select-language:american-english | normal | unset | 2906 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2888 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2888 |
| sort-products:price-low | normal | unset | 2126 |
| select-department:womens | normal | unset | 1455 |
| navigate-utility:help | normal | unset | 1454 |
| select-department:mens | normal | unset | 1454 |
| select-region:se | normal | unset | 1454 |
| navigate-brand-family:ensemble | normal | unset | 1453 |
| navigate-brand-family:outlet | normal | unset | 1453 |
| navigate-brand-family:regear | normal | unset | 1453 |
| navigate-brand-family:trail-lab | normal | unset | 1453 |
| navigate-header:shop | normal | unset | 1453 |
| navigate-hero:shop-new-arrivals | normal | unset | 1453 |
| navigate-sale:spring-collection-sale | normal | unset | 1453 |
| navigate-utility:find-store | normal | unset | 1453 |
| select-region:us | normal | unset | 1453 |
| navigate-header:account | normal | unset | 1452 |
| navigate-header:cart | normal | unset | 1452 |
| navigate-sale:shop-all | normal | unset | 1452 |
| select-category:mens-mid-layers | normal | unset | 1447 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1446 |
| checkout-dialog:close | normal | unset | 1444 |
| edit-account-email | normal | unset | 1444 |
| edit-shipping-address | normal | unset | 1444 |
| save-account | critical | unset | 1444 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1444 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1444 |
| shopping-cart:checkout | critical | unset | 1444 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1444 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1444 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1444 |
| edit-account-name | normal | unset | 1443 |
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
