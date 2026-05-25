# Infrastructure Replication Skill

Use this skill when creating a new application from the Ensemble-Grafana infrastructure pattern. The goal is to make cloud deployment incremental, independently runnable, and easy to validate before workloads are exposed.

## Core Pattern

- Split Terraform into independently deployable stacks instead of one large state.
- Prefer explicit handoff outputs between stacks over hidden cross-state assumptions.
- Keep root or legacy Terraform as reference only after stack decomposition is complete.
- Document every stack's required inputs, produced outputs, and manual prerequisites.
- Keep secrets out of state inputs whenever possible; use placeholders, secret references, or runtime secret managers.

## Recommended Terraform Stack Order

Use this stack sequence as the default:

```text
network -> edge-static -> auth -> cluster -> data -> workload-iam -> kubernetes
```

### `network`

Purpose:

- VPC.
- Public/private subnets.
- Route tables.
- NAT and internet gateway.
- Network outputs for downstream stacks.

Required outputs:

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`

Replication notes:

- Make this the first standalone state.
- Avoid coupling the VPC lifecycle to EKS, RDS, or CloudFront.
- Include an export helper if later stacks need `.tfvars` generated from outputs.

### `edge-static`

Purpose:

- Route53 hosted zone and DNS records.
- ACM certificates for public HTTPS.
- CloudFront distribution.
- S3 buckets for static frontend and media.
- WAF for public edge.
- Static/API path behavior split.

Replication notes:

- Use ACM in `us-east-1` for CloudFront certificates.
- Route `/api/*` to API origin separately from static assets.
- Configure HTTP-to-HTTPS redirects at CloudFront.
- Document registrar delegation and name servers.

### `auth`

Purpose:

- Cognito user pool and hosted UI.
- Google OIDC identity provider.
- OAuth application client.

Replication notes:

- Allow any valid Google account by avoiding domain-specific restrictions.
- Keep Google client ID and client secret in `.tfvars` stubs or secret storage.
- Document Google OAuth consent screen and callback URL requirements.

### `cluster`

Purpose:

- EKS cluster.
- Managed node group.
- Cluster/node IAM roles.
- OIDC provider for IRSA.

Replication notes:

- Use three `t3.medium` nodes for demo clusters (higher pod limits than `t3.small`); scale app replicas to 2 when running Beyla, Pyroscope, and Grafana k8s-monitoring together.
- Keep workload IAM separate from cluster creation.
- Require `aws eks update-kubeconfig` as a post-apply operational step.

### `data`

Purpose:

- Postgres/Aurora inventory catalog store.
- DynamoDB shopper state tables.
- Runtime database secret references.

Replication notes:

- Use Postgres for durable catalog/inventory.
- Use DynamoDB for cart/account/session/idempotency state.
- Enable recovery controls such as point-in-time recovery where possible.

### `workload-iam`

Purpose:

- IAM roles for service accounts.
- DynamoDB access by service.
- Database secret access by service.

Replication notes:

- Use IRSA roles per service, not broad node roles.
- Keep service permissions narrow and resource-specific.

### `kubernetes`

Purpose:

- Namespace.
- Deployments.
- Services.
- Ingress/API routing.
- Secrets references.
- Observability DaemonSets/collectors.

Replication notes:

- Apply after the cluster, data, and workload IAM stacks exist.
- Keep generated secrets out of source.
- Include resource requests/limits and health probes for every workload.

## Kubernetes Workload Baseline

For each backend service:

- 2 replicas for demo HA on small/medium EKS node groups.
- CPU and memory requests/limits.
- Readiness and liveness probes.
- Service manifest.
- Prometheus scrape annotations or ServiceMonitor metadata.
- Environment variables for service name, log level, auth, database, and telemetry.

## Domain And TLS

Default public path:

- Route53 hosted zone for the apex domain.
- Registrar delegates to Route53 name servers.
- ACM certificate validates through DNS.
- CloudFront serves `https://<domain>`.
- HTTP redirects to HTTPS.

Use Let's Encrypt only for direct in-cluster ingress/server TLS when CloudFront or ACM is not terminating TLS.

## Security Baseline

Include:

- WAF at CloudFront and, if needed, regional API entry.
- Private S3 origins.
- Least-privilege IAM.
- Secret examples only; never commit real secret files.
- Network policies for Kubernetes.
- Security predeploy checks for secrets, WAF, HSTS, Kubernetes hardening, and recovery settings.

## Validation Checklist

- `terraform init && terraform plan` works in each stack.
- Stack output names match downstream variable names.
- Route53 hosted zone has registrar-delegated name servers.
- ACM certificate is issued.
- CloudFront serves HTTPS and redirects HTTP.
- `/api/*` is routed separately from static assets.
- EKS kubeconfig works for the deploy role.
- Kubernetes manifests apply cleanly.
- README documents the exact stack order and required variables.
- DIAGRAMS.md reflects network, request, and deployment flow changes.
