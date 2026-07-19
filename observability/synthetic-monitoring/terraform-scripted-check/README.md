# Synthetic Monitoring checks (Terraform, CI-applied)

Grafana Synthetic Monitoring scripted/browser checks for ensemble-retail, managed with Terraform
and applied in CI under the orenlion1 standard
([core-infra `docs/standards/terraform-ci-oidc.md`](https://github.com/orenlion1/core-infra/blob/main/docs/standards/terraform-ci-oidc.md)).

This is the **non-AWS-provider** adaptation of the standard:

- The **check resources are Grafana** — the provider authenticates with a Grafana Cloud token
  injected from repo **secrets** (`GRAFANA_URL`, `GRAFANA_AUTH`, `GRAFANA_SM_URL`,
  `GRAFANA_SM_ACCESS_TOKEN`), *not* AWS OIDC.
- **AWS OIDC is used only for the S3 state backend** and this stack's own two CI roles (`ci.tf`):
  read-only `terraform-plan` (any run, posts the plan on PRs) and write `terraform-apply` (only
  assumable from the required-reviewer `terraform-apply` GitHub environment).
- State lives in the shared `ensemble-grafana-tf-state-<account>` bucket, key
  `stacks/ensemble-retail-synthetics/terraform.tfstate`, S3-native `use_lockfile` locking.

The workflow is [`.github/workflows/synthetics-apply.yml`](../../../.github/workflows/synthetics-apply.yml).

## One-time bootstrap

The CI roles are created *by* an apply, so bootstrap once from a laptop with operator AWS
credentials and the Grafana token exported (see `../.env.example`):

```bash
cd observability/synthetic-monitoring/terraform-scripted-check
export GRAFANA_URL=... GRAFANA_AUTH=... GRAFANA_SM_URL=... GRAFANA_SM_ACCESS_TOKEN=...
terraform init \
  -backend-config="bucket=ensemble-grafana-tf-state-<account>" \
  -backend-config="region=us-east-1" \
  -backend-config="use_lockfile=true"
terraform apply    # creates the two CI roles and the checks

# publish the ARNs + bucket so CI stops skipping, and add the Grafana secrets:
gh variable set AWS_PLAN_ROLE_ARN  --body "$(terraform output -raw terraform_plan_role_arn)"
gh variable set AWS_APPLY_ROLE_ARN --body "$(terraform output -raw terraform_apply_role_arn)"
gh variable set TF_STATE_BUCKET    --body "ensemble-grafana-tf-state-<account>"
gh secret set GRAFANA_URL; gh secret set GRAFANA_AUTH
gh secret set GRAFANA_SM_URL; gh secret set GRAFANA_SM_ACCESS_TOKEN
```

Then configure the `terraform-apply` GitHub environment with a required reviewer, restricted to
`main`. After that, PRs plan and `main` applies — no laptop applies.

> Note: the checks are currently `enabled = false`, and a script path
> (`../sync-scripted-check.mjs`, `../create-synthetic-monitoring.sh`) also manages Synthetic
> Monitoring. Terraform and that script both touch the same Grafana resources; decide on a single
> source of truth before enabling the checks in production.
