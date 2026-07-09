# Ensemble-Retail Diagrams

Architecture diagrams for the Ensemble-Retail ecommerce platform. Deployed AWS, Kubernetes, and Grafana resource identifiers remain legacy-named where renaming would recreate resources.

Graphviz DOT sources are authoritative for the diagrams. The diagrams use dark-mode styling with high-contrast text. Rendered SVG and PNG exports are stored in `docs/diagrams/`.

Regenerate exports after editing a diagram source:

```sh
for f in docs/diagrams/*.dot; do
  dot -Tsvg "$f" > "${f%.dot}.svg"
  dot -Tpng -Gdpi=192 "$f" > "${f%.dot}.png"
done
```

## Network Diagram

Source: `docs/diagrams/network-diagram.dot`

Rendered: [SVG](docs/diagrams/network-diagram.svg) · [PNG](docs/diagrams/network-diagram.png)

```dot
digraph network_diagram {
  rankdir=LR;
  label="Ensemble-Retail Network Diagram";

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
  route53 [label="Route53 public DNS\nensemble-retail.com\napi.ensemble-retail.com", fillcolor="#164e63"];
  acm [label="ACM certificate\nus-east-1 / ISSUED\ncovers both domains", fillcolor="#155e75"];
  edgeWaf [label="AWS WAF\nCloudFront scope", fillcolor="#7f1d1d"];
  cloudfront [label="CloudFront distribution\nensemble-retail.com", fillcolor="#1e3a8a"];
  staticS3 [label="S3 frontend bucket\nprivate origin", fillcolor="#713f12"];
  imageS3 [label="S3 inventory images bucket", fillcolor="#713f12"];
  logsS3 [label="S3 edge logs bucket\nCloudFront access logs", fillcolor="#713f12"];
  apiGateway [label="API Gateway HTTP API\napi.ensemble-retail.com\nstage throttling", fillcolor="#3730a3"];
  cognito [label="AWS Cognito\nGoogle federation", fillcolor="#4c1d95"];
  google [label="Google Identity Provider", fillcolor="#4c1d95"];
  dynamodb [label="DynamoDB\nproducts / carts / accounts\non-demand, PITR", shape=cylinder, fillcolor="#14532d"];
  cwLogs [label="AWS CloudWatch Logs\nAPI Gateway + Lambda", fillcolor="#334155"];
  grafana [label="Grafana Cloud\nFaro, metrics, logs, traces, profiles", fillcolor="#6b21a8"];
  k6 [label="Grafana Cloud k6\nload tests\n5 rps baseline + browser checks", fillcolor="#6b21a8"];

  subgraph cluster_lambda {
    label="AWS Lambda (Java 21, arm64, SnapStart)";
    color="#64748b";
    fontcolor="#f8fafc";
    style="rounded,dashed";
    inventory [label="inventory-service\nLambda + live alias", fillcolor="#14532d"];
    cart [label="cart-service\nLambda + live alias", fillcolor="#14532d"];
    account [label="account-service\nLambda + live alias", fillcolor="#14532d"];
  }

  registrar -> route53 [label="NS delegation"];
  route53 -> cloudfront [label="storefront\nA / AAAA alias"];
  route53 -> apiGateway [label="api.* A / AAAA alias"];
  acm -> cloudfront [label="TLS certificate"];
  acm -> apiGateway [label="TLS certificate"];
  shopper -> edgeWaf [label="HTTPS storefront"];
  edgeWaf -> cloudfront;
  shopper -> apiGateway [label="HTTPS /api/*\nX-Api-Key or Bearer JWT"];
  shopper -> cognito [label="Google sign-in"];
  cognito -> google;
  cloudfront -> staticS3 [label="static assets"];
  cloudfront -> imageS3 [label="inventory images"];
  cloudfront -> logsS3 [label="standard access logs"];
  apiGateway -> inventory [label="/api/inventory/*"];
  apiGateway -> cart [label="/api/cart/*"];
  apiGateway -> account [label="/api/account/*"];
  apiGateway -> cwLogs [label="access logs"];
  inventory -> dynamodb [label="scan products"];
  cart -> dynamodb [label="get/put cart"];
  account -> dynamodb [label="get/put account"];
  inventory -> cwLogs [label="function logs"];
  cart -> cwLogs [label="function logs"];
  account -> cwLogs [label="function logs"];
  shopper -> grafana [label="Faro web telemetry"];
  k6 -> cloudfront [label="storefront + browser checks\nwith traceparent"];
  k6 -> apiGateway [label="regional, spike,\n5 rps baseline API load"];
  k6 -> grafana [label="test results + trace correlation"];
}
```

## Sequence Diagram

Source: `docs/diagrams/sequence-diagram.dot`

Rendered: [SVG](docs/diagrams/sequence-diagram.svg) · [PNG](docs/diagrams/sequence-diagram.png)

```dot
digraph sequence_dependency_diagram {
  label="Frontend-to-Backend Request Sequence as Stacked Horizontal Paths";
  labelloc=t;
  rankdir=TB;

  graph [
    fontname="Helvetica,Arial,sans-serif",
    fontsize=22,
    bgcolor="#0b1220",
    fontcolor="#f8fafc",
    newrank=true,
    nodesep=0.30,
    ranksep=0.35,
    splines=polyline,
    outputorder=edgesfirst,
    pad=0.25
  ];

  node [
    shape=box,
    style="filled,setlinewidth(2)",
    fontname="Helvetica,Arial,sans-serif",
    fontsize=11,
    color="#64748b",
    fillcolor="#111827",
    fontcolor="#f8fafc",
    margin="0.10,0.06"
  ];

  edge [
    fontname="Helvetica,Arial,sans-serif",
    fontsize=9,
    color="#94a3b8",
    fontcolor="#f8fafc",
    arrowsize=0.55,
    penwidth=2
  ];

  key [shape=plain, label=<
    <TABLE BORDER="1" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6" COLOR="#475569">
      <TR><TD BGCOLOR="#1e3a8a"><FONT COLOR="#f8fafc"><B>Browser</B></FONT></TD>
      <TD BGCOLOR="#164e63"><FONT COLOR="#f8fafc"><B>DNS / Edge</B></FONT></TD>
      <TD BGCOLOR="#713f12"><FONT COLOR="#f8fafc"><B>Static Origin</B></FONT></TD>
      <TD BGCOLOR="#4c1d95"><FONT COLOR="#f8fafc"><B>Identity</B></FONT></TD>
      <TD BGCOLOR="#14532d"><FONT COLOR="#f8fafc"><B>API Gateway / Lambda</B></FONT></TD>
      <TD BGCOLOR="#166534"><FONT COLOR="#f8fafc"><B>DynamoDB</B></FONT></TD>
      <TD BGCOLOR="#6b21a8"><FONT COLOR="#f8fafc"><B>Telemetry</B></FONT></TD>
      <TD BGCOLOR="#713f12"><FONT COLOR="#f8fafc"><B>k6</B></FONT></TD></TR>
    </TABLE>
  >];

  start [label="Shopper browser", shape=ellipse, fillcolor="#1e3a8a", color="#1e3a8a"];

  subgraph cluster_static {
    label="1. Storefront page load";
    graph [rank=same];
    color="#38bdf8";
    fontcolor="#bae6fd";
    style="rounded,setlinewidth(2)";
    static_browser [label="Open\nensemble-retail.com", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    static_dns [label="Route53\nDNS alias", fillcolor="#164e63", color="#38bdf8", group=c2];
    static_cf [label="CloudFront\n+ edge WAF", fillcolor="#164e63", color="#38bdf8", group=c3];
    static_s3 [label="S3\nstatic origin", fillcolor="#713f12", color="#f59e0b", group=c4];
    static_render [label="Render HTML,\nJS, CSS, headers", fillcolor="#1e3a8a", color="#1e3a8a", group=c5];
    static_faro [label="Faro page load,\nvitals, session", fillcolor="#6b21a8", color="#c084fc", group=c6];
    static_grafana [label="Grafana Cloud\nfrontend telemetry", fillcolor="#6b21a8", color="#c084fc", group=c7];
    static_browser -> static_dns [label="resolve"];
    static_dns -> static_cf [label="alias"];
    static_cf -> static_s3 [label="fetch"];
    static_s3 -> static_render [label="assets"];
    static_render -> static_faro [label="web signal"];
    static_faro -> static_grafana [label="collect"];
  }

  subgraph cluster_auth {
    label="2. Google sign-in through Cognito";
    graph [rank=same];
    color="#a855f7";
    fontcolor="#e9d5ff";
    style="rounded,setlinewidth(2)";
    auth_browser [label="Start\nGoogle sign-in", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    auth_cognito [label="Cognito\nOAuth authorize", fillcolor="#4c1d95", color="#a855f7", group=c2];
    auth_google [label="Google IdP\nauthentication", fillcolor="#4c1d95", color="#a855f7", group=c3];
    auth_claims [label="Cognito tokens\n+ profile claims", fillcolor="#4c1d95", color="#a855f7", group=c4];
    auth_account [label="Populate account\nname + email", fillcolor="#1e3a8a", color="#1e3a8a", group=c5];
    auth_browser -> auth_cognito [label="authorize"];
    auth_cognito -> auth_google [label="redirect"];
    auth_google -> auth_claims [label="claims"];
    auth_claims -> auth_account [label="callback + PKCE"];
  }

  subgraph cluster_inventory {
    label="3. Inventory browse request";
    graph [rank=same];
    color="#22c55e";
    fontcolor="#bbf7d0";
    style="rounded,setlinewidth(2)";
    inv_browser [label="GET\n/api/inventory/products", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    inv_api [label="API Gateway\napi.* /api/inventory/*", fillcolor="#3730a3", color="#818cf8", group=c2];
    inv_service [label="inventory-service\nLambda + trace context", fillcolor="#14532d", color="#22c55e", group=c3];
    inv_db [label="DynamoDB\nproduct catalog scan", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c4];
    inv_response [label="JSON product data\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c5];
    inv_browser -> inv_api;
    inv_api -> inv_service;
    inv_service -> inv_db [label="scan"];
    inv_db -> inv_response [label="items -> JSON"];
  }

  subgraph cluster_cart {
    label="4. Cart update request";
    graph [rank=same];
    color="#22c55e";
    fontcolor="#bbf7d0";
    style="rounded,setlinewidth(2)";
    cart_browser [label="Cart change\nbrowser", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    cart_api [label="API Gateway\nJWT / X-Api-Key + throttle", fillcolor="#3730a3", color="#818cf8", group=c2];
    cart_service [label="cart-service\nLambda update cart", fillcolor="#14532d", color="#22c55e", group=c3];
    cart_db [label="DynamoDB\ncart state", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c4];
    cart_response [label="Updated cart\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c5];
    cart_local [label="localStorage\nanonymous cart", fillcolor="#0f172a", color="#64748b", group=c2];
    cart_browser -> cart_local [label="no token"];
    cart_browser -> cart_api [label="signed-in PUT\nBearer JWT"];
    cart_api -> cart_service;
    cart_service -> cart_db [label="persist"];
    cart_db -> cart_response [label="ack"];
  }

  subgraph cluster_account {
    label="5. Account save request";
    graph [rank=same];
    color="#22c55e";
    fontcolor="#bbf7d0";
    style="rounded,setlinewidth(2)";
    acct_browser [label="PUT\n/api/account/accounts/{shopperId}", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    acct_api [label="API Gateway\nJWT + throttle", fillcolor="#3730a3", color="#818cf8", group=c2];
    acct_service [label="account-service\nLambda profile + wallet", fillcolor="#14532d", color="#22c55e", group=c3];
    acct_db [label="DynamoDB\naccount state", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c4];
    acct_response [label="Saved account\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c5];
    acct_browser -> acct_api [label="Bearer JWT"];
    acct_api -> acct_service;
    acct_service -> acct_db [label="persist"];
    acct_db -> acct_response [label="ack"];
  }

  subgraph cluster_telemetry {
    label="6. Backend telemetry";
    graph [rank=same];
    color="#c084fc";
    fontcolor="#f3e8ff";
    style="rounded,setlinewidth(2)";
    telemetry_services [label="inventory / cart /\naccount Lambdas", fillcolor="#14532d", color="#22c55e", group=c1];
    telemetry_cw [label="AWS CloudWatch\nfunction logs + metrics", fillcolor="#334155", color="#94a3b8", group=c2];
    telemetry_grafana [label="Grafana Cloud\nCloudWatch integration,\nMimir, Loki", fillcolor="#6b21a8", color="#c084fc", group=c3];
    telemetry_services -> telemetry_cw [label="logs + metrics"];
    telemetry_cw -> telemetry_grafana [label="scrape / integration"];
  }

  subgraph cluster_k6 {
    label="7. k6 load and browser checks";
    graph [rank=same];
    color="#f59e0b";
    fontcolor="#fde68a";
    style="rounded,setlinewidth(2)";
    k6_runner [label="Grafana Cloud k6\nregional + spike\n5 rps API + browser", fillcolor="#713f12", color="#f59e0b", group=c1];
    k6_edge [label="CloudFront storefront +\nAPI Gateway /api/*", fillcolor="#164e63", color="#38bdf8", group=c2];
    k6_services [label="inventory / cart /\naccount Lambdas", fillcolor="#14532d", color="#22c55e", group=c3];
    k6_grafana [label="Grafana Cloud\nrun metrics + checks", fillcolor="#6b21a8", color="#c084fc", group=c4];
    k6_runner -> k6_edge [label="regional, spike,\nbrowser actions"];
    k6_edge -> k6_services;
    k6_runner -> k6_grafana [label="results"];
  }

  key -> start [style=invis, weight=20];
  start -> static_browser [style=invis, weight=20];
  static_browser -> auth_browser [style=invis, weight=20];
  auth_browser -> inv_browser [style=invis, weight=20];
  inv_browser -> cart_browser [style=invis, weight=20];
  cart_browser -> acct_browser [style=invis, weight=20];
  acct_browser -> telemetry_services [style=invis, weight=20];
  telemetry_services -> k6_runner [style=invis, weight=20];
}
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


  browser [label="Browser\nensemble-retail.com", fillcolor="#1e3a8a"];
  dns [label="Route53\nA/AAAA alias", fillcolor="#164e63"];
  wafEdge [label="AWS WAF\nedge rules", fillcolor="#7f1d1d"];
  cf [label="CloudFront\nHTTPS storefront", fillcolor="#1e3a8a"];
  s3 [label="S3 frontend origin\nindex.html, JS, CSS", fillcolor="#713f12"];
  cognito [label="Cognito Hosted UI\nGoogle federation", fillcolor="#4c1d95"];
  google [label="Google IdP", fillcolor="#4c1d95"];
  localState [label="Browser localStorage\nanonymous cart/account", fillcolor="#0f172a"];
  apiGw [label="API Gateway HTTP API\napi.ensemble-retail.com\nstage throttling", fillcolor="#3730a3"];
  k6 [label="Grafana Cloud k6\nregional, spike,\n5 rps baseline,\nbrowser checks", fillcolor="#6b21a8"];
  grafana [label="Grafana Cloud\nresults and telemetry", fillcolor="#6b21a8"];

  inventory [label="inventory-service Lambda\n/api/inventory/*", fillcolor="#14532d"];
  cart [label="cart-service Lambda\n/api/cart/*", fillcolor="#14532d"];
  account [label="account-service Lambda\n/api/account/*", fillcolor="#14532d"];
  dynamoProducts [label="DynamoDB\nproduct catalog", shape=cylinder, fillcolor="#166534"];
  dynamoCart [label="DynamoDB\ncart state", shape=cylinder, fillcolor="#166534"];
  dynamoAccount [label="DynamoDB\naccount, address, wallet metadata", shape=cylinder, fillcolor="#166534"];

  browser -> dns [label="DNS lookup"];
  dns -> browser [label="CloudFront / API GW target"];
  browser -> wafEdge [label="HTTPS storefront"];
  browser -> cognito [label="OAuth code + PKCE"];
  cognito -> google [label="Google authentication"];
  google -> cognito [label="identity claims"];
  cognito -> browser [label="Cognito JWTs"];
  browser -> localState [label="anonymous writes"];
  localState -> browser [label="restore local state"];

  // Storefront path (CloudFront + S3)
  wafEdge -> cf;
  cf -> s3 [label="static route"];
  s3 -> cf [label="HTML/assets"];
  cf -> browser [label="Storefront response"];
  k6 -> wafEdge [label="storefront + browser checks"];

  // API path (API Gateway + Lambda + DynamoDB), a separate api.* host
  browser -> apiGw [label="/api/*\nBearer JWT or X-Api-Key"];
  k6 -> apiGw [label="Synthetic load\n5 rps baseline\nwith traceparent"];
  apiGw -> inventory [label="/api/inventory/*"];
  apiGw -> cart [label="/api/cart/*"];
  apiGw -> account [label="/api/account/*"];
  inventory -> dynamoProducts [label="Scan products, categories, stock, pricing"];
  dynamoProducts -> inventory;
  cart -> dynamoCart [label="Read/write cart items"];
  dynamoCart -> cart;
  account -> dynamoAccount [label="Read/write profile, shipping, wallet"];
  dynamoAccount -> account;
  inventory -> apiGw [label="JSON response"];
  cart -> apiGw [label="JSON response"];
  account -> apiGw [label="JSON response"];
  apiGw -> browser [label="JSON response"];
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
  cloudfront [label="CloudFront\nstorefront routing", fillcolor="#1e3a8a"];
  apiGw [label="API Gateway HTTP API\napi.* /api/* routing", fillcolor="#3730a3"];
  edgeLogs [label="S3 access logs\nCloudFront", fillcolor="#713f12"];

  subgraph cluster_services {
    label="Lambda services (Java 21, arm64, SnapStart)";
    color="#64748b";
    fontcolor="#f8fafc";
    style="rounded,dashed";
    inventory [label="inventory-service", fillcolor="#14532d"];
    cart [label="cart-service", fillcolor="#14532d"];
    account [label="account-service", fillcolor="#14532d"];
  }

  otel [label="Lambda OTLP traces\n(pending Grafana Cloud\nOTLP re-wiring)", fillcolor="#334155"];
  cwLogs [label="CloudWatch Logs\nAPI Gateway + Lambda", fillcolor="#164e63"];
  cwMetrics [label="CloudWatch Metrics\nLambda + API Gateway", fillcolor="#164e63"];
  cwIntegration [label="Grafana Cloud\nCloudWatch integration", fillcolor="#6b21a8"];
  synth [label="Grafana Synthetic Monitoring\nHTTP, DNS, Ping, TCP,\nscripted k6, k6 browser", fillcolor="#6b21a8"];
  k6 [label="Grafana Cloud k6\nregional load, spike benchmark,\n5 rps API baseline,\nbrowser actions", fillcolor="#6b21a8"];
  k6Tracing [label="k6 Tempo instrumentation\nW3C trace context", fillcolor="#6b21a8"];
  irm [label="Grafana IRM\nincidents, labels, on-call schedule", fillcolor="#6b21a8"];

  grafana [label="Grafana Cloud stack\norenlion.grafana.net", fillcolor="#4c1d95"];
  frontendObs [label="Frontend Observability\nFaro events and exceptions", fillcolor="#581c87"];
  tempo [label="Traces\nfrontend spans + waterfalls", fillcolor="#581c87"];
  prometheus [label="Metrics\nRED + infrastructure signals", fillcolor="#581c87"];
  loki [label="Logs\nfunction + service labels", fillcolor="#581c87"];
  smResults [label="Synthetic results\nuptime, TLS, DNS,\nlatency, browser actions", fillcolor="#581c87"];
  k6Results [label="k6 results\nVUs, checks, thresholds", fillcolor="#581c87"];
  incidents [label="IRM workflows\nseverity, ownership, response", fillcolor="#581c87"];

  browser -> faro [label="page views, errors, user actions"];
  browser -> tracing [label="HTTP requests with traceparent"];
  tracing -> cloudfront [label="storefront"];
  tracing -> apiGw [label="/api/* with traceparent"];
  cloudfront -> edgeLogs [label="standard access logs"];
  apiGw -> inventory;
  apiGw -> cart;
  apiGw -> account;
  faro -> grafana [label="collector endpoint"];
  tracing -> grafana [label="frontend spans"];
  inventory -> otel;
  cart -> otel;
  account -> otel;
  inventory -> cwLogs;
  cart -> cwLogs;
  account -> cwLogs;
  inventory -> cwMetrics;
  cart -> cwMetrics;
  account -> cwMetrics;
  apiGw -> cwLogs [label="access logs"];
  apiGw -> cwMetrics [label="request metrics"];
  cwLogs -> cwIntegration [label="log ingestion"];
  cwMetrics -> cwIntegration [label="metric scrape"];
  otel -> grafana [label="OTLP export (when enabled)", style=dashed];
  edgeLogs -> grafana [label="RCA source for edge status codes"];
  cwIntegration -> grafana [label="metrics + logs into Grafana"];
  synth -> cloudfront [label="checks storefront health"];
  synth -> apiGw [label="checks API health"];
  synth -> grafana [label="check samples"];
  k6 -> k6Tracing;
  k6Tracing -> apiGw [label="load checks with traceparent\n5 rps API baseline"];
  k6Tracing -> cloudfront [label="browser + storefront checks"];
  k6 -> grafana [label="test metrics + trace correlation"];
  irm -> grafana [label="incident and schedule state"];
  grafana -> frontendObs;
  grafana -> tempo;
  grafana -> prometheus;
  grafana -> loki;
  grafana -> smResults;
  grafana -> k6Results;
  grafana -> incidents;
}
```
