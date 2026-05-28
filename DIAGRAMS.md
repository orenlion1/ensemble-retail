# Ensemble-Grafana Diagrams

Architecture diagrams for the Ensemble-Grafana ecommerce platform.

Rendered PNG exports are stored in `docs/diagrams/`. Source Mermaid blocks remain authoritative; regenerate PNGs after editing this file.

## Network Diagram

```mermaid
flowchart TB
  shopper["Shopper browser"]
  google["Google Identity Provider"]
  registrar["Domain registrar"]
  route53["Route53 hosted zone\nensemble-grafana.com"]
  acm["ACM certificate\nus-east-1 / ISSUED"]
  edgeWaf["AWS WAF\nCloudFront scope"]
  cloudfront["CloudFront distribution\nensemble-grafana.com"]
  staticS3["S3 frontend bucket\nprivate origin"]
  imageS3["S3 inventory images bucket"]
  apiAlb["API ingress / ALB\napi.ensemble-grafana.com"]
  regionalWaf["AWS WAF\nregional API scope"]

  subgraph eks["EKS cluster"]
    beyla["Grafana Beyla"]
    alloy["Grafana Alloy\nOTel collector"]
    inventory["inventory-service\nSpring Boot pods"]
    cart["cart-service\nSpring Boot pods"]
    account["account-service\nSpring Boot pods"]
  end

  postgres["Postgres inventory DB"]
  dynamodb["DynamoDB\ncart/account state"]
  cognito["AWS Cognito\nGoogle federation"]
  grafana["Grafana Cloud\nFaro, metrics, logs, traces, profiles"]
  k6["Grafana Cloud k6\nload tests and browser checks"]
  accountBaseline["Terraform account-baseline stack\naccount-level SSM host-management setting"]

  registrar -->|"NS delegation"| route53
  route53 -->|"A / AAAA alias"| cloudfront
  acm -->|"TLS certificate"| cloudfront
  shopper -->|"HTTPS storefront"| edgeWaf --> cloudfront
  shopper -->|"Google sign-in"| cognito --> google
  cloudfront -->|"static assets"| staticS3
  cloudfront -->|"inventory images"| imageS3
  cloudfront -->|"/api/*"| regionalWaf --> apiAlb
  apiAlb --> inventory
  apiAlb --> cart
  apiAlb --> account
  inventory --> postgres
  cart --> dynamodb
  account --> dynamodb
  shopper -->|"Faro web telemetry"| grafana
  accountBaseline -->|"SSM default host-management role setting"| eks
  k6 -->|"regional, spike,\nand browser checks\nwith traceparent"| cloudfront
  k6 -->|"test results +\ntrace correlation"| grafana
  beyla -->|"zero-code HTTP telemetry"| alloy
  inventory -->|"OTel + Prometheus"| alloy
  cart -->|"OTel + Prometheus"| alloy
  account -->|"OTel + Prometheus"| alloy
  alloy --> grafana
```

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor Shopper
  participant Browser as Browser storefront
  participant Route53 as Route53 DNS
  participant CloudFront as CloudFront + edge WAF
  participant S3 as S3 static origin
  participant Cognito as Cognito hosted UI
  participant Google as Google IdP
  participant API as API ingress / ALB
  participant Inventory as inventory-service
  participant Cart as cart-service
  participant Account as account-service
  participant Postgres as Postgres inventory DB
  participant DynamoDB as DynamoDB shopper state
  participant Alloy as Grafana Alloy
  participant Grafana as Grafana Cloud
  participant K6 as Grafana Cloud k6

  Shopper->>Browser: Open https://ensemble-grafana.com
  Browser->>Route53: Resolve ensemble-grafana.com
  Route53-->>Browser: CloudFront alias target
  Browser->>CloudFront: HTTPS GET /
  CloudFront->>S3: Fetch index.html and assets
  S3-->>CloudFront: Static storefront
  CloudFront-->>Browser: HTML, JS, CSS, security headers
  Browser-->>Grafana: Faro page load, web vitals, session telemetry

  Shopper->>Browser: Sign in with Google
  Browser->>Cognito: Start OAuth authorization
  Cognito->>Google: Redirect for Google authentication
  Google-->>Cognito: Authorization code / identity claims
  Cognito-->>Browser: Auth callback with authorization code
  Browser->>Cognito: Exchange code with PKCE verifier
  Cognito-->>Browser: Cognito tokens and Google profile claims
  Browser->>Browser: Populate account name and email

  Browser->>CloudFront: GET /api/inventory/products
  CloudFront->>API: Route /api/* request
  API->>Inventory: Forward request with trace context
  Inventory->>Postgres: Query catalog, categories, prices, stock
  Postgres-->>Inventory: Inventory rows
  Inventory-->>API: Product response
  API-->>CloudFront: JSON response
  CloudFront-->>Browser: Product data

  Shopper->>Browser: Add item to cart
  Browser->>CloudFront: PUT /api/cart/carts/{shopperId} with Bearer JWT
  CloudFront->>API: Route cart request
  API->>Cart: Update cart with trace context and JWT
  Cart->>DynamoDB: Persist cart state
  DynamoDB-->>Cart: Write acknowledged
  Cart-->>Browser: Updated cart

  Shopper->>Browser: Save shipping address and wallet metadata
  Browser->>CloudFront: PUT /api/account/accounts/{shopperId} with Bearer JWT
  CloudFront->>API: Route account request
  API->>Account: Update account with trace context and JWT
  Account->>DynamoDB: Persist address and wallet metadata
  DynamoDB-->>Account: Write acknowledged
  Account-->>Browser: Saved account

  Inventory-->>Alloy: Metrics, logs, traces
  Cart-->>Alloy: Metrics, logs, traces
  Account-->>Alloy: Metrics, logs, traces
  Alloy-->>Grafana: Forward telemetry

  K6->>CloudFront: Run regional, spike, and browser checks with W3C trace context
  CloudFront->>API: Route k6 /api/* requests
  API->>Inventory: Product/catalog load
  API->>Cart: Protected cart writes with API_TEST_KEY
  API->>Account: Protected account writes with API_TEST_KEY
  K6-->>Grafana: Publish k6 run metrics, checks, and trace correlation metadata
```

## Request Flow Diagram

```mermaid
flowchart LR
  browser["Browser\nensemble-grafana.com"]
  dns["Route53\nA/AAAA alias"]
  cf["CloudFront\nHTTPS + static/API routing"]
  wafEdge["AWS WAF\nedge rules"]
  s3["S3 frontend origin\nindex.html, JS, CSS"]
  cognito["Cognito Hosted UI\nGoogle federation"]
  google["Google IdP"]
  apiPath{"/api/* ?"}
  apiWaf["AWS WAF\nregional API rules"]
  ingress["EKS API ingress / ALB"]
  k6["Grafana Cloud k6\nregional, spike,\nbrowser checks"]
  grafana["Grafana Cloud\nresults and telemetry"]

  inventory["inventory-service\n/api/inventory/*"]
  cart["cart-service\n/api/cart/*"]
  account["account-service\n/api/account/*"]

  postgres[("Postgres\ninventory catalog")]
  dynamoCart[("DynamoDB\ncart state")]
  dynamoAccount[("DynamoDB\naccount, address,\nwallet metadata")]

  browser -->|"DNS lookup"| dns
  dns -->|"CloudFront target"| browser
  browser -->|"HTTPS request"| wafEdge
  browser -->|"OAuth code + PKCE"| cognito
  cognito -->|"Google authentication"| google
  google -->|"identity claims"| cognito
  cognito -->|"Cognito JWTs"| browser
  k6 -->|"Synthetic load\nHTTPS + /api/*\nwith traceparent"| wafEdge
  wafEdge --> cf
  cf --> apiPath
  apiPath -->|"No: static route"| s3
  s3 -->|"HTML/assets"| cf
  cf -->|"Storefront response"| browser

  apiPath -->|"Yes: /api/*\nBearer JWT or API key"| apiWaf
  apiWaf --> ingress
  ingress -->|"/api/inventory/*"| inventory
  ingress -->|"/api/cart/*"| cart
  ingress -->|"/api/account/*"| account

  inventory -->|"Read products, categories,\nstock, pricing"| postgres
  postgres --> inventory
  cart -->|"Read/write cart items"| dynamoCart
  dynamoCart --> cart
  account -->|"Read/write profile,\nshipping, wallet metadata"| dynamoAccount
  dynamoAccount --> account

  inventory -->|"JSON response"| ingress
  cart -->|"JSON response"| ingress
  account -->|"JSON response"| ingress
  ingress --> apiWaf --> cf --> browser
  k6 -->|"k6 result metrics\nand trace correlation"| grafana
```

## Observability Capabilities Flow

```mermaid
flowchart TB
  browser["Shopper browser\nReact storefront"]
  faro["Grafana Faro SDK\nweb vitals, errors,\nlogs, sessions, user actions"]
  tracing["Faro web tracing\ntrace context on fetch/XHR"]

  cloudfront["CloudFront\nstatic + /api/* routing"]
  ingress["EKS API ingress / ALB"]

  subgraph services["Spring Boot services"]
    inventory["inventory-service"]
    cart["cart-service"]
    account["account-service"]
  end

  actuator["Spring Actuator\n/actuator/prometheus"]
  otel["Spring OpenTelemetry\ntraces + resource attrs"]
  logs["Kubernetes pod logs\nservice labels"]
  beyla["Grafana Beyla\nzero-code HTTP telemetry"]
  pyroscope["Pyroscope Alloy DaemonSet\nJVM profiles"]
  alloy["Grafana Alloy\nOTel collector"]

  synth["Grafana Synthetic Monitoring\nHTTP, DNS, Ping, TCP"]
  k6["Grafana Cloud k6\nregional load, spike benchmark,\nbrowser actions"]
  k6Tracing["k6 Tempo instrumentation\nW3C trace context"]
  irm["Grafana IRM\nincidents, labels,\non-call schedule"]

  grafana["Grafana Cloud stack\norenlion.grafana.net"]
  frontendObs["Frontend Observability\nFaro events and exceptions"]
  tempo["Traces\nfrontend-to-backend waterfalls"]
  prometheus["Metrics\nRED + infrastructure signals"]
  loki["Logs\nnamespace + service labels"]
  profiles["Profiles\nJava CPU profiles"]
  smResults["Synthetic results\nuptime, TLS, DNS, latency"]
  k6Results["k6 results\nVUs, checks, thresholds"]
  incidents["IRM workflows\nseverity, ownership, response"]

  browser -->|"page views, errors,\nuser actions"| faro
  browser -->|"HTTP requests\nwith traceparent"| tracing
  tracing --> cloudfront --> ingress
  ingress --> inventory
  ingress --> cart
  ingress --> account

  faro -->|"collector endpoint"| grafana
  tracing -->|"frontend spans"| grafana

  inventory --> actuator
  cart --> actuator
  account --> actuator
  inventory --> otel
  cart --> otel
  account --> otel
  inventory --> logs
  cart --> logs
  account --> logs

  services -->|"HTTP telemetry"| beyla
  services -->|"JVM attach"| pyroscope
  actuator -->|"Prometheus scrape"| alloy
  otel -->|"OTLP traces"| alloy
  logs -->|"pod log collection"| alloy
  beyla -->|"metrics + traces"| alloy
  pyroscope -->|"profiles write"| grafana
  alloy -->|"OTLP export"| grafana

  synth -->|"checks production URL\nand API health"| cloudfront
  synth -->|"check samples"| grafana
  k6 --> k6Tracing
  k6Tracing -->|"load checks\nwith traceparent"| cloudfront
  k6 -->|"test metrics +\ntrace correlation"| grafana
  irm -->|"incident and schedule state"| grafana

  grafana --> frontendObs
  grafana --> tempo
  grafana --> prometheus
  grafana --> loki
  grafana --> profiles
  grafana --> smResults
  grafana --> k6Results
  grafana --> incidents
```
