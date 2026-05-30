# Faro User Action Execution Totals

Generated: 2026-05-30T20:18:25.745Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 9995

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 916 |
| select-language:swedish | normal | unset | 728 |
| select-language:american-english | normal | unset | 720 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 680 |
| close-product-detail:mens-midlayer-grid | normal | unset | 678 |
| sort-products:price-low | normal | unset | 414 |
| select-region:se | normal | unset | 364 |
| select-region:us | normal | unset | 360 |
| select-department:womens | normal | unset | 359 |
| select-department:mens | normal | unset | 353 |
| select-category:mens-mid-layers | normal | unset | 349 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 344 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 339 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 339 |
| edit-account-name | normal | unset | 338 |
| shopping-cart:checkout | critical | unset | 338 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 338 |
| checkout-dialog:close | normal | unset | 337 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 337 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 335 |
| edit-account-email | normal | unset | 334 |
| edit-shipping-address | normal | unset | 334 |
| save-account | critical | unset | 334 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 6 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 3 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| navigate-checkout:grafana | normal | unset | 1 |
| navigate-header:cart | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:checkout | normal | unset | 1 |
| shopping-cart:remove-item:womens-rain-cap | normal | unset | 1 |
| view-product:product-grid-mens-shell-alpha | normal | unset | 1 |
