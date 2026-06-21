# Faro User Action Execution Totals

Generated: 2026-06-08T13:57:19.097Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 4924

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 305 |
| select-language:american-english | normal | unset | 242 |
| select-language:swedish | normal | unset | 240 |
| close-product-detail:mens-midlayer-grid | normal | unset | 238 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 238 |
| sort-products:price-low | normal | unset | 168 |
| navigate-sale:spring-collection-sale | normal | unset | 121 |
| select-department:womens | normal | unset | 121 |
| select-region:us | normal | unset | 121 |
| checkout-dialog:close | normal | unset | 120 |
| navigate-hero:shop-new-arrivals | normal | unset | 120 |
| select-category:mens-mid-layers | normal | unset | 120 |
| select-department:mens | normal | unset | 120 |
| select-region:se | normal | unset | 120 |
| edit-account-email | normal | unset | 119 |
| edit-account-name | normal | unset | 119 |
| edit-shipping-address | normal | unset | 119 |
| navigate-brand-family:ensemble | normal | unset | 119 |
| navigate-brand-family:outlet | normal | unset | 119 |
| navigate-brand-family:regear | normal | unset | 119 |
| navigate-brand-family:trail-lab | normal | unset | 119 |
| navigate-header:account | normal | unset | 119 |
| navigate-header:cart | normal | unset | 119 |
| navigate-header:shop | normal | unset | 119 |
| navigate-sale:shop-all | normal | unset | 119 |
| navigate-utility:find-store | normal | unset | 119 |
| navigate-utility:help | normal | unset | 119 |
| save-account | critical | unset | 119 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 119 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 119 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 119 |
| shopping-cart:checkout | critical | unset | 119 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 119 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 119 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 119 |
| select-language:french | normal | unset | 4 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 4 |
| select-language:british-english | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| select-region:ca | normal | unset | 2 |
| auth:google-login-complete | normal | unset | 1 |
| auth:google-login-error | normal | unset | 1 |
| auth:google-login-start | critical | unset | 1 |
| select-category:mens-packs | normal | unset | 1 |
| select-category:womens-all | normal | unset | 1 |
| select-category:womens-base-layers | normal | unset | 1 |
| select-category:womens-pants | normal | unset | 1 |
| select-category:womens-shells | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:womens-base-merino | normal | unset | 1 |
| shopping-cart:add-item:womens-softshell-hoody | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:checkout | normal | unset | 1 |
| shopping-cart:remove-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:remove-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:remove-item:mens-trail-pant | normal | unset | 1 |
