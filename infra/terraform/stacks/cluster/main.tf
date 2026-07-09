# DECOMMISSIONED 2026-07-09 — serverless cost-reduction migration (Option D).
#
# The EKS cluster, node group, OIDC provider, and associated IAM roles that this stack managed
# were destroyed when the three Spring Boot services moved to API Gateway + Lambda + DynamoDB
# (see docs/serverless-migration.md). The resource blocks were removed so this stack no longer
# recreates the cluster on apply. The remote state (S3 key stacks/cluster/terraform.tfstate) is
# retained but empty. To fully retire, delete this stack directory and its state object.
