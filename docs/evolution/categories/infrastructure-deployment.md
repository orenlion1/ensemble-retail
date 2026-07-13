# Infrastructure and Deployment

## Reconstructed Prompt Category

> Build the AWS, Terraform, Kubernetes, security, and deployment path needed to run the demo like a real service.

## Chronology

| Date | Evidence | Evolution |
| --- | --- | --- |
| 2026-05-28 | `cd5a7df` Move SSM account controls into guarded baseline stack. | Sensitive account baseline settings moved behind a guarded Terraform path. |
| 2026-05-29 | `0a1cdae` Normalize account baseline service setting ID | Infrastructure naming was stabilized. |
| 2026-05-30 | `a422450` Document API test key rotation smoke test | Secret rotation gained a concrete validation path. |
| 2026-05-30 | `be7ff4a` Allow two pods unavailable during service rollouts | Kubernetes rollout settings were tuned for service changes. |
| 2026-05-30 | `6fcde97` Raise WAF rate limits for k6 smoke tests | Edge protection was adjusted for synthetic traffic. |
| 2026-05-30 | `d2a8161` Update account service deployment tag | Deployed service versioning was updated. |
| 2026-05-31 | `27dd368` Set backend services to saturation replica profile | Backend capacity was changed for saturation exercises. |
| 2026-05-31 | `b1050df` Scale inventory service for spike traffic | Inventory service capacity was tuned under load. |
| 2026-05-31 | `f15ee46` Reduce inventory service replicas to one | Capacity settings were tuned back after testing. |
| 2026-05-31 | `64d3717` Balance traffic spike inventory load | Service load distribution was refined. |
| 2026-07-01 | `.github/workflows/deploy.yml`, `infra/k8s/deploy-rbac.yaml` | AWS deployment became automatic: on Build success on `main`, GitHub Actions builds/pushes service images, rolls out EKS, syncs the frontend to S3, and invalidates CloudFront via a GitHub OIDC deploy role. |
| 2026-07-09 | `infra/terraform/stacks/serverless`, `docs/serverless-migration.md` | Cost-reduction migration (Option D): the three Spring Boot services moved from EKS to API Gateway HTTP API + Lambda (Java 21, arm64, SnapStart) backed by DynamoDB, and the EKS cluster, Aurora cluster, NAT gateway, ALB, and regional WAF were torn down. Monthly run-rate dropped from ~$335 to ~$14. |
| 2026-07-12 | `infra/terraform/stacks/edge-static`, `infra/terraform/stacks/serverless/api.tf`, `infra/terraform/stacks/auth` | `ensemble-service.com` added as a third apex domain: new Route 53 zone (Namecheap custom-nameserver delegation), shared ACM certificate replaced with SANs for apex/www/api, CloudFront aliases, API Gateway custom domain `api.ensemble-service.com`, and Cognito callback URLs. Stale ALB-era `api.ensemble-retail.com` CNAME resource removed from edge-static. |
| 2026-07-12 | `core-infra` repository, `infra/README.md` | All Terraform extracted to the dedicated [core-infra](https://github.com/orenlion1/core-infra) repo with local state moved intact (verified by no-change plans). Shared surface documented and consumers validated: winnow uses the `ensemble-grafana.com` zone, `ensemble-grafana-shoppers` Cognito pool, OIDC provider, and shared tf-state bucket; priority-email is self-contained. |

## What This Category Produced

- Incremental Terraform stack structure for network, edge/static, auth, account-baseline, cluster, data, workload IAM, and Kubernetes.
- Kubernetes manifests for services, rollout behavior, Alloy, Beyla, and API routing.
- Concrete documentation for secret rotation, WAF limits, deployment commands, and validation.
- Capacity profiles that support load-test exercises.

## Current Artifacts

- [core-infra terraform/stacks](https://github.com/orenlion1/core-infra) (extracted 2026-07-12; see [infra/README.md](../../../infra/README.md))
- [infra/k8s](../../../infra/k8s)
- [.github/workflows/deploy.yml](../../../.github/workflows/deploy.yml)
- [docs/deployment.md](../../deployment.md)
- [skills/infrastructure/SKILLS.md](../../../skills/infrastructure/SKILLS.md)
