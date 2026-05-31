# Grafana Neutral Color Standardization - 2026-05-31

Source design note: `docs/dashboard-design/The Tufte Aesthetic for Grafana Dashboard Design.pdf`, section 2, "Strategic Use of Color".

## Color Scheme

| Usage | Setting |
|---|---:|
| Neutral/default visualization color | `#437d9e` |
| Stat/Singlestat background coloring | `colorMode: none` |
| Meets goal threshold | `#1eb16a` |
| Close to goal threshold | `#f27d05` |
| Significantly outside goal threshold | `#bd362f` |

## Scope

- Dashboards pulled from Grafana with `gcx dashboards list -o json`: 74.
- Editable dashboards updated and pushed with `gcx dashboards update`: 61.
- Dashboard style fields changed: 1458.
- Non-threshold color defaults set to neutral blue: 600.
- Baseline/default threshold steps set to neutral blue: 752.
- Stat/Singlestat background color modes turned off: 106.
- Publish failures: 0.

## Validation

A fresh dashboard pull after publishing found:

- Editable Stat/Singlestat panels still using background coloring: 0.
- Editable non-threshold field defaults not using `#437d9e`: 0.
- Editable baseline threshold steps not using `#437d9e`: 0.

## Updated Dashboards

| Dashboard UID | Title | Neutral Color Defaults | Neutral Baseline Thresholds | Backgrounds Off | Total Changes |
|---|---|---:|---:|---:|---:|
| 4_D6mSh4z | Cloud Logs Export Insights | 0 | 7 | 1 | 8 |
| Or6wtgg | Uptime SLA & RCA  | 14 | 0 | 11 | 25 |
| Orjdxm4 | Serviceline Cost Analysis - Metrics & Logs | 11 | 0 | 0 | 11 |
| a581fb5a-df38-45d7-83cb-d10835930fa1 | Performance Stats | 5 | 5 | 1 | 11 |
| asserts--C-IEldWk | Kafka Client KPI | 13 | 17 | 0 | 30 |
| asserts-000000039 | PostgreSQL-KPI | 17 | 0 | 0 | 17 |
| asserts-09ec8aa1e996d6ffcd6817bbaff4db1b | Kubernetes / API server | 10 | 10 | 0 | 20 |
| asserts-200ac8fdbfbb74b39aff88118e4d1c2c | Kubernetes / Compute Resources / Node (Pods) | 2 | 3 | 0 | 5 |
| asserts-3138fa155d5915769fbded898ac09fd9 | Kubernetes / Kubelet | 11 | 5 | 0 | 16 |
| asserts-5cxLMtrnk | JVM Service KPI (JMX Exporter) | 20 | 23 | 0 | 43 |
| asserts-632e265de029684c40b21cb76bca4f94 | Kubernetes / Proxy | 7 | 8 | 0 | 15 |
| asserts-6581e46e4e5c7ba40a07646395ef7b23 | Kubernetes / Compute Resources / Pod | 2 | 3 | 0 | 5 |
| asserts-85a562078cdf77779eaa1add43ccec1e | Kubernetes / Compute Resources / Namespace (Pods) | 6 | 10 | 0 | 16 |
| asserts-8Z6ACMK4k | JVM Overview | 14 | 14 | 0 | 28 |
| asserts-9 | Prometheus KPI | 5 | 6 | 0 | 11 |
| asserts-AtmF3moGk | Service KPI | 27 | 29 | 0 | 56 |
| asserts-BzznFZEGz | Namespace KPI | 8 | 8 | 0 | 16 |
| asserts-Eyumxkb4z | GO Metrics KPI | 10 | 10 | 0 | 20 |
| asserts-HX942iTGk | Node KPI | 6 | 6 | 0 | 12 |
| asserts-Ic9lazx4z | GO Instance Metrics KPI | 6 | 6 | 0 | 12 |
| asserts-Kn5xm-gZk | RabbitMQ Overview | 6 | 17 | 10 | 33 |
| asserts-MWKNuXinz | CoreDNS | 9 | 13 | 0 | 22 |
| asserts-Oje7LJN4z98 | CAdvisor Node KPI | 3 | 4 | 0 | 7 |
| asserts-QtQDLaV7z | JVM Instance KPI (Micrometer) | 0 | 3 | 0 | 3 |
| asserts-Z52Ejom7k | Redis ServiceInstance KPI | 16 | 0 | 0 | 16 |
| asserts-_Iwshez7z | Prometheus Blackbox Exporter | 5 | 103 | 14 | 122 |
| asserts-a164a7f0339f99e89cea5cb47e9be617 | Kubernetes / Compute Resources / Workload | 2 | 3 | 0 | 5 |
| asserts-a87fb0d919ec0ea5f6543124e16c42a5 | Kubernetes / Compute Resources / Namespace (Workloads) | 2 | 3 | 0 | 5 |
| asserts-d9I_9crnz | JVM Instance KPI (JMX Exporter) | 6 | 9 | 0 | 15 |
| asserts-efa86fd1d0c121a26444b636a3f509a8 | Kubernetes / Compute Resources / Cluster | 2 | 9 | 0 | 11 |
| asserts-fV9uuKb4k | Python Instance Metrics KPI | 4 | 7 | 0 | 11 |
| asserts-gW9uuKb4hy | Python Metrics KPI | 4 | 7 | 0 | 11 |
| asserts-gsO74Yi7k | Redis Service KPI | 18 | 0 | 0 | 18 |
| asserts-i2R0zTAMk | Pod KPI | 2 | 10 | 0 | 12 |
| asserts-i2R0zTAMk9 | GO Pod KPI | 1 | 9 | 0 | 10 |
| asserts-j1TdLsfMy | Database KPI | 3 | 5 | 0 | 8 |
| asserts-kRQz1IzVz | MongoDB-Database-KPI | 6 | 6 | 0 | 12 |
| asserts-mi0fBzxVk | NodeJS Instance Metrics KPI | 10 | 10 | 0 | 20 |
| asserts-mongodb-cluster-summary | MongoDB Cluster Summary | 6 | 8 | 0 | 14 |
| asserts-mongodb-instance-summary | MongoDB Instance Summary | 6 | 9 | 0 | 15 |
| asserts-mongodb-replicaset-summary | MongoDB ReplSet Summary | 4 | 5 | 0 | 9 |
| asserts-mxwNYa47z | JVM Service KPI (Micrometer) | 21 | 24 | 0 | 45 |
| asserts-mysql-amazonaurora | Aurora MySQL | 6 | 0 | 0 | 6 |
| asserts-mysql-innodb | MySQL InnoDB Details | 67 | 173 | 0 | 240 |
| asserts-mysql-instance-overview | MySQL Overview | 14 | 37 | 0 | 51 |
| asserts-mysql-instance-summary | MySQL Summary | 5 | 13 | 0 | 18 |
| asserts-n_nxrE_mk | ElasticSearch | 8 | 14 | 1 | 23 |
| asserts-nginx | NGINX Ingress controller | 5 | 12 | 0 | 17 |
| asserts-pMEd7m0Mz98 | CAdvisor KPI | 3 | 4 | 0 | 7 |
| asserts-qu-QZdfZz | Kafka Cluster KPI | 16 | 19 | 0 | 35 |
| asserts-rYdddlPWk-asserts | Node Exporter | 4 | 15 | 0 | 19 |
| asserts-t2iHfkxVk | NodeJS Metrics KPI | 10 | 10 | 0 | 20 |
| asserts-ukOUz1oGz | ServiceInstance KPI | 2 | 0 | 0 | 2 |
| asserts-usMp0qg7z | Node Group KPI | 6 | 6 | 0 | 12 |
| asserts-xSc6TpPMk | Volume KPI | 5 | 0 | 0 | 5 |
| c0c599c3-b950-44cc-9b22-c1b9b55f5fb4 | Billing/Usage | 64 | 2 | 62 | 128 |
| d2e206e1-f72b-448c-83d8-657831c2ea6d | Overview | 4 | 4 | 0 | 8 |
| ensemble-red-log-signals | Ensemble Performance | 33 | 0 | 0 | 33 |
| f41e046e-928f-4c5e-9a12-cd1fbd79609e | Business Health | 4 | 5 | 4 | 13 |
| fdkz6t5tcm7lse | Logs Demo Dashboard | 8 | 4 | 0 | 12 |
| or46lql | User Action Traffic: Real Users vs k6 | 6 | 0 | 2 | 8 |
