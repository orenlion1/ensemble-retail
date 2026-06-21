# Faro User Action Execution Totals

Generated: 2026-06-01T18:20:04.061Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 25401

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 1459 |
| select-language:american-english | normal | unset | 1246 |
| select-language:swedish | normal | unset | 1246 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1242 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1242 |
| sort-products:price-low | normal | unset | 918 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 624 |
| navigate-sale:spring-collection-sale | normal | unset | 623 |
| select-region:se | normal | unset | 623 |
| select-region:us | normal | unset | 623 |
| select-department:womens | normal | unset | 622 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 622 |
| checkout-dialog:close | normal | unset | 621 |
| edit-account-email | normal | unset | 621 |
| edit-account-name | normal | unset | 621 |
| edit-shipping-address | normal | unset | 621 |
| navigate-brand-family:ensemble | normal | unset | 621 |
| navigate-brand-family:outlet | normal | unset | 621 |
| navigate-brand-family:regear | normal | unset | 621 |
| navigate-brand-family:trail-lab | normal | unset | 621 |
| navigate-header:account | normal | unset | 621 |
| navigate-header:cart | normal | unset | 621 |
| navigate-header:shop | normal | unset | 621 |
| navigate-hero:shop-new-arrivals | normal | unset | 621 |
| navigate-sale:shop-all | normal | unset | 621 |
| navigate-utility:find-store | normal | unset | 621 |
| navigate-utility:help | normal | unset | 621 |
| save-account | critical | unset | 621 |
| select-category:mens-mid-layers | normal | unset | 621 |
| select-department:mens | normal | unset | 621 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 621 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 621 |
| shopping-cart:checkout | critical | unset | 621 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 621 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 621 |
| select-language:mandarin | normal | unset | 6 |
| select-language:british-english | normal | unset | 4 |
| select-language:french | normal | unset | 4 |
| select-region:cn | normal | unset | 3 |
| select-region:ca | normal | unset | 2 |
| select-region:uk | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | normal | unset | 1 |
| select-category:mens-pants | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:remove-item:mens-trail-pant | normal | unset | 1 |
