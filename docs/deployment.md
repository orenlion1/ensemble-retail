# Deployment Runbook

> **Serverless since 2026-07-09.** The backend runs on AWS Lambda (Java 21, arm64, SnapStart)
> behind an API Gateway HTTP API, backed by DynamoDB — see `docs/serverless-migration.md`. EKS,
> Aurora, the NAT gateway, the ALB, and the regional WAF were decommissioned. The "Automated CI"
> section below reflects the current Lambda path; the Kubernetes/EKS operator sections further
> down are retained as historical context and no longer apply.

## Automated CI -> AWS Deployment (default path)

Every push or merge to `main` runs the `Build` workflow. When it succeeds, the `Deploy` workflow (`.github/workflows/deploy.yml`) is triggered via `workflow_run` and deploys the exact CI-passing commit:

1. Change detection: diffs the CI-passing commit against the head of the last successful `Deploy` run and computes which components changed. Docs-only pushes deploy nothing; `services/<name>/**` selects that service; `frontend/**` selects the storefront; a change to `deploy.yml` itself (or no usable base) selects everything.
2. Backend (per changed service): packages the shaded Lambda jar (`mvn package`), uploads it to the `ensemble-grafana-lambda-artifacts-<account-id>` S3 bucket, runs `aws lambda update-function-code`, publishes a new version (SnapStart snapshot), waits for it to become `Active`, and moves the `live` alias to it. The API Gateway integration targets the `live` alias, so the cutover is atomic.
3. Frontend (when changed): builds the storefront, syncs `frontend/dist/` to the frontend S3 bucket with `--delete`, and creates a CloudFront invalidation for `/*`.

Authentication uses GitHub OIDC to assume the deploy IAM role; no static AWS keys exist in GitHub. Required repository secrets: `AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE_ARN`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. The deploy role needs `lambda:UpdateFunctionCode`, `lambda:PublishVersion`, `lambda:UpdateAlias`, `lambda:GetFunction`, and `s3:PutObject` on the artifacts bucket (EKS/ECR permissions are no longer required).

Secrets and Terraform changes (including `stacks/serverless`) are NOT applied by the automated workflow; run the Terraform stacks locally.

For `stacks/cluster` and `stacks/cloudwatch-integration` specifically, `.github/workflows/terraform-apply.yml` offers a manual, guarded `workflow_dispatch` alternative to applying locally: it plans and applies via GitHub OIDC using IAM roles scoped only to those two stacks' resources, and the apply step requires a `terraform-apply` GitHub environment reviewer to approve it before AWS credentials are ever issued. See `infra/terraform/stacks/README.md` (section 9) for one-time setup and usage.

## Static Assets

1. Build the storefront with `npm run build` from `frontend/`.
2. Upload `frontend/dist/` to the S3 frontend bucket.
3. Upload inventory imagery to the image bucket or keep product image URLs in Postgres pointed at CloudFront-hosted objects.
4. Invalidate CloudFront after deploys that change entrypoint files.

## API

1. Build each Spring Boot service with `mvn package`.
2. Build and push Docker images for `inventory-service`, `cart-service`, and `account-service`.
3. Replace `IMAGE_REGISTRY`, `ACCOUNT_ID`, `ACM_CERTIFICATE_ARN`, `WAFV2_REGIONAL_ACL_ARN`, and `ALB_LOG_BUCKET` in `infra/k8s/*.yaml` with Terraform outputs and deployment values.
4. Create runtime secrets through AWS Secrets Manager or SSM Parameter Store, then sync them to Kubernetes. Use `infra/k8s/secrets.example.yaml` and `infra/k8s/observability-secrets.example.template.yaml` as schema references. Copy the template to local `observability-secrets.yaml` (gitignored) with real values before apply.
5. Apply namespace, secrets, observability, services, network policies, and ingress manifests.
6. Confirm `/actuator/health`, `/actuator/prometheus`, authenticated cart/account calls, and frontend `/api/*` calls work through CloudFront.

## Security Gate

Before public DNS cutover:

1. Run `scripts/security/predeploy-check.sh`.
2. Run frontend and service builds.
3. Confirm WAF logs, ALB access logs, EKS audit logs, and CloudFront access logs are landing in the log bucket or configured telemetry destination.
4. Confirm cart/account APIs reject unauthenticated requests and accept either Cognito JWTs or the scoped test API key.
5. Confirm no `.env`, `.tfvars`, Terraform state, source-map API keys, or Grafana Cloud tokens are committed.

## Network

Network can be applied as its own Terraform state before the rest of the platform:

1. Run `terraform init && terraform apply` from `infra/terraform/stacks/network`.
2. Run `node scripts/terraform/export-network-tfvars.mjs` from the repo root to generate `infra/terraform/network.auto.tfvars.json`.
3. Run the root stack from `infra/terraform`; with `provision_network=false`, it consumes `vpc_id`, `public_subnet_ids`, and `private_subnet_ids` instead of creating duplicate network resources.

The reusable network module lives at `infra/terraform/modules/network` and creates the VPC, public subnets, private subnets, internet gateway, NAT gateway, and route tables.

Use the remaining chunks in this order where possible: network, edge/static, cluster, data, workload IAM, then Kubernetes manifests. The detailed split plan is in `infra/terraform/stacks/README.md`.

## Domain And TLS

Use `ensemble-retail.com` as the canonical public domain. Public edge TLS is provisioned with ACM in `us-east-1` for CloudFront and API aliases. The existing Terraform state and AWS resources retain legacy `ensemble-grafana` identifiers; do not rename or recreate them as part of the repository rename. `ensemble-grafana.com` remains a compatibility alias.

Use Let's Encrypt only for direct in-cluster TLS endpoints that bypass CloudFront/ACM. For that case, install cert-manager in EKS and issue certificates using a DNS-01 Route53 solver.
