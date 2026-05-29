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

Registrar delegation for `ensemble-grafana.com` is complete. The registrar points to the `route53_name_servers` output for this hosted zone, so a normal `terraform apply` can validate the ACM certificate in `us-east-1`, attach it to CloudFront, and create apex and `www` Route53 alias records for `https://ensemble-grafana.com`.

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
export VITE_COGNITO_REDIRECT_URI="https://ensemble-grafana.com/auth/callback"
```

The frontend exchanges the Cognito authorization code with PKCE. Do not provide the Google client secret to the frontend build.

## 4. Account Baseline

`stacks/account-baseline` owns account-wide baseline controls shared across workloads. This stack currently manages the Systems Manager default host-management role/service setting used by SSM Agent (`/ssm/managed-instance/default-ec2-instance-management-role`).

Use a dedicated guarded pipeline with manual review/approval (for example, `scripts/terraform/guarded-apply-account-baseline.sh`) because this stack updates account-level settings and includes lifecycle protections (`prevent_destroy`).
The guarded apply script verifies caller identity account `629513454417` before running Terraform.

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

- Role ARN: `arn:aws:iam::629513454417:role/GrafanaLabsCloudWatchIntegration`
- External ID: `3254864`
- Trusted Grafana AWS account: `008923505280`
- Grafana stack ID: `1665320`
- Grafana Cloud Provider API URL: `https://cloud-provider-api-prod-us-east-3.grafana.net`
- Grafana AWS account resource ID: `270`
- RDS scrape job: `ensemble-grafana-rds-cloudwatch`

Troubleshooting: if Terraform cannot create the scrape job, confirm `GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN` is a Cloud Provider Observability token rather than a telemetry ingest token, and confirm `grafana_cloud_provider_url` matches the stack returned by `https://grafana.com/api/instances`. If Grafana reports `Failed to assume role on provided account`, confirm the Grafana AWS account form uses the exact `role_arn` output. A failed or successful connection attempt should appear in CloudTrail as an `AssumeRole` event for this role. If no event appears, Grafana is likely not calling this role ARN. If the Grafana UI shows different values for the 12-digit Grafana AWS account ID or External ID, pass them as `grafana_account_id` and `external_id` and reapply the stack.

## 9. Kubernetes

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
9. `kubernetes`: Kubernetes manifests or Helm releases after EKS exists.

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
