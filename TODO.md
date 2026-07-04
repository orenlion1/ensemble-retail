# TODO

Operator actions pending against the live cluster/AWS account. These are steps
CI intentionally does not perform (see "Operator-only surface" in `CLAUDE.md`),
so they need someone with real `kubectl`/AWS credentials to run them.

- [ ] **Apply the Honeycomb burst-protection fix (PR #9, merged 2026-07-04).**
      `infra/k8s/alloy-beyla.yaml`'s `alloy-config` ConfigMap was updated to stop
      fanning metrics out to Honeycomb and to sample Honeycomb-bound traces/logs
      to 20%, but Kubernetes manifests are operator-applied, not CI-deployed.
      Until this runs, the live `alloy` Deployment is still on the old config and
      Honeycomb keeps receiving full, unsampled telemetry.

      ```sh
      ./scripts/kubernetes/apply-manifests.sh
      ```

      Confirms it worked: `kubectl -n ensemble-observability rollout status
      deployment/alloy` completes, and Honeycomb's daily event volume drops
      below the burst-protection threshold. See
      `observability/README.md#honeycomb-burst-protection-2026-07-04` for
      details, how to tune the sampling rate, and how to revert.
