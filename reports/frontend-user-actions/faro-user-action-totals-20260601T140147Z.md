# Faro User Action Execution Totals

Generated: 2026-06-01T14:01:47.383Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 10655

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 606 |
| close-product-detail:mens-midlayer-grid | normal | unset | 522 |
| select-language:american-english | normal | unset | 522 |
| select-language:swedish | normal | unset | 522 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 522 |
| sort-products:price-low | normal | unset | 392 |
| checkout-dialog:close | normal | unset | 261 |
| edit-account-email | normal | unset | 261 |
| edit-account-name | normal | unset | 261 |
| edit-shipping-address | normal | unset | 261 |
| navigate-brand-family:ensemble | normal | unset | 261 |
| navigate-brand-family:outlet | normal | unset | 261 |
| navigate-brand-family:regear | normal | unset | 261 |
| navigate-brand-family:trail-lab | normal | unset | 261 |
| navigate-header:account | normal | unset | 261 |
| navigate-header:cart | normal | unset | 261 |
| navigate-header:shop | normal | unset | 261 |
| navigate-hero:shop-new-arrivals | normal | unset | 261 |
| navigate-sale:shop-all | normal | unset | 261 |
| navigate-sale:spring-collection-sale | normal | unset | 261 |
| navigate-utility:find-store | normal | unset | 261 |
| navigate-utility:help | normal | unset | 261 |
| save-account | critical | unset | 261 |
| select-category:mens-mid-layers | normal | unset | 261 |
| select-department:mens | normal | unset | 261 |
| select-department:womens | normal | unset | 261 |
| select-region:se | normal | unset | 261 |
| select-region:us | normal | unset | 261 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 261 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 261 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 261 |
| shopping-cart:checkout | critical | unset | 261 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 261 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 261 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 261 |
