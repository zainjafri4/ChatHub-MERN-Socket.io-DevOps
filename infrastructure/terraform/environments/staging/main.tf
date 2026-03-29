locals {
  project = "chathub"
  env     = "staging"
  tags = {
    Project     = local.project
    Environment = local.env
    ManagedBy   = "terraform"
  }
}

module "security_groups" {
  source  = "../../modules/security_groups"
  project = local.project
  env     = local.env
  vpc_id  = module.networking.vpc_id
  tags    = local.tags
}

# Single public subnet — ECS host sits here, Elastic IP provides stable address.
# No NAT Gateway, no private subnets = zero extra cost.
module "networking" {
  source = "../../modules/networking"

  project             = local.project
  env                 = local.env
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = ["10.0.1.0/24"]
  availability_zones  = ["${var.aws_region}a"]
  tags                = local.tags
}

module "ecr" {
  source                = "../../modules/ecr"
  project               = local.project
  image_retention_count = 3
  tags                  = local.tags
}

module "iam" {
  source  = "../../modules/iam"
  project = local.project
  env     = local.env

  create_github_oidc_role = var.create_github_oidc_role
  github_repo             = var.github_repo
  ecr_repo_arns = [
    "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.project}-backend",
    "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.project}-frontend",
  ]

  tags = local.tags
}

module "ecs" {
  source     = "../../modules/ecs"
  project    = local.project
  env        = local.env
  aws_region = var.aws_region
  tags       = local.tags

  subnet_id            = module.networking.public_subnet_ids[0]
  ecs_sg_id            = module.security_groups.ecs_sg_id
  instance_profile_name = module.iam.instance_profile_name

  task_execution_role_arn = module.iam.task_execution_role_arn
  task_role_arn           = module.iam.task_role_arn

  backend_image  = module.ecr.backend_repo_url
  frontend_image = module.ecr.frontend_repo_url
  image_tag      = var.image_tag

  ssm_prefix = "/chathub/staging"
}

data "aws_caller_identity" "current" {}
