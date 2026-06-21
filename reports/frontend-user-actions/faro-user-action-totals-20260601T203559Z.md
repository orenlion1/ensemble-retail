# Faro User Action Execution Totals

Generated: 2026-06-01T20:35:59.647Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 36363

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2135 |
| select-language:american-english | normal | unset | 1782 |
| select-language:swedish | normal | unset | 1780 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1774 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1774 |
| sort-products:price-low | normal | unset | 1321 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 892 |
| select-region:us | normal | unset | 891 |
| navigate-sale:spring-collection-sale | normal | unset | 890 |
| select-region:se | normal | unset | 890 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 890 |
| select-department:womens | normal | unset | 889 |
| checkout-dialog:close | normal | unset | 888 |
| navigate-header:cart | normal | unset | 888 |
| navigate-hero:shop-new-arrivals | normal | unset | 888 |
| shopping-cart:checkout | critical | unset | 888 |
| edit-account-email | normal | unset | 887 |
| edit-account-name | normal | unset | 887 |
| edit-shipping-address | normal | unset | 887 |
| navigate-brand-family:ensemble | normal | unset | 887 |
| navigate-brand-family:outlet | normal | unset | 887 |
| navigate-brand-family:regear | normal | unset | 887 |
| navigate-brand-family:trail-lab | normal | unset | 887 |
| navigate-header:account | normal | unset | 887 |
| navigate-header:shop | normal | unset | 887 |
| navigate-sale:shop-all | normal | unset | 887 |
| navigate-utility:find-store | normal | unset | 887 |
| navigate-utility:help | normal | unset | 887 |
| save-account | critical | unset | 887 |
| select-category:mens-mid-layers | normal | unset | 887 |
| select-department:mens | normal | unset | 887 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 887 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 887 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 887 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 887 |
| select-language:british-english | normal | unset | 8 |
| select-language:french | normal | unset | 8 |
| select-language:mandarin | normal | unset | 6 |
| select-region:ca | normal | unset | 4 |
| select-region:uk | normal | unset | 4 |
| select-region:cn | normal | unset | 3 |
| auth:google-login-complete | normal | unset | 2 |
| auth:google-login-start | critical | unset | 2 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 2 |
| shopping-cart:remove-item:mens-trail-pant | normal | unset | 2 |
| auth:google-login-start | normal | unset | 1 |
| select-category:mens-pants | normal | unset | 1 |
| select-category:womens-accessories | normal | unset | 1 |
| select-category:womens-base-layers | normal | unset | 1 |
| shopping-cart:add-item:mens-shell-alpha | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
| shopping-cart:add-sale-item:womens-softshell-hoody | normal | unset | 1 |
| shopping-cart:remove-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:remove-item:womens-softshell-hoody | normal | unset | 1 |
