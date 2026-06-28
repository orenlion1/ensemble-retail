---
name: incident-placeholder-template
description: Use when creating Grafana IRM monthly placeholder incidents for Ensemble-Retail. This template intentionally bypasses the standard incident-creation requirement for feature and service labels, and creates low-signal placeholder incidents with region, client_impact, and hosting_type labels.
---

# Incident Placeholder Template

Use this skill only for explicitly requested Grafana IRM placeholder incidents.

## Scope

This template bypasses the stricter `incident-creation` skill rules for `feature`, `service`, and `detection`.

## Default Template

- Title: `[Placeholder] <Month YYYY> No Action Needed`
- Description: `[Placeholder] No Action Needed`
- Resolution summary: `[Placeholder] No Action Needed`
- Severity: `Sev-2: Significant Business Impact`
- Start time: `{DATE} 00:01 EDT`
- End time: `{DATE} 00:02 EDT`
- Labels:
  - `client_impact:{impact_category}`
  - `hosting_type:logistics-platform`
  - `region:{region}`
- Optional labels:
  - `client:{client_name}` only when the request specifies a client.

Replace `{DATE}` with the requested placeholder incident date. For monthly placeholder exercises, use the first calendar day of the month unless the user provides a specific holiday date.
Replace `client_impact:{impact_category}` with the impact category in the request, such as `client_impact:multiple-clients` or `client_impact:single-client`. If the request does not specify an impact category, default to `client_impact:multiple-clients`.
Replace `client:{client_name}` with the client name in the request. Do not include the `client` label when the request does not specify a client.
Replace `region:{region}` with the region in the request, such as `region:US`, `region:UK`, `region:China`, `region:Canada`, `region:EU`, or `region:Sweden`. If the request does not specify a region, default to `region:US`.

## Workflow

1. Validate the three required label values exist in Grafana IRM, including the requested `client_impact:{impact_category}` and `region:{region}` values. If `client:{client_name}` is present, validate that label value too.
2. Create each incident as active with the template labels.
3. Set the requested event start and end with `IncidentsService.UpdateIncidentEventTime`.
4. Add the resolution summary as an activity note.
5. Close the incident.
6. Reapply the start and end time after close, because IRM may recalculate event timing when resolving.
7. Validate resolved status, the three required labels, and the optional `client` label when specified.
