# Account Baseline Stack

This stack owns account-level AWS controls that are shared across workloads.

## Ownership

- Owner team: `platform` (override with `-var owner=...`)
- Managed by: `terraform-account-baseline-pipeline` (override with `-var managed_by=...`)
- Scope: account-wide resources only

Do not apply this stack from workload-specific pipelines or from per-cluster release jobs.

## Managed Resources

- IAM role used by Systems Manager default host management:
  - `AWSSystemsManagerDefaultEC2InstanceManagementRole` (fixed name; not configurable)
- SSM service setting:
  - `/ssm/managed-instance/default-ec2-instance-management-role`

Both resources have `lifecycle.prevent_destroy = true` to reduce accidental account-level drift or removal.

## Guarded Apply Requirements

- Use a dedicated account-baseline pipeline with manual approval.
- Require a plan review before apply.
- Enforce target account verification (`629513454417`) before plan/apply.
- Limit destructive operations:
  - no `terraform destroy`
  - no targeted destroy of managed resources

Example guarded workflow:

```bash
cd infra/terraform/stacks/account-baseline
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Repository-enforced workflow:

- Workflow: `.github/workflows/account-baseline-guard.yml`
- `guard` job validates Terraform and checks that the guarded apply script enforces account checks.
- `apply` job runs only through `workflow_dispatch`, is restricted to `main`/`master`, and uses environment `account-baseline-prod` for manual approval gates.
- Configure secret `ACCOUNT_BASELINE_APPLY_ROLE_ARN` with the AWS role ARN that can apply this stack.
- Configure GitHub environment protection for `account-baseline-prod` with required reviewers before allowing applies.

## Verifications

```bash
terraform output ssm_default_host_management_role_name
aws ssm get-service-setting \
  --setting-id /ssm/managed-instance/default-ec2-instance-management-role \
  --region us-east-1
```
