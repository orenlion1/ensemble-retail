# Faro User Action Execution Totals

Generated: 2026-05-31T18:00:11.718Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 8422

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 626 |
| select-language:american-english | normal | unset | 416 |
| select-language:swedish | normal | unset | 416 |
| close-product-detail:mens-midlayer-grid | normal | unset | 400 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 400 |
| sort-products:price-low | normal | unset | 236 |
| navigate-brand-family:ensemble | normal | unset | 208 |
| navigate-brand-family:outlet | normal | unset | 208 |
| navigate-brand-family:regear | normal | unset | 208 |
| navigate-brand-family:trail-lab | normal | unset | 208 |
| navigate-header:account | normal | unset | 208 |
| navigate-header:cart | normal | unset | 208 |
| navigate-header:shop | normal | unset | 208 |
| navigate-hero:shop-new-arrivals | normal | unset | 208 |
| navigate-sale:shop-all | normal | unset | 208 |
| navigate-sale:spring-collection-sale | normal | unset | 208 |
| navigate-utility:find-store | normal | unset | 208 |
| navigate-utility:help | normal | unset | 208 |
| select-department:mens | normal | unset | 208 |
| select-department:womens | normal | unset | 208 |
| select-region:se | normal | unset | 208 |
| select-region:us | normal | unset | 208 |
| checkout-dialog:close | normal | unset | 200 |
| edit-account-email | normal | unset | 200 |
| edit-account-name | normal | unset | 200 |
| edit-shipping-address | normal | unset | 200 |
| save-account | critical | unset | 200 |
| select-category:mens-mid-layers | normal | unset | 200 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 200 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 200 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 200 |
| shopping-cart:checkout | critical | unset | 200 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 200 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 200 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 200 |
