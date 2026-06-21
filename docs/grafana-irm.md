# Grafana IRM And Incident Exercise

## Users

Create responders for engineering, ecommerce operations, and customer support in Grafana IRM. Add at least one escalation path covering business hours and after-hours.

## Business-Hours On-Call Schedule

The requested primary on-call schedule is `Ensemble-Grafana Business Hours`: assign the current Grafana IRM user every day from 9:00 AM to 5:00 PM Eastern time.

`gcx irm oncall` can list and inspect schedules, users, and shifts, but this gcx build does not expose schedule or shift creation commands. Use `observability/irm/create-business-hours-oncall.sh` for the create step; it uses the official Grafana IRM OnCall API and falls back to `gcx irm oncall users current` to resolve the current user when gcx has a valid IRM token.

Required credentials and inputs:

- `GRAFANA_IRM_API_URL`: defaults to `https://incident-prod-us-east-3.grafana.net/oncall`.
- `GRAFANA_IRM_TOKEN`: a token with `grafana-irm-app.schedules:write` and `grafana-irm-app.user-settings:read`.
- `GRAFANA_STACK_URL`: defaults to `https://orenlion.grafana.net`.
- `USER_ID`: optional; set it to your IRM user id if gcx/API current-user lookup cannot resolve it.

Run:

```sh
GRAFANA_IRM_TOKEN=<irm-token> \
observability/irm/create-business-hours-oncall.sh
```

Current created resources:

- Schedule: `Ensemble-Grafana Business Hours`, ID `SP1JXJ6S48HAZ`.
- Shift: `Ensemble-Grafana 9-5 Eastern`, ID `OHIRQE3JJ96RI`.
- User: `orendroid`, ID `UGQ913U99XKYX`.
- Time zone: `America/New_York`.

Validate:

```sh
gcx irm oncall schedules list
gcx irm oncall shifts list
gcx irm oncall schedules final-shifts SP1JXJ6S48HAZ --start 2026-05-25 --end 2026-05-28
```

## SRE 24/7 On-Call Schedule

The 24/7/365 SRE schedule is `Ensemble-Grafana SRE 24x7`. It assigns `orendroid` (`UGQ913U99XKYX`) to a daily 24-hour recurrent shift, scoped to team `SRE` (`TWU2GNHZYST7U`) and connected to Slack channel `#sre` (`C0B6UFESQR5`).

Use `observability/irm/create-sre-24x7-oncall.sh` to recreate it. The helper uses the OnCall API because this `gcx` build can list OnCall schedules and shifts but does not expose create commands.

Required credentials and inputs:

- `GRAFANA_IRM_API_URL`: defaults to `https://incident-prod-us-east-3.grafana.net/oncall`.
- `GRAFANA_IRM_TOKEN`: a token with `grafana-irm-app.schedules:write` and `grafana-irm-app.user-settings:read`.
- `GRAFANA_STACK_URL`: defaults to `https://orenlion.grafana.net`.
- `USER_ID`: defaults to `UGQ913U99XKYX`.
- `TEAM_ID`: defaults to `TWU2GNHZYST7U`.
- `SLACK_CHANNEL_ID`: defaults to `C0B6UFESQR5`.

Run:

```sh
GRAFANA_IRM_TOKEN=<irm-token> \
observability/irm/create-sre-24x7-oncall.sh
```

Current created resources:

- Schedule: `Ensemble-Grafana SRE 24x7`, ID `SG6C9816MEKQQ`.
- Shift: `Ensemble-Grafana SRE 24x7`, ID `OTL337ZBLLAUC`.
- Escalation chain: `SRE-Escalation`, ID `FXIJQB51CYLL3`.
- Escalation policy: `EQFWNRZQGD1DQ`, position `0`, type `notify_on_call_from_schedule`, schedule `SG6C9816MEKQQ`, important notifications enabled.
- Team: `SRE`, ID `TWU2GNHZYST7U`.
- Slack channel: `#sre`, ID `C0B6UFESQR5`.
- User: `orendroid`, ID `UGQ913U99XKYX`.
- Time zone: `America/New_York`.
- Start: `2026-05-31T00:00:00`.
- Duration: `86400` seconds.

Validate:

```sh
gcx irm oncall schedules get SG6C9816MEKQQ -o json
gcx irm oncall shifts get OTL337ZBLLAUC -o json
gcx irm oncall schedules final-shifts SG6C9816MEKQQ --start 2026-05-31 --end 2026-06-03 -o json
gcx irm oncall escalation-policies get EQFWNRZQGD1DQ -o json
```

## Labels

Use these exact label keys and values on generated and real incidents:

- `client_impact`: `single-client`, `multiple-clients`
- `detection`: `manual`, `synthetic-monitoring`, `grafana-alert`, `k6-load-test`, `customer-report`, `call-in`
- `feature`: `HL7-message-processing`, `cms-menus`, `fast-lane`, `login`, `mobile`, `notification`, `shopping-cart-add`, `shopping-cart-checkout`, `shopping-cart-remove`, `single-url`, `temp-tracking`, `transfer-case`, `vanity-url`
- `hosting_type`: `capacity-iq`, `data-platform`, `location-iq`, `logistics-platform`
- `impact_type`: `availability`, `performance`, `provider`
- `product`: `CMS-On-Premises`, `CWS`, `CapacityIQ`, `DWC`, `DataIQ`, `DecisionIQ`, `LocationIQ`, `OperationsIQ`, `RTLS-On-Premises`, `ReferralIQ`, `TC-On-Premises`, `TransferIQ`, `WorkflowIQ`
- `region`: `Canada`, `China`, `EU`, `UK`, `US`
- `root_cause`: values include `Manual-Error`, `Code-Defect`, `Certificate-Expiration`, `misconfiguration`, provider categories, scaling defects, and configuration/update failure categories imported from the `Uptime SLA & RCA` dashboard transformations.
- `service`: `account`, `authentication`, `cart`, `inventory`
- `serviceline`: `auth`, `bed-mgmt`, `bi-system-hosting`, `cms`, `core-infrastructure-compute`, `core-infrastructure-security`, `design-system`, `etl`, `hl7`, `microservice-platform`, `notification`, `onpremise-communication`, `optc`, `patient`, `patient-mvt`, `patient-visit`, `periop`, `rtls`, `staff-mgmt`, `transfer-case`, `user`, `utility`
- `product_category`: `mens_hiking`, `mens_boots`

The dashboard-derived labels were extracted only from the `Uptime SLA & RCA` dashboard transformations, specifically `jsonPaths[].path` values shaped as `label:value`. Missing label keys and values were created in Grafana IRM with `gcx api` through `FieldsService.AddLabelKey` and `FieldsService.AddLabelValue`. Validate them with:

```sh
gcx api /api/plugins/grafana-irm-app/resources/api/v1/FieldsService.GetFields -d '{}' -o json
```

## Severities

Configured Grafana IRM severity labels:

- Level 1: `Sev-1: Critical Business Impact`
- Level 2: `Sev-2: Significant Business Impact`
- Level 3: `Sev-3: Medium Impact`
- Level 4: `Low Impact`

Use them as:

- Level 1: checkout/cart unavailable for multiple customers.
- Level 2: product browsing degraded or one backend service has high error rate.
- Level 3: single category affected or elevated latency without checkout failure.
- Level 4: test incident, dashboard validation, or non-customer-impacting alert.

Validate:

```sh
gcx irm incidents severities list -o json
```

This `gcx` build lists IRM severities but does not expose first-class severity update/create subcommands. For automation, use `gcx api` against `SeveritiesService.UpdateOrgSeverity`, `SeveritiesService.CreateOrgSeverity`, and `SeveritiesService.DeleteOrgSeverity` with an IRM-capable Grafana token.

## Generate Test Incidents

Use `scripts/generate-incident.sh` with a Grafana Cloud IRM token. The script posts to `https://incident-prod-us-east-3.grafana.net/incident` by default and includes the required labels `region=US`, `feature=shopping-cart-checkout`, `service=cart`, and `detection=manual`, plus `root_cause=Manual-Error`, `product_category=mens_hiking`, and `client_impact=multiple-clients`. Override `REGION`, `FEATURE`, `SERVICE`, `DETECTION`, `ROOT_CAUSE`, `PRODUCT_CATEGORY`, and `CLIENT_IMPACT` to generate incidents across the approved taxonomy.

## 2025 Holiday Traffic-Spike Incidents

Created resolved Sev-2 incidents `2` through `22` to exercise holiday RCA dashboards and label filtering. The reviewed holiday set was pushed again as incidents `42` through `62`. The incidents cover US federal holidays and Canadian federal statutory holidays in 2025.

Common template:

- Description: `Holiday traffic spike results in shopping cart errors and order loss`
- Resolution summary: `Traffic spike due to holiday, services OOM killed and restarting. Node and pod auto-scaling requires calibration.`
- Labels: `feature=shopping-cart-checkout`, `client_impact=multiple-clients`, `impact_type=availability`, `service=cart`, `root_cause=Scaling-Defect-Service`
- Event window: `10:00 AM` to `10:30 AM` EDT, stored as `14:00:00Z` to `14:30:00Z`
- Region: `US` for US federal holidays, `Canada` for Canadian federal statutory holidays

Black Friday 2025 was added separately as incident `23` with the same labels and resolution summary. Its event window is four hours on `2025-11-28`, from `10:00 AM` to `2:00 PM` Eastern, stored as `15:00:00Z` to `19:00:00Z`.

The latest holiday and monthly placeholder push is recorded in `observability/irm/generated/incident-push-summary.md` and `observability/irm/generated/incident-push-results.json`. Use `node scripts/push-irm-incidents.mjs` to replay the reviewed incident manifests in `observability/irm/generated/incident-manifests/`; the script applies severity, labels, event times, resolution activity, close status, and post-close validation.

China holiday traffic-spike incidents were pushed as resolved Sev-2 incidents `80` through `107`. They use the same holiday incident template with `region=China` and one incident for each official 2025 China public holiday date. The push is recorded in `observability/irm/generated/china-incident-push-summary.md` and `observability/irm/generated/china-incident-push-results.json`.

## Monthly Placeholder Incidents

Created resolved Sev-2 incidents `24` through `40` for each month in 2025 and January through May 2026. The reviewed placeholder set was pushed again as incidents `63` through `79`.

June 2026 was created separately as resolved incident `209` with `region=US`, `detection=call-in`, `client_impact=multiple-clients`, and `impact_type=availablity`. Its event window is `2026-06-01T04:01:00Z` to `2026-06-01T04:02:00Z`.

Regional placeholder incidents were created for `UK`, `China`, `Canada`, and `EU`, covering monthly placeholders from `2024-12-01` through `2026-05-01`. These are resolved incidents `108` through `179`: `UK=108-125`, `China=126-143`, `Canada=144-161`, and `EU=162-179`. Results are recorded in `observability/irm/generated/regional-placeholder-incident-push-summary.md` and `observability/irm/generated/regional-placeholder-incident-push-results.json`.

Sweden was added as a `region` label value and pushed as resolved placeholder incidents `184` through `200`, covering monthly placeholders from `2025-01-01` through `2026-05-01`. Results are recorded in `observability/irm/generated/sweden-placeholder-incident-push-summary.md` and `observability/irm/generated/sweden-placeholder-incident-push-results.json`; the review file is `observability/irm/sweden-monthly-placeholder-incidents-review.md`.

These use `skills/observability/incident-placeholder-template/SKILL.md` and intentionally bypass the standard incident policy requiring `feature` and `service` labels. Current placeholder guidance still includes `detection=manual` unless the request names another approved detection source.

Common template:

- Description: `[Placeholder] No Action Needed`
- Resolution summary: `[Placeholder] No Action Needed`
- Labels: `region=<requested region>`, `detection=manual`, `client_impact=multiple-clients`, `impact_type=availablity`
- Event window: `00:01 AM` to `00:02 AM` EDT, stored as `04:01:00Z` to `04:02:00Z` on the first day of each month
