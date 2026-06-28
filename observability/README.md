# Observability

Grafana Cloud telemetry assets for Ensemble-Retail. Application OTLP, logs, and profiles are collected by Alloy in `ensemble-observability` (see `infra/k8s/` and `observability/alloy/config.alloy`). Cluster-level metrics, node logs, events, and cost data are collected by the [Grafana k8s-monitoring](https://github.com/grafana/k8s-monitoring-helm) chart in the `grafana` namespace. The live cluster and telemetry labels retain the legacy `ensemble-grafana` identifier for continuity.

## Layout

| Path | Purpose |
|------|---------|
| `alloy/` | Reference Alloy river config for OTLP, Prometheus scrape, and log export |
| `grafana/dashboards/` | Starter Grafana dashboards |
| `k8s-monitoring/` | Helm values example for Grafana Cloud Kubernetes monitoring |
| `synthetic-monitoring/` | `gcx` probe and check definitions |
| `irm/` | Grafana IRM / on-call helpers |

Stack URL: `https://orenlion.grafana.net` (stack ID `1665320`, region `prod-us-east-3`).

## Kubernetes cluster monitoring (Helm)

The `grafana/k8s-monitoring` chart (v4.x) deploys Alloy collectors, kube-state-metrics, and node-exporter. It sends data to Grafana Cloud Prometheus and Loki endpoints for this stack. OpenCost and cluster events are disabled in `k8s-monitoring/values.example.yaml` to reduce pod pressure on demo clusters.

### Prerequisites

1. `kubectl` context pointed at the EKS cluster:

   ```sh
   aws eks update-kubeconfig --name ensemble-grafana --region us-east-1 --profile ensemble-grafana
   ```

2. Helm 3 installed.

3. Grafana Cloud credentials with push access for metrics and logs, plus Fleet Management for Alloy remote config. Create a stack service account token in the Grafana Cloud portal; do not commit token values.

4. **Cluster capacity:** Terraform in `infra/terraform/stacks/cluster/main.tf` provisions **three `t3.medium` nodes** (`desiredSize=3`, `minSize=3`, `maxSize=3`). App workloads use **2 replicas** per service (`infra/k8s/services.yaml`). `t3.small` nodes cap at **11 pods per node** and are insufficient for Beyla, Pyroscope, k8s-monitoring, and three app replicas together.

### Install or upgrade

```sh
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update grafana

# Export credentials from Grafana Cloud (Prometheus, Loki, Fleet Management users/passwords).
export GRAFANA_CLOUD_METRICS_USER="3254864"
export GRAFANA_CLOUD_METRICS_PASSWORD="<grafana-cloud-token>"
export GRAFANA_CLOUD_LOGS_USER="1623107"
export GRAFANA_CLOUD_LOGS_PASSWORD="<grafana-cloud-token>"
export GRAFANA_CLOUD_FLEET_USER="1665320"
export GRAFANA_CLOUD_FLEET_PASSWORD="<grafana-cloud-token>"

envsubst < observability/k8s-monitoring/values.example.yaml > /tmp/k8s-monitoring-values.yaml

helm upgrade --install grafana-k8s-monitoring grafana/k8s-monitoring \
  --version "^4" \
  --namespace grafana \
  --create-namespace \
  --values /tmp/k8s-monitoring-values.yaml
```

Use a longer timeout if you need Helm to wait for every workload to become ready:

```sh
helm upgrade --install --rollback-on-failure --timeout 600s grafana-k8s-monitoring grafana/k8s-monitoring \
  --version "^4" \
  --namespace grafana \
  --create-namespace \
  --values /tmp/k8s-monitoring-values.yaml
```

Helm 4 deprecates `--atomic`; prefer `--rollback-on-failure`.

### URL shape

Grafana Cloud hostnames must not include a stray dot before the path. Use:

- `https://prometheus-prod-66-prod-us-east-3.grafana.net/api/prom/push`
- `https://logs-prod-042.grafana.net/loki/api/v1/push`
- `https://prometheus-prod-66-prod-us-east-3.grafana.net/api/prom` (OpenCost external Prometheus)

Not `https://...grafana.net./api/...`.

### What gets deployed

Release name: `grafana-k8s-monitoring`  
Namespace: `grafana`  
Chart version: `4.1.3` (when requesting `^4`)

| Component | Kind | Role |
|-----------|------|------|
| `alloy-metrics` | StatefulSet | Cluster, host, and cost metrics |
| `alloy-logs` | DaemonSet | Node / container logs |
| `alloy-operator` | Deployment | Manages Alloy custom resources |
| `kube-state-metrics` | Deployment | Kubernetes object metrics |
| `node-exporter` | DaemonSet | Host metrics (Linux) |

Disabled in `values.example.yaml` to save pod slots: `alloy-singleton` (cluster events), OpenCost (`costMetrics`).

Windows exporter is disabled (`windowsHosts.enabled: false`) because the cluster has no Windows nodes.

### Validation

```sh
helm status grafana-k8s-monitoring -n grafana
helm list -n grafana
kubectl get pods -n grafana
kubectl get alloy -n grafana
```

Expect all pods in `grafana` to reach `Running` and Alloy CRs to exist for `alloy-logs` and `alloy-metrics`.

In Grafana Cloud, confirm incoming series and logs for cluster name `ensemble-grafana`.

### Uninstall

If uninstall hangs on Alloy finalizers, patch finalizers and use `--no-hooks`:

```sh
for name in grafana-k8s-monitoring-alloy-logs grafana-k8s-monitoring-alloy-metrics grafana-k8s-monitoring-alloy-singleton; do
  kubectl patch alloy "$name" -n grafana --type merge -p '{"metadata":{"finalizers":null}}' || true
done
kubectl delete job -n grafana grafana-k8s-monitoring-remove-alloy-and-finalizer --ignore-not-found
helm uninstall grafana-k8s-monitoring -n grafana --no-hooks
helm uninstall grafana-k8s-monitoring-alloy-logs grafana-k8s-monitoring-alloy-metrics grafana-k8s-monitoring-alloy-singleton -n grafana
```

### Troubleshooting

| Symptom | Likely cause | Mitigation |
|---------|----------------|------------|
| `has no deployed releases` / stuck `uninstalling` | Prior atomic install or failed uninstall | Clear Alloy finalizers; `helm uninstall --no-hooks`; reinstall |
| `Too many pods` on `t3.small` | 11-pod limit per node | Use `t3.medium` and three nodes via Terraform; set app replicas to 2; disable OpenCost/cluster events in k8s-monitoring values |
| DaemonSet `Available: 2/3` during `--wait` | Third node still joining | Wait for node `Ready`, or install without `--wait` and verify pods afterward |
| Alloy CR `NotFound` during wait | Subcharts still reconciling | Increase `--timeout` or install without `--wait` |
| Pending `node-exporter` / `alloy-logs` on one node | That node at pod capacity | Free slots on the saturated node or add nodes |

Scale the node group with Terraform in `infra/terraform/stacks/cluster` (`t3.medium`, desired/min/max 3). `aws eks update-nodegroup-config` can change counts only, not instance type.

### Coexistence with `ensemble-observability`

- **`ensemble-observability`:** Application OTLP, Beyla, Pyroscope, and pod-scoped Alloy scraping (see root `README.md` Backend Observability).
- **`grafana`:** Cluster-wide k8s-monitoring chart (node metrics, cluster metrics, node logs).

Both can run at the same time on three `t3.medium` nodes with trimmed k8s-monitoring values.

## Synthetic monitoring

See `observability/synthetic-monitoring/` and root `README.md` Synthetic Monitoring.

```sh
cd observability/synthetic-monitoring
cp .env.example .env   # fill tokens locally; do not commit
./create-synthetic-monitoring.sh
```

## IRM

Business-hours on-call helper: `observability/irm/create-business-hours-oncall.sh`. See `docs/grafana-irm.md`.
