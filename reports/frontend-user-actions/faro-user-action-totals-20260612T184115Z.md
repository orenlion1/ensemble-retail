# Faro User Action Execution Totals

Generated: 2026-06-12T18:41:15.298Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 5823

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 403 |
| select-language:american-english | normal | unset | 284 |
| close-product-detail:mens-midlayer-grid | normal | unset | 282 |
| select-language:swedish | normal | unset | 282 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 282 |
| sort-products:price-low | normal | unset | 190 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 143 |
| checkout-dialog:close | normal | unset | 142 |
| navigate-sale:spring-collection-sale | normal | unset | 142 |
| select-region:us | normal | unset | 142 |
| shopping-cart:checkout | critical | unset | 142 |
| edit-account-email | normal | unset | 141 |
| edit-account-name | normal | unset | 141 |
| edit-shipping-address | normal | unset | 141 |
| navigate-brand-family:ensemble | normal | unset | 141 |
| navigate-brand-family:outlet | normal | unset | 141 |
| navigate-brand-family:regear | normal | unset | 141 |
| navigate-brand-family:trail-lab | normal | unset | 141 |
| navigate-header:account | normal | unset | 141 |
| navigate-header:cart | normal | unset | 141 |
| navigate-header:shop | normal | unset | 141 |
| navigate-hero:shop-new-arrivals | normal | unset | 141 |
| navigate-sale:shop-all | normal | unset | 141 |
| navigate-utility:find-store | normal | unset | 141 |
| navigate-utility:help | normal | unset | 141 |
| save-account | critical | unset | 141 |
| select-category:mens-mid-layers | normal | unset | 141 |
| select-department:mens | normal | unset | 141 |
| select-department:womens | normal | unset | 141 |
| select-region:se | normal | unset | 141 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 141 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 141 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 141 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 141 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 141 |
| select-language:french | normal | unset | 2 |
| select-region:ca | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 1 |
