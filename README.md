# Ensemble-Grafana

This is a training repo to explore the art of the "promptable". Original outdoor-inspired ecommerce platform for Ensemble-grafana. The repo contains a shopper-facing JavaScript storefront, three Spring Boot microservices, AWS deployment assets, and Grafana observability configuration.

**Try the mock site:** [https://ensemble-grafana.com/](https://ensemble-grafana.com/) — browse products, use the cart and checkout flows, switch regions, and sign in with Google via Cognito to explore account features.

## Project Layout

- `frontend/` - Vite JavaScript storefront with Grafana Faro instrumentation.
- `services/inventory-service/` - Spring Boot API for categories, products, prices, stock, and image metadata.
- `services/cart-service/` - Spring Boot API for shopper cart state.
- `services/account-service/` - Spring Boot API for profile, shipping address, and wallet metadata.
- `infra/k8s/` - EKS Kubernetes manifests for services, Alloy, Beyla, and API routing.
- `infra/terraform/` - AWS infrastructure skeleton for Route53, ACM, CloudFront, WAF, S3, EKS, Postgres, and DynamoDB.
- `infra/terraform/stacks/` - Incremental Terraform stacks for network, edge/static, auth, account-baseline, cluster, data, and workload IAM.
- `observability/` - Grafana Alloy config, k8s-monitoring Helm values, synthetic checks, and starter dashboards. See `observability/README.md`.
- `load-tests/` - k6 API and browser scenarios covering users, categories, product browsing, cart, checkout, account, and synthetic button-action flows.
- `docs/` - deployment, security, domain/TLS, and Grafana IRM runbooks.
- `docs/graviton-migration.md` - plan for migrating EKS workers and service images from x86 to AWS Graviton/ARM64.
- `scripts/security/` - predeploy security checks for secrets, Kubernetes hardening, and IaC controls.
- `.github/workflows/build.yml` - GitHub Actions security checks, Maven service packages, frontend build, Playwright browser checks, and k6 script inspection.
- `.github/workflows/account-baseline-guard.yml` - Guardrail workflow for account-baseline Terraform validation and manual-approval apply path.
- `skills/` - reusable `SKILLS.md` playbooks for replicating the dependency, infrastructure, observability, and coding patterns in future applications.

## CI (GitHub Actions)

On push and pull requests to `main` or `master`, `.github/workflows/build.yml` runs:

1. `scripts/security/predeploy-check.sh` (scans **git-tracked** files for `glc_`, `glsa_`, `GOCSPX-`, AWS keys, and private keys)
2. `mvn package` for `inventory-service`, `cart-service`, and `account-service` (Java 21)
3. `npm ci`, `npm run build`, and `npm run test:e2e` for `frontend/`
4. `k6 inspect` for `load-tests/synthetic-browser-actions.js`, `load-tests/grafana-cloud-20-user-regional.js`, and `load-tests/grafana-cloud-traffic-spikes.js`

Runtime secrets stay out of git via `.gitignore` (see `infra/k8s/observability-secrets.example.template.yaml` for the observability secret schema).

## Local Development

```sh
docker compose up -d postgres dynamodb-local
cd services/inventory-service && mvn spring-boot:run
cd services/cart-service && mvn spring-boot:run
cd services/account-service && mvn spring-boot:run
cd frontend && npm install && npm run dev
```

The frontend dev server proxies `/api/inventory`, `/api/cart`, and `/api/account` to the local services.

## Terraform Deployment

Terraform is split into smaller independently runnable stacks. Run them in order so each stack can pass outputs to the next one:

```text
network -> edge-static -> auth -> account-baseline -> cluster -> data -> workload-iam -> kubernetes
```

Initialize and plan each stack from its own directory:

```sh
cd infra/terraform/stacks/network
terraform init
AWS_PROFILE=ensemble-grafana terraform plan
AWS_PROFILE=ensemble-grafana terraform apply
```

After `network` applies, export its outputs for the root stack if you still want to run the legacy composed root:

```sh
node scripts/terraform/export-network-tfvars.mjs
```

For the incremental flow, use `terraform output` values from earlier stacks as variables for later stacks:

```sh
cd infra/terraform/stacks/cluster
AWS_PROFILE=ensemble-grafana terraform plan \
  -var='private_subnet_ids=["subnet-private-a","subnet-private-b"]' \
  -var='public_subnet_ids=["subnet-public-a","subnet-public-b"]'
```

Then run:

- `edge-static`: DNS, ACM, WAF, CloudFront, frontend/image/log S3 buckets.
- `auth`: Cognito hosted UI, Google IdP, OAuth client. Any valid Google account can authenticate once the Google OAuth consent screen is published.
- `account-baseline`: account-level Systems Manager default host-management role/service setting with guarded apply and `prevent_destroy`.
- `cluster`: EKS cluster, managed node group (`t3.medium`, three nodes, desired/min/max 3), cluster/node IAM, OIDC provider.
- `data`: DynamoDB tables, Aurora/Postgres inventory DB, runtime secret.
- `workload-iam`: IRSA roles/policies for inventory, cart, and account services.
- `cloudwatch-integration`: IAM role and read policy that Grafana Cloud assumes to scrape AWS CloudWatch metrics.
- `kubernetes`: apply manifests after replacing placeholders:

```sh
aws eks update-kubeconfig --name ensemble-grafana --region us-east-1 --profile ensemble-grafana
scripts/kubernetes/apply-manifests.sh
```

The checked-in Kubernetes service manifest is pinned to the deployed account `629513454417`, ECR service images, and three replicas per Spring Boot service. Rolling updates use `maxSurge: 0` and `maxUnavailable: 2`, with PodDisruptionBudgets set to `minAvailable: 1`, so one pod remains available while the other two update. WAF rate limits are configured by the `edge-static` Terraform stack as `edge_rate_limit_per_ip` and `api_rate_limit_per_ip`, currently `200000` requests per source IP per 5-minute AWS WAF evaluation window, so repeated local 20-VU k6 smoke tests can run without being blocked by WAF. If deploying to another AWS account, replace the IRSA role annotations and image registry before applying `infra/k8s/services.yaml`.

Detailed inputs and handoff outputs are documented in `infra/terraform/stacks/README.md`. Do not commit `.tfvars`, state files, generated `network.auto.tfvars.json`, or real secrets.

To enable Grafana Cloud AWS CloudWatch metrics scraping, apply the dedicated CloudWatch integration stack. The stack creates the AWS IAM role Grafana assumes and manages the Grafana Cloud AWS/RDS CloudWatch scrape job for stack `1665320` and AWS account resource `270`.

```sh
cd infra/terraform/stacks/cloudwatch-integration
cp terraform.tfvars.example terraform.tfvars
export GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN=<grafana-cloud-provider-token>
AWS_PROFILE=ensemble-grafana terraform init
AWS_PROFILE=ensemble-grafana terraform apply
AWS_PROFILE=ensemble-grafana terraform output role_arn
AWS_PROFILE=ensemble-grafana terraform output rds_cloudwatch_scrape_job_id
```

Current applied CloudWatch integration values:

- Role ARN: `arn:aws:iam::629513454417:role/GrafanaLabsCloudWatchIntegration`
- External ID: `3254864`
- Trusted Grafana AWS account: `008923505280`
- Grafana stack ID: `1665320`
- Grafana Cloud Provider API URL: `https://cloud-provider-api-prod-us-east-3.grafana.net`
- Grafana AWS account resource ID: `270`
- RDS scrape job: `ensemble-grafana-rds-cloudwatch`
- RDS discovery tags: `Application=ensemble-grafana`, `Stack=data`, `Service=inventory`

The Terraform provider needs `GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN` with Grafana Cloud Provider Observability permissions to create or update scrape jobs. The Cloud Provider API URL was resolved from `https://grafana.com/api/instances` for stack `orenlion`. If Grafana reports `Failed to assume role on provided account`, verify the AWS account form is using the exact role ARN above. CloudTrail should show an `AssumeRole` event for that role when Grafana attempts the connection; if no event appears, Grafana is likely pointed at a different ARN or account entry. If the Grafana Cloud AWS setup page shows a different 12-digit Grafana AWS account ID or a different External ID, rerun this stack with:

```sh
AWS_PROFILE=ensemble-grafana terraform apply \
  -var='external_id=<grafana-external-id>' \
  -var='grafana_account_id=<grafana-aws-account-id>'
```

## Shopper Authentication

The Account panel uses Cognito Hosted UI with Google federation. The browser starts an OAuth authorization-code flow with PKCE, receives the callback at `/auth/callback`, exchanges the code with Cognito, and populates the account name/email from the Cognito ID token claims. Cart and account API writes use the Cognito `sub` as `shopperId` and send `Authorization: Bearer <access_token>` so the Spring Boot resource servers can validate the request.

Public frontend build variables:

```sh
VITE_COGNITO_HOSTED_UI_DOMAIN=https://ensemble-grafana.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=<cognito-app-client-id>
VITE_COGNITO_REDIRECT_URI=https://ensemble-grafana.com/auth/callback
```

The Google OAuth client must allow the Cognito IdP redirect URI from `terraform output google_oauth_redirect_uri`. Do not expose or commit the Google client secret; only the Cognito app client ID is a browser value.

## Frontend Observability

Grafana Faro is initialized with `@grafana/faro-react`, React Router instrumentation, and `@grafana/faro-web-tracing` so browser events, logs, web vitals, route changes, and frontend HTTP spans can flow to Grafana Cloud. The default collector is the Ensemble-Grafana Grafana Cloud endpoint; override it with `VITE_FARO_URL` and set `VITE_FARO_API_KEY` if your endpoint requires an API key. See `frontend/.env.example`.

Faro user actions include region, locale, and language attributes. The storefront region picker currently maps `US` to American English (`en-US`), `CA` to French (`fr-CA`), `CN` to Mandarin (`zh-CN`), `UK` to British English (`en-GB`), and `SE` to Swedish (`sv-SE`). British English copy uses regional retail terms such as `Basket`, `Delivery`, `Colours`, and `Trousers`.

Once deployed, filter Faro exception events in Grafana with:

```logql
{kind="exception", app_id="464"}
```

Production builds also support Grafana source map uploads through `@grafana/faro-rollup-plugin`. Set `FARO_SOURCEMAP_ENDPOINT`, `FARO_SOURCEMAP_API_KEY`, `FARO_APP_ID`, and `FARO_STACK_ID` in the build environment to enable source map generation and upload during `npm run build`.

## Backend Observability

Grafana Alloy is deployed in `ensemble-observability` and sends backend telemetry to Grafana Cloud through the OTLP gateway configured in `infra/k8s/observability-secrets.yaml` (copy from `infra/k8s/observability-secrets.example.template.yaml`; both runtime files are gitignored). The token used as `GRAFANA_CLOUD_API_KEY` must allow `traces:write`, `metrics:write`, `logs:write`, and `profiles:write`.

The observability capability flow is diagrammed in [DIAGRAMS.md](DIAGRAMS.md#observability-capabilities-flow).

Alloy currently collects:

- OTLP traces from the Spring Boot services on ports `4317` and `4318`.
- Prometheus metrics from pods annotated with `prometheus.io/scrape: "true"`, using each service's `/actuator/prometheus` endpoint.
- Kubernetes pod logs from the `ensemble-grafana` namespace through `loki.source.kubernetes`, converted to OTLP logs before export.
- Java CPU profiles from Spring Boot JVMs through a dedicated `pyroscope-alloy` DaemonSet using `pyroscope.java` and `pyroscope.write`.

The `pyroscope-alloy` DaemonSet runs only on nodes labeled `ensemble-grafana/profiling=enabled`. The `cluster` Terraform stack applies this label to the EKS managed node group so the DaemonSet is scheduled after `terraform apply`.

```sh
cd infra/terraform/stacks/cluster
terraform apply \
  -var='private_subnet_ids=["subnet-048c5e6caccdfe474","subnet-04685f890ee355983"]' \
  -var='public_subnet_ids=["subnet-0e0d3de57984148ef","subnet-05a28012b54f0b378"]'
```

The account-baseline stack configures the SSM account setting `/ssm/managed-instance/default-ec2-instance-management-role` to `AWSSystemsManagerDefaultEC2InstanceManagementRole`. This resolves SSM Agent errors such as:

```text
RequestManagedInstanceRoleToken: AccessDeniedException: Systems Manager's instance management role is not configured for account
```

After applying the account-baseline stack, verify:

```sh
cd infra/terraform/stacks/account-baseline
terraform output ssm_default_host_management_role_name
aws ssm get-service-setting \
  --setting-id /ssm/managed-instance/default-ec2-instance-management-role \
  --profile ensemble-grafana \
  --region us-east-1
```

Use the guarded workflow for account-level baseline changes:

```sh
CONFIRM_ACCOUNT_BASELINE_APPLY=yes \
AWS_PROFILE=ensemble-grafana \
scripts/terraform/guarded-apply-account-baseline.sh
```

The guarded apply script fails closed unless the active caller identity account matches `629513454417` and the region is `us-east-1`.

Validation on May 25, 2026: `pyroscope-alloy` was running `3/3` pods, and Grafana Cloud Profiles returned `account-service`, `cart-service`, and `inventory-service` with `process_cpu` and JVM allocation profile types in the last five minutes.

Set `GRAFANA_CLOUD_PROFILES_URL` to the Profiles/Pyroscope ingest URL shown in the Grafana Cloud stack. For this deployment, the active endpoint is `https://profiles-prod-028.grafana.net` with user `1665320`.

Useful Grafana queries:

```logql
{namespace="ensemble-grafana"}
```

```promql
http_server_requests_seconds_count{namespace="ensemble-grafana"}
```

Pyroscope profiles should appear under service names such as `inventory-service`, `cart-service`, and `account-service`.

## Production Shape

Static frontend assets and inventory images are deployed to S3 and served through CloudFront. API calls are routed separately under `/api/*` to EKS-hosted Spring Boot services. Public HTTPS for `https://ensemble-grafana.com` is terminated with an ACM certificate at the CloudFront edge, protected by AWS WAF. The `edge-static` Terraform stack creates the Route53 hosted zone, ACM DNS validation records, and apex/`www` alias records.

Registrar delegation for `ensemble-grafana.com` has been completed. The registrar now points to the Route53 hosted zone name servers:

```text
ns-1673.awsdns-17.co.uk
ns-345.awsdns-43.com
ns-843.awsdns-41.net
ns-1040.awsdns-02.org
```

Architecture diagrams have moved to [DIAGRAMS.md](DIAGRAMS.md). Rendered PNG exports are stored in `docs/diagrams/`.

## Synthetic Monitoring

`gcx` is installed with Homebrew and the Synthetic Monitoring definitions live in `observability/synthetic-monitoring`.

The active Grafana stack URL is `https://orenlion.grafana.net`, stack ID is `1665320`, and the Synthetic Monitoring API endpoint is `https://synthetic-monitoring-api-us-east-3.grafana.net`. The Synthetic Monitoring access token is separate from the OTLP/Faro/Profiles token.

```sh
cd observability/synthetic-monitoring
./create-synthetic-monitoring.sh
```

The setup script pins Synthetic Monitoring metric lookups to datasource UID `orenlion-prom`:

```sh
gcx config set grafana.server https://orenlion.grafana.net
gcx config set contexts.default.default-prometheus-datasource orenlion-prom
gcx config set contexts.default.providers.synth.sm-url https://synthetic-monitoring-api-us-east-3.grafana.net
gcx config set contexts.default.providers.synth.sm-metrics-datasource-uid orenlion-prom
```

The Grafana stack service account token comes from `infra/k8s/observability-secrets.yaml` key `GRAFANA_CLOUD_API_KEY`; use it as `GRAFANA_CLOUD_TOKEN` in `observability/synthetic-monitoring/.env`. The Synthetic Monitoring API token is separate and should be set as `GRAFANA_PROVIDER_SYNTH_SM_TOKEN`.

This explicit configuration avoids `gcx` Synthetic Monitoring auto-discovery failures for the SM URL, SM token, and metrics datasource. The status command can also be run directly:

```sh
gcx synthetic-monitoring checks status --job 'ensemble-grafana-*' --datasource-uid orenlion-prom
```

`gcx` created three private probe records:

- `ensemble-grafana-us` - probe ID `98`
- `ensemble-grafana-canada` - probe ID `99`
- `ensemble-grafana-uk` - probe ID `100`

Those private probe records are offline until their agents are deployed, so the active checks currently run from online public probes `Oregon`, `Montreal`, and `London`:

- HTTP: `ensemble-grafana-site-uptime-tls` - check ID `2493`
- HTTP: `ensemble-grafana-api-response-time` - check ID `2494`
- DNS: `ensemble-grafana-dns-resolution` - check ID `2495`
- Ping: `ensemble-grafana-ping-reachability` - check ID `2496`
- TCP: `ensemble-grafana-tcp-tls-connectivity` - check ID `2497`

Useful `gcx` commands:

```sh
gcx synthetic-monitoring probes list --limit 0
gcx synthetic-monitoring checks list --job 'ensemble-grafana-*'
gcx synthetic-monitoring checks get 2493 -o yaml
```

The checks use `alertSensitivity: none` because the Synthetic Monitoring API rejected legacy alert creation. Use Grafana-managed alert rules if alerting is needed.

If the status command returns `NODATA`, the checks are configured but Synthetic Monitoring samples are not yet visible in the selected metrics datasource/window. Recheck after the next check interval and confirm the Synthetic Monitoring datasource UID if it persists.

## Grafana IRM

IRM setup notes live in `docs/grafana-irm.md`. The OnCall API URL is `https://incident-prod-us-east-3.grafana.net/oncall` and the Incident API URL is `https://incident-prod-us-east-3.grafana.net/incident`.

The business-hours on-call helper is `observability/irm/create-business-hours-oncall.sh` and creates `Ensemble-Grafana Business Hours`, assigning the current IRM user every day from `09:00` to `17:00` in `America/New_York`.

`gcx irm oncall` currently supports listing and inspecting OnCall schedules, shifts, and users. This installed gcx build does not expose create commands for OnCall shifts or schedules, so the helper uses the official IRM API for creation and `gcx` for current-user lookup/validation when a valid IRM token is configured.

Required inputs:

```sh
export GRAFANA_IRM_TOKEN=<token-with-grafana-irm-app.schedules:write>
export GRAFANA_STACK_URL=https://orenlion.grafana.net
```

Run:

```sh
observability/irm/create-business-hours-oncall.sh
gcx irm oncall schedules list
gcx irm oncall shifts list
```

Current IRM resources:

- Schedule: `Ensemble-Grafana Business Hours`, ID `SP1JXJ6S48HAZ`.
- Shift: `Ensemble-Grafana 9-5 Eastern`, ID `OHIRQE3JJ96RI`.
- User: `orendroid`, ID `UGQ913U99XKYX`.
- Severity levels: Level 1 `Sev-1: Critical Business Impact`; Level 2 `Sev-2: Significant Business Impact`; Level 3 `Sev-3: Medium Impact`; Level 4 `Low Impact`.
- Incident label values: `client_impact`, `region`, `root_cause`, `service`, and cart/login `feature` values include the Ensemble-Grafana labels plus all additional label values extracted from the `Uptime SLA & RCA` dashboard transformations. `root_cause` includes `misconfiguration`; `service` includes `account`, `authentication`, `cart`, and `inventory`. Dashboard-derived keys now include `feature`, `hosting_type`, `impact_type`, `product`, and `serviceline`.
- Incident creation policy lives in `skills/observability/incident-creation/SKILL.md`; every incident must include `region`, `feature`, and `service` labels. The default generated incident uses `region=US`, `feature=shopping-cart-checkout`, and `service=cart`.
- 2025 holiday traffic-spike incident exercise: created and resolved incidents `2` through `22`, then pushed the reviewed set again as incidents `42` through `62`, for US federal holidays and Canadian federal statutory holidays. Each uses severity `Sev-2: Significant Business Impact`, `feature=shopping-cart-checkout`, `client_impact=multiple-clients`, `impact_type=availability`, `service=cart`, and `root_cause=Scaling-Defect-Service`; US holidays use `region=US` and Canadian holidays use `region=Canada`.
- Holiday traffic-spike incident plan: `observability/irm/holiday-traffic-spike-incidents-review.md` stages the 2025 US federal and Canadian federal statutory holiday incidents. The latest push results are in `observability/irm/generated/incident-push-summary.md` and `observability/irm/generated/incident-push-results.json`.
- China holiday traffic-spike incident exercise: pushed the reviewed 2025 China public holiday set as incidents `80` through `107`. Each uses severity `Sev-2: Significant Business Impact`, `region=China`, `feature=shopping-cart-checkout`, `client_impact=multiple-clients`, `impact_type=availability`, `service=cart`, and `root_cause=Scaling-Defect-Service`. Results are in `observability/irm/generated/china-incident-push-summary.md` and `observability/irm/generated/china-incident-push-results.json`.
- Black Friday 2025 traffic-spike incident exercise: created and resolved incident `23` for `2025-11-28`, with a four-hour event window from `10:00 AM` to `2:00 PM` Eastern (`15:00:00Z` to `19:00:00Z`) and the same checkout/cart scaling labels.
- Monthly placeholder incident exercise: created and resolved incidents `24` through `40`, then pushed the reviewed set again as incidents `63` through `79`, for each month in 2025 and January through May 2026. These intentionally use `skills/observability/incident-placeholder-template/SKILL.md` and bypass the normal `feature` and `service` label requirement, with labels `region=US`, `client_impact=multiple-clients`, and `impact_type=availablity`.
- Regional monthly placeholder incident exercise: created and resolved incidents `108` through `179` for `UK`, `China`, `Canada`, and `EU`, covering monthly placeholders from `2024-12-01` through `2026-05-01`. Ranges are `UK=108-125`, `China=126-143`, `Canada=144-161`, and `EU=162-179`. Results are in `observability/irm/generated/regional-placeholder-incident-push-summary.md` and `observability/irm/generated/regional-placeholder-incident-push-results.json`.
- Monthly placeholder incident plan: `observability/irm/monthly-placeholder-incidents-review.md` stages the same 2025 and January-May 2026 placeholder template.
- Incident push automation: run `node scripts/push-irm-incidents.mjs` after reviewing `observability/irm/generated/incidents-to-push.json`, or set `INCIDENT_INPUT_PATH`, `INCIDENT_OUTPUT_PATH`, and `INCIDENT_SUMMARY_PATH` for a regional batch. The script creates each IRM incident, applies severity, labels, event start/end times, adds the resolution summary as an activity note, closes the incident, reapplies event times, and validates the resolved incident. A schema-check incident `41` was marked as a drill and renamed as superseded so it does not represent a review-set incident.

Validate severity names with:

```sh
gcx irm incidents severities list -o json
gcx api /api/plugins/grafana-irm-app/resources/api/v1/FieldsService.GetFields -d '{}' -o json
```

The token configured from `infra/k8s/observability-secrets.yaml` line 18 is valid for telemetry ingest but returns `401 Invalid API key` for Grafana plugin/IRM settings discovery. Use an IRM-capable Grafana service account token or access policy token with `grafana-irm-app.schedules:write`, `grafana-irm-app.schedules:read`, and `grafana-irm-app.user-settings:read`.

## k6 Load Tests

The API-oriented k6 load test is `load-tests/ensemble-grafana.js`. The Grafana Cloud k6 regional load test is `load-tests/grafana-cloud-20-user-regional.js`. The traffic spike benchmark is `load-tests/grafana-cloud-traffic-spikes.js`. The scripted browser check is `load-tests/synthetic-browser-actions.js` and validates the storefront user actions that should also appear in Faro.

Important distinction for Faro validation: `grafana-cloud-20-user-regional.js` is an HTTP/API test, so it does not execute browser JavaScript and cannot emit Faro user-action events. Use `synthetic-browser-actions.js` when validating Faro user-action request counts.

All API write scenarios require `API_TEST_KEY` because cart and account workflows are protected. Set it locally or as a Grafana Cloud k6 environment variable/secret before running Cloud tests. Without it, the regional and spike tests fail fast before generating misleading 401-heavy results.

When local `.env` `API_TEST_KEY` changes, sync it to Kubernetes and restart the services that read it from environment variables:

```sh
API_TEST_KEY=$(awk -F= '$1=="API_TEST_KEY" {print substr($0,index($0,"=")+1)}' .env)
API_TEST_KEY_B64=$(printf '%s' "$API_TEST_KEY" | base64 | tr -d '\n')

kubectl -n ensemble-grafana patch secret ensemble-secrets \
  --type merge \
  -p "{\"data\":{\"API_TEST_KEY\":\"$API_TEST_KEY_B64\"}}"

kubectl -n ensemble-grafana rollout restart deployment/cart-service deployment/account-service
kubectl -n ensemble-grafana rollout status deployment/cart-service
kubectl -n ensemble-grafana rollout status deployment/account-service

kubectl -n ensemble-grafana get secret ensemble-secrets \
  -o jsonpath='{.data.API_TEST_KEY}' | base64 --decode | shasum -a 256
awk -F= '$1=="API_TEST_KEY" {v=substr($0,index($0,"=")+1); gsub(/\r$/, "", v); printf "%s", v}' .env | shasum -a 256
```

After the hashes match, run the 30-second production regional smoke test.

The regional load test now starts at 30 concurrent users for 10 minutes with five shopper personas, a 50% increase over the previous 20-user baseline:

- `browser`: browses storefront, categories, and products.
- `cart_builder`: browses men's products and updates cart quantities.
- `account_manager`: browses women's products and updates account, shipping address, and wallet metadata.
- `sale_hunter`: browses discounted products and adds sale items to cart.
- `checkout`: updates cart, saves account data, and records checkout attempts.

Each virtual user cycles through `US`, `CA`, `CN`, `UK`, and `SE`, sending `region`, `locale`, and `language` as request tags plus `X-Region`, `X-Locale`, and `X-Language`, and hitting the storefront with `?region=<region>`.

The API load scripts use low-cardinality group and request labels for Grafana Cloud reporting. Dynamic shopper IDs stay in the request path, but the k6 `name` tag is templated as values such as `PUT /api/cart/carts/:shopperId` and `PUT /api/account/accounts/:shopperId`. The scripts also import Grafana's Tempo HTTP instrumentation helper and propagate W3C trace context so Grafana Cloud k6 can correlate requests with backend traces when service traces are flowing to Grafana Cloud Traces.

Use `STOREFRONT_BASE_URL` and `API_BASE_URL` when the static site and API are routed through different origins. The current production API origin is `https://api.ensemble-grafana.com`.

Run the 30-user regional test locally:

```sh
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-grafana.com \
API_BASE_URL=https://api.ensemble-grafana.com \
k6 run load-tests/grafana-cloud-20-user-regional.js
```

Override regional load with `REGIONAL_SHOPPER_VUS` when benchmarking a different target:

```sh
REGIONAL_SHOPPER_VUS=45 \
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-grafana.com \
API_BASE_URL=https://api.ensemble-grafana.com \
k6 run load-tests/grafana-cloud-20-user-regional.js
```

Run the same regional script with embedded Faro browser actions (enabled by default) in Grafana Cloud k6:

```sh
k6 cloud run load-tests/grafana-cloud-20-user-regional.js
```

Disable browser actions when you only want API load behavior:

```sh
ENABLE_FARO_BROWSER_ACTIONS=0 k6 cloud run load-tests/grafana-cloud-20-user-regional.js
```

Tune browser action pressure in shared Cloud runs:

```sh
BROWSER_ACTION_VUS=1 \
BROWSER_ACTION_ITERATIONS=2 \
BROWSER_ACTION_MAX_DURATION=10m \
k6 cloud run load-tests/grafana-cloud-20-user-regional.js
```

Run a short smoke version:

```sh
API_TEST_KEY=<api-test-key> \
TEST_DURATION=30s \
STOREFRONT_BASE_URL=https://ensemble-grafana.com \
API_BASE_URL=https://api.ensemble-grafana.com \
k6 run load-tests/grafana-cloud-20-user-regional.js
```

Run it in Grafana Cloud k6 after authenticating the k6 CLI:

```sh
k6 cloud login --token <k6-token> --stack orenlion
k6 cloud run load-tests/grafana-cloud-20-user-regional.js
```

Run the Faro user-action browser scenario in Grafana Cloud k6:

```sh
k6 cloud run load-tests/synthetic-browser-actions.js
```

For this environment, the working k6 credential is the native Grafana Cloud k6 token configured with `k6 cloud login`. The Grafana Cloud service account token stored at `infra/k8s/observability-secrets.yaml` line 18 is configured for `gcx` as `grafana.token` and `cloud.token`, but it is not accepted by the k6 token exchange:

```text
k6 token exchange failed: invalid Grafana token format
```

Use line 18 for Grafana Cloud/OTLP-facing `gcx` configuration, Synthetic Monitoring status with explicit datasource settings, and observability deployment wiring. Use the native k6 token for `k6 cloud login`, upload, and Cloud k6 runs.

The load tests have been uploaded to Grafana Cloud k6 in stack `https://orenlion.grafana.net`, default project `7637489`:

- API flow load test: `https://orenlion.grafana.net/a/k6-app/tests/1228494`
- 30-user regional load test: `https://orenlion.grafana.net/a/k6-app/tests/1228490`
- Traffic spike benchmark: `https://orenlion.grafana.net/a/k6-app/tests/1228496`
- Browser action synthetic check: `https://orenlion.grafana.net/a/k6-app/tests/1228497`

Creating k6 load tests through `gcx` remains blocked until a Grafana Cloud token is available that both has `stacks:read` and is accepted by the k6 token exchange:

```sh
gcx k6 projects list
gcx k6 load-tests create \
  --name ensemble-grafana-30-user-regional \
  --project-id <k6-project-id> \
  --script load-tests/grafana-cloud-20-user-regional.js
```

The most recent Cloud run started successfully at `https://orenlion.grafana.net/a/k6-app/runs/7612474`, then failed immediately because `API_TEST_KEY` was not configured in the Cloud runtime.

### k6 Load Test Comparison Report

After every k6 load test concludes, pull or preserve the latest run data under `reports/load-tests/`, then generate the comparison report and visualizations:

```sh
node scripts/report-load-tests.mjs
```

The report is written to `reports/load-tests/load-test-comparison.md`. Generate it for passed, failed, and error runs whenever Grafana/k6 returns usable run metadata. Each run is identified by test name, run ID, and date. The generated `reports/load-tests/comparison/` folder includes:

- `load-test-runs.csv` for spreadsheet comparisons.
- `load-test-counters.csv` for total HTTP requests, user actions, shopping cart add/remove actions, checkout actions, cart updates, checkout attempts, and region changes.
- `load-test-results-by-date.svg` for pass/fail/error history.
- `load-test-duration-by-date.svg` for runtime comparison.
- `load-test-vuh-by-date.svg` for Grafana Cloud VUH cost comparison.
- `latest-http-failure-rate.svg`, `latest-check-pass-rate.svg`, and `latest-http-p95.svg` for latest-run health comparisons.
- `latest-user-action-totals.svg` for comparing cart add, cart remove, and API cart update totals across recent local summary files.

### k6 Traffic Spike Benchmark

The spike benchmark is `load-tests/grafana-cloud-traffic-spikes.js`. It uses the same regional shopper personas as the regional test, but benchmarks three traffic spikes where each peak is 50% higher than the previous one. The default first spike is now 40 VUs, matching the latest validated 2x benchmark level:

- Spike 1: `40` VUs.
- Spike 2: `60` VUs.
- Spike 3: `90` VUs.

Each spike ramps quickly, holds for one minute, and then returns to a low recovery load before the next spike. Requests are tagged by `spike`, `region`, `persona`, and endpoint name. The traffic spike script is now the combined benchmark entrypoint: it runs the three-spike API benchmark, the regional shopper load scenario, and the full browser-action synthetic journey that validates Faro user actions and region/language UI behavior.

Run locally:

```sh
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-grafana.com \
API_BASE_URL=https://api.ensemble-grafana.com \
k6 run load-tests/grafana-cloud-traffic-spikes.js
```

Run in Grafana Cloud k6:

```sh
k6 cloud run load-tests/grafana-cloud-traffic-spikes.js
```

This command also requires `API_TEST_KEY` to be present in the Grafana Cloud k6 project environment.

Override the first spike size with `BASE_SPIKE_USERS`; the next two spikes remain 50% larger than the previous peak:

```sh
API_TEST_KEY=<api-test-key> \
BASE_SPIKE_USERS=60 \
STOREFRONT_BASE_URL=https://ensemble-grafana.com \
API_BASE_URL=https://api.ensemble-grafana.com \
k6 run load-tests/grafana-cloud-traffic-spikes.js
```

Optional knobs for the combined scenarios:

- `REGIONAL_SHOPPER_VUS`: regional API shopper load, default `30`.
- `BROWSER_ACTION_ITERATIONS`: full browser-action synthetic iterations, default `1`.
- `BROWSER_ACTION_MAX_DURATION`: max duration for the browser-action scenario, default `10m`.

The browser action check covers:

- department/category selection.
- product sorting and search.
- region changes for US, Canada, China, UK, and Sweden.
- language changes for American English, French, Mandarin, British English, and Swedish.
- product detail open/close.
- add to cart from product grid, sale grid, and product detail.
- cart quantity change, checkout, and item removal.
- account profile, shipping address, wallet metadata, and save account.

Install k6 locally if needed:

```sh
brew install k6
```

Run the scripted browser check against production:

```sh
BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js
```

Run this production check after every frontend deployment, after the S3 sync and CloudFront invalidation have completed. It validates the deployed site still emits all expected Faro user actions and that cart, checkout, account save, and region/language flows work at the public URL.

After the production browser check, run a `gcx` Faro user-action report so Grafana Cloud confirms the events arrived:

```sh
mkdir -p reports/frontend-user-actions
node scripts/report-faro-user-actions.mjs
```

The report uses this `gcx logs query` LogQL expression to get total user executions for k6-driven Faro user actions:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

Store the summarized report in `reports/frontend-user-actions/`. It should include total executions by action name, importance, and severity. Then rerun `node scripts/report-load-tests.mjs` so `reports/load-tests/load-test-comparison.md` includes the latest Grafana Cloud Faro execution totals alongside local k6 request/action totals.

Run it against a local frontend:

```sh
cd frontend
npm run dev
BASE_URL=http://localhost:5173 k6 run ../load-tests/synthetic-browser-actions.js
```

The browser check records `data-faro-user-action-name` interactions plus change/submit actions, then fails if required actions are missing. Enable action debugging with:

```sh
DEBUG_ACTIONS=1 BASE_URL=https://ensemble-grafana.com k6 run load-tests/synthetic-browser-actions.js
```

The frontend also has Playwright browser regression tests for interactive UI behavior. These tests stub the Faro collector, verify emitted Faro action names for cart, checkout, region/language, Google login, and account save actions, check the cart delete icon, detect broken storefront images, and compare desktop/mobile screenshots.

```sh
cd frontend
npm run test:e2e
```

Regenerate screenshot baselines intentionally after reviewed layout changes:

```sh
cd frontend
npm run test:e2e -- --update-snapshots
```

## Predeploy Security

Run `scripts/security/predeploy-check.sh` before opening the platform to public traffic. The check looks for committed secret shapes and verifies the core Kubernetes, Spring Security, WAF, HSTS, and DynamoDB recovery controls are present.
