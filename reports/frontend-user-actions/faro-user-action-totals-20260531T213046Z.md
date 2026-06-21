# Faro User Action Execution Totals

Generated: 2026-05-31T21:30:46.030Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 40679

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2523 |
| select-language:swedish | normal | unset | 1994 |
| select-language:american-english | normal | unset | 1992 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1976 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1976 |
| sort-products:price-low | normal | unset | 1419 |
| navigate-hero:shop-new-arrivals | normal | unset | 997 |
| navigate-utility:help | normal | unset | 997 |
| select-department:mens | normal | unset | 997 |
| select-department:womens | normal | unset | 997 |
| select-region:se | normal | unset | 997 |
| navigate-brand-family:ensemble | normal | unset | 996 |
| navigate-brand-family:outlet | normal | unset | 996 |
| navigate-brand-family:regear | normal | unset | 996 |
| navigate-brand-family:trail-lab | normal | unset | 996 |
| navigate-header:account | normal | unset | 996 |
| navigate-header:cart | normal | unset | 996 |
| navigate-header:shop | normal | unset | 996 |
| navigate-sale:shop-all | normal | unset | 996 |
| navigate-sale:spring-collection-sale | normal | unset | 996 |
| navigate-utility:find-store | normal | unset | 996 |
| select-region:us | normal | unset | 996 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 990 |
| select-category:mens-mid-layers | normal | unset | 989 |
| checkout-dialog:close | normal | unset | 988 |
| edit-account-email | normal | unset | 988 |
| edit-shipping-address | normal | unset | 988 |
| save-account | critical | unset | 988 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 988 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 988 |
| shopping-cart:checkout | critical | unset | 988 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 988 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 988 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 988 |
| edit-account-name | normal | unset | 987 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
