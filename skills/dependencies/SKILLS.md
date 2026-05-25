# Dependencies Replication Skill

Use this skill when preparing a new workstation, CI runner, or bootstrap script for an Ensemble-Grafana-style application. The goal is to install and verify the tools needed for Java/Spring services, JavaScript frontend work, AWS/Terraform infrastructure, Kubernetes deployment, Grafana observability, k6 testing, and local development.

## Core Pattern

- Install dependencies with repeatable commands.
- Prefer package managers where possible.
- Verify every installed tool with a version command.
- Document credentials separately from tool installation.
- Keep secrets out of shell history, logs, and committed files.
- Capture OS-specific notes when commands differ.

## macOS Bootstrap

Install Homebrew first if it is missing:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install core tools:

```sh
brew update
brew install \
  awscli \
  docker \
  gcx \
  git \
  jq \
  k6 \
  kubectl \
  maven \
  node \
  openjdk \
  ripgrep \
  terraform
```

Link Java if Homebrew asks for it:

```sh
sudo ln -sfn "$(brew --prefix openjdk)/libexec/openjdk.jdk" /Library/Java/JavaVirtualMachines/openjdk.jdk
```

Start Docker Desktop manually after installation, or install Docker Desktop separately if the Homebrew formula does not provide the desktop runtime needed on the host.

## Version Verification

Run:

```sh
aws --version
docker --version
gcx version
git --version
java --version
mvn --version
node --version
npm --version
k6 version
kubectl version --client
terraform version
rg --version
jq --version
```

Record the important versions in the setup notes when reproducing a build or debugging environment differences.

## Java And Maven

Use Java for Spring Boot services:

- Install OpenJDK.
- Install Maven.
- Verify `JAVA_HOME` if Maven cannot find Java.

Common shell setup:

```sh
export JAVA_HOME="$(/usr/libexec/java_home)"
export PATH="$JAVA_HOME/bin:$PATH"
```

Verify service builds:

```sh
cd services/inventory-service && mvn test
cd ../cart-service && mvn test
cd ../account-service && mvn test
```

## Node And Frontend

Use Node/npm for the Vite frontend:

```sh
cd frontend
npm install
npm run build
```

For applications with browser checks:

```sh
npm run test:images
```

## Docker And Local Data Stores

Use Docker for local Postgres and DynamoDB Local:

```sh
docker compose up -d postgres dynamodb-local
docker compose ps
```

Verify local service ports match the application config before starting Spring Boot services.

## AWS And Terraform

Install:

- `awscli`
- `terraform`

Configure an AWS profile:

```sh
aws configure sso --profile <profile-name>
aws sts get-caller-identity --profile <profile-name>
```

Run Terraform per stack:

```sh
cd infra/terraform/stacks/network
terraform init
AWS_PROFILE=<profile-name> terraform plan
```

Never commit:

- `.terraform/`
- Terraform state files for shared repos.
- `.tfvars` files containing secrets.

## Kubernetes

Install:

- `kubectl`
- AWS CLI auth support through `aws eks update-kubeconfig`.

Configure kubeconfig:

```sh
aws eks update-kubeconfig \
  --name <cluster-name> \
  --region <aws-region> \
  --profile <profile-name>
```

Verify:

```sh
kubectl cluster-info
kubectl get namespaces
```

If the principal cannot list Kubernetes objects, update EKS access entries or the `aws-auth` mapping and Kubernetes RBAC.

## Grafana CLI And Observability Tools

Install `gcx`:

```sh
brew install gcx
gcx version
```

Configure Grafana Cloud context:

```sh
gcx config set grafana.server https://<stack>.grafana.net
gcx config set grafana.token <grafana-cloud-token>
gcx config set cloud.stack <stack-slug>
gcx config set cloud.token <grafana-cloud-token>
```

For Synthetic Monitoring, also configure:

```sh
gcx config set providers.synth.sm-url https://synthetic-monitoring-api-<region>.grafana.net
gcx config set providers.synth.sm-token <synthetic-monitoring-token>
gcx config set providers.synth.sm-metrics-datasource-uid <prometheus-datasource-uid>
```

Token note:

- Grafana Cloud OTLP/Faro/Profiles tokens are not always accepted by k6 token exchange.
- Native k6 tokens may be required for `k6 cloud login`.

## k6

Install:

```sh
brew install k6
k6 version
```

Authenticate to Grafana Cloud k6:

```sh
k6 cloud login --token <k6-token> --stack <stack-slug-or-url>
k6 cloud project list
```

Validate scripts before running:

```sh
k6 inspect load-tests/grafana-cloud-20-user-regional.js
k6 inspect load-tests/grafana-cloud-traffic-spikes.js
k6 inspect load-tests/synthetic-browser-actions.js
```

Run locally:

```sh
API_TEST_KEY=<api-test-key> \
BASE_URL=https://<domain> \
k6 run load-tests/grafana-cloud-20-user-regional.js
```

Upload or run in Cloud:

```sh
k6 cloud upload load-tests/grafana-cloud-20-user-regional.js
k6 cloud run load-tests/grafana-cloud-20-user-regional.js
```

## Browser Testing

For browser inspection and frontend validation, use one or more of:

- Chrome DevTools MCP server.
- k6 browser.
- Lighthouse.
- Project-specific broken-image checks.

Verify:

```sh
cd frontend
npm run test:images
```

## Credentials Checklist

Do not install credentials as part of dependency setup. Document what is needed:

- AWS profile or SSO access.
- Google OAuth client ID and secret.
- Grafana Cloud token for telemetry writes.
- Grafana Synthetic Monitoring token.
- Native k6 token.
- `API_TEST_KEY` for protected load-test write flows.
- Kubernetes access entry or RBAC mapping.

Store local secret examples in ignored files or secret managers, not committed source.

## Validation Checklist

- All version commands succeed.
- Docker can run local data stores.
- Maven can build Spring Boot services.
- Frontend can install and build.
- Terraform can initialize a stack.
- AWS caller identity is correct.
- kubectl can reach the target EKS cluster.
- `gcx config view` shows expected stack and Synthetic Monitoring settings with secrets redacted.
- `k6 inspect` passes for every load-test script.
- README documents any non-obvious dependency or token split.
