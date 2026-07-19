# TODO

Operator actions pending against the live cluster/AWS account. These are steps
CI intentionally does not perform (see "Operator-only surface" in `CLAUDE.md`),
so they need someone with real `kubectl`/AWS credentials to run them.

No pending items.

## Done

- [x] **Apply the Honeycomb burst-protection fix (PR #9, merged 2026-07-04).**
      Applied 2026-07-04 via the guarded `Observability Apply` workflow
      ([run #5](https://github.com/orenlion1/ensemble-retail/actions/runs/28718573161)):
      `kubectl apply` updated `alloy-config` and rolled `deployment/alloy`
      (`pyroscope-alloy` unchanged, correctly skipped). The live cluster now
      drops metrics from the Honeycomb fan-out and samples Honeycomb-bound
      traces/logs to 20%. Remaining verification is Honeycomb-side: confirm on
      the Usage page that daily event volume stays below the 657,895 target.
      See `observability/README.md#honeycomb-burst-protection-2026-07-04` for
      how to tune the sampling rate or revert.

- [x] **Bootstrap the Observability Apply guarded workflow.**
      Done 2026-07-04: `scripts/terraform/bootstrap-ci-observability-apply.sh`
      was run by an operator (IAM roles created, RBAC applied, `aws-auth`
      mapped, `observability-apply` environment + secrets configured), plus the
      PR #16 follow-up granting the planner role `patch` so `kubectl diff`
      works.
      **Retired 2026-07-19:** the workflow and its `observability-apply-rbac.yaml`
      were removed after the `ensemble-grafana` EKS cluster was decommissioned —
      there is no longer a cluster to apply ConfigMaps to. The stale
      `EKS_CLUSTER_NAME`, `OBSERVABILITY_PLAN_ROLE_ARN`, and
      `OBSERVABILITY_APPLY_ROLE_ARN` repo secrets can now be deleted.
