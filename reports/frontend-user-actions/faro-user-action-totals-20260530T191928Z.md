# Faro User Action Execution Totals

Generated: 2026-05-30T19:19:28.677Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 324

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 29 |
| close-product-detail:mens-midlayer-grid | normal | unset | 18 |
| select-language:american-english | normal | unset | 18 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 18 |
| select-language:swedish | normal | unset | 14 |
| shopping-cart:checkout | critical | unset | 14 |
| checkout-dialog:close | normal | unset | 13 |
| edit-account-name | normal | unset | 12 |
| sort-products:price-low | normal | unset | 12 |
| select-language:french | normal | unset | 11 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 11 |
| edit-account-email | normal | unset | 9 |
| edit-shipping-address | normal | unset | 9 |
| save-account | critical | unset | 9 |
| select-category:mens-mid-layers | normal | unset | 9 |
| select-department:mens | normal | unset | 9 |
| select-department:womens | normal | unset | 9 |
| select-region:us | normal | unset | 9 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 9 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 9 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 9 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 9 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 9 |
| select-region:se | normal | unset | 7 |
| select-language:british-english | normal | unset | 6 |
| select-language:mandarin | normal | unset | 6 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 6 |
| select-region:ca | normal | unset | 4 |
| shopping-cart:checkout | normal | unset | 4 |
| select-region:cn | normal | unset | 3 |
| select-region:uk | normal | unset | 3 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| navigate-checkout:grafana | normal | unset | 1 |
| navigate-header:cart | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:remove-item:womens-rain-cap | normal | unset | 1 |
