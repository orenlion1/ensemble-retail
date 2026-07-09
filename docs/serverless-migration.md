# Option D — EKS → Lambda/DynamoDB migration runbook

Migrates the three Java services off EKS onto API Gateway + Lambda (Java 21, arm64, SnapStart)
backed by DynamoDB, then mothballs the EKS/Aurora/NAT/WAF/ALB stack. Target run-rate ≈ **$7/mo**
(down from ~$335/mo).

## Architecture after cutover

```
CloudFront (storefront, unchanged)
api.ensemble-grafana.com ─► API Gateway HTTP API ─► Lambda alias :live ─► DynamoDB
                              (stage throttle)        (reserved concurrency)   products / carts / accounts
```

No VPC, no NAT: DynamoDB is reached over the IAM-authenticated public AWS API and OTLP telemetry
egresses to Grafana Cloud over the internet.

## Security posture (WAF replacement)

| Retired WAF control | Replacement |
| --- | --- |
| `ApiRateLimitPerIp` | API Gateway stage throttle (`api_throttle_rate`/`_burst`) |
| Unbounded scaling → cost DoS | Per-function `reserved_concurrent_executions` + `$15` AWS Budgets alarm |
| Managed rule sets | App-layer auth unchanged (`X-Api-Key` + optional Cognito JWT, fail-closed); optionally keep the CloudFront edge WAF |
| Public `/actuator/prometheus` | Removed from every service's allow-list and actuator exposure |

## Stage 1–3 (done, non-destructive)

- `ensemble-products` DynamoDB table added to `infra/terraform/stacks/data`.
- Services converted to DynamoDB + `StreamLambdaHandler`; build green (`mvn -pl … package`).
- `infra/terraform/stacks/serverless` stack (`terraform validate` clean).

## Runtime config (secrets.auto.tfvars)

The serverless stack reads its runtime secrets and domain config from a **gitignored**
`infra/terraform/stacks/serverless/secrets.auto.tfvars` (auto-loaded by Terraform), so
`terraform apply` needs no `-var` flags and no cluster access:

```hcl
api_key                = "..."   # matches the services' ApiKeyAuthenticationFilter
cognito_issuer_uri     = "..."
allowed_cors_origins   = "https://ensemble-grafana.com,https://www.ensemble-grafana.com"
enable_custom_domain   = true
acm_certificate_arn    = "arn:aws:acm:us-east-1:...:certificate/..."   # SANs cover both api.* domains
route53_zone_id        = "Z0341661YMUM03LL4U91"   # ensemble-grafana.com
enable_retail_domain   = true
retail_route53_zone_id = "Z01547403K7K30O1L02DJ"  # ensemble-retail.com
```

> These previously lived in the in-cluster `ensemble-secrets` secret; that source was retired with
> EKS. If the file is lost, recover `api_key`/`cognito_issuer_uri`/`allowed_cors_origins` from a live
> Lambda version: `aws lambda get-function-configuration --function-name ensemble-grafana-cart
> --qualifier live --query 'Environment.Variables'`.

## Stage 4 — deploy & cutover (COMPLETED 2026-07-09)

The initial migration ran the steps below. Ongoing deploys are automated by `.github/workflows/deploy.yml`
(build jar → S3 → update-function-code → publish → move `live` alias); to deploy manually, rebuild the
jars and `terraform apply` the serverless stack (secrets.auto.tfvars supplies everything).

```bash
export AWS_REGION=us-east-1
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# 1. Build all three Lambda jars
for s in inventory-service cart-service account-service; do (cd services/$s && mvn -q clean package); done

# 2. Create tables (adds ensemble-products) + apply serverless stack (no custom domain yet)
terraform -chdir=infra/terraform/stacks/data apply
terraform -chdir=infra/terraform/stacks/serverless apply \
  -var="api_key=$API_TEST_KEY" -var="cognito_issuer_uri=$COGNITO_ISSUER_URI" \
  -var="otlp_endpoint=$OTEL_ENDPOINT" -var="otlp_headers=$OTEL_HEADERS"

# 3. Seed the catalog
scripts/dynamodb/seed-products.sh

# 4. Smoke-test the execute-api URL (from `terraform output api_endpoint`)
API=$(terraform -chdir=infra/terraform/stacks/serverless output -raw api_endpoint)
curl -fsS "$API/api/inventory/products" | head -c 400          # catalog (public)
curl -fsS "$API/api/inventory/categories" | head -c 200
curl -fsS -H "X-Api-Key: $API_TEST_KEY" "$API/api/cart/carts/demo-shopper"
curl -fsS -X PUT -H "X-Api-Key: $API_TEST_KEY" -H 'Content-Type: application/json' \
  -d '{"shopperId":"demo-shopper","items":[]}' "$API/api/cart/carts/demo-shopper"

# 5. DNS cutover — repoint api.ensemble-grafana.com at API Gateway
terraform -chdir=infra/terraform/stacks/serverless apply \
  -var="enable_custom_domain=true" -var="acm_certificate_arn=$ACM_ARN" \
  -var="route53_zone_id=$ZONE_ID"   # (plus the vars from step 2)
```

Confirm the first Lambda cold start succeeds — **verify SnapStart is available for arm64 Java 21
in us-east-1**; if the apply rejects `snap_start` on arm64, switch `architectures` to `["x86_64"]`.

## Stage 5 — mothball EKS + tear down legacy (GATED, destructive)

Only after cutover is validated and traffic is served by API Gateway.

```bash
# EKS control plane + nodes + k8s-managed ALB
terraform -chdir=infra/terraform/stacks/cluster destroy

# Aurora, NAT, inventory DB SG/subnet group — NOT the DynamoDB tables (deletion-protected).
# Disable deletion_protection on aws_rds_cluster.inventory first, then targeted destroy:
terraform -chdir=infra/terraform/stacks/data destroy \
  -target=aws_rds_cluster_instance.inventory_writer \
  -target=aws_rds_cluster.inventory \
  -target=aws_security_group.inventory_db \
  -target=aws_db_subnet_group.inventory

# NAT gateway lives in the network stack; remove it there. WAF ACLs (ensemble-grafana-api,
# ensemble-grafana-edge) are operator-managed — delete or keep just the CloudFront edge ACL.
```

Then update `EVOLUTION.md` + `docs/evolution/categories/infrastructure-deployment.md` and the
architecture diagrams to reflect the serverless topology.
