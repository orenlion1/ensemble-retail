# Graviton Migration Plan

This plan describes how to migrate the Ensemble-Grafana EKS workloads from x86 nodes to AWS Graviton/ARM64 nodes.

## Goal

Move the EKS worker nodes from x86 `t3.medium` instances to ARM64 Graviton instances while keeping the storefront, backend services, and observability pipeline working.

## Terraform Changes

Prefer a phased rollout by adding a new ARM node group before removing the existing x86 node group.

Update or extend the EKS cluster stack in `infra/terraform/stacks/cluster`:

- Add a Graviton managed node group.
- Use an ARM instance type:
  - `t4g.medium` for the closest low-cost demo equivalent.
  - `m7g.medium` or `c7g.medium` for steadier production-style performance.
- Use the ARM EKS AMI type:
  - `AL2023_ARM_64_STANDARD`
- Keep the existing x86 node group temporarily during migration.
- Consider labels for phased scheduling:
  - `kubernetes.io/arch=arm64`
  - `ensemble-grafana/node-arch=arm64`
- Consider taints only if you want explicit workload opt-in during the first rollout.

Likely files:

- `infra/terraform/stacks/cluster/main.tf`
- `infra/terraform/stacks/cluster/variables.tf`
- `infra/terraform/stacks/README.md`
- `README.md`

## Kubernetes Changes

If backend and observability images are published as multi-architecture image manifests, Kubernetes can schedule them on ARM nodes without workload selectors.

For a phased rollout, temporarily add `nodeSelector` or affinity to selected workloads:

```yaml
nodeSelector:
  kubernetes.io/arch: arm64
```

Review these workloads before cutting over:

- `inventory-service`
- `cart-service`
- `account-service`
- Grafana Alloy
- Grafana Beyla
- Pyroscope profiling workloads
- AWS Load Balancer Controller, if managed in-cluster
- Any DaemonSet that uses host, kernel, or eBPF features

## Code And Build Changes

No Java source changes are expected. Spring Boot services should run on ARM64 as long as their container images and base images support ARM64.

Required build changes:

- Build and push multi-architecture images for each backend service:

```sh
docker buildx build --platform linux/amd64,linux/arm64 --push ...
```

- Publish multi-arch manifest tags to ECR for:
  - `inventory-service`
  - `cart-service`
  - `account-service`
- Verify Dockerfiles use ARM64-compatible base images, such as multi-arch Eclipse Temurin images.
- Avoid x86-only native binaries or libraries.

The JavaScript frontend static build does not require architecture changes.

## Observability Risks

Validate the observability stack on ARM before removing x86 capacity.

Pay special attention to:

- Grafana Alloy ARM64 image support.
- Grafana Beyla ARM64 and eBPF support.
- Pyroscope Java profiling behavior on ARM64.
- Service labels on logs, metrics, traces, and profiles.
- Backend RED metrics from `/actuator/prometheus`.

Beyla and profiling are the highest-risk areas because they depend more directly on kernel/runtime behavior.

## Recommended Rollout

1. Build and push multi-arch backend images to ECR.
2. Add an ARM64 Graviton node group alongside the existing x86 node group.
3. Deploy one service or one replica set to ARM64 using a temporary selector.
4. Validate health endpoints and API behavior.
5. Validate logs, metrics, traces, Faro-to-backend trace correlation, and profiles.
6. Run k6 API and browser-action checks.
7. Drain one x86 node and watch workload rescheduling.
8. Remove x86 selectors or taints after all workloads are multi-arch safe.
9. Scale down and remove the x86 node group.
10. Update documentation and diagrams if the deployment topology changes.

## Validation Checklist

- EKS ARM node group is active.
- Nodes report `kubernetes.io/arch=arm64`.
- Backend pods start on ARM nodes.
- All service health checks pass.
- `/actuator/prometheus` works for each backend service.
- Logs include service labels.
- Metrics flow to Grafana Cloud.
- Traces flow from Faro frontend spans to backend spans.
- Profiles flow to Grafana Cloud Profiles.
- k6 browser-action validation passes.
- Production smoke checks pass after rollout.
