# infra

The Terraform for this project (all stacks, modules, and the per-stack runbook) moved to the
dedicated shared-infrastructure repository on 2026-07-12:

**https://github.com/orenlion1/core-infra** — clone it as a sibling of this repo
(`../core-infra`); the `serverless` stack locates this repo's built service jars via a
sibling-checkout `repo_root` default.

What remains here:

- `k8s/` — legacy EKS-era Kubernetes manifests, retained for history. The EKS footprint was
  decommissioned in the 2026-07-09 serverless migration; nothing here is deployed.
- `seed/` — DynamoDB catalog seed data used by `scripts/dynamodb/`.

Code deploys are unchanged: CI ships Lambda code and the storefront on merge to `main`
(see `docs/deployment.md`). Resource-level changes (API Gateway, DynamoDB, IAM, DNS,
certificates, Cognito) are made in core-infra and applied locally by an operator.
