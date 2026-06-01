# Faro User Action Execution Totals

Generated: 2026-06-01T15:48:26.751Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 20459

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 1196 |
| select-language:swedish | normal | unset | 1002 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1000 |
| select-language:american-english | normal | unset | 1000 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1000 |
| sort-products:price-low | normal | unset | 735 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 502 |
| navigate-sale:spring-collection-sale | normal | unset | 501 |
| select-region:se | normal | unset | 501 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 501 |
| checkout-dialog:close | normal | unset | 500 |
| edit-account-email | normal | unset | 500 |
| edit-account-name | normal | unset | 500 |
| edit-shipping-address | normal | unset | 500 |
| navigate-brand-family:ensemble | normal | unset | 500 |
| navigate-brand-family:outlet | normal | unset | 500 |
| navigate-brand-family:regear | normal | unset | 500 |
| navigate-brand-family:trail-lab | normal | unset | 500 |
| navigate-header:account | normal | unset | 500 |
| navigate-header:cart | normal | unset | 500 |
| navigate-header:shop | normal | unset | 500 |
| navigate-hero:shop-new-arrivals | normal | unset | 500 |
| navigate-sale:shop-all | normal | unset | 500 |
| navigate-utility:find-store | normal | unset | 500 |
| navigate-utility:help | normal | unset | 500 |
| save-account | critical | unset | 500 |
| select-category:mens-mid-layers | normal | unset | 500 |
| select-department:mens | normal | unset | 500 |
| select-department:womens | normal | unset | 500 |
| select-region:us | normal | unset | 500 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 500 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 500 |
| shopping-cart:checkout | critical | unset | 500 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 500 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 500 |
| select-language:british-english | normal | unset | 4 |
| select-language:mandarin | normal | unset | 4 |
| select-language:french | normal | unset | 2 |
| select-region:cn | normal | unset | 2 |
| select-region:uk | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| select-category:mens-pants | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
