# Faro User Action Execution Totals

Generated: 2026-05-31T18:55:23.669Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 13725

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 926 |
| select-language:swedish | normal | unset | 678 |
| select-language:american-english | normal | unset | 676 |
| close-product-detail:mens-midlayer-grid | normal | unset | 660 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 660 |
| sort-products:price-low | normal | unset | 414 |
| select-region:se | normal | unset | 339 |
| navigate-brand-family:ensemble | normal | unset | 338 |
| navigate-brand-family:outlet | normal | unset | 338 |
| navigate-brand-family:regear | normal | unset | 338 |
| navigate-brand-family:trail-lab | normal | unset | 338 |
| navigate-header:account | normal | unset | 338 |
| navigate-header:cart | normal | unset | 338 |
| navigate-header:shop | normal | unset | 338 |
| navigate-hero:shop-new-arrivals | normal | unset | 338 |
| navigate-sale:shop-all | normal | unset | 338 |
| navigate-sale:spring-collection-sale | normal | unset | 338 |
| navigate-utility:find-store | normal | unset | 338 |
| navigate-utility:help | normal | unset | 338 |
| select-department:mens | normal | unset | 338 |
| select-department:womens | normal | unset | 338 |
| select-region:us | normal | unset | 338 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 332 |
| checkout-dialog:close | normal | unset | 330 |
| edit-account-email | normal | unset | 330 |
| edit-shipping-address | normal | unset | 330 |
| save-account | critical | unset | 330 |
| select-category:mens-mid-layers | normal | unset | 330 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 330 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 330 |
| shopping-cart:checkout | critical | unset | 330 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 330 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 330 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 330 |
| edit-account-name | normal | unset | 329 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
