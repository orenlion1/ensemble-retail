# Ensemble-Grafana Diagrams

Architecture diagrams for the Ensemble-Grafana ecommerce platform.

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
  k6 [label="Grafana Cloud k6\nload tests\n100 rps baseline + browser checks", fillcolor="#6b21a8"];
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
  k6 -> cloudfront [label="regional, spike,\n100 rps baseline,\nbrowser checks\nwith traceparent"];
  k6 -> grafana [label="test results + trace correlation"];
  beyla -> alloy [label="zero-code HTTP telemetry"];
  inventory -> alloy [label="OTel + Prometheus"];
  cart -> alloy [label="OTel + Prometheus"];
  account -> alloy [label="OTel + Prometheus"];
  alloy -> grafana;
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
      <TD BGCOLOR="#14532d"><FONT COLOR="#f8fafc"><B>API / Services</B></FONT></TD>
      <TD BGCOLOR="#166534"><FONT COLOR="#f8fafc"><B>Data Stores</B></FONT></TD>
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
    static_browser [label="Open\nensemble-grafana.com", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
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
    inv_cf [label="CloudFront\n/api/* route", fillcolor="#164e63", color="#38bdf8", group=c2];
    inv_api [label="ALB /\nAPI ingress", fillcolor="#14532d", color="#22c55e", group=c3];
    inv_service [label="inventory-service\ntrace context", fillcolor="#14532d", color="#22c55e", group=c4];
    inv_db [label="Postgres\ncatalog rows", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c5];
    inv_response [label="JSON product data\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c6];
    inv_browser -> inv_cf;
    inv_cf -> inv_api;
    inv_api -> inv_service;
    inv_service -> inv_db [label="query"];
    inv_db -> inv_response [label="rows -> JSON"];
  }

  subgraph cluster_cart {
    label="4. Cart update request";
    graph [rank=same];
    color="#22c55e";
    fontcolor="#bbf7d0";
    style="rounded,setlinewidth(2)";
    cart_browser [label="Cart change\nbrowser", fillcolor="#1e3a8a", color="#1e3a8a", group=c1];
    cart_cf [label="CloudFront\n/api/* route", fillcolor="#164e63", color="#38bdf8", group=c2];
    cart_api [label="ALB /\nJWT + trace", fillcolor="#14532d", color="#22c55e", group=c3];
    cart_service [label="cart-service\nupdate cart", fillcolor="#14532d", color="#22c55e", group=c4];
    cart_db [label="DynamoDB\ncart state", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c5];
    cart_response [label="Updated cart\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c6];
    cart_local [label="localStorage\nanonymous cart", fillcolor="#0f172a", color="#64748b", group=c2];
    cart_browser -> cart_local [label="no token"];
    cart_browser -> cart_cf [label="signed-in PUT\nBearer JWT"];
    cart_cf -> cart_api;
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
    acct_cf [label="CloudFront\n/api/* route", fillcolor="#164e63", color="#38bdf8", group=c2];
    acct_api [label="ALB /\nJWT + trace", fillcolor="#14532d", color="#22c55e", group=c3];
    acct_service [label="account-service\nprofile + wallet", fillcolor="#14532d", color="#22c55e", group=c4];
    acct_db [label="DynamoDB\naccount state", shape=cylinder, fillcolor="#166534", color="#16a34a", group=c5];
    acct_response [label="Saved account\nback to browser", fillcolor="#1e3a8a", color="#1e3a8a", group=c6];
    acct_browser -> acct_cf [label="Bearer JWT"];
    acct_cf -> acct_api;
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
    telemetry_services [label="inventory / cart /\naccount services", fillcolor="#14532d", color="#22c55e", group=c1];
    telemetry_alloy [label="Grafana Alloy\nmetrics, logs, traces", fillcolor="#6b21a8", color="#c084fc", group=c2];
    telemetry_grafana [label="Grafana Cloud\nMimir, Loki, Tempo,\nPyroscope", fillcolor="#6b21a8", color="#c084fc", group=c3];
    telemetry_services -> telemetry_alloy [label="OTel + Prometheus"];
    telemetry_alloy -> telemetry_grafana [label="export"];
  }

  subgraph cluster_k6 {
    label="7. k6 load and browser checks";
    graph [rank=same];
    color="#f59e0b";
    fontcolor="#fde68a";
    style="rounded,setlinewidth(2)";
    k6_runner [label="Grafana Cloud k6\nregional + spike\n100 rps API + browser", fillcolor="#713f12", color="#f59e0b", group=c1];
    k6_cf [label="CloudFront\n/api/* + storefront", fillcolor="#164e63", color="#38bdf8", group=c2];
    k6_api [label="ALB / API\ntraceparent", fillcolor="#14532d", color="#22c55e", group=c3];
    k6_services [label="inventory / cart /\naccount services", fillcolor="#14532d", color="#22c55e", group=c4];
    k6_grafana [label="Grafana Cloud\nrun metrics + checks", fillcolor="#6b21a8", color="#c084fc", group=c5];
    k6_runner -> k6_cf [label="regional, spike,\nbrowser actions"];
    k6_cf -> k6_api;
    k6_api -> k6_services;
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


  browser [label="Browser\nensemble-grafana.com", fillcolor="#1e3a8a"];
  dns [label="Route53\nA/AAAA alias", fillcolor="#164e63"];
  wafEdge [label="AWS WAF\nedge rules", fillcolor="#7f1d1d"];
  cf [label="CloudFront\nHTTPS + static/API routing", fillcolor="#1e3a8a"];
  apiPath [label="/api/* ?", shape=diamond, fillcolor="#7c2d12"];
  s3 [label="S3 frontend origin\nindex.html, JS, CSS", fillcolor="#713f12"];
  cognito [label="Cognito Hosted UI\nGoogle federation", fillcolor="#4c1d95"];
  google [label="Google IdP", fillcolor="#4c1d95"];
  localState [label="Browser localStorage\nanonymous cart/account", fillcolor="#0f172a"];
  apiWaf [label="AWS WAF\nregional API rules", fillcolor="#7f1d1d"];
  ingress [label="EKS API ingress / ALB", fillcolor="#3730a3"];
  k6 [label="Grafana Cloud k6\nregional, spike,\n100 rps baseline,\nbrowser checks", fillcolor="#6b21a8"];
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
  browser -> localState [label="anonymous writes"];
  localState -> browser [label="restore local state"];
  k6 -> wafEdge [label="Synthetic load\n100 rps baseline\nHTTPS + /api/*\nwith traceparent"];
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
  synth [label="Grafana Synthetic Monitoring\nHTTP, DNS, Ping, TCP,\nscripted k6, k6 browser", fillcolor="#6b21a8"];
  k6 [label="Grafana Cloud k6\nregional load, spike benchmark,\n100 rps API baseline,\nbrowser actions", fillcolor="#6b21a8"];
  k6Tracing [label="k6 Tempo instrumentation\nW3C trace context", fillcolor="#6b21a8"];
  irm [label="Grafana IRM\nincidents, labels, on-call schedule", fillcolor="#6b21a8"];

  grafana [label="Grafana Cloud stack\norenlion.grafana.net", fillcolor="#4c1d95"];
  frontendObs [label="Frontend Observability\nFaro events and exceptions", fillcolor="#581c87"];
  tempo [label="Traces\nfrontend-to-backend waterfalls", fillcolor="#581c87"];
  prometheus [label="Metrics\nRED + infrastructure signals", fillcolor="#581c87"];
  loki [label="Logs\nnamespace + service labels", fillcolor="#581c87"];
  profiles [label="Profiles\nJava CPU profiles", fillcolor="#581c87"];
  smResults [label="Synthetic results\nuptime, TLS, DNS,\nlatency, browser actions", fillcolor="#581c87"];
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
  k6Tracing -> cloudfront [label="load checks with traceparent\n100 rps API baseline"];
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
