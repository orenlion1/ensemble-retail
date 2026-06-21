module "network" {
  count  = var.provision_network ? 1 : 0
  source = "./modules/network"

  availability_zone_count = var.availability_zone_count
  name                    = "ensemble-grafana"
  vpc_cidr                = var.vpc_cidr
}

locals {
  private_subnet_ids = var.provision_network ? module.network[0].private_subnet_ids : var.private_subnet_ids
  public_subnet_ids  = var.provision_network ? module.network[0].public_subnet_ids : var.public_subnet_ids
  vpc_id             = var.provision_network ? module.network[0].vpc_id : var.vpc_id
}

check "network_inputs" {
  assert {
    condition = var.provision_network || (
      var.vpc_id != null &&
      var.private_subnet_ids != null &&
      var.public_subnet_ids != null &&
      length(var.private_subnet_ids) > 0 &&
      length(var.public_subnet_ids) > 0
    )
    error_message = "When provision_network is false, provide vpc_id, private_subnet_ids, and public_subnet_ids from stacks/network outputs."
  }
}
