---
name: incident-creation
description: Use when creating Grafana IRM incidents for Ensemble-Grafana or a replicated application. Ensures every incident includes required labels for region, feature, and service, and validates label values against the documented IRM taxonomy before creating or scripting incidents.
---

# Incident Creation

Use this skill whenever creating, scripting, or documenting Grafana IRM incidents.

## Required Labels

Every incident must include these label keys:

- `region`
- `feature`
- `service`

Do not create an incident without all three. If the user omitted one, infer a reasonable value from the incident context when safe; otherwise ask for the missing value.

## Ensemble-Grafana Values

Use the current IRM taxonomy unless the target application has its own documented labels:

- `region`: `US`, `UK`, `China`, `Canada`, `EU`
- `service`: `inventory`, `cart`, `account`, `authentication`
- `feature`: `login`, `shopping-cart-add`, `shopping-cart-remove`, `shopping-cart-checkout`

Other feature values may exist from dashboard imports. Prefer the most specific value that matches the incident.

## Creation Workflow

1. Identify the incident title, severity, and impact.
2. Select `region`, `feature`, and `service`.
3. Add any additional labels requested by the user, such as `root_cause`, `client_impact`, or `product_category`.
4. Validate label keys and values before creation:

```sh
gcx api /api/plugins/grafana-irm-app/resources/api/v1/FieldsService.GetFields -d '{}' -o json
```

5. Create the incident through the project script or the IRM Incident API.

## Project Script Pattern

For Ensemble-Grafana, prefer:

```sh
REGION=US \
FEATURE=shopping-cart-checkout \
SERVICE=cart \
ROOT_CAUSE=Manual-Error \
CLIENT_IMPACT=multiple-clients \
scripts/generate-incident.sh
```

The script must send labels in this shape:

```json
{
  "labels": {
    "region": "US",
    "feature": "shopping-cart-checkout",
    "service": "cart"
  }
}
```

## Validation

After creation or script changes:

- Confirm the generated payload includes `region`, `feature`, and `service`.
- Confirm `sh -n scripts/generate-incident.sh` passes when the script is edited.
- Document any new label keys or values in the application IRM runbook.
