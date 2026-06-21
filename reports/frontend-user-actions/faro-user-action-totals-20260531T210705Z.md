# Faro User Action Execution Totals

Generated: 2026-05-31T21:07:05.971Z

Datasource: `grafanacloud-logs`

Window: `6h`

Total executions: 35016

Query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

The GCX range query returns a rolling `6h` series. The table uses the latest sample per `action_name`, `event_data_userActionImportance`, and `event_data_userActionSeverity` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
| search-products | normal | unset | 2242 |
| select-language:swedish | normal | unset | 1716 |
| select-language:american-english | normal | unset | 1714 |
| close-product-detail:mens-midlayer-grid | normal | unset | 1698 |
| shopping-cart:add-detail-item:mens-midlayer-grid | normal | unset | 1698 |
| sort-products:price-low | normal | unset | 1180 |
| navigate-hero:shop-new-arrivals | normal | unset | 858 |
| navigate-utility:help | normal | unset | 858 |
| select-department:mens | normal | unset | 858 |
| select-department:womens | normal | unset | 858 |
| select-region:se | normal | unset | 858 |
| navigate-brand-family:ensemble | normal | unset | 857 |
| navigate-brand-family:outlet | normal | unset | 857 |
| navigate-brand-family:regear | normal | unset | 857 |
| navigate-brand-family:trail-lab | normal | unset | 857 |
| navigate-header:account | normal | unset | 857 |
| navigate-header:cart | normal | unset | 857 |
| navigate-header:shop | normal | unset | 857 |
| navigate-sale:shop-all | normal | unset | 857 |
| navigate-sale:spring-collection-sale | normal | unset | 857 |
| navigate-utility:find-store | normal | unset | 857 |
| select-region:us | normal | unset | 857 |
| shopping-cart:add-sale-item:mens-midlayer-grid | normal | unset | 851 |
| select-category:mens-mid-layers | normal | unset | 850 |
| checkout-dialog:close | normal | unset | 849 |
| edit-account-email | normal | unset | 849 |
| edit-shipping-address | normal | unset | 849 |
| save-account | critical | unset | 849 |
| shopping-cart:add-item:mens-midlayer-grid | normal | unset | 849 |
| shopping-cart:change-quantity:mens-midlayer-grid | normal | unset | 849 |
| shopping-cart:checkout | critical | unset | 849 |
| shopping-cart:remove-item:mens-midlayer-grid | normal | unset | 849 |
| view-product:product-grid-mens-midlayer-grid | normal | unset | 849 |
| view-product:sale-grid-mens-midlayer-grid | normal | unset | 849 |
| edit-account-name | normal | unset | 848 |
| select-language:british-english | normal | unset | 2 |
| select-language:french | normal | unset | 2 |
| select-language:mandarin | normal | unset | 2 |
| auth:google-login-error | normal | unset | 1 |
| select-region:ca | normal | unset | 1 |
| select-region:cn | normal | unset | 1 |
| select-region:uk | normal | unset | 1 |
| shopping-cart:add-item:mens-daypack-22 | normal | unset | 1 |
| shopping-cart:add-sale-item:mens-trail-pant | normal | unset | 1 |
