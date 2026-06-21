module "network" {
  source = "../../modules/network"

  availability_zone_count = var.availability_zone_count
  name                    = "ensemble-grafana"
  vpc_cidr                = var.vpc_cidr
}
