# Faro User Action Execution Totals

Generated: 2026-06-02T15:30:07.420Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 10525

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 547 |
| close-product-detail:mens-midlayer-grid | normal | unset | 518 |
| select-language:american-english | normal | unset | 518 |
| select-language:swedish | normal | unset | 518 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 518 |
| sort-products:price-low | normal | unset | 401 |
| navigate-brand-family:ensemble | normal | unset | 259 |
| navigate-brand-family:outlet | normal | unset | 259 |
| navigate-brand-family:regear | normal | unset | 259 |
| navigate-brand-family:trail-lab | normal | unset | 259 |
| navigate-header:account | normal | unset | 259 |
| navigate-header:cart | normal | unset | 259 |
| navigate-header:shop | normal | unset | 259 |
| navigate-hero:shop-new-arrivals | normal | unset | 259 |
| navigate-sale:shop-all | normal | unset | 259 |
| navigate-sale:spring-collection-sale | normal | unset | 259 |
| navigate-utility:find-store | normal | unset | 259 |
| navigate-utility:help | normal | unset | 259 |
| select-category:mens-mid-layers | normal | unset | 259 |
| select-department:mens | normal | unset | 259 |
| select-department:womens | normal | unset | 259 |
| select-region:se | normal | unset | 259 |
| select-region:us | normal | unset | 259 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 259 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 259 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 259 |
| shopping-cart:checkout | critical | unset | 259 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 259 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 259 |
| checkout-dialog:close | normal | unset | 258 |
| edit-account-email | normal | unset | 258 |
| edit-account-name | normal | unset | 258 |
| edit-shipping-address | normal | unset | 258 |
| save-account | critical | unset | 258 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 258 |
