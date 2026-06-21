# Security Notes

## Implemented Pre-Deploy Controls

- CloudFront is configured with AWS WAF managed common, known-bad-input, SQLi, and rate-limit rules.
- The API ALB has a regional WAF ACL and TLS 1.2/1.3 ALB policy placeholders in the Kubernetes ingress.
- CloudFront response headers include HSTS, frame denial, content type sniffing protection, referrer policy, permissions policy, and a restrictive CSP.
- S3 buckets block public access and use server-side encryption; CloudFront reads static assets through Origin Access Control.
- DynamoDB cart/account tables enable point-in-time recovery, server-side encryption, and deletion protection.
- RDS is private-subnet only, encrypted, deletion-protected, backed up, and security-group restricted to EKS.
- EKS control plane audit logs are enabled. Worker nodes run in private subnets.
- EKS pod access is scoped through IRSA roles for inventory, cart, and account service accounts.
- Kubernetes app pods run as non-root, drop Linux capabilities, deny privilege escalation, use read-only root filesystems, and have PodDisruptionBudgets.
- The application namespace enforces the Kubernetes restricted pod security standard. Beyla runs in a separate observability namespace because eBPF instrumentation requires elevated host access.
- Spring services validate inputs, hide stack traces/binding details in error responses, use explicit CORS origins, and protect cart/account APIs with Cognito JWTs or the scoped k6/API test key.
- The storefront uses Cognito Hosted UI with Google federation and PKCE. Browser API writes include a Cognito bearer token after sign-in; the Google client secret stays server-side in Terraform/secret inputs only.
- Wallet data is validated as metadata only; full payment card numbers are rejected.
- `.env`, `.tfvars`, and Terraform state files are ignored so secrets are not committed by default.

## Required Before Public Traffic

- Replace every placeholder ARN/account ID in Kubernetes manifests with Terraform outputs or a deployment templating step.
- Store runtime secrets in AWS Secrets Manager or SSM Parameter Store and sync them into Kubernetes with External Secrets or the AWS Secrets Store CSI driver.
- Configure `COGNITO_ISSUER_URI`, `ALLOWED_CORS_ORIGINS`, frontend `VITE_COGNITO_*` values, and API keys per environment.
- Confirm Grafana Faro source-map upload keys exist only in the CI/build environment. Never expose source-map upload keys to the browser.
- Enable CI checks for `npm audit`, Maven dependency scanning, container image scanning, IaC scanning, and secret scanning.
- Confirm logs/traces redact `Authorization`, `Cookie`, `X-Api-Key`, wallet metadata, addresses, and query strings before forwarding telemetry.
- Validate WAF rule false positives in count mode before switching new rule groups to block mode for real traffic.
