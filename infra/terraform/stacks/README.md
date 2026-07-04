# Incremental Terraform Stacks

Run deployment in smaller state files so high-blast-radius resources are not planned or applied every time.

## 1. Network

`stacks/network` is independently runnable and owns only the VPC, public subnets, private subnets, internet gateway, NAT gateway, and route tables.

```bash
cd infra/terraform/stacks/network
terraform init
terraform plan
terraform apply
terraform output
```

The stack exports:

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- `availability_zones`

## 2. Edge And Static Assets

`stacks/edge-static` owns DNS, ACM, WAF, CloudFront, and S3 buckets for static assets/images/logs.

```bash
cd infra/terraform/stacks/edge-static
terraform init
terraform plan
terraform apply
terraform output
```

The canonical storefront is `https://ensemble-retail.com`, while this stack intentionally retains the legacy `ensemble-grafana.com` hosted zone, Terraform defaults, and resource identifiers. Do not rename these state-backed resources during the repository rename; the legacy domain remains a compatibility alias on the existing CloudFront distribution.

## 3. Auth

`stacks/auth` owns Cognito and Google federation. It allows any user with a valid Google account to authenticate through Google; there is no domain allowlist in Terraform. Make sure the Google OAuth consent screen is published, because Google test mode still limits sign-in to test users.

```bash
cd infra/terraform/stacks/auth
terraform init
terraform plan \
  -var='google_client_id=...' \
  -var='google_client_secret=...'
terraform apply
terraform output google_oauth_redirect_uri
```

Add the `google_oauth_redirect_uri` output to the Google OAuth client's authorized redirect URIs.

Pass these public outputs to the frontend build:

```bash
export VITE_COGNITO_HOSTED_UI_DOMAIN="$(terraform output -raw cognito_hosted_ui_domain)"
export VITE_COGNITO_CLIENT_ID="$(terraform output -raw cognito_client_id)"
export VITE_COGNITO_REDIRECT_URI="https://ensemble-retail.com/auth/callback"
```

The frontend exchanges the Cognito authorization code with PKCE. Do not provide the Google client secret to the frontend build.

## 4. Account Baseline

`stacks/account-baseline` owns account-wide baseline controls shared across workloads. This stack currently manages the Systems Manager default host-management role/service setting used by SSM Agent (`/ssm/managed-instance/default-ec2-instance-management-role`).

Use a dedicated guarded pipeline with manual review/approval (for example, `scripts/terraform/guarded-apply-account-baseline.sh`) because this stack updates account-level settings and includes lifecycle protections (`prevent_destroy`).
The guarded apply script verifies caller identity account `123456789012` before running Terraform.

```bash
cd infra/terraform/stacks/account-baseline
terraform init
terraform plan -out=tfplan
terraform apply tfplan
terraform output ssm_default_host_management_role_name
```

If SSM Agent logs show `RequestManagedInstanceRoleToken AccessDeniedException` with a message like `instance management role is not configured`, confirm this stack was applied and that the service setting now points to `AWSSystemsManagerDefaultEC2InstanceManagementRole`.

## 5. Cluster

`stacks/cluster` owns the EKS control plane, node group, cluster IAM, node IAM, and OIDC provider. Pass subnet outputs from `stacks/network`.

```bash
cd infra/terraform/stacks/cluster
terraform init
terraform plan \
  -var='private_subnet_ids=["subnet-private-a","subnet-private-b"]' \
  -var='public_subnet_ids=["subnet-public-a","subnet-public-b"]'
```

Only `api`/`audit` control-plane log types are enabled (the other three produced continuous,
unused CloudWatch Logs volume). The `/aws/eks/<cluster_name>/cluster` log group is now
Terraform-managed with a 14-day retention so it stops growing forever. If the cluster was already
applied under the old config, EKS auto-created that log group with "Never Expire" retention —
import it before re-applying so Terraform doesn't try to create a duplicate:

```bash
terraform import aws_cloudwatch_log_group.eks_cluster /aws/eks/ensemble-grafana/cluster
```

## 6. Data

`stacks/data` owns DynamoDB, Aurora/Postgres, the database security group, and the runtime Secrets Manager placeholder. Pass network outputs plus the EKS cluster security group from `stacks/cluster`.

```bash
cd infra/terraform/stacks/data
terraform init
terraform plan \
  -var='vpc_id=vpc-...' \
  -var='private_subnet_ids=["subnet-private-a","subnet-private-b"]' \
  -var='eks_cluster_security_group_id=sg-...' \
  -var='inventory_db_password=...'
```

## 7. Workload IAM

`stacks/workload-iam` owns IRSA roles and policies for the Spring Boot services. Pass OIDC outputs from `stacks/cluster` and table/secret outputs from `stacks/data`.

```bash
cd infra/terraform/stacks/workload-iam
terraform init
terraform plan \
  -var='oidc_provider_arn=arn:aws:iam::123456789012:oidc-provider/...' \
  -var='oidc_provider_url=https://oidc.eks.us-east-1.amazonaws.com/id/...' \
  -var='cart_table_arn=arn:aws:dynamodb:...' \
  -var='account_table_arn=arn:aws:dynamodb:...' \
  -var='app_runtime_secret_arn=arn:aws:secretsmanager:...'
```

## 8. CloudWatch Integration

`stacks/cloudwatch-integration` owns the IAM role and inline policy that Grafana Cloud assumes to scrape AWS CloudWatch metrics. It also manages the Grafana Cloud AWS/RDS CloudWatch scrape job associated with stack `1665320` and AWS account resource `270`. The `external_id` is the value shown in the Grafana Cloud AWS integration setup; this deployment uses `3254864`.

The RDS scrape job polls every 900s (15 min) rather than 300s to cut `GetMetricData` request
volume 3x, and no longer requests the `AuroraGlobalDB*` metrics since `ensemble-inventory` is a
single-region Aurora cluster (those queries always returned empty). Both changes were made to
keep the account under its CloudWatch API request free tier.

```bash
cd infra/terraform/stacks/cloudwatch-integration
terraform init
cp terraform.tfvars.example terraform.tfvars
export GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN=<grafana-cloud-provider-token>
terraform plan
terraform apply
terraform output role_arn
terraform output rds_cloudwatch_scrape_job_id
```

Copy the `role_arn` output into the Grafana Cloud AWS CloudWatch metrics integration if the AWS account resource has not already been created.

Current applied output:

- Role ARN: `arn:aws:iam::123456789012:role/GrafanaLabsCloudWatchIntegration`
- External ID: `3254864`
- Trusted Grafana AWS account: `008923505280`
- Grafana stack ID: `1665320`
- Grafana Cloud Provider API URL: `https://cloud-provider-api-prod-us-east-3.grafana.net`
- Grafana AWS account resource ID: `270`
- RDS scrape job: `ensemble-grafana-rds-cloudwatch`
- RDS discovery tags: `Application=ensemble-grafana`, `Stack=data`, `Service=inventory`

Troubleshooting: if Terraform cannot create the scrape job, confirm `GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN` is a Cloud Provider Observability token rather than a telemetry ingest token, and confirm `grafana_cloud_provider_url` matches the stack returned by `https://grafana.com/api/instances`. If Grafana reports `Failed to assume role on provided account`, confirm the Grafana AWS account form uses the exact `role_arn` output. A failed or successful connection attempt should appear in CloudTrail as an `AssumeRole` event for this role. If no event appears, Grafana is likely not calling this role ARN. If the Grafana UI shows different values for the 12-digit Grafana AWS account ID or External ID, pass them as `grafana_account_id` and `external_id` and reapply the stack.

## 9. CI Terraform Apply (guarded OIDC)

`stacks/cluster` and `stacks/cloudwatch-integration` now declare a partial `backend "s3" {}`
block so state can be shared between local operator runs and CI, and `.github/workflows/terraform-apply.yml`
provides a manual, guarded `workflow_dispatch` path that applies either stack via GitHub OIDC
instead of static AWS keys.

**One-time setup:** run the bootstrap script locally with real AWS credentials and an
authenticated `gh` CLI:

```bash
scripts/terraform/bootstrap-ci-terraform-apply.sh
```

It is idempotent and does everything the workflow needs, in order:

1. Applies `stacks/ci-terraform-apply`, which owns the shared state backend
   (`ensemble-grafana-tf-state-<account-id>` S3 bucket + `ensemble-grafana-tf-locks` DynamoDB
   table) and the two OIDC IAM roles. This stack keeps *local* state on purpose — it is the
   bootstrap root of trust and can't depend on the backend it creates.
2. Migrates any local `stacks/cluster` / `stacks/cloudwatch-integration` state into S3 under
   `stacks/<stack>/terraform.tfstate` (local copies are renamed `terraform.tfstate.migrated-backup`).
3. Imports the EKS-auto-created `/aws/eks/ensemble-grafana/cluster` log group into the cluster
   state so the retention change manages it instead of colliding with it.
4. Creates the `terraform-apply` GitHub environment with the current `gh` user as required
   reviewer, restricted to `main`. The apply IAM role's trust policy only allows
   `AssumeRoleWithWebIdentity` from jobs running under that exact environment name, so the
   reviewer approval *is* the credential gate.
5. Sets the `TERRAFORM_PLAN_ROLE_ARN` / `TERRAFORM_APPLY_ROLE_ARN` secrets and the
   `TF_BACKEND_BUCKET` / `TF_BACKEND_DYNAMODB_TABLE` / `CLUSTER_PRIVATE_SUBNET_IDS` /
   `CLUSTER_PUBLIC_SUBNET_IDS` repository variables the workflow reads, and warns if the
   `GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN` / `GRAFANA_CLOUD_EXTERNAL_ID` secrets (`3254864`, per
   section 8 above) are missing.

**Running it:** trigger "Terraform Apply" from the Actions tab, pick the stack, leave `apply`
unchecked to get a plan-only run (posted to the job summary), then re-run with `apply` checked
once the plan looks right — the `apply` job sits pending until a `terraform-apply` environment
reviewer approves it. Backend location comes from the repository variables; the `backend_*`
inputs exist only to override them for a one-off run against different state.

The IAM roles themselves (`ensemble-grafana-terraform-plan`, `ensemble-grafana-terraform-apply`)
are scoped only to `eks:DescribeCluster`/`UpdateClusterConfig` on the `ensemble-grafana` cluster,
the `/aws/eks/ensemble-grafana/cluster` log group, and the `GrafanaLabsCloudWatchIntegration` IAM
role — they cannot touch anything else in the account. See
`infra/terraform/stacks/ci-terraform-apply/main.tf`.

## 10. Kubernetes

Kubernetes manifests remain under `infra/k8s` because they are applied after the AWS substrate exists and service account annotations have been populated with `stacks/workload-iam` outputs.

```bash
aws eks update-kubeconfig --name ensemble-grafana --region us-east-1
scripts/kubernetes/apply-manifests.sh
```

The script dry-runs example secret schemas and applies namespace, observability, services, network policies, and ingress manifests. Replace placeholders in `infra/k8s/*.yaml` before applying to a real cluster.

## Chunk Summary

Use deployment states in this order:

1. `network`: VPC, subnets, routing, NAT.
2. `edge-static`: Route53 zone, ACM certificate, WAF, S3 buckets, CloudFront.
3. `auth`: Cognito hosted UI, Google IdP, OAuth client.
4. `account-baseline`: account-level SSM default host-management role and service setting.
5. `cluster`: EKS cluster, node group, OIDC provider, cluster/node IAM.
6. `data`: DynamoDB tables, RDS/Aurora inventory database, Secrets Manager runtime secret.
7. `workload-iam`: IRSA roles and policies for inventory, cart, and account services.
8. `cloudwatch-integration`: IAM role Grafana Cloud assumes to scrape AWS CloudWatch metrics.
9. `ci-terraform-apply`: IAM roles the guarded GitHub Actions workflow assumes via OIDC to plan/apply `cluster` and `cloudwatch-integration` (bootstrap locally first — see above).
10. `kubernetes`: Kubernetes manifests or Helm releases after EKS exists.

Downstream stacks should read upstream outputs through `terraform_remote_state` or a generated `*.auto.tfvars.json` file. Keep state movement explicit with `terraform state mv` when migrating already-created resources.

To run the current root stack against a separately managed network, pass the network outputs into the root stack and disable root-owned network provisioning:

```bash
cd infra/terraform
terraform plan \
  -var='provision_network=false' \
  -var='vpc_id=vpc-...' \
  -var='private_subnet_ids=["subnet-private-a","subnet-private-b"]' \
  -var='public_subnet_ids=["subnet-public-a","subnet-public-b"]'
```

For a repeatable handoff, write the network outputs into a local ignored tfvars file for the root stack:

```bash
node scripts/terraform/export-network-tfvars.mjs
```

The generated `infra/terraform/network.auto.tfvars.json` includes `provision_network=false` plus `vpc_id`, `public_subnet_ids`, and `private_subnet_ids`.

## Migration From The Current Root State

If resources were already created by `infra/terraform`, move network objects into the standalone network state instead of recreating them. Use a temporary local state pull/push or Terraform Cloud/S3 state operations, then map the old root addresses to module addresses:

```bash
terraform state mv 'aws_vpc.main' 'module.network.aws_vpc.main'
terraform state mv 'aws_internet_gateway.main' 'module.network.aws_internet_gateway.main'
terraform state mv 'aws_eip.nat' 'module.network.aws_eip.nat'
terraform state mv 'aws_nat_gateway.main' 'module.network.aws_nat_gateway.main'
terraform state mv 'aws_route_table.public' 'module.network.aws_route_table.public'
terraform state mv 'aws_route_table.private' 'module.network.aws_route_table.private'
terraform state mv 'aws_subnet.public["us-east-1a"]' 'module.network.aws_subnet.public["us-east-1a"]'
terraform state mv 'aws_subnet.private["us-east-1a"]' 'module.network.aws_subnet.private["us-east-1a"]'
```

Adjust the subnet keys to match the availability zones in your applied state.
