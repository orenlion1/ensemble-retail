# Observability Replication Skill

Use this skill when adding the Ensemble-Grafana observability pattern to a new application. The goal is end-to-end visibility from browser action to backend service, database calls, load tests, incidents, logs, metrics, traces, and profiles.

## Core Pattern

- Use Grafana Cloud as the telemetry destination.
- Use Grafana Faro in the frontend.
- Use Grafana Alloy as the collector.
- Use OpenTelemetry for application traces.
- Use Prometheus metrics from Spring Boot actuator endpoints.
- Use Kubernetes logs through Alloy.
- Use Pyroscope profiles for JVM services.
- Use Grafana Beyla for zero-code backend HTTP telemetry.
- Use Grafana Synthetic Monitoring for uptime, DNS, ping, TCP, and API checks.
- Use Grafana Cloud k6 for load and browser-action tests.
- Enable CloudFront and ALB access logs for edge/API status-code RCA when load tests expose 4xx/5xx behavior.

## Frontend Observability

Implement:

- `@grafana/faro-react`.
- `@grafana/faro-web-tracing`.
- React Router instrumentation.
- User context with `faro.api.setUser`.
- Named user actions for every button, select, submit, cart, and checkout interaction.
- Source map upload through `@grafana/faro-rollup-plugin`.

Action naming guidance:

- Use stable names such as `shopping-cart:add-item:<product-id>`.
- Include cart checkout, add, remove, quantity change, region change, account save, category selection, and product detail actions.
- Avoid names that include volatile display copy.

## Backend Observability

For each Spring Boot service:

- Add actuator Prometheus endpoint.
- Expose `/actuator/prometheus`.
- Configure RED metrics for HTTP endpoints: rate, errors, duration.
- Configure log levels: `error`, `info`, `debug`, `trace`.
- Propagate W3C trace context from frontend to backend.
- Add OTel exporter configuration.
- Attach service labels to logs, metrics, and traces.

## Alloy Collector Pattern

Deploy Alloy in the observability namespace with:

- OTLP receivers on `4317` and `4318`.
- Prometheus discovery/scrape for annotated pods.
- Kubernetes pod log collection.
- OTel export to Grafana Cloud.
- Loki-compatible log labels or OTLP resource attributes.
- Pyroscope profile write configuration.

Secrets needed:

- OTLP endpoint.
- Grafana Cloud stack/service account token with write scopes for traces, metrics, logs, and profiles.
- Profiles endpoint and user/tenant ID.

Do not commit real secret files. Keep `.example.yaml` files complete enough to reproduce the shape.

## Pyroscope Profiles

Use the Grafana Alloy Pyroscope pattern:

- Configure a dedicated profiling Alloy deployment or DaemonSet.
- Label nodes that should run JVM profiling.
- Keep profiling opt-in for small demo clusters.
- Set service names to match deployments: `inventory-service`, `cart-service`, `account-service`.
- Send profiles to the Grafana Cloud Profiles URL.

## Beyla

Use Beyla for zero-code HTTP telemetry when you need a fast backend telemetry rollout:

- Deploy with Kubernetes discovery.
- Scope discovery to application namespaces.
- Ensure service labels are attached.
- Feed Beyla telemetry into Alloy/Grafana Cloud.

## Synthetic Monitoring

Use `gcx` and manifest files for:

- HTTP uptime/TLS check.
- HTTP API response-time check.
- DNS resolution check.
- Ping reachability check.
- TCP/TLS connectivity check.

Operational notes:

- Public probes can be used immediately.
- Private probe records are offline until probe agents are deployed.
- If `gcx` datasource autodiscovery fails, set the Synthetic Monitoring metrics datasource UID explicitly.
- Use `alertSensitivity: none` when legacy alert creation is blocked, then create Grafana-managed alert rules separately.

## gcx Permission Dependencies

Keep reusable gcx permission requirements in this skill. Put only project-specific token locations, current blockers, stack URLs, and run commands in the application README.

Configure `gcx` with separate credentials when the product APIs require different token types:

- `grafana.token`: Grafana stack API/service-account token for Grafana HTTP APIs, dashboards, datasources, plugin settings, IRM discovery, and commands that call the stack directly.
- `cloud.token`: Grafana Cloud access policy token for Cloud control-plane APIs such as stacks and some k6 discovery flows.
- `providers.synth.sm-token`: Synthetic Monitoring API token for probes and checks; this is separate from telemetry ingest and stack API tokens.
- Native `k6 cloud login` token: use for Cloud k6 upload/run operations when `gcx k6` token exchange rejects a Grafana Cloud access policy token.
- Telemetry ingest tokens: use for Alloy/OTLP/Faro/Profiles writes only; do not assume they can administer IRM, Synthetic Monitoring, k6, dashboards, or plugin settings.

Minimum permission patterns:

- Synthetic Monitoring checks/probes: stack API access for datasource lookup plus a Synthetic Monitoring token; if datasource autodiscovery fails, set the metrics datasource UID explicitly.
- k6 Cloud tests: k6 project access and a native k6 token for `k6 cloud login`; protected application APIs also need `API_TEST_KEY` as a k6 environment variable/secret.
- IRM OnCall schedules and shifts: token must allow `grafana-irm-app.schedules:write`, `grafana-irm-app.schedules:read`, and `grafana-irm-app.user-settings:read`; the OnCall API URL comes from IRM Settings -> Admin & API.
- IRM incidents: token must allow incident creation/update for the IRM incident API and should be scoped only to the stack/product needed.
- Dashboards/datasources/alerts: stack service-account token with the relevant Grafana RBAC permissions for the resource type.
- Terraform Cloud Provider Observability resources such as AWS CloudWatch scrape jobs: use `GRAFANA_CLOUD_PROVIDER_ACCESS_TOKEN` with `integration-management:read`, `integration-management:write`, and `stacks:read`, plus the regional `GRAFANA_CLOUD_PROVIDER_URL` for the stack.

Troubleshooting cues:

- `401 Invalid API key` while fetching plugin settings usually means the configured `grafana.token` is not a valid stack API/service-account token for that Grafana API, even if it works for telemetry ingest.
- k6 token exchange failures usually mean the token type is wrong for Cloud k6; authenticate with `k6 cloud login --token ... --stack <stack>`.
- Synthetic Monitoring `NODATA` can mean checks exist but samples are not yet visible in the selected datasource/window; verify probe status and datasource UID.

## k6 Load Testing

Provide at least three k6 scripts:

- API load test for catalog, cart, account flows.
- Regional Cloud k6 test with multiple personas and region switching.
- Spike benchmark with multiple traffic spikes.
- Browser-action synthetic check that exercises all `data-faro-user-action-name` controls.
- Low-cardinality group names and request `name` tags. Use static group names and route templates such as `PUT /api/cart/carts/:shopperId` instead of embedding user IDs, product IDs, or cart IDs in group labels.
- Grafana Tempo HTTP instrumentation with W3C propagation for HTTP tests, so Grafana Cloud k6 can correlate requests with backend traces when service traces are flowing to Grafana Cloud Traces.

Recommended spike profile:

- Spike 1 at baseline peak.
- Spike 2 at 2x spike 1 for stress validation.
- Spike 3 at 2x spike 2 for stress validation.
- Add recovery windows between spikes.
- Keep browser-action load sustained with multiple browser VUs when Faro user-action volume is part of the test goal. A single shared browser iteration only validates coverage; it does not produce meaningful user-action volume. Keep browser VU counts lower than protocol API VUs because each browser VU launches Chromium and can fail first with page navigation timeouts under spike pressure.
- Browser-action scripts should wait for a stable app-shell selector instead of global network idle when the application emits background telemetry or loads remote images. This keeps navigation readiness tied to user-visible UI, not long-running Faro/image requests.
- For high protocol/API volume, prefer a `constant-arrival-rate` scenario with low-cardinality request names. The Ensemble traffic-spike profile includes a steady `API_REQUEST_RPS=120` scenario for the current 120 requests/second baseline. Keep the request mix balanced by service; inventory-service also receives catalog reads from shopper journeys, and account-service writes are heavier state mutations, so the steady request-rate mix should weight inventory and account lighter than cart. Use `INVENTORY_REQUEST_INTERVAL` to avoid fetching catalog data every iteration and `ACCOUNT_WRITE_INTERVAL` to avoid account writes every account or checkout iteration unless that service saturation is the test goal.
- For browser-action coverage, ramp browser VUs up instead of starting every Chromium session at once. Keep the browser scenario small enough that Chromium capacity does not dominate API load-test results.
- When user-action throughput is the goal, add tagged per-action counters and thresholds for every expected action family. Default Ensemble traffic-spike runs target at least 0.18 user-action events per second per action family.
- For zero-failure custom counters with thresholds such as `count==0`, emit an explicit `Counter.add(0, tags)` on successful paths. Grafana Cloud k6 can otherwise receive no series for a perfect run, making the threshold ambiguous or falsely failed.

Required k6 environment:

- Native k6 token for `k6 cloud login`.
- `API_TEST_KEY` as a Grafana Cloud k6 environment variable/secret for protected cart/account writes.
- `STOREFRONT_BASE_URL` and `API_BASE_URL` when static assets and APIs use separate origins.
- For end-to-end edge tests, set `API_BASE_URL` to the storefront domain so `/api/*` traverses CloudFront. Use the API origin domain only when intentionally bypassing CloudFront.
- Run load tests in Grafana Cloud k6 by default with `k6 cloud run`. Use local `k6 run` only for script debugging or when Grafana Cloud k6 is unavailable.
- Always use temporary local `.env` injection for k6 Cloud runs that require `API_TEST_KEY` (for example: `set -a && source .env && set +a && k6 cloud run -e API_TEST_KEY="$API_TEST_KEY" ...`), and keep `.env` gitignored.
- If a run fails with missing/invalid API key errors (for example `API_TEST_KEY is required`), prompt the user to set or update `API_TEST_KEY` in `.env` and rerun.
- If `gcx k6` fails during token exchange, use the Grafana k6 Cloud REST API directly with the native k6 token: `Authorization: Bearer $K6_CLOUD_TOKEN`, `X-Stack-Id: <stack id>`, and `/cloud/v6/load_tests/{id}/test_runs`. Normalize the response into the same `reports/load-tests/k6-summary-*.json` and `reports/load-tests/k6-runs-*.json` shape expected by the load-test report.

After each k6 browser-action run, validate Faro user-action telemetry in Grafana with `gcx logs query` and confirm expected `faro.user.action` events are present for browser-based flows. For frontend deployments and k6 load-test reporting, generate a report in `reports/frontend-user-actions/` using `node scripts/report-faro-user-actions.mjs`. The report must use the standard six-hour execution query:

```logql
sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [6h])
)
```

Use the latest sample returned by the GCX range query as the total executions for each action/importance/severity tuple.

After any k6 load test concludes, update the load-test comparison artifacts:

```bash
node scripts/report-load-tests.mjs
```

This produces `reports/load-tests/load-test-comparison.md`, `reports/load-tests/comparison/load-test-runs.csv`, `reports/load-tests/comparison/load-test-counters.csv`, SVG charts for results by date, duration, VUH cost, latest HTTP failure rate, latest check pass rate, latest HTTP p95, latest user-action/cart totals, and the Graphviz load-run history assets `docs/graphviz/load-run-table.{dot,svg,png}`. Run it for passed, failed, and error runs whenever Grafana/k6 returns usable run metadata. Keep raw `reports/load-tests/k6-*.json` pulls ignored because Grafana Cloud run payloads can include runtime token fields.

After every traffic-spike load test, push the refreshed `docs/graphviz/load-run-table.dot` into the `User Action Traffic: Real Users vs k6` dashboard `Load Run History` tab, panel `panel-17`, following `skills/graphviz/dashboard-inventory/SKILL.md`. Always fetch the live dashboard first, update only `panel-17`, publish with `gcx dashboards update or46lql`, then fetch the dashboard back into `observability/grafana/dashboards/user-action-traffic-real-users-vs-k6.json`.

Document Grafana Cloud k6 run URLs after each cloud execution.

## Grafana IRM

For incident readiness:

- Document users and escalation expectations.
- Define severity examples.
- Use the incident creation skill in `skills/observability/incident-creation/SKILL.md` whenever creating, scripting, or documenting Grafana IRM incidents.
- Require every incident to include `region`, `feature`, and `service` labels.
- Use labels such as `region`, `feature`, `service`, `root_cause`, `product_category`, and `client_impact`.
- Provide an incident-generation script or runbook for test events.
- Use `skills/observability/incident-placeholder-template/SKILL.md` only for explicitly requested placeholder incidents; that template bypasses the normal `feature` and `service` label requirement.

Recommended labels:

- `region:US`
- `feature:shopping-cart-checkout`
- `service:cart`
- `root_cause:Manual-Error`
- `root_cause:Certificate-Expiration`
- `root_cause:Code-Defect`
- `product_category:mens_hiking`
- `product_category:mens_boots`
- `client_impact:single-client`
- `client_impact:multiple-clients`

## Dashboards And Queries

Create starter dashboards for:

- Frontend errors and web vitals.
- API RED metrics.
- Service health.
- Trace waterfalls from Faro frontend spans to Spring Boot backend spans.
- Logs by namespace/service.
- Profiles by service.
- k6 load-test results by persona, region, endpoint, and spike.

### Dashboard Color Standard

Use the Ensemble dashboard design note in `docs/dashboard-design/` for dashboard color decisions. Use muted blue `#437d9e` as the neutral/default visualization color so bright colors do not diminish important data. Turn Stat/Singlestat background coloring off with `colorMode: none`.

Apply bright colors only to meaningful threshold goal states:

- Meets goal: `#1eb16a`.
- Close to goal: `#f27d05`.
- Significantly outside goal: `#bd362f`.
- Text-only critical threshold: `#ff3a3a`.

When standardizing existing Grafana dashboards, pull dashboards with `gcx dashboards list -o json`, run `scripts/standardize-grafana-threshold-colors.mjs`, publish changed editable dashboards with `gcx dashboards update`, and write a report under `reports/grafana-threshold-standardization/`. Skip non-editable/plugin-provisioned dashboards unless the user explicitly asks to fork or replace vendor-managed content.

When applying neutral defaults and clean Stat backgrounds, run `scripts/standardize-grafana-neutral-colors.mjs` after the threshold script. Publish the changed editable dashboards with `gcx dashboards update`, then validate a fresh dashboard pull has no editable Stat/Singlestat panels with background coloring, no non-threshold color defaults outside `#437d9e`, and no baseline/default threshold steps outside `#437d9e`.

After every dashboard change, validate the live dashboard with Grafana MCP in addition to any `gcx` fetch/update checks:

- Use `search_dashboards` to confirm the dashboard title and UID.
- Use `get_dashboard_by_uid` or `get_dashboard_property` to confirm expected tabs, rows, panels, transformations, field overrides, variables, and query definitions.
- Use `get_dashboard_panel_queries` for query wiring changes and confirm PromQL, LogQL, CloudWatch, or other datasource queries still target the expected labels and variables.
- Use datasource tools such as `query_prometheus` or `query_loki_logs` when a changed panel should return data.
- Use `get_panel_image` for visual validation of critical or layout-sensitive panels.
- Keep `gcx` for deterministic publish/fetch snapshots and CI-friendly JSON assertions; use Grafana MCP for read-after-write semantic validation.

Useful query reminders:

- Faro exception filter: `{kind="exception", app_id="464"}`
- Service logs should include `namespace` and `service` labels.
- Prometheus metrics should include service/deployment labels.

## Validation Checklist

- Faro sends page loads, errors, user actions, and frontend traces.
- Backend metrics appear from `/actuator/prometheus`.
- Logs include `service` labels.
- Traces flow from browser to backend services.
- Profiles appear for Java services.
- Synthetic checks are configured for HTTP, DNS, Ping, and TCP.
- k6 scripts inspect cleanly and are uploaded to Grafana Cloud k6.
- Dashboard changes are validated against the live Grafana dashboard with Grafana MCP after publish.
- README records tokens needed without exposing values.
- DIAGRAMS.md includes telemetry and load-test flows.
