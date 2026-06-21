# Deployment Runbook

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

Use Route53 for `ensemble-grafana.com`. Public edge TLS is provisioned with ACM in `us-east-1` for CloudFront and API aliases. Domain purchase remains a manual account/registrar step; after ownership is established, point registrar name servers to the Terraform-created Route53 hosted zone.

Use Let's Encrypt only for direct in-cluster TLS endpoints that bypass CloudFront/ACM. For that case, install cert-manager in EKS and issue certificates using a DNS-01 Route53 solver.
