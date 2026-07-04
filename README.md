# Ensemble-Retail

This is a training repo to explore the art of the "promptable" through Ensemble-Retail, an outdoor-inspired ecommerce platform. The repo contains a shopper-facing JavaScript storefront, three Spring Boot microservices, AWS deployment assets, and Grafana observability configuration.

**Try the mock site:** [https://ensemble-retail.com/](https://ensemble-retail.com/) — browse products, use the cart and checkout flows, switch regions, and sign in with Google via Cognito to explore account features.

The repository and application are named `ensemble-retail`. Existing deployed AWS, Kubernetes, Cognito, Grafana, and Terraform resources intentionally retain their `ensemble-grafana` identifiers to avoid destructive recreation. Commands below therefore continue to use legacy resource names such as the `ensemble-grafana` Kubernetes namespace, AWS profile, EKS cluster, Synthetic Monitoring jobs, and IRM schedules.

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
- `EVOLUTION.md` and `docs/evolution/` - source-backed chronology of how Ensemble-Retail was built from first prompt category to latest committed evidence, including a high-resolution Graphviz timeline.
- `docs/graviton-migration.md` - plan for migrating EKS workers and service images from x86 to AWS Graviton/ARM64.
- `scripts/security/` - predeploy security checks for secrets, Kubernetes hardening, and IaC controls.
- `.github/workflows/build.yml` - GitHub Actions security checks, Maven service packages, frontend build, Playwright browser checks, and k6 script inspection.
- `.github/workflows/account-baseline-guard.yml` - Guardrail workflow for account-baseline Terraform validation and manual-approval apply path.
- `skills/` - reusable `SKILLS.md` playbooks for replicating the dependency, infrastructure, observability, and coding patterns in future applications.
- `TODO.md` - pending operator actions against the live cluster/AWS account (steps CI intentionally doesn't perform).

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

## Automated Deployment (GitHub Actions)

Every change that reaches `main` deploys to AWS automatically. The deployment gate is CI itself: the `Deploy` workflow (`.github/workflows/deploy.yml`) is triggered by `workflow_run` only when the `Build` workflow completes successfully for a push to `main`, and it always checks out and ships the exact CI-passing commit.

```
push / merge to main
        |
        v
  Build workflow (security, backend, frontend + Playwright, observability checks)
        |  success only
        v
  Deploy workflow (GitHub OIDC -> IAM role ensemble-retail-deploy)
        |
        +--> backend, per service (inventory | cart | account):
        |      mvn package -> docker build (linux/amd64) -> push to ECR :<short-sha>
        |      -> kubectl set image -> rollout status (namespace ensemble-grafana)
        |
        +--> frontend:
               npm run build -> aws s3 sync frontend/dist -> CloudFront invalidation /*
```

Key properties of the pattern:

- **No static AWS credentials in GitHub.** The workflow's `id-token: write` permission lets it assume the deploy IAM role via the GitHub OIDC provider; the role's trust policy is scoped to this repository's `main` branch and `production` environment.
- **Least privilege on both sides.** The IAM role can only push the three service ECR repositories, describe the EKS cluster, write the frontend bucket, and create CloudFront invalidations. In-cluster, `infra/k8s/deploy-rbac.yaml` limits the role's `ensemble-retail-deployers` group to deployment patch/watch plus replicaset/pod reads in the `ensemble-grafana` namespace (mapped via the operator-managed `aws-auth` ConfigMap).
- **Placeholders stay in git, real identifiers stay in secrets.** Committed manifests keep the placeholder account/registry values; the workflow reads `AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE_ARN`, `EKS_CLUSTER_NAME`, `FRONTEND_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID` from repository secrets.
- **Traceable images.** Service images are tagged with the commit short SHA, so the running image tag identifies the deployed source revision (`kubectl -n ensemble-grafana get deployment -o wide`).
- **Change-scoped deploys.** A `changes` job diffs the CI-passing commit against the last successfully deployed commit and only runs the affected tracks: `services/<name>/**` triggers that service's image rollout, `frontend/**` triggers the storefront sync, and docs-only pushes skip deployment entirely (a `deploy.yml` change redeploys everything).
- **Bounded scope.** Only service images and the storefront deploy automatically. Kubernetes manifest, secret, ingress, and Terraform changes remain operator-applied via `scripts/kubernetes/apply-manifests.sh` and the Terraform stacks (see `docs/deployment.md`); `scripts/ci/poll-and-deploy.sh` remains as the local manifest-apply gate.

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

The checked-in Kubernetes service manifest is pinned to the deployed account `123456789012`, ECR service images, and the current spike-test profile: `inventory-service`, `cart-service`, and `account-service` each run 1 pod to preserve visible downstream saturation signals during k6 regional-load tests. Rolling updates use `maxSurge: 1` and `maxUnavailable: 0`, with PodDisruptionBudgets set to `minAvailable: 1`, so a replacement pod is started before the running pod budget is reduced during routine rollouts. WAF rate limits are configured by the `edge-static` Terraform stack as `edge_rate_limit_per_ip` and `api_rate_limit_per_ip`, currently `200000` requests per source IP per 5-minute AWS WAF evaluation window, so repeated local 20-VU k6 smoke tests can run without being blocked by WAF. If deploying to another AWS account, replace the IRSA role annotations and image registry before applying `infra/k8s/services.yaml`.

`inventory-service` is hardened for the 400-VU traffic-spike RCA where `/api/inventory/products` returned an HTML edge/origin error page and the pod was OOMKilled. The service now caches the small catalog/category result sets in-process, caps the Postgres Hikari pool to four connections, sets readiness/liveness health groups to the lightweight Kubernetes state indicators instead of DB health, enables dynamic profiler-agent loading without warnings, and runs with a larger `150m/384Mi` request and `750m/768Mi` limit. The JVM image entrypoint uses `MaxRAMPercentage=60` and `InitialRAMPercentage=30` so heap leaves room for native memory, Tomcat, JDBC, OTel, and Pyroscope. Readiness waits 60 seconds, then checks every 10 seconds with `timeoutSeconds: 5` and `failureThreshold: 5`; liveness waits 120 seconds before checking every 20 seconds with the same timeout and failure threshold.

To apply or roll back the saturation-test replica profile:

```sh
kubectl apply -f infra/k8s/services.yaml
kubectl -n ensemble-grafana rollout status deployment/inventory-service
kubectl -n ensemble-grafana rollout status deployment/cart-service
kubectl -n ensemble-grafana rollout status deployment/account-service

# Reapply the current one-pod saturation profile.
kubectl -n ensemble-grafana scale deployment/inventory-service --replicas=1
kubectl -n ensemble-grafana scale deployment/cart-service --replicas=1
kubectl -n ensemble-grafana scale deployment/account-service --replicas=1
```

During saturation runs, watch Grafana for Kubernetes CPU/memory utilization, pod restart count, throttling, service RED metrics, k6 HTTP failure rate, p95/p99 latency, and Faro user-action timing. Run `node scripts/report-load-tests.mjs` after each k6 run so the load-test comparison report captures the saturation effect.

To compare a local kubelet-log remediation plan with Grafana Assistant's remediation plan, use the repo alias `/compare-kubelet-resolution-plan`. The command definition is `.codex/commands/compare-kubelet-resolution-plan.md` and calls `gcx assistant prompt --context assistant-oauth` with the same kubelet ERROR-log analysis prompt used for the local Resolution Plan. The `assistant-oauth` context uses browser OAuth for Grafana Assistant, while the default `gcx` context remains the service-account context for dashboards, datasources, IRM, Synthetic Monitoring, and other automation. If Assistant returns `HTTP 401: invalid user`, rerun `gcx login assistant-oauth --server https://orenlion.grafana.net` and choose OAuth browser auth.

The Grafana dashboard `Ensemble Performance` includes a `kubelet` tab for probe-failure RCA. The tab is managed from `observability/grafana/dashboards/ensemble-red-log-signals.json` and was published with `gcx dashboards update ensemble-red-log-signals`. It includes Loki panels for kubelet probe failures grouped by service (`containerName`), pod, probe type, and node/instance, plus raw probe-failure details. To refresh and republish the dashboard manifest:

```sh
gcx dashboards get ensemble-red-log-signals -o json > observability/grafana/dashboards/ensemble-red-log-signals.json
gcx dashboards update ensemble-red-log-signals -f observability/grafana/dashboards/ensemble-red-log-signals.json
```

The same dashboard also includes a `Frontend` tab for Faro behavior anomalies in user actions. The tab uses the Grafana Cloud Loki datasource and queries `{app_id="464", kind="event"}` Faro events with `event_name=faro.user.action`. It surfaces user-action volume by action, p95 action duration, critical/high-importance actions, region and locale mix, cart/checkout action volume, frontend exception/error signals, and raw user-action details.

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

- Role ARN: `arn:aws:iam::123456789012:role/GrafanaLabsCloudWatchIntegration`
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

The Account panel uses Cognito Hosted UI with Google federation. The browser starts an OAuth authorization-code flow with PKCE, receives the callback at `/auth/callback`, exchanges the code with Cognito, and populates the account name/email from the Cognito ID token claims. Anonymous cart and account changes stay in browser local storage and do not call protected write APIs. After sign-in, cart and account API writes use the Cognito `sub` as `shopperId` and send `Authorization: Bearer <access_token>` so the Spring Boot resource servers can validate the request.

Public frontend build variables:

```sh
VITE_COGNITO_HOSTED_UI_DOMAIN=https://ensemble-grafana.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=<cognito-app-client-id>
VITE_COGNITO_REDIRECT_URI=https://ensemble-retail.com/auth/callback
```

The Google OAuth client must allow the Cognito IdP redirect URI from `terraform output google_oauth_redirect_uri`. Do not expose or commit the Google client secret; only the Cognito app client ID is a browser value.

## Frontend Observability

Grafana Faro is initialized with `@grafana/faro-react`, React Router instrumentation, and `@grafana/faro-web-tracing` so browser events, logs, web vitals, route changes, and frontend HTTP spans can flow to Grafana Cloud. The default collector is the Ensemble-Retail Grafana Cloud endpoint; override it with `VITE_FARO_URL` and set `VITE_FARO_API_KEY` if your endpoint requires an API key. See `frontend/.env.example`.

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

The guarded apply script fails closed unless the active caller identity account matches `123456789012` and the region is `us-east-1`.

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

### Honeycomb burst protection (2026-07-04)

Alloy also fans traces/logs/metrics out to Honeycomb in parallel with Grafana Cloud (see
`infra/k8s/alloy-beyla.yaml`, mirrored in `observability/alloy/config.alloy`). Full
duplication of the metrics scraped every 30s tripped Honeycomb's burst protection (>2x
daily event target). Metrics no longer fan out to Honeycomb at all, and Honeycomb-bound
traces/logs are now sampled to 20% via a new `otelcol.processor.probabilistic_sampler`
stage; Grafana Cloud keeps full fidelity. See `observability/README.md#honeycomb-burst-protection-2026-07-04`
for how to apply, tune the sampling rate, or revert to full fan-out.

Applying that ConfigMap change to the live cluster no longer strictly requires local
`kubectl`/AWS credentials: the guarded `.github/workflows/observability-apply.yml`
(`workflow_dispatch`) diffs and applies just the two Alloy ConfigMaps via GitHub OIDC, gated by
an `observability-apply` environment reviewer, same pattern as the Terraform-apply workflow
below. It needs a one-time bootstrap first — see `infra/terraform/stacks/README.md` section 11
and `TODO.md`.

## Production Shape

Static frontend assets and inventory images are deployed to S3 and served through CloudFront. API calls are routed separately under `/api/*` to EKS-hosted Spring Boot services. The canonical public URL is `https://ensemble-retail.com`; `https://ensemble-grafana.com` remains a legacy alias on the same CloudFront distribution. HTTPS is terminated with ACM at the CloudFront edge and protected by AWS WAF. The existing `edge-static` Terraform stack and its resource identifiers remain legacy-named to prevent replacement of stateful or edge resources.

The retained legacy `ensemble-grafana.com` Route53 hosted zone uses these name servers:

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

Those private probe records are offline until their agents are deployed. To control Grafana Cloud Synthetic Monitoring cost, the repo keeps the check code and manifests but sets every `ensemble-grafana-*` check to `enabled: false`. Re-enable only the specific check needed for a validation window, then disable it again after the run. When enabled, the checks use online public probes `Oregon`, `Montreal`, and `London`:

- HTTP: `ensemble-grafana-site-uptime-tls` - check ID `2493`
- HTTP: `ensemble-grafana-api-response-time` - check ID `2494`
- DNS: `ensemble-grafana-dns-resolution` - check ID `2495`
- Ping: `ensemble-grafana-ping-reachability` - check ID `2496`
- TCP: `ensemble-grafana-tcp-tls-connectivity` - check ID `2497`
- Scripted k6: `ensemble-grafana-scripted-storefront-api` - check ID `2545`
- k6 browser: `ensemble-grafana-browser-user-actions` - repo definition added for the same browser action journey used by the traffic-spike load test; live check ID is pending Terraform creation/import.

The scripted k6 check follows Grafana Synthetic Monitoring requirements: one VU, one iteration, no external data files, and only standard k6 imports. It loads the storefront, validates the public inventory list, fetches one product detail by ID, and confirms the protected cart API rejects unauthenticated access. The single source of truth is the script `observability/synthetic-monitoring/ensemble-retail-scripted-check.js`. Terraform reads it via `file()`, and the YAML check manifest `observability/synthetic-monitoring/check-scripted-storefront-api.yaml` embeds it through a generator, so edit only the `.js` file.

The k6 browser check closes the Synthetic Monitoring gap for load-tested user actions. Its source of truth is the load-test browser journey `load-tests/synthetic-browser-actions.js`, which is also imported by `load-tests/grafana-cloud-traffic-spikes.js` as the `storefront_actions` scenario. The generator `observability/synthetic-monitoring/sync-browser-action-check.mjs` emits a standalone Synthetic Monitoring script at `observability/synthetic-monitoring/ensemble-retail-browser-action-check.js` and embeds that script in `observability/synthetic-monitoring/check-browser-user-actions.yaml` under `settings.browser.script`. The check validates every exact and dynamic user-action family exercised by the load test: navigation, department/category selection, sort/search, US/Canada/China/UK/Sweden region and language changes, product detail open/close, grid/detail/sale cart adds, quantity change, checkout, checkout dialog close, item removal, Google sign-in control visibility, and account save.

Validate the scripted check locally, then regenerate and verify the manifest before pushing changes. These commands inspect code and manifests only; they do not enable the live Synthetic Monitoring checks:

```sh
k6 run observability/synthetic-monitoring/ensemble-retail-scripted-check.js
node observability/synthetic-monitoring/sync-scripted-check.mjs
node observability/synthetic-monitoring/sync-scripted-check.mjs --check
node observability/synthetic-monitoring/sync-browser-action-check.mjs
node observability/synthetic-monitoring/sync-browser-action-check.mjs --check
k6 inspect observability/synthetic-monitoring/ensemble-retail-browser-action-check.js
```

The `observability` job in `.github/workflows/build.yml` runs both sync checks and `k6 inspect` on the scripted and browser-check sources, so stale Synthetic Monitoring manifests fail CI. CI keeps the disabled check code healthy without driving live Synthetic Monitoring execution cost.

`gcx synthetic-monitoring checks create` currently returns `failed to decode incoming check` for generated k6 script manifests even though `gcx` can list and query created checks. On June 10, 2026, the same error was observed for `observability/synthetic-monitoring/check-browser-user-actions.yaml`. Use the Grafana Terraform provider wrapper in `observability/synthetic-monitoring/terraform-scripted-check/` for k6 scripted and k6 browser creation/update. Required provider environment variables are `GRAFANA_URL`, `GRAFANA_AUTH`, `GRAFANA_SM_URL`, `GRAFANA_SM_ACCESS_TOKEN`, and `GRAFANA_STACK_ID`. Because check ID `2545` was created before a repo-local Terraform state was committed, import it before managing updates from this wrapper; after creating the browser check, import its live ID as `grafana_synthetic_monitoring_check.browser_user_actions`:

```sh
terraform -chdir=observability/synthetic-monitoring/terraform-scripted-check init
terraform -chdir=observability/synthetic-monitoring/terraform-scripted-check import grafana_synthetic_monitoring_check.scripted 2545
terraform -chdir=observability/synthetic-monitoring/terraform-scripted-check import grafana_synthetic_monitoring_check.browser_user_actions <browser-check-id>
terraform -chdir=observability/synthetic-monitoring/terraform-scripted-check apply
```

Useful `gcx` commands:

```sh
gcx synthetic-monitoring probes list --limit 0
gcx synthetic-monitoring checks list --job 'ensemble-grafana-*'
gcx synthetic-monitoring checks list -o json --no-truncate | jq '[.[] | select(.spec.settings | has("scripted"))]'
gcx synthetic-monitoring checks get 2493 -o yaml
```

The checks use `alertSensitivity: none` because the Synthetic Monitoring API rejected legacy alert creation. Use Grafana-managed alert rules if alerting is needed.

If the status command returns `NODATA`, the checks are configured but Synthetic Monitoring samples are not yet visible in the selected metrics datasource/window. Recheck after the next check interval and confirm the Synthetic Monitoring datasource UID if it persists.

## Grafana IRM

IRM setup notes live in `docs/grafana-irm.md`. The OnCall API URL is `https://incident-prod-us-east-3.grafana.net/oncall` and the Incident API URL is `https://incident-prod-us-east-3.grafana.net/incident`.

The business-hours on-call helper is `observability/irm/create-business-hours-oncall.sh` and creates `Ensemble-Grafana Business Hours`, assigning the current IRM user every day from `09:00` to `17:00` in `America/New_York`.

The 24/7 SRE on-call helper is `observability/irm/create-sre-24x7-oncall.sh` and creates `Ensemble-Grafana SRE 24x7`, assigning user `orendroid` every day for a 24-hour recurrent shift in `America/New_York`, scoped to team `SRE`, and connected to Slack channel `#sre`.

`gcx irm oncall` currently supports listing and inspecting OnCall schedules, shifts, and users. This installed gcx build does not expose create commands for OnCall shifts or schedules, so the helper uses the official IRM API for creation and `gcx` for current-user lookup/validation when a valid IRM token is configured.

Required inputs:

```sh
export GRAFANA_IRM_TOKEN=<token-with-grafana-irm-app.schedules:write>
export GRAFANA_STACK_URL=https://orenlion.grafana.net
```

Run:

```sh
observability/irm/create-business-hours-oncall.sh
observability/irm/create-sre-24x7-oncall.sh
gcx irm oncall schedules list
gcx irm oncall shifts list
```

Current IRM resources:

- Schedule: `Ensemble-Grafana Business Hours`, ID `SP1JXJ6S48HAZ`.
- Shift: `Ensemble-Grafana 9-5 Eastern`, ID `OHIRQE3JJ96RI`.
- Schedule: `Ensemble-Grafana SRE 24x7`, ID `SG6C9816MEKQQ`, team `SRE` (`TWU2GNHZYST7U`), Slack channel `#sre` (`C0B6UFESQR5`).
- Shift: `Ensemble-Grafana SRE 24x7`, ID `OTL337ZBLLAUC`, daily 24-hour recurrence starting `2026-05-31T00:00:00` in `America/New_York`.
- Escalation chain: `SRE-Escalation`, ID `FXIJQB51CYLL3`; first policy `EQFWNRZQGD1DQ` uses `notify_on_call_from_schedule` with schedule `SG6C9816MEKQQ`, followed by a 15-minute wait and team-member fallback.
- User: `orendroid`, ID `UGQ913U99XKYX`.
- Severity levels: Level 1 `Sev-1: Critical Business Impact`; Level 2 `Sev-2: Significant Business Impact`; Level 3 `Sev-3: Medium Impact`; Level 4 `Low Impact`.
- Incident label values: `client_impact`, `detection`, `region`, `root_cause`, `service`, and cart/login `feature` values retain the legacy Ensemble-Grafana labels plus all additional label values extracted from the `Uptime SLA & RCA` dashboard transformations. `detection` includes `manual`, `synthetic-monitoring`, `grafana-alert`, `k6-load-test`, `customer-report`, and `call-in`; `root_cause` includes `misconfiguration`; `service` includes `account`, `authentication`, `cart`, and `inventory`. Dashboard-derived keys now include `feature`, `hosting_type`, `impact_type`, `product`, and `serviceline`.
- Incident creation policy lives in `skills/observability/incident-creation/SKILL.md`; every incident must include `region`, `feature`, `service`, and `detection` labels. The default generated incident uses `region=US`, `feature=shopping-cart-checkout`, `service=cart`, and `detection=manual`.
- 2025 holiday traffic-spike incident exercise: created and resolved incidents `2` through `22`, then pushed the reviewed set again as incidents `42` through `62`, for US federal holidays and Canadian federal statutory holidays. Each uses severity `Sev-2: Significant Business Impact`, `feature=shopping-cart-checkout`, `client_impact=multiple-clients`, `impact_type=availability`, `service=cart`, and `root_cause=Scaling-Defect-Service`; US holidays use `region=US` and Canadian holidays use `region=Canada`.
- Holiday traffic-spike incident plan: `observability/irm/holiday-traffic-spike-incidents-review.md` stages the 2025 US federal and Canadian federal statutory holiday incidents. The latest push results are in `observability/irm/generated/incident-push-summary.md` and `observability/irm/generated/incident-push-results.json`.
- China holiday traffic-spike incident exercise: pushed the reviewed 2025 China public holiday set as incidents `80` through `107`. Each uses severity `Sev-2: Significant Business Impact`, `region=China`, `feature=shopping-cart-checkout`, `client_impact=multiple-clients`, `impact_type=availability`, `service=cart`, and `root_cause=Scaling-Defect-Service`. Results are in `observability/irm/generated/china-incident-push-summary.md` and `observability/irm/generated/china-incident-push-results.json`.
- Black Friday 2025 traffic-spike incident exercise: created and resolved incident `23` for `2025-11-28`, with a four-hour event window from `10:00 AM` to `2:00 PM` Eastern (`15:00:00Z` to `19:00:00Z`) and the same checkout/cart scaling labels.
- Black Friday 2025 shopping-cart-add availability incident exercise: created and resolved incident `205` for `2025-11-28`, with an event window from `9:00 AM` to `5:00 PM` Eastern (`14:00:00Z` to `22:00:00Z`). Labels are `region=US`, `feature=shopping-cart-add`, `service=cart`, `client_impact=multiple-clients`, `impact_type=availability`, and `root_cause=Scaling-Defect-Service`. Results are in `observability/irm/generated/black-friday-2025-shopping-cart-add-push-summary.md` and `observability/irm/generated/black-friday-2025-shopping-cart-add-push-results.json`.
- Monthly placeholder incident exercise: created and resolved incidents `24` through `40`, then pushed the reviewed set again as incidents `63` through `79`, for each month in 2025 and January through May 2026. Incident `209` records the June 2026 placeholder with `detection=call-in`. These intentionally use `skills/observability/incident-placeholder-template/SKILL.md` and bypass the normal `feature` and `service` label requirement, while current placeholder guidance keeps `detection=manual` unless a specific detection source is requested. The regenerated June 2026 placeholder uses `impact_type=availability`; older placeholder records used labels `region=US`, `client_impact=multiple-clients`, and the historical misspelling `impact_type=availablity`.
- Regional monthly placeholder incident exercise: created and resolved incidents `108` through `179` for `UK`, `China`, `Canada`, and `EU`, covering monthly placeholders from `2024-12-01` through `2026-05-01`. Ranges are `UK=108-125`, `China=126-143`, `Canada=144-161`, and `EU=162-179`. Results are in `observability/irm/generated/regional-placeholder-incident-push-summary.md` and `observability/irm/generated/regional-placeholder-incident-push-results.json`. Sweden was added as a `region` label value and pushed as resolved incidents `184` through `200`, covering monthly placeholders from `2025-01-01` through `2026-05-01`; results are in `observability/irm/generated/sweden-placeholder-incident-push-summary.md` and `observability/irm/generated/sweden-placeholder-incident-push-results.json`.
- Monthly placeholder incident plan: `observability/irm/monthly-placeholder-incidents-review.md` stages the same 2025 and January-May 2026 placeholder template.
- Incident push automation: run `node scripts/push-irm-incidents.mjs` after reviewing `observability/irm/generated/incidents-to-push.json`, or set `INCIDENT_INPUT_PATH`, `INCIDENT_OUTPUT_PATH`, and `INCIDENT_SUMMARY_PATH` for a regional batch. The script creates each IRM incident, applies severity, labels, event start/end times, adds the resolution summary as an activity note, closes the incident, reapplies event times, and validates the resolved incident. A schema-check incident `41` was marked as a drill and renamed as superseded so it does not represent a review-set incident.

Validate severity names with:

```sh
gcx irm incidents severities list -o json
gcx api /api/plugins/grafana-irm-app/resources/api/v1/FieldsService.GetFields -d '{}' -o json
```

The token configured from `infra/k8s/observability-secrets.yaml` line 18 is valid for telemetry ingest but returns `401 Invalid API key` for Grafana plugin/IRM settings discovery. Use an IRM-capable Grafana service account token or access policy token with `grafana-irm-app.schedules:write`, `grafana-irm-app.schedules:read`, and `grafana-irm-app.user-settings:read`.

## k6 Load Tests

The API-oriented k6 load test is `load-tests/ensemble-retail.js`. The Grafana Cloud k6 regional load test is `load-tests/grafana-cloud-20-user-regional.js`. The traffic spike benchmark is `load-tests/grafana-cloud-traffic-spikes.js`. The scripted browser check is `load-tests/synthetic-browser-actions.js` and validates the storefront user actions that should also appear in Faro.

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

Use `STOREFRONT_BASE_URL` and `API_BASE_URL` when the static site and API are routed through different origins. Load tests default to `https://ensemble-retail.com` so both storefront and `/api/*` traffic traverse CloudFront. The direct production API origin is `https://api.ensemble-retail.com` and should be used only when intentionally bypassing CloudFront.

Run the 30-user regional test locally:

```sh
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-retail.com \
API_BASE_URL=https://ensemble-retail.com \
k6 run load-tests/grafana-cloud-20-user-regional.js
```

Override regional load with `REGIONAL_SHOPPER_VUS` when benchmarking a different target:

```sh
REGIONAL_SHOPPER_VUS=45 \
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-retail.com \
API_BASE_URL=https://ensemble-retail.com \
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
STOREFRONT_BASE_URL=https://ensemble-retail.com \
API_BASE_URL=https://ensemble-retail.com \
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
- Browser action synthetic check: `https://orenlion.grafana.net/a/k6-app/tests/1233226`

Creating k6 load tests through `gcx` remains blocked until a Grafana Cloud token is available that both has `stacks:read` and is accepted by the k6 token exchange:

```sh
gcx k6 projects list
gcx k6 load-tests create \
  --name ensemble-retail-30-user-regional \
  --project-id <k6-project-id> \
  --script load-tests/grafana-cloud-20-user-regional.js
```

The most recent Cloud run started successfully at `https://orenlion.grafana.net/a/k6-app/runs/7612474`, then failed immediately because `API_TEST_KEY` was not configured in the Cloud runtime.

When `gcx k6 runs list` fails with the k6 token-exchange error, pull run history through the Grafana k6 Cloud REST API with the native k6 token instead:

```sh
set -a
source .env
set +a
node scripts/pull-k6-runs-direct.mjs
node scripts/report-load-tests.mjs
```

The direct pull uses `Authorization: Bearer $K6_CLOUD_TOKEN`, `X-Stack-Id: 1665320`, and the documented `/cloud/v6/load_tests/{id}/test_runs` endpoint. It writes normalized `reports/load-tests/k6-summary-*.json` and `reports/load-tests/k6-runs-*.json` files for the comparison report. Raw `k6-*.json` report pulls stay gitignored.

### k6 Load Test Comparison Report

After every k6 load test concludes, pull or preserve the latest run data under `reports/load-tests/`, then generate the comparison report and visualizations:

```sh
node scripts/report-load-tests.mjs
```

The report is written to `reports/load-tests/load-test-comparison.md`. Generate it for passed, failed, and error runs whenever Grafana/k6 returns usable run metadata. Each run is identified by test name, run ID, and date. The same command also refreshes the Graphviz load-run history table under `docs/graphviz/load-run-table.*`. The generated `reports/load-tests/comparison/` folder includes:

- `load-test-runs.csv` for spreadsheet comparisons.
- `load-test-counters.csv` for total HTTP requests, user actions, shopping cart add/remove actions, checkout actions, cart updates, checkout attempts, and region changes.
- `load-test-results-by-date.svg` for pass/fail/error history.
- `load-test-duration-by-date.svg` for runtime comparison.
- `load-test-vuh-by-date.svg` for Grafana Cloud VUH cost comparison.
- `latest-http-failure-rate.svg`, `latest-check-pass-rate.svg`, and `latest-http-p95.svg` for latest-run health comparisons.
- `latest-user-action-totals.svg` for comparing cart add, cart remove, and API cart update totals across recent local summary files.

Latest saturation exercise:

- `2026-06-08 12:32 EDT`: Grafana Cloud k6 traffic spike run `7718235` completed and passed the current 100/200/400 VU spike profile with the steady API request-rate scenario at `120` requests/second. URL: `https://orenlion.grafana.net/a/k6-app/runs/7718235`.
- k6 signal: the direct k6 Cloud run-history pull recorded result `passed`, status `completed`, duration `600` seconds, request rate `120` requests/second, combined max VUs `615`, max browser VUs `5`, and total cost `108.01` VUH. Grafana k6 Cloud aggregate metrics recorded `269,448` HTTP requests, `0%` HTTP failures, `87.6ms` HTTP p95, `274.4ms` HTTP p99, and `71,961` steady API request-rate iterations against the `>=68,400` threshold. The refreshed comparison report is `reports/load-tests/load-test-comparison.md`.
- Faro signal: `node scripts/report-faro-user-actions.mjs` recorded `9,717` user-action executions in the rolling six-hour Grafana Cloud log query window, with the per-action report under `reports/frontend-user-actions/`.
- Dashboard signal: the refreshed `docs/graphviz/load-run-table.dot` was published to the `User Action Traffic: Real Users vs k6` dashboard `Load Run History` panel `panel-17`, then fetched back into `observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json`.

### k6 Traffic Spike Benchmark

Slash command alias: `/run-load-test`. The repo-local command definition is `.codex/commands/run-load-test.md` and points agents at `skills/observability/SKILLS.md` before running the benchmark and post-run reports.

The spike benchmark is `load-tests/grafana-cloud-traffic-spikes.js`. The alternate Grafana Cloud run entrypoint `load-tests/grafana-cloud-traffic-spikes-2.js` reuses the same scenarios and thresholds, but publishes the run under the Cloud k6 test name `ensemble-retail-traffic-spikes-2`. It uses the same regional shopper personas as the regional test, but benchmarks three traffic spikes where each peak is 2x the previous one. The default first spike is now 100 VUs:

- Spike 1: `100` VUs.
- Spike 2: `200` VUs.
- Spike 3: `400` VUs.

Each spike ramps quickly, holds for 1 minute 20 seconds, and then returns to a low recovery load before the next spike. The default combined run lasts 10 minutes: a 10-minute API spike profile, 10 minutes of regional shoppers, a steady 5 requests/second API scenario, and 10 minutes of browser actions for Faro validation. Requests are tagged by `spike`, `region`, `persona`, and endpoint name. The traffic spike script is now the combined benchmark entrypoint: it runs the three-spike API benchmark, the regional shopper load scenario, a constant-arrival-rate API scenario, and a browser-action scenario that repeatedly executes the full storefront journey so Faro receives user-action events during the load window. To avoid inventory-service receiving a disproportionate share of the load, spike shopper journeys refresh catalog data every third iteration by default (`INVENTORY_REQUEST_INTERVAL=3`), and the steady API-rate scenario sends 20% of requests to inventory, 60% to cart, 10% to account, and 10% to the storefront.

Run in Grafana Cloud k6:

```sh
set -a
source .env
set +a
K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
  -e API_TEST_KEY="$API_TEST_KEY" \
  -e STOREFRONT_BASE_URL=https://ensemble-retail.com \
  -e API_BASE_URL=https://ensemble-retail.com \
  load-tests/grafana-cloud-traffic-spikes.js
```

Use the second named Cloud k6 test when a separate Grafana Cloud run history is needed:

```sh
set -a
source .env
set +a
K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
  -e API_TEST_KEY="$API_TEST_KEY" \
  -e STOREFRONT_BASE_URL=https://ensemble-retail.com \
  -e API_BASE_URL=https://ensemble-retail.com \
  load-tests/grafana-cloud-traffic-spikes-2.js
```

The command uploads the execution to Grafana Cloud k6 and returns a run URL. `K6_CLOUD_TOKEN` authenticates the upload from the local shell. The `-e` flags inject `API_TEST_KEY`, `STOREFRONT_BASE_URL`, and `API_BASE_URL` into the remote Grafana Cloud k6 workers; do not rely on plain shell variable assignments for protected application values. `API_TEST_KEY` can come from the local `.env` injection above or from the Grafana Cloud k6 project environment. The default `API_BASE_URL` is `https://ensemble-retail.com`, so `/api/*` requests traverse CloudFront and the edge WAF before reaching the API origin. Set `API_BASE_URL=https://api.ensemble-retail.com` only when intentionally testing the ALB/API origin directly.

Local execution is only for script debugging:

```sh
API_TEST_KEY=<api-test-key> \
STOREFRONT_BASE_URL=https://ensemble-retail.com \
API_BASE_URL=https://ensemble-retail.com \
k6 run load-tests/grafana-cloud-traffic-spikes.js
```

Override the first spike size with `BASE_SPIKE_USERS`; the next two spikes remain 2x larger than the previous peak by default. Override the multiplier with `SPIKE_MULTIPLIER` only when debugging a different profile:

```sh
set -a
source .env
set +a
K6_CLOUD_TOKEN="$K6_CLOUD_TOKEN" k6 cloud run \
  -e API_TEST_KEY="$API_TEST_KEY" \
  -e BASE_SPIKE_USERS=60 \
  -e SPIKE_MULTIPLIER=2 \
  -e STOREFRONT_BASE_URL=https://ensemble-retail.com \
  -e API_BASE_URL=https://ensemble-retail.com \
  load-tests/grafana-cloud-traffic-spikes.js
```

The default combined benchmark peaks at 455 VUs: 400 traffic-spike VUs, 30 regional shoppers, up to 20 steady API request-rate VUs, and 5 browser-action VUs. Increase the project VU quota before running the default benchmark in Cloud k6, or temporarily lower `BASE_SPIKE_USERS`, `REGIONAL_SHOPPER_VUS`, `API_REQUEST_MAX_VUS`, or `BROWSER_ACTION_VUS` for quota-constrained validation runs.

The steady API scenario is the baseline 5 requests/second load. It uses `constant-arrival-rate`, runs for 10 minutes, and rotates across storefront, inventory, cart, and account requests through CloudFront. Inventory and account are intentionally weighted lighter because inventory-service also receives catalog reads from shopper journeys, and account-service writes are heavier state mutations than cart updates. Override `INVENTORY_REQUEST_INTERVAL` only when deliberately testing catalog pressure; larger values reduce spike-journey catalog refreshes, and `1` restores every-iteration catalog reads. Override `ACCOUNT_WRITE_INTERVAL` only when deliberately testing account-service pressure; larger values reduce spike-journey account writes, and `1` restores every-iteration account writes for account and checkout personas. The API-rate threshold validates at least 95% of the target request count so Grafana Cloud runner setup and shutdown time do not turn an otherwise healthy 5 rps scenario into a false failure. The traffic-spike shopper journey validates that inventory product responses are JSON before parsing; HTML or non-200 product responses increment `spike_non_json_responses` and fail the `count==0` threshold with a clear status/content-type/body-prefix log. Successful JSON parses emit `spike_non_json_responses.add(0)` so Grafana Cloud always has a zero-value series to evaluate when no non-JSON responses occur. The browser-action scenario uses sustained browser VUs rather than a single shared iteration. Its default target is at least 0.18 user-action events per second for every expected action family. Browser VUs ramp to the 5-VU target over 2 minutes, hold for 6 minutes, and ramp down for 2 minutes so Grafana Cloud does not launch every Chromium session in the same startup burst. The script publishes a tagged `storefront_user_action_events` counter with `action_family` labels and fails the run when any expected action family is below `USER_ACTION_TARGET_RPS`. Browser-action load is intentionally lower than protocol API load because the full synthetic journey launches Chromium and captures Faro actions. Browser navigation waits for the storefront app shell instead of global network idle so background Faro or image requests do not fail the benchmark before the UI is usable. Initial storefront navigation and localization reloads use bounded retries so transient browser navigation stalls do not abort an otherwise healthy API benchmark.

Graphviz traffic-spike diagrams live under `docs/graphviz/` and are generated from the current default benchmark profile: `BASE_SPIKE_USERS=100`, `SPIKE_MULTIPLIER=2`, `REGIONAL_SHOPPER_VUS=30`, `API_REQUEST_RPS=5`, `API_REQUEST_MAX_VUS=20`, and `BROWSER_ACTION_VUS=5`. The Grafana dashboard `Ensemble Traffic Spike Graphviz Model` uses the dark heatmap DOT from `docs/graphviz/traffic-spike-target-heatmap-dark.dot` and the HTML heatmap from `docs/graphviz/traffic-spike-target-heatmap.html`; update it with `gcx dashboards update ensemble-traffic-spike-graphviz -f observability/grafana/dashboards/traffic-spike-graphviz.json` after refreshing the dashboard manifest with `gcx dashboards get ensemble-traffic-spike-graphviz -o json`. Dashboard URL: `https://orenlion.grafana.net/d/6d68e547-2aac-4f8c-bc87-73139bff4816/ensemble-traffic-spike-graphviz-model`.

The current load-run history table is also available as Graphviz source and rendered assets:

- `docs/graphviz/load-run-table.dot`
- `docs/graphviz/load-run-table.svg`
- `docs/graphviz/load-run-table.png`

After every traffic-spike run, update the `Load Run History` tab in the `User Action Traffic: Real Users vs k6` dashboard with the refreshed `docs/graphviz/load-run-table.dot` source. Fetch the live dashboard first so the update carries the latest Grafana resource version, then update only `panel-17`:

```sh
gcx dashboards get or46lql -o json > /tmp/user-action-traffic-real-users-vs-k6-live.json
node --input-type=module -e "import { readFileSync, writeFileSync } from 'node:fs'; const dashboard=JSON.parse(readFileSync('/tmp/user-action-traffic-real-users-vs-k6-live.json','utf8')); dashboard.spec.elements['panel-17'].spec.vizConfig.spec.options.dotDiagram=readFileSync('docs/graphviz/load-run-table.dot','utf8'); writeFileSync('observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json', JSON.stringify(dashboard, null, 2) + '\n');"
gcx dashboards update or46lql -f observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json
gcx dashboards get or46lql -o json > observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json
```

The traffic-spike user-action fidelity model is available as:

- `docs/graphviz/traffic-spike-load-test-flow.dot`
- `docs/graphviz/traffic-spike-load-test-flow.svg`
- `docs/graphviz/traffic-spike-load-test-flow.png`

The Faro, k6 load-test, and Synthetic Monitoring contract relationship model is available as:

- `docs/graphviz/faro-k6-contract-relationships.dot`
- `docs/graphviz/faro-k6-contract-relationships.svg`
- `docs/graphviz/faro-k6-contract-relationships.png`

The observability capabilities flow has two render targets:

- `docs/diagrams/observability-capabilities-flow.dot` is the detailed source used in `DIAGRAMS.md`.
- `docs/diagrams/observability-capabilities-flow-presentation.dot` is the slide and Grafana panel source with a less wide layout and larger labels.
- `docs/diagrams/observability-capabilities-flow-presentation-16x9.png` is the 4K widescreen PNG for presentation decks.

The Grafana folder `Diagrams` contains the dashboard `Ensemble Graphviz Diagrams`, which embeds the key current Graphviz DOT sources from `docs/diagrams/`, `docs/graphviz/`, and `docs/evolution/diagrams/`. The `Traffic Spike Design` tab contains the traffic-spike user-action fidelity model. The `Observability Architecture` tab uses the presentation-optimized observability capabilities flow. The `Evolution` tab publishes `docs/evolution/diagrams/ensemble-evolution-timeline-dark.dot`; push this tab with `gcx dashboards update ensemble-graphviz-diagrams -f observability/grafana/dashboards/ensemble-graphviz-diagrams-api.json` whenever the evolution timeline changes. The `User Action Traffic: Real Users vs k6` dashboard contains the load-run history table in its `Load Run History` tab. The dashboard inventory is [docs/graphviz/grafana-dashboard-diagram-inventory.md](docs/graphviz/grafana-dashboard-diagram-inventory.md); only push Grafana diagram updates for sources listed there, adding new dashboard diagrams to the inventory first. Folder URL: `https://orenlion.grafana.net/dashboards/f/ensemble-diagrams/diagrams`. Dashboard URL: `https://orenlion.grafana.net/d/ensemble-graphviz-diagrams/ensemble-graphviz-diagrams`. User action traffic dashboard URL: `https://orenlion.grafana.net/d/or46lql/user-action-traffic3a-real-users-vs-k6`. Recreate or update the Ensemble Graphviz dashboard with:

```sh
gcx api /api/folders -d '{"uid":"ensemble-diagrams","title":"Diagrams"}'
gcx api /api/dashboards/db -d @observability/grafana/dashboards/ensemble-graphviz-diagrams-api.json
```

### Grafana Dashboard Color Standard

Dashboard colors follow the Tufte-inspired strategic color standard documented in [docs/dashboard-design/README.md](docs/dashboard-design/README.md), based on [The Tufte Aesthetic for Grafana Dashboard Design.pdf](<docs/dashboard-design/The Tufte Aesthetic for Grafana Dashboard Design.pdf>), section 2, "Strategic Use of Color".

| Usage | Setting |
|---|---:|
| Neutral/default visualization color | `#437d9e` |
| Stat/Singlestat background coloring | `colorMode: none` |

| State | Color |
|---|---:|
| Meets goal | `#1eb16a` |
| Close to goal | `#f27d05` |
| Significantly outside goal | `#bd362f` |
| Text-only critical threshold | `#ff3a3a` |

To refresh dashboard threshold colors from Grafana and push the standard palette:

```sh
gcx dashboards list -o json > /tmp/ensemble-dashboard-doc/dashboards-list.json
node scripts/standardize-grafana-threshold-colors.mjs \
  --input /tmp/ensemble-dashboard-doc/dashboards-list.json \
  --output-dir /tmp/ensemble-dashboard-doc/standardized \
  --report reports/grafana-threshold-standardization/threshold-standardization-YYYYMMDD.json
for file in /tmp/ensemble-dashboard-doc/standardized/*.json; do
  gcx dashboards update "$(basename "$file" .json)" -f "$file"
done
```

On May 31, 2026, this process scanned 74 dashboards, updated 60 editable dashboards, changed 1906 threshold color fields, skipped 11 non-editable/plugin-provisioned dashboards, and retried `ensemble-red-log-signals` after a version conflict. The run report is [reports/grafana-threshold-standardization/threshold-standardization-20260531.md](reports/grafana-threshold-standardization/threshold-standardization-20260531.md).

To refresh neutral defaults and clean Stat/Singlestat backgrounds:

```sh
gcx dashboards list -o json > /tmp/ensemble-dashboard-neutral-list.json
node scripts/standardize-grafana-neutral-colors.mjs \
  --input /tmp/ensemble-dashboard-neutral-list.json \
  --output-dir /tmp/ensemble-dashboard-neutral/standardized \
  --report reports/grafana-threshold-standardization/neutral-defaults-YYYYMMDD.json
for file in /tmp/ensemble-dashboard-neutral/standardized/*.json; do
  gcx dashboards update "$(basename "$file" .json)" -f "$file"
done
```

On May 31, 2026, this neutral pass scanned 74 dashboards, updated 61 editable dashboards, changed 1458 style fields, set 600 non-threshold color defaults to `#437d9e`, set 752 baseline/default threshold steps to `#437d9e`, and turned off 106 Stat/Singlestat background color modes. A fresh dashboard pull after publishing found zero editable Stat/Singlestat background color modes, zero non-threshold defaults outside `#437d9e`, and zero non-neutral baseline threshold steps. The run report is [reports/grafana-threshold-standardization/neutral-defaults-20260531.md](reports/grafana-threshold-standardization/neutral-defaults-20260531.md).

Optional knobs for the combined scenarios:

- `REGIONAL_SHOPPER_VUS`: regional API shopper load, default `30`.
- `SPIKE_MULTIPLIER`: traffic spike growth multiplier, default `2`.
- `API_REQUEST_RPS`: steady protocol/API request rate, default `5`.
- `INVENTORY_REQUEST_INTERVAL`: spike-journey catalog refresh interval, default `3`.
- `ACCOUNT_WRITE_INTERVAL`: spike-journey account write interval, default `3`.
- `API_REQUEST_PRE_ALLOCATED_VUS`: preallocated VUs for the steady request-rate scenario, default `5`.
- `API_REQUEST_MAX_VUS`: max VUs for the steady request-rate scenario, default `20`.
- `USER_ACTION_TARGET_RPS`: minimum target rate for every expected browser user-action family, default `0.18`.
- `BROWSER_ACTION_VUS`: concurrent browser VUs that repeatedly execute the full user-action journey, default `5`.
- `BROWSER_ACTION_DURATION`: duration for sustained browser user-action load, default `TEST_DURATION` or `10m`.
- `BROWSER_ACTION_RAMP_UP`: browser-action ramp-up duration, default `2m`.
- `BROWSER_ACTION_HOLD`: browser-action hold duration, default `6m`.
- `BROWSER_ACTION_RAMP_DOWN`: browser-action ramp-down duration, default `2m`.

The browser action check covers:

- brand-family, sale-banner, header, hero, and utility navigation actions.
- department/category selection.
- product sorting and search.
- region changes for US, Canada, China, UK, and Sweden.
- language changes for American English, French, Mandarin, British English, and Swedish.
- product detail open/close.
- add to cart from product grid, sale grid, and product detail.
- cart quantity change, checkout, and item removal.
- checkout dialog Ensemble Retail link availability.
- Google sign-in control availability.
- account profile, shipping address, wallet metadata, and save account.

Install k6 locally if needed:

```sh
brew install k6
```

Run the scripted browser check against production:

```sh
BASE_URL=https://ensemble-retail.com k6 run load-tests/synthetic-browser-actions.js
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
DEBUG_ACTIONS=1 BASE_URL=https://ensemble-retail.com k6 run load-tests/synthetic-browser-actions.js
```

The current browser-action audit inventory is stored in `reports/k6-browser-action-audit/`. The May 31, 2026 audit confirmed the Synthetic Monitoring HTTP, DNS, Ping, and TCP checks exist in Grafana, while browser-action coverage lived in the standalone Grafana Cloud k6 run. The Synthetic Monitoring k6 browser check `ensemble-grafana-browser-user-actions` now uses the same generated browser journey so scheduled Synthetic Monitoring covers the load-tested navigation, cart, checkout, region/language, auth-control, and account-save actions as well.

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
