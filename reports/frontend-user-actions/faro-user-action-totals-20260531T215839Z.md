# Faro User Action Execution Totals

Generated: 2026-05-31T21:58:39.390Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 45803

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2811 |
| select-language:swedish | normal | unset | 2246 |
| select-language:american-english | normal | unset | 2244 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2228 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2228 |
| sort-products:price-low | normal | unset | 1593 |
| navigate-hero:shop-new-arrivals | normal | unset | 1123 |
| navigate-utility:help | normal | unset | 1123 |
| select-department:mens | normal | unset | 1123 |
| select-department:womens | normal | unset | 1123 |
| select-region:se | normal | unset | 1123 |
| navigate-brand-family:ensemble | normal | unset | 1122 |
| navigate-brand-family:outlet | normal | unset | 1122 |
| navigate-brand-family:regear | normal | unset | 1122 |
| navigate-brand-family:trail-lab | normal | unset | 1122 |
| navigate-header:account | normal | unset | 1122 |
| navigate-header:cart | normal | unset | 1122 |
| navigate-header:shop | normal | unset | 1122 |
| navigate-sale:shop-all | normal | unset | 1122 |
| navigate-sale:spring-collection-sale | normal | unset | 1122 |
| navigate-utility:find-store | normal | unset | 1122 |
| select-region:us | normal | unset | 1122 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1116 |
| select-category:mens-mid-layers | normal | unset | 1115 |
| checkout-dialog:close | normal | unset | 1114 |
| edit-account-email | normal | unset | 1114 |
| edit-shipping-address | normal | unset | 1114 |
| save-account | critical | unset | 1114 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1114 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1114 |
| shopping-cart:checkout | critical | unset | 1114 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1114 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1114 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1114 |
| edit-account-name | normal | unset | 1113 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
