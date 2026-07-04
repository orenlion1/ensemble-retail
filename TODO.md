# TODO

Operator actions pending against the live cluster/AWS account. These are steps
CI intentionally does not perform (see "Operator-only surface" in `CLAUDE.md`),
so they need someone with real `kubectl`/AWS credentials to run them.

- [ ] **Apply the Honeycomb burst-protection fix (PR #9, merged 2026-07-04).**
      `infra/k8s/alloy-beyla.yaml`'s `alloy-config` ConfigMap was updated to stop
      fanning metrics out to Honeycomb and to sample Honeycomb-bound traces/logs
      to 20%, but Kubernetes manifests are operator-applied, not CI-deployed.
      Until this runs, the live `alloy` Deployment is still on the old config and
      Honeycomb keeps receiving full, unsampled telemetry. Two ways to apply it:

      ```sh
      ./scripts/kubernetes/apply-manifests.sh
      ```

      or, without needing local `kubectl`/AWS credentials at all, the guarded
      `Observability Apply` GitHub Actions workflow (`workflow_dispatch`,
      `.github/workflows/observability-apply.yml`) diffs and applies just the two
      Alloy ConfigMaps via OIDC. **One-time setup still required** — someone with
      real cluster credentials must run
      `scripts/terraform/bootstrap-ci-observability-apply.sh` once (creates the
      scoped IAM roles, applies `infra/k8s/observability-apply-rbac.yaml`, and maps
      them into `aws-auth`) before the workflow can be used; see
      `infra/terraform/stacks/README.md` section 11.

      Confirms it worked: `kubectl -n ensemble-observability rollout status
      deployment/alloy` completes, and Honeycomb's daily event volume drops
      below the burst-protection threshold. See
      `observability/README.md#honeycomb-burst-protection-2026-07-04` for
      details, how to tune the sampling rate, and how to revert.

- [ ] **Bootstrap the Observability Apply guarded workflow.**
      `scripts/terraform/bootstrap-ci-observability-apply.sh` needs to be run once
      by an operator with real AWS + kubectl credentials before
      `.github/workflows/observability-apply.yml` can be used for the item above
      (or for any future Alloy ConfigMap change). Same operator-only constraint as
      `bootstrap-ci-terraform-apply.sh` — it creates IAM roles and patches the live
      cluster's `aws-auth` ConfigMap, which CI cannot do on its own.
