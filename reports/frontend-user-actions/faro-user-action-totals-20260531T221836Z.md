# Faro User Action Execution Totals

Generated: 2026-05-31T22:18:36.975Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 50811

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 3137 |
| select-language:swedish | normal | unset | 2490 |
| select-language:american-english | normal | unset | 2488 |
| close-product-detail:mens-midlayer-grid | normal | unset | 2472 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 2472 |
| sort-products:price-low | normal | unset | 1753 |
| navigate-utility:help | normal | unset | 1246 |
| navigate-brand-family:ensemble | normal | unset | 1245 |
| navigate-brand-family:outlet | normal | unset | 1245 |
| navigate-brand-family:regear | normal | unset | 1245 |
| navigate-brand-family:trail-lab | normal | unset | 1245 |
| navigate-header:shop | normal | unset | 1245 |
| navigate-hero:shop-new-arrivals | normal | unset | 1245 |
| navigate-sale:spring-collection-sale | normal | unset | 1245 |
| navigate-utility:find-store | normal | unset | 1245 |
| select-department:mens | normal | unset | 1245 |
| select-department:womens | normal | unset | 1245 |
| select-region:se | normal | unset | 1245 |
| navigate-header:account | normal | unset | 1244 |
| navigate-header:cart | normal | unset | 1244 |
| navigate-sale:shop-all | normal | unset | 1244 |
| select-region:us | normal | unset | 1244 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 1238 |
| select-category:mens-mid-layers | normal | unset | 1237 |
| checkout-dialog:close | normal | unset | 1236 |
| edit-account-email | normal | unset | 1236 |
| edit-shipping-address | normal | unset | 1236 |
| save-account | critical | unset | 1236 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 1236 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 1236 |
| shopping-cart:checkout | critical | unset | 1236 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 1236 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 1236 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 1236 |
| edit-account-name | normal | unset | 1235 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
