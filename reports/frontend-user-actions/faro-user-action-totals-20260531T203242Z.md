# Faro User Action Execution Totals

Generated: 2026-05-31T20:32:42.841Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 30038

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 1928 |
| select-language:swedish | normal | unset | 1474 |
| select-language:american-english | normal | unset | 1472 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1456 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1456 |
| sort-products:price-low | normal | unset | 999 |
| select-region:se | normal | unset | 737 |
| navigate-brand-family:ensemble | normal | unset | 736 |
| navigate-brand-family:outlet | normal | unset | 736 |
| navigate-brand-family:regear | normal | unset | 736 |
| navigate-brand-family:trail-lab | normal | unset | 736 |
| navigate-header:account | normal | unset | 736 |
| navigate-header:cart | normal | unset | 736 |
| navigate-header:shop | normal | unset | 736 |
| navigate-hero:shop-new-arrivals | normal | unset | 736 |
| navigate-sale:shop-all | normal | unset | 736 |
| navigate-sale:spring-collection-sale | normal | unset | 736 |
| navigate-utility:find-store | normal | unset | 736 |
| navigate-utility:help | normal | unset | 736 |
| select-department:mens | normal | unset | 736 |
| select-department:womens | normal | unset | 736 |
| select-region:us | normal | unset | 736 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 730 |
| checkout-dialog:close | normal | unset | 728 |
| edit-account-email | normal | unset | 728 |
| edit-shipping-address | normal | unset | 728 |
| save-account | critical | unset | 728 |
| select-category:mens-mid-layers | normal | unset | 728 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 728 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 728 |
| shopping-cart:checkout | critical | unset | 728 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 728 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 728 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 728 |
| edit-account-name | normal | unset | 727 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
