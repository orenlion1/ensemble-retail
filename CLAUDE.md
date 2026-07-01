# ensemble — agent guidance

## Grafana / gcx
- **Stay on the orenlion (ensemble) stack only.** This repo targets the `orenlion` Grafana stack
  (`https://orenlion.grafana.net`). The live gcx config (`~/.config/gcx/config.yaml`) exposes it
  as the `default` context — that is the ensemble stack, so the default context is correct here.
  Do **not** add or switch to `teletracking` / `teletracking-eu` contexts from this repo.
- **Do not read `gcx-config.txt`.** It is a sanitized template — every token is the literal
  placeholder `**REDACTED**`, so it carries no usable credentials and no useful config. It also
  lists `ensemble`/`teletracking` contexts that do NOT exist in the live config; ignore it. The
  real, working credentials live in `gcx`'s own config; validate connectivity with `gcx` directly
  (e.g. `gcx api /api/user`, `gcx datasources list`).

## Connectivity validation
- AWS: `aws sts get-caller-identity` (account `629513454417`, user `ensemble-grafana`, `us-east-1`).
- Grafana: `gcx api /api/user` against the `ensemble` context.
- GitHub: `ssh -T git@github.com`.

## Deployment
- **Code changes ship themselves — do not deploy manually.** Every push/merge to `main` runs the
  `Build` workflow; on success the `Deploy` workflow automatically ships the exact CI-passing
  commit via GitHub OIDC (service images to ECR + EKS rollout, storefront to S3 + CloudFront
  invalidation). Land the change on `main` and let the pipeline run.
- **Deploys are change-scoped.** The workflow diffs against the last deployed commit:
  `services/<name>/**` deploys only that service, `frontend/**` deploys only the storefront,
  and documentation-only changes deploy nothing. A `deploy.yml` change redeploys everything.
- **Operator-only surface.** Kubernetes manifests, secrets, ingress, and Terraform are NOT
  applied by CI — use `scripts/kubernetes/apply-manifests.sh` and the Terraform stacks locally.
- Real resource identifiers live in GitHub repository secrets (`AWS_ACCOUNT_ID`,
  `AWS_DEPLOY_ROLE_ARN`, `EKS_CLUSTER_NAME`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`);
  committed files keep placeholder values. See `docs/deployment.md` for the full runbook.
