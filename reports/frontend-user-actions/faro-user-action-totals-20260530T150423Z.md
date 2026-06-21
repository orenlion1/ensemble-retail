# Faro User Action Execution Totals

Generated: 2026-05-30T15:04:23.719Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 295

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 23 |
| select-language:american-english | normal | unset | 20 |
| select-language:french | normal | unset | 19 |
| close-product-detail:mens-midlayer-grid | normal | unset | 14 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 14 |
| shopping-cart:checkout | critical | unset | 11 |
| edit-account-name | normal | unset | 10 |
| select-category:mens-mid-layers | normal | unset | 10 |
| select-department:mens | normal | unset | 10 |
| select-department:womens | normal | unset | 10 |
| select-region:us | normal | unset | 10 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 10 |
| checkout-dialog:close | normal | unset | 9 |
| sort-products:price-low | normal | unset | 9 |
| select-language:british-english | normal | unset | 8 |
| select-language:mandarin | normal | unset | 8 |
| shopping-cart:checkout | normal | unset | 8 |
| edit-account-email | normal | unset | 7 |
| edit-shipping-address | normal | unset | 7 |
| save-account | critical | unset | 7 |
| select-region:ca | normal | unset | 7 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 7 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 7 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 7 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 7 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 7 |
| select-language:swedish | normal | unset | 6 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 6 |
| select-region:cn | normal | unset | 4 |
| select-region:uk | normal | unset | 4 |
| select-region:se | normal | unset | 3 |
| navigate-header:cart | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| navigate-checkout:grafana | normal | unset | 1 |
| shopping-cart:remove-item:womens-rain-cap | normal | unset | 1 |
