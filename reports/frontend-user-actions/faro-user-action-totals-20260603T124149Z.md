# Faro User Action Execution Totals

Generated: 2026-06-03T12:41:49.417Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 5046

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 282 |
| select-language:american-english | normal | unset | 248 |
| close-product-detail:mens-midlayer-grid | normal | unset | 246 |
| select-language:swedish | normal | unset | 246 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 246 |
| sort-products:price-low | normal | unset | 182 |
| checkout-dialog:close | normal | unset | 124 |
| navigate-sale:spring-collection-sale | normal | unset | 124 |
| select-department:mens | normal | unset | 124 |
| select-department:womens | normal | unset | 124 |
| select-region:us | normal | unset | 124 |
| shopping-cart:checkout | critical | unset | 124 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 124 |
| edit-account-email | normal | unset | 123 |
| edit-account-name | normal | unset | 123 |
| edit-shipping-address | normal | unset | 123 |
| navigate-brand-family:ensemble | normal | unset | 123 |
| navigate-brand-family:outlet | normal | unset | 123 |
| navigate-brand-family:regear | normal | unset | 123 |
| navigate-brand-family:trail-lab | normal | unset | 123 |
| navigate-header:account | normal | unset | 123 |
| navigate-header:cart | normal | unset | 123 |
| navigate-header:shop | normal | unset | 123 |
| navigate-hero:shop-new-arrivals | normal | unset | 123 |
| navigate-sale:shop-all | normal | unset | 123 |
| navigate-utility:find-store | normal | unset | 123 |
| navigate-utility:help | normal | unset | 123 |
| save-account | critical | unset | 123 |
| select-category:mens-mid-layers | normal | unset | 123 |
| select-region:se | normal | unset | 123 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 123 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 123 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 123 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 123 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 123 |
| select-language:british-english | normal | unset | 4 |
| select-category:womens-pants | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-region:uk | normal | unset | 2 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-start | critical | unset | 1 |
| save-account | normal | unset | 1 |
| select-category:womens-accessories | normal | unset | 1 |
| select-category:womens-base-layers | normal | unset | 1 |
| select-category:womens-shells | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:remove-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:remove-item:mens-trail-pant | normal | unset | 1 |
