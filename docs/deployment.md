# Deployment Runbook

## Automated CI -> AWS Deployment (default path)

Every push or merge to `main` runs the `Build` workflow. When it succeeds, the `Deploy` workflow (`.github/workflows/deploy.yml`) is triggered via `workflow_run` and deploys the exact CI-passing commit:

1. Change detection: diffs the CI-passing commit against the head of the last successful `Deploy` run and computes which components changed. Docs-only pushes deploy nothing; `services/<name>/**` selects that service; `frontend/**` selects the storefront; a change to `deploy.yml` itself (or no usable base) selects everything.
2. Backend (per changed service): packages the Spring Boot service, builds and pushes its image to ECR tagged with the short commit SHA, then runs `kubectl set image` and waits for rollout status in the `ensemble-grafana` namespace.
3. Frontend (when changed): builds the storefront, syncs `frontend/dist/` to the frontend S3 bucket with `--delete`, and creates a CloudFront invalidation for `/*`.

Authentication uses GitHub OIDC to assume the deploy IAM role; no static AWS keys exist in GitHub. Required repository secrets: `AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE_ARN`, `EKS_CLUSTER_NAME`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. Kubernetes access is limited by `infra/k8s/deploy-rbac.yaml` plus an operator-managed `aws-auth` mapping to the `ensemble-retail-deployers` group.

Manifest, secret, ingress, and Terraform changes are NOT applied by the automated workflow; they stay on the operator paths below (`scripts/kubernetes/apply-manifests.sh`, Terraform stacks). `scripts/ci/poll-and-deploy.sh` remains available as a local manifest-apply gate.

For `stacks/cluster` and `stacks/cloudwatch-integration` specifically, `.github/workflows/terraform-apply.yml` offers a manual, guarded `workflow_dispatch` alternative to applying locally: it plans and applies via GitHub OIDC using IAM roles scoped only to those two stacks' resources, and the apply step requires a `terraform-apply` GitHub environment reviewer to approve it before AWS credentials are ever issued. See `infra/terraform/stacks/README.md` (section 9) for one-time setup and usage.

Similarly, for just the `alloy-config`/`pyroscope-alloy-config` ConfigMaps in
`infra/k8s/alloy-beyla.yaml`, `.github/workflows/observability-apply.yml` offers a guarded
`workflow_dispatch` alternative to running `apply-manifests.sh` locally: it diffs and applies via
GitHub OIDC using an IAM role that only grants `eks:DescribeCluster`, with real authorization
enforced by Kubernetes RBAC (`infra/k8s/observability-apply-rbac.yaml`) scoped to those two
ConfigMaps and their owning Deployment/DaemonSet, and the apply step requires an
`observability-apply` GitHub environment reviewer to approve it. See
`infra/terraform/stacks/README.md` (section 11) for one-time setup and usage.

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
