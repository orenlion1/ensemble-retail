# Faro User Action Execution Totals

Generated: 2026-06-01T19:38:03.893Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 36069

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2105 |
| select-language:american-english | normal | unset | 1768 |
| select-language:swedish | normal | unset | 1768 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1764 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1764 |
| sort-products:price-low | normal | unset | 1283 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 885 |
| navigate-sale:spring-collection-sale | normal | unset | 884 |
| select-region:se | normal | unset | 884 |
| select-region:us | normal | unset | 884 |
| select-department:womens | normal | unset | 883 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 883 |
| checkout-dialog:close | normal | unset | 882 |
| edit-account-email | normal | unset | 882 |
| edit-account-name | normal | unset | 882 |
| edit-shipping-address | normal | unset | 882 |
| navigate-brand-family:ensemble | normal | unset | 882 |
| navigate-brand-family:outlet | normal | unset | 882 |
| navigate-brand-family:regear | normal | unset | 882 |
| navigate-brand-family:trail-lab | normal | unset | 882 |
| navigate-header:account | normal | unset | 882 |
| navigate-header:cart | normal | unset | 882 |
| navigate-header:shop | normal | unset | 882 |
| navigate-hero:shop-new-arrivals | normal | unset | 882 |
| navigate-sale:shop-all | normal | unset | 882 |
| navigate-utility:find-store | normal | unset | 882 |
| navigate-utility:help | normal | unset | 882 |
| save-account | critical | unset | 882 |
| select-category:mens-mid-layers | normal | unset | 882 |
| select-department:mens | normal | unset | 882 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 882 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 882 |
| shopping-cart:checkout | critical | unset | 882 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 882 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 882 |
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
