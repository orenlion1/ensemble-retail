# Faro User Action Execution Totals

Generated: 2026-06-01T14:24:35.635Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 15515

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 856 |
| close-product-detail:mens-midlayer-grid | normal | unset | 762 |
| select-language:american-english | normal | unset | 762 |
| select-language:swedish | normal | unset | 762 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 762 |
| sort-products:price-low | normal | unset | 562 |
| checkout-dialog:close | normal | unset | 381 |
| edit-account-email | normal | unset | 381 |
| edit-account-name | normal | unset | 381 |
| edit-shipping-address | normal | unset | 381 |
| navigate-brand-family:ensemble | normal | unset | 381 |
| navigate-brand-family:outlet | normal | unset | 381 |
| navigate-brand-family:regear | normal | unset | 381 |
| navigate-brand-family:trail-lab | normal | unset | 381 |
| navigate-header:account | normal | unset | 381 |
| navigate-header:cart | normal | unset | 381 |
| navigate-header:shop | normal | unset | 381 |
| navigate-hero:shop-new-arrivals | normal | unset | 381 |
| navigate-sale:shop-all | normal | unset | 381 |
| navigate-sale:spring-collection-sale | normal | unset | 381 |
| navigate-utility:find-store | normal | unset | 381 |
| navigate-utility:help | normal | unset | 381 |
| save-account | critical | unset | 381 |
| select-category:mens-mid-layers | normal | unset | 381 |
| select-department:mens | normal | unset | 381 |
| select-department:womens | normal | unset | 381 |
| select-region:se | normal | unset | 381 |
| select-region:us | normal | unset | 381 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 381 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 381 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 381 |
| shopping-cart:checkout | critical | unset | 381 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 381 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 381 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 381 |
