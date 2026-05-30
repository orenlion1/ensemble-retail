# Ensemble-Grafana Diagrams

Architecture diagrams for the Ensemble-Grafana ecommerce platform.

Graphviz DOT sources are authoritative for architecture and flow diagrams. Mermaid is authoritative for the sequence diagram because it preserves request and response lifelines across dependencies. The diagrams use dark-mode styling with high-contrast text where supported. Rendered SVG and PNG exports are stored in `docs/diagrams/`.

Regenerate exports after editing a diagram source:

```sh
for f in docs/diagrams/*.dot; do
  dot -Tsvg "$f" > "${f%.dot}.svg"
  dot -Tpng -Gdpi=192 "$f" > "${f%.dot}.png"
done
npx -y @mermaid-js/mermaid-cli -i docs/diagrams/sequence-diagram.mmd -o docs/diagrams/sequence-diagram.svg -b transparent -t dark
npx -y @mermaid-js/mermaid-cli -i docs/diagrams/sequence-diagram.mmd -o docs/diagrams/sequence-diagram.png -b transparent -t dark -s 2
```

## Network Diagram

Source: `docs/diagrams/network-diagram.dot`

Rendered: [SVG](docs/diagrams/network-diagram.svg) · [PNG](docs/diagrams/network-diagram.png)

```dot
digraph network_diagram {
  rankdir=LR;
  label="Ensemble-Grafana Network Diagram";

  graph [
    fontname="Helvetica",
    fontsize=20,
    labelloc=t,
    bgcolor="#0b1220",
    fontcolor="#f8fafc",
    pad=0.25,
    nodesep=0.45,
    ranksep=0.7
  ];
  node [
    shape=box,
    style="rounded,filled",
    fontname="Helvetica",
    fontsize=11,
    color="#64748b",
    fillcolor="#111827",
    fontcolor="#f8fafc",
    margin="0.12,0.08"
  ];
  edge [
    fontname="Helvetica",
    fontsize=9,
    color="#94a3b8",
    fontcolor="#f8fafc",
    arrowsize=0.7
  ];


  shopper [label="Shopper browser", fillcolor="#1e3a8a"];
  registrar [label="Domain registrar"];
  route53 [label="Route53 hosted zone\nensemble-grafana.com", fillcolor="#164e63"];
  acm [label="ACM certificate\nus-east-1 / ISSUED", fillcolor="#155e75"];
  edgeWaf [label="AWS WAF\nCloudFront scope", fillcolor="#7f1d1d"];
  cloudfront [label="CloudFront distribution\nensemble-grafana.com", fillcolor="#1e3a8a"];
  staticS3 [label="S3 frontend bucket\nprivate origin", fillcolor="#713f12"];
  imageS3 [label="S3 inventory images bucket", fillcolor="#713f12"];
  logsS3 [label="S3 edge/API logs bucket\nCloudFront + ALB logs", fillcolor="#713f12"];
  regionalWaf [label="AWS WAF\nregional API scope", fillcolor="#7f1d1d"];
  apiAlb [label="API ingress / ALB\napi.ensemble-grafana.com", fillcolor="#3730a3"];
  cognito [label="AWS Cognito\nGoogle federation", fillcolor="#4c1d95"];
  google [label="Google Identity Provider", fillcolor="#4c1d95"];
  postgres [label="Postgres inventory DB", shape=cylinder, fillcolor="#14532d"];
  dynamodb [label="DynamoDB\ncart/account state", shape=cylinder, fillcolor="#14532d"];
  cloudwatch [label="AWS CloudWatch\nRDS metrics", fillcolor="#334155"];
  cloudwatchScrape [label="Grafana Cloud Provider\nAWS/RDS scrape job", fillcolor="#581c87"];
  grafana [label="Grafana Cloud\nFaro, metrics, logs, traces, profiles", fillcolor="#6b21a8"];
  k6 [label="Grafana Cloud k6\nload tests and browser checks", fillcolor="#6b21a8"];
  accountBaseline [label="Terraform account-baseline stack\nSSM host-management setting", fillcolor="#334155"];

  subgraph cluster_eks {
    label="EKS cluster";
    color="#64748b";
    fontcolor="#f8fafc";
    style="rounded,dashed";
    beyla [label="Grafana Beyla", fillcolor="#581c87"];
    alloy [label="Grafana Alloy\nOTel collector", fillcolor="#581c87"];
    inventory [label="inventory-service\nSpring Boot pods", fillcolor="#14532d"];
    cart [label="cart-service\nSpring Boot pods", fillcolor="#14532d"];
    account [label="account-service\nSpring Boot pods", fillcolor="#14532d"];
  }

  registrar -> route53 [label="NS delegation"];
  route53 -> cloudfront [label="A / AAAA alias"];
  acm -> cloudfront [label="TLS certificate"];
  shopper -> edgeWaf [label="HTTPS storefront"];
  edgeWaf -> cloudfront;
  shopper -> cognito [label="Google sign-in"];
  cognito -> google;
  cloudfront -> staticS3 [label="static assets"];
  cloudfront -> imageS3 [label="inventory images"];
  cloudfront -> logsS3 [label="standard access logs"];
  cloudfront -> regionalWaf [label="/api/*"];
  regionalWaf -> apiAlb;
  apiAlb -> logsS3 [label="ALB access logs"];
  apiAlb -> inventory;
  apiAlb -> cart;
  apiAlb -> account;
  inventory -> postgres;
  cart -> dynamodb;
  account -> dynamodb;
  postgres -> cloudwatch [label="RDS metrics"];
  cloudwatchScrape -> cloudwatch [label="assume AWS role\nand scrape metrics"];
  cloudwatchScrape -> grafana [label="CloudWatch metrics"];
  shopper -> grafana [label="Faro web telemetry"];
  accountBaseline -> beyla [label="SSM default role setting"];
  k6 -> cloudfront [label="regional, spike, browser checks\nwith traceparent"];
  k6 -> grafana [label="test results + trace correlation"];
  beyla -> alloy [label="zero-code HTTP telemetry"];
  inventory -> alloy [label="OTel + Prometheus"];
  cart -> alloy [label="OTel + Prometheus"];
  account -> alloy [label="OTel + Prometheus"];
  alloy -> grafana;
}
```

## Sequence Diagram

Source: `docs/diagrams/sequence-diagram.mmd`

Rendered: [SVG](docs/diagrams/sequence-diagram.svg) · [PNG](docs/diagrams/sequence-diagram.png)

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

Source: `docs/diagrams/request-flow-diagram.dot`

Rendered: [SVG](docs/diagrams/request-flow-diagram.svg) · [PNG](docs/diagrams/request-flow-diagram.png)

```dot
digraph request_flow_diagram {
  rankdir=LR;
  label="Browser Request Flow Through Backend Services";

  graph [
    fontname="Helvetica",
    fontsize=20,
    labelloc=t,
    bgcolor="#0b1220",
    fontcolor="#f8fafc",
    pad=0.25,
    nodesep=0.45,
    ranksep=0.7
  ];
  node [
    shape=box,
    style="rounded,filled",
    fontname="Helvetica",
    fontsize=11,
    color="#64748b",
    fillcolor="#111827",
    fontcolor="#f8fafc",
    margin="0.12,0.08"
  ];
  edge [
    fontname="Helvetica",
    fontsize=9,
    color="#94a3b8",
    fontcolor="#f8fafc",
    arrowsize=0.7
  ];


  browser [label="Browser\nensemble-grafana.com", fillcolor="#1e3a8a"];
  dns [label="Route53\nA/AAAA alias", fillcolor="#164e63"];
  wafEdge [label="AWS WAF\nedge rules", fillcolor="#7f1d1d"];
  cf [label="CloudFront\nHTTPS + static/API routing", fillcolor="#1e3a8a"];
  apiPath [label="/api/* ?", shape=diamond, fillcolor="#7c2d12"];
  s3 [label="S3 frontend origin\nindex.html, JS, CSS", fillcolor="#713f12"];
  cognito [label="Cognito Hosted UI\nGoogle federation", fillcolor="#4c1d95"];
  google [label="Google IdP", fillcolor="#4c1d95"];
  apiWaf [label="AWS WAF\nregional API rules", fillcolor="#7f1d1d"];
  ingress [label="EKS API ingress / ALB", fillcolor="#3730a3"];
  k6 [label="Grafana Cloud k6\nregional, spike, browser checks", fillcolor="#6b21a8"];
  grafana [label="Grafana Cloud\nresults and telemetry", fillcolor="#6b21a8"];

  inventory [label="inventory-service\n/api/inventory/*", fillcolor="#14532d"];
  cart [label="cart-service\n/api/cart/*", fillcolor="#14532d"];
  account [label="account-service\n/api/account/*", fillcolor="#14532d"];
  postgres [label="Postgres\ninventory catalog", shape=cylinder, fillcolor="#166534"];
  dynamoCart [label="DynamoDB\ncart state", shape=cylinder, fillcolor="#166534"];
  dynamoAccount [label="DynamoDB\naccount, address, wallet metadata", shape=cylinder, fillcolor="#166534"];

  browser -> dns [label="DNS lookup"];
  dns -> browser [label="CloudFront target"];
  browser -> wafEdge [label="HTTPS request"];
  browser -> cognito [label="OAuth code + PKCE"];
  cognito -> google [label="Google authentication"];
  google -> cognito [label="identity claims"];
  cognito -> browser [label="Cognito JWTs"];
  k6 -> wafEdge [label="Synthetic load\nHTTPS + /api/*\nwith traceparent"];
  wafEdge -> cf;
  cf -> apiPath;
  apiPath -> s3 [label="No: static route"];
  s3 -> cf [label="HTML/assets"];
  cf -> browser [label="Storefront response"];

  apiPath -> apiWaf [label="Yes: /api/*\nBearer JWT or API key"];
  apiWaf -> ingress;
  ingress -> inventory [label="/api/inventory/*"];
  ingress -> cart [label="/api/cart/*"];
  ingress -> account [label="/api/account/*"];
  inventory -> postgres [label="Read products, categories, stock, pricing"];
  postgres -> inventory;
  cart -> dynamoCart [label="Read/write cart items"];
  dynamoCart -> cart;
  account -> dynamoAccount [label="Read/write profile, shipping, wallet"];
  dynamoAccount -> account;
  inventory -> ingress [label="JSON response"];
  cart -> ingress [label="JSON response"];
  account -> ingress [label="JSON response"];
  ingress -> apiWaf -> cf -> browser;
  k6 -> grafana [label="k6 result metrics\nand trace correlation"];
}
```

## Observability Capabilities Flow

Source: `docs/diagrams/observability-capabilities-flow.dot`

Rendered: [SVG](docs/diagrams/observability-capabilities-flow.svg) · [PNG](docs/diagrams/observability-capabilities-flow.png)

```dot
digraph observability_capabilities_flow {
  rankdir=LR;
  label="Observability Capabilities Flow";

  graph [
    fontname="Helvetica",
    fontsize=20,
    labelloc=t,
    bgcolor="#0b1220",
    fontcolor="#f8fafc",
    pad=0.25,
    nodesep=0.45,
    ranksep=0.7
  ];
  node [
    shape=box,
    style="rounded,filled",
    fontname="Helvetica",
    fontsize=11,
    color="#64748b",
    fillcolor="#111827",
    fontcolor="#f8fafc",
    margin="0.12,0.08"
  ];
  edge [
    fontname="Helvetica",
    fontsize=9,
    color="#94a3b8",
    fontcolor="#f8fafc",
    arrowsize=0.7
  ];


  browser [label="Shopper browser\nReact storefront", fillcolor="#1e3a8a"];
  faro [label="Grafana Faro SDK\nweb vitals, errors, logs, sessions, user actions", fillcolor="#6b21a8"];
  tracing [label="Faro web tracing\ntrace context on fetch/XHR", fillcolor="#6b21a8"];
  cloudfront [label="CloudFront\nstatic + /api/* routing", fillcolor="#1e3a8a"];
  ingress [label="EKS API ingress / ALB", fillcolor="#3730a3"];
  edgeLogs [label="S3 access logs\nCloudFront + ALB", fillcolor="#713f12"];

  subgraph cluster_services {
    label="Spring Boot services";
    color="#64748b";
    fontcolor="#f8fafc";
    style="rounded,dashed";
    inventory [label="inventory-service", fillcolor="#14532d"];
    cart [label="cart-service", fillcolor="#14532d"];
    account [label="account-service", fillcolor="#14532d"];
  }

  actuator [label="Spring Actuator\n/actuator/prometheus", fillcolor="#164e63"];
  otel [label="Spring OpenTelemetry\ntraces + resource attrs", fillcolor="#164e63"];
  logs [label="Kubernetes pod logs\nservice labels", fillcolor="#164e63"];
  beyla [label="Grafana Beyla\nzero-code HTTP telemetry", fillcolor="#6b21a8"];
  pyroscope [label="Pyroscope Alloy DaemonSet\nJVM profiles", fillcolor="#6b21a8"];
  alloy [label="Grafana Alloy\nOTel collector", fillcolor="#6b21a8"];
  cloudwatch [label="AWS CloudWatch\nRDS metrics", fillcolor="#334155"];
  cloudwatchScrape [label="Grafana Cloud Provider\nAWS/RDS scrape job", fillcolor="#6b21a8"];
  synth [label="Grafana Synthetic Monitoring\nHTTP, DNS, Ping, TCP", fillcolor="#6b21a8"];
  k6 [label="Grafana Cloud k6\nregional load, spike benchmark, browser actions", fillcolor="#6b21a8"];
  k6Tracing [label="k6 Tempo instrumentation\nW3C trace context", fillcolor="#6b21a8"];
  irm [label="Grafana IRM\nincidents, labels, on-call schedule", fillcolor="#6b21a8"];

  grafana [label="Grafana Cloud stack\norenlion.grafana.net", fillcolor="#4c1d95"];
  frontendObs [label="Frontend Observability\nFaro events and exceptions", fillcolor="#581c87"];
  tempo [label="Traces\nfrontend-to-backend waterfalls", fillcolor="#581c87"];
  prometheus [label="Metrics\nRED + infrastructure signals", fillcolor="#581c87"];
  loki [label="Logs\nnamespace + service labels", fillcolor="#581c87"];
  profiles [label="Profiles\nJava CPU profiles", fillcolor="#581c87"];
  smResults [label="Synthetic results\nuptime, TLS, DNS, latency", fillcolor="#581c87"];
  k6Results [label="k6 results\nVUs, checks, thresholds", fillcolor="#581c87"];
  incidents [label="IRM workflows\nseverity, ownership, response", fillcolor="#581c87"];

  browser -> faro [label="page views, errors, user actions"];
  browser -> tracing [label="HTTP requests with traceparent"];
  tracing -> cloudfront -> ingress;
  cloudfront -> edgeLogs [label="standard access logs"];
  ingress -> edgeLogs [label="ALB access logs"];
  ingress -> inventory;
  ingress -> cart;
  ingress -> account;
  faro -> grafana [label="collector endpoint"];
  tracing -> grafana [label="frontend spans"];
  inventory -> actuator;
  cart -> actuator;
  account -> actuator;
  inventory -> otel;
  cart -> otel;
  account -> otel;
  inventory -> logs;
  cart -> logs;
  account -> logs;
  inventory -> beyla [label="HTTP telemetry"];
  cart -> beyla [label="HTTP telemetry"];
  account -> beyla [label="HTTP telemetry"];
  inventory -> pyroscope [label="JVM attach"];
  cart -> pyroscope [label="JVM attach"];
  account -> pyroscope [label="JVM attach"];
  actuator -> alloy [label="Prometheus scrape"];
  otel -> alloy [label="OTLP traces"];
  logs -> alloy [label="pod log collection"];
  edgeLogs -> grafana [label="RCA source for edge/API status codes"];
  beyla -> alloy [label="metrics + traces"];
  pyroscope -> grafana [label="profiles write"];
  alloy -> grafana [label="OTLP export"];
  cloudwatchScrape -> cloudwatch [label="assume AWS role and scrape AWS/RDS metrics"];
  cloudwatch -> grafana [label="RDS CloudWatch samples"];
  synth -> cloudfront [label="checks production URL and API health"];
  synth -> grafana [label="check samples"];
  k6 -> k6Tracing;
  k6Tracing -> cloudfront [label="load checks with traceparent"];
  k6 -> grafana [label="test metrics + trace correlation"];
  irm -> grafana [label="incident and schedule state"];
  grafana -> frontendObs;
  grafana -> tempo;
  grafana -> prometheus;
  grafana -> loki;
  grafana -> profiles;
  grafana -> smResults;
  grafana -> k6Results;
  grafana -> incidents;
}
```
