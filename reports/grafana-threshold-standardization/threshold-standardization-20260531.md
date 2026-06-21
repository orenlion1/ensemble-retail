# Grafana Threshold Color Standardization - 2026-05-31

Source design note: `docs/dashboard-design/The Tufte Aesthetic for Grafana Dashboard Design.pdf`.

## Color Scheme

| State | Color |
|---|---:|
| Meets goal | `#1eb16a` |
| Close to goal | `#f27d05` |
| Significantly outside goal | `#bd362f` |
| Text-only critical threshold | `#ff3a3a` |

## Scope

- Dashboards pulled from Grafana with `gcx dashboards list -o json`: 74.
- Editable dashboards updated and pushed with `gcx dashboards update`: 60.
- Threshold color fields changed: 1906.
- Non-editable/plugin-provisioned dashboards skipped: 11.
- Conflict retries: ensemble-red-log-signals.

## Updated Dashboards

| Dashboard UID | Title | Threshold Color Changes |
|---|---|---:|
| 4_D6mSh4z | Cloud Logs Export Insights | 7 |
| Or6wtgg | Uptime SLA & RCA  | 13 |
| Orjdxm4 | Serviceline Cost Analysis - Metrics & Logs | 8 |
| a581fb5a-df38-45d7-83cb-d10835930fa1 | Performance Stats | 8 |
| asserts--C-IEldWk | Kafka Client KPI | 34 |
| asserts-000000039 | PostgreSQL-KPI | 46 |
| asserts-09ec8aa1e996d6ffcd6817bbaff4db1b | Kubernetes / API server | 20 |
| asserts-200ac8fdbfbb74b39aff88118e4d1c2c | Kubernetes / Compute Resources / Node (Pods) | 6 |
| asserts-3138fa155d5915769fbded898ac09fd9 | Kubernetes / Kubelet | 10 |
| asserts-5cxLMtrnk | JVM Service KPI (JMX Exporter) | 48 |
| asserts-632e265de029684c40b21cb76bca4f94 | Kubernetes / Proxy | 16 |
| asserts-6581e46e4e5c7ba40a07646395ef7b23 | Kubernetes / Compute Resources / Pod | 5 |
| asserts-85a562078cdf77779eaa1add43ccec1e | Kubernetes / Compute Resources / Namespace (Pods) | 22 |
| asserts-8Z6ACMK4k | JVM Overview | 28 |
| asserts-9 | Prometheus KPI | 12 |
| asserts-AtmF3moGk | Service KPI | 58 |
| asserts-BzznFZEGz | Namespace KPI | 15 |
| asserts-Eyumxkb4z | GO Metrics KPI | 20 |
| asserts-HX942iTGk | Node KPI | 12 |
| asserts-Ic9lazx4z | GO Instance Metrics KPI | 12 |
| asserts-Kn5xm-gZk | RabbitMQ Overview | 34 |
| asserts-MWKNuXinz | CoreDNS | 26 |
| asserts-Oje7LJN4z98 | CAdvisor Node KPI | 8 |
| asserts-QtQDLaV7z | JVM Instance KPI (Micrometer) | 8 |
| asserts-Z52Ejom7k | Redis ServiceInstance KPI | 24 |
| asserts-_Iwshez7z | Prometheus Blackbox Exporter | 262 |
| asserts-a164a7f0339f99e89cea5cb47e9be617 | Kubernetes / Compute Resources / Workload | 6 |
| asserts-a87fb0d919ec0ea5f6543124e16c42a5 | Kubernetes / Compute Resources / Namespace (Workloads) | 6 |
| asserts-d9I_9crnz | JVM Instance KPI (JMX Exporter) | 20 |
| asserts-efa86fd1d0c121a26444b636a3f509a8 | Kubernetes / Compute Resources / Cluster | 22 |
| asserts-fV9uuKb4k | Python Instance Metrics KPI | 14 |
| asserts-gW9uuKb4hy | Python Metrics KPI | 14 |
| asserts-gsO74Yi7k | Redis Service KPI | 28 |
| asserts-i2R0zTAMk | Pod KPI | 20 |
| asserts-i2R0zTAMk9 | GO Pod KPI | 18 |
| asserts-j1TdLsfMy | Database KPI | 10 |
| asserts-kRQz1IzVz | MongoDB-Database-KPI | 12 |
| asserts-mi0fBzxVk | NodeJS Instance Metrics KPI | 20 |
| asserts-mongodb-cluster-summary | MongoDB Cluster Summary | 18 |
| asserts-mongodb-instance-summary | MongoDB Instance Summary | 19 |
| asserts-mongodb-replicaset-summary | MongoDB ReplSet Summary | 10 |
| asserts-mxwNYa47z | JVM Service KPI (Micrometer) | 50 |
| asserts-mysql-amazonaurora | Aurora MySQL | 12 |
| asserts-mysql-innodb | MySQL InnoDB Details | 391 |
| asserts-mysql-instance-overview | MySQL Overview | 82 |
| asserts-mysql-instance-summary | MySQL Summary | 33 |
| asserts-n_nxrE_mk | ElasticSearch | 34 |
| asserts-nginx | NGINX Ingress controller | 22 |
| asserts-pMEd7m0Mz98 | CAdvisor KPI | 8 |
| asserts-qu-QZdfZz | Kafka Cluster KPI | 33 |
| asserts-rYdddlPWk-asserts | Node Exporter | 37 |
| asserts-t2iHfkxVk | NodeJS Metrics KPI | 20 |
| asserts-ukOUz1oGz | ServiceInstance KPI | 14 |
| asserts-usMp0qg7z | Node Group KPI | 12 |
| c0c599c3-b950-44cc-9b22-c1b9b55f5fb4 | Billing/Usage | 1 |
| d2e206e1-f72b-448c-83d8-657831c2ea6d | Overview | 4 |
| ensemble-red-log-signals | Ensemble Performance | 114 |
| f41e046e-928f-4c5e-9a12-cd1fbd79609e | Business Health | 11 |
| fdkz6t5tcm7lse | Logs Demo Dashboard | 6 |
| or46lql | User Action Traffic: Real Users vs k6 | 23 |
