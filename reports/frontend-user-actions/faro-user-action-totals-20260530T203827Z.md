# Faro User Action Execution Totals

Generated: 2026-05-30T20:38:27.731Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 19816

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 1695 |
| select-language:swedish | normal | unset | 1436 |
| select-language:american-english | normal | unset | 1426 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1363 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1355 |
| sort-products:price-low | normal | unset | 897 |
| select-region:se | normal | unset | 718 |
| select-region:us | normal | unset | 713 |
| select-department:womens | normal | unset | 711 |
| select-department:mens | normal | unset | 704 |
| select-category:mens-mid-layers | normal | unset | 700 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 689 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 680 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 677 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 675 |
| shopping-cart:checkout | critical | unset | 673 |
| checkout-dialog:close | normal | unset | 672 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 672 |
| edit-account-name | normal | unset | 671 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 669 |
| edit-account-email | normal | unset | 665 |
| edit-shipping-address | normal | unset | 665 |
| save-account | critical | unset | 663 |
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
