# Faro User Action Execution Totals

Generated: 2026-06-28T19:36:10.515Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 5711

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 435 |
| select-language:swedish | normal | unset | 278 |
| close-product-detail:mens-midlayer-grid | normal | unset | 276 |
| select-language:american-english | normal | unset | 276 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 276 |
| sort-products:price-low | normal | unset | 168 |
| checkout-dialog:close | normal | unset | 138 |
| edit-account-email | normal | unset | 138 |
| edit-account-name | normal | unset | 138 |
| edit-shipping-address | normal | unset | 138 |
| navigate-brand-family:ensemble | normal | unset | 138 |
| navigate-brand-family:outlet | normal | unset | 138 |
| navigate-brand-family:regear | normal | unset | 138 |
| navigate-brand-family:trail-lab | normal | unset | 138 |
| navigate-header:account | normal | unset | 138 |
| navigate-header:cart | normal | unset | 138 |
| navigate-header:shop | normal | unset | 138 |
| navigate-hero:shop-new-arrivals | normal | unset | 138 |
| navigate-sale:shop-all | normal | unset | 138 |
| navigate-sale:spring-collection-sale | normal | unset | 138 |
| navigate-utility:find-store | normal | unset | 138 |
| navigate-utility:help | normal | unset | 138 |
| save-account | critical | unset | 138 |
| select-category:mens-mid-layers | normal | unset | 138 |
| select-department:mens | normal | unset | 138 |
| select-department:womens | normal | unset | 138 |
| select-region:se | normal | unset | 138 |
| select-region:us | normal | unset | 138 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 138 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 138 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 138 |
| shopping-cart:checkout | critical | unset | 138 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 138 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 138 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 138 |
