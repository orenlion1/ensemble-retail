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
- **Serverless since 2026-07-09.** The services run on AWS Lambda (Java 21, arm64, SnapStart)
  behind an API Gateway HTTP API, backed by DynamoDB. EKS, Aurora, the NAT gateway, the ALB, and
  the regional WAF were decommissioned in the cost-reduction migration. See
  `docs/serverless-migration.md` and `EVOLUTION.md`.
- **Code changes ship themselves — do not deploy manually.** Every push/merge to `main` runs the
  `Build` workflow; on success the `Deploy` workflow ships the exact CI-passing commit via GitHub
  OIDC. Backend: `mvn package` the shaded jar → upload to the `ensemble-grafana-lambda-artifacts-*`
  S3 bucket → `update-function-code` + `publish-version` → move the `live` alias. Frontend:
  storefront to S3 + CloudFront invalidation. Land the change on `main` and let the pipeline run.
- **Deploys are change-scoped.** The workflow diffs against the last deployed commit:
  `services/<name>/**` deploys only that service's Lambda, `frontend/**` deploys only the
  storefront, and documentation-only changes deploy nothing. A `deploy.yml` change redeploys all.
- **Operator-only surface.** DynamoDB tables, secrets, the API/Lambda/IAM (`stacks/serverless`),
  and all other Terraform are NOT applied by CI — run the Terraform stacks locally.
- The deploy role (`AWS_DEPLOY_ROLE_ARN`) needs `lambda:UpdateFunctionCode`, `lambda:PublishVersion`,
  `lambda:UpdateAlias`, `lambda:GetFunction`, and `s3:PutObject` on the artifacts bucket (it no
  longer needs EKS/ECR). Real resource identifiers live in GitHub repository secrets
  (`AWS_ACCOUNT_ID`, `AWS_DEPLOY_ROLE_ARN`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`);
  committed files keep placeholder values. See `docs/deployment.md` for the full runbook.
