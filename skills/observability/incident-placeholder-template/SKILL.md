---
name: incident-placeholder-template
description: Use when creating Grafana IRM monthly placeholder incidents for Ensemble-Grafana. This template intentionally bypasses the standard incident-creation requirement for feature and service labels, and creates low-signal placeholder incidents with only region, client_impact, and impact_type labels.
---

# Incident Placeholder Template

Use this skill only for explicitly requested Grafana IRM placeholder incidents.

## Scope

This template bypasses the stricter `incident-creation` skill rules. Do not require `feature` or `service` labels for placeholder incidents unless the user adds them.

## Default Template

- Title: `[Placeholder] <Month YYYY> No Action Needed`
- Description: `[Placeholder] No Action Needed`
- Resolution summary: `[Placeholder] No Action Needed`
- Severity: `Sev-2: Significant Business Impact`
- Start time: `{DATE} 00:01 EDT`
- End time: `{DATE} 00:02 EDT`
- Labels:
  - `region:{region}`
  - `client_impact:multiple-clients`
  - `impact_type:availablity`

Keep `impact_type:availablity` spelled exactly as shown when the user requests this placeholder template.
Replace `{DATE}` with the requested placeholder incident date. For monthly placeholder exercises, use the first calendar day of the month unless the user provides a specific holiday date.
Replace `region:{region}` with the region in the request, such as `region:US`, `region:UK`, `region:China`, `region:Canada`, `region:EU`, or `region:Sweden`. If the request does not specify a region, default to `region:US`.

## Workflow

1. Validate the three label values exist in Grafana IRM, including the requested `region:{region}` value.
2. Create each incident as active with the template labels.
3. Set the requested event start and end with `IncidentsService.UpdateIncidentEventTime`.
4. Add the resolution summary as an activity note.
5. Close the incident.
6. Reapply the start and end time after close, because IRM may recalculate event timing when resolving.
7. Validate resolved status and the three labels.
