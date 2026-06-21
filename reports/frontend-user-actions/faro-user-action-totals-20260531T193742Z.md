# Faro User Action Execution Totals

Generated: 2026-05-31T19:37:42.700Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 19305

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 1200 |
| select-language:swedish | normal | unset | 952 |
| select-language:american-english | normal | unset | 950 |
| close-product-detail:mens-midlayer-grid | normal | unset | 934 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 934 |
| sort-products:price-low | normal | unset | 651 |
| select-region:se | normal | unset | 476 |
| navigate-brand-family:ensemble | normal | unset | 475 |
| navigate-brand-family:outlet | normal | unset | 475 |
| navigate-brand-family:regear | normal | unset | 475 |
| navigate-brand-family:trail-lab | normal | unset | 475 |
| navigate-header:account | normal | unset | 475 |
| navigate-header:cart | normal | unset | 475 |
| navigate-header:shop | normal | unset | 475 |
| navigate-hero:shop-new-arrivals | normal | unset | 475 |
| navigate-sale:shop-all | normal | unset | 475 |
| navigate-sale:spring-collection-sale | normal | unset | 475 |
| navigate-utility:find-store | normal | unset | 475 |
| navigate-utility:help | normal | unset | 475 |
| select-department:mens | normal | unset | 475 |
| select-department:womens | normal | unset | 475 |
| select-region:us | normal | unset | 475 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 469 |
| checkout-dialog:close | normal | unset | 467 |
| edit-account-email | normal | unset | 467 |
| edit-shipping-address | normal | unset | 467 |
| save-account | critical | unset | 467 |
| select-category:mens-mid-layers | normal | unset | 467 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 467 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 467 |
| shopping-cart:checkout | critical | unset | 467 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 467 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 467 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 467 |
| edit-account-name | normal | unset | 466 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
