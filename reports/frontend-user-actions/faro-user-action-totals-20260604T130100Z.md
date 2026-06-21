# Faro User Action Execution Totals

Generated: 2026-06-04T13:01:00.350Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 5114

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 314 |
| close-product-detail:mens-midlayer-grid | normal | unset | 250 |
| select-language:american-english | normal | unset | 250 |
| select-language:swedish | normal | unset | 250 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 250 |
| sort-products:price-low | normal | unset | 170 |
| navigate-sale:spring-collection-sale | normal | unset | 126 |
| checkout-dialog:close | normal | unset | 125 |
| edit-account-email | normal | unset | 125 |
| edit-account-name | normal | unset | 125 |
| edit-shipping-address | normal | unset | 125 |
| navigate-brand-family:ensemble | normal | unset | 125 |
| navigate-brand-family:outlet | normal | unset | 125 |
| navigate-brand-family:regear | normal | unset | 125 |
| navigate-brand-family:trail-lab | normal | unset | 125 |
| navigate-header:account | normal | unset | 125 |
| navigate-header:cart | normal | unset | 125 |
| navigate-header:shop | normal | unset | 125 |
| navigate-hero:shop-new-arrivals | normal | unset | 125 |
| navigate-sale:shop-all | normal | unset | 125 |
| navigate-utility:find-store | normal | unset | 125 |
| navigate-utility:help | normal | unset | 125 |
| save-account | critical | unset | 125 |
| select-category:mens-mid-layers | normal | unset | 125 |
| select-department:mens | normal | unset | 125 |
| select-department:womens | normal | unset | 125 |
| select-region:se | normal | unset | 125 |
| select-region:us | normal | unset | 125 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 125 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 125 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 125 |
| shopping-cart:checkout | critical | unset | 125 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 125 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 125 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 125 |
| auth:google-login-error | normal | unset | 2 |
| shopping-cart:remove-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:remove-item:womens-softshell-hoody | normal | unset | 1 |
