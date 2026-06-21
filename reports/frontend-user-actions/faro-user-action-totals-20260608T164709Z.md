# Faro User Action Execution Totals

Generated: 2026-06-08T16:47:09.187Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 9717

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 605 |
| select-language:american-english | normal | unset | 476 |
| select-language:swedish | normal | unset | 474 |
| close-product-detail:mens-midlayer-grid | normal | unset | 470 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 470 |
| sort-products:price-low | normal | unset | 333 |
| select-department:womens | normal | unset | 239 |
| checkout-dialog:close | normal | unset | 238 |
| navigate-sale:spring-collection-sale | normal | unset | 238 |
| select-department:mens | normal | unset | 238 |
| select-region:us | normal | unset | 238 |
| select-region:se | normal | unset | 237 |
| navigate-hero:shop-new-arrivals | normal | unset | 236 |
| select-category:mens-mid-layers | normal | unset | 236 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 236 |
| shopping-cart:checkout | critical | unset | 236 |
| edit-account-email | normal | unset | 235 |
| edit-account-name | normal | unset | 235 |
| edit-shipping-address | normal | unset | 235 |
| navigate-brand-family:ensemble | normal | unset | 235 |
| navigate-brand-family:outlet | normal | unset | 235 |
| navigate-brand-family:regear | normal | unset | 235 |
| navigate-brand-family:trail-lab | normal | unset | 235 |
| navigate-header:account | normal | unset | 235 |
| navigate-header:cart | normal | unset | 235 |
| navigate-header:shop | normal | unset | 235 |
| navigate-sale:shop-all | normal | unset | 235 |
| navigate-utility:find-store | normal | unset | 235 |
| navigate-utility:help | normal | unset | 235 |
| save-account | critical | unset | 235 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 235 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 235 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 235 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 235 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 235 |
| select-language:british-english | normal | unset | 4 |
| select-language:french | normal | unset | 4 |
| select-language:mandarin | normal | unset | 4 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 4 |
| auth:google-login-start | critical | unset | 3 |
| select-category:womens-base-layers | normal | unset | 3 |
| auth:google-login-complete | normal | unset | 2 |
| auth:google-login-error | normal | unset | 2 |
| select-category:womens-accessories | normal | unset | 2 |
| select-category:womens-all | normal | unset | 2 |
| select-category:womens-pants | normal | unset | 2 |
| select-category:womens-shells | normal | unset | 2 |
| select-region:ca | normal | unset | 2 |
| select-region:cn | normal | unset | 2 |
| select-region:uk | normal | unset | 2 |
| shopping-cart:checkout | normal | unset | 2 |
| auth:sign-out | normal | unset | 1 |
| select-category:mens-packs | normal | unset | 1 |
| shopping-cart:add-item:womens-base-merino | normal | unset | 1 |
| shopping-cart:add-item:womens-softshell-hoody | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:remove-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:remove-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:remove-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:remove-item:womens-softshell-hoody | normal | unset | 1 |
| sort-products:price-high | normal | unset | 1 |
