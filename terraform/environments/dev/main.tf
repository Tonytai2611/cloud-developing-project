locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

data "aws_caller_identity" "current" {}


module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  public_subnet_cidrs = {
    "us-east-1a" = "10.0.1.0/24"
    "us-east-1b" = "10.0.2.0/24"
  }
  tags = local.common_tags
}

module "security_groups" {
  source = "../../modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc-id
  app_port     = 3001

  tags = local.common_tags
}

module "ecr" {
  source = "../../modules/ecr"

  project_name     = var.project_name
  environment      = var.environment
  repository_names = ["backend", "frontend"]
  tags             = local.common_tags
}


module "alb" {
  count = var.enable_backend ? 1 : 0

  source = "../../modules/alb"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc-id
  public_subnet_ids = [
    module.vpc.public-subnet-ids[0],
    module.vpc.public-subnet-ids[1]
  ]
  alb_security_group_id = module.security_groups.alb_security_group_id
  app_port              = 3001
  health_check_path     = "/health"
  tags                  = local.common_tags
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name                  = var.project_name
  environment                   = var.environment
  enable_point_in_time_recovery = true
  tags                          = local.common_tags
}

module "websocket_chat" {
  source = "../../modules/websocket-chat"

  project_name                  = var.project_name
  environment                   = var.environment
  aws_region                    = var.aws_region
  lambda_source_path            = abspath("${path.root}/../../../lambda/chat_handler.py")
  enable_point_in_time_recovery = true
  stage_name                    = "production"
  tags                          = local.common_tags
}

module "ecs" {
  count = var.enable_backend ? 1 : 0

  source                = "../../modules/ecs"
  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  subnet_ids            = module.vpc.public-subnet-ids
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  ecs_target_group_arn  = module.alb[0].alb_target_group_arn
  container_name        = "backend"
  container_image       = "${module.ecr.repository_urls["backend"]}:latest"
  container_port        = 3001
  environment_variables = {
    AWS_REGION           = var.aws_region
    COGNITO_CLIENT_ID    = var.cognito_client_id
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    NODE_ENV             = "production"
    PORT                 = "3001"
    IMAGE_BUCKET         = module.image_bucket.image_bucket_name
    MENU_TABLE           = module.dynamodb.menu_table_name
    BOOKING_TABLE        = module.dynamodb.bookings_table_name
    TABLES_TABLE         = module.dynamodb.tables_table_name
    USERS_TABLE          = module.dynamodb.users_table_name
  }

  cpu             = 256
  memory          = 512
  users_table_arn = module.dynamodb.users_table_arn
  additional_dynamodb_table_arns = [
    module.dynamodb.bookings_table_arn,
    module.dynamodb.menu_table_arn,
    module.dynamodb.tables_table_arn
  ]
  cognito_user_pool_arn = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
  image_bucket_arn      = module.image_bucket.image_bucket_arn
  desired_count         = 1
  assign_public_ip      = true
  tags                  = local.common_tags
}

module "frontend_hosting" {
  source = "../../modules/frontend-hosting"

  project_name           = var.project_name
  environment            = var.environment
  account_id             = data.aws_caller_identity.current.account_id
  api_origin_domain_name = var.enable_backend ? module.alb[0].alb_dns_name : null
  api_path_patterns = [
    "/register",
    "/login",
    "/logout",
    "/me",
    "/user",
    "/confirm",
    "/confirmUser",
    "/verify-email",
    "/contact",
    "/upload",
    "/images/*",
    "/health",
    "/createBooking",
    "/updateBooking",
    "/deleteBooking",
    "/getBooking",
    "/createTable",
    "/updateTable",
    "/deleteTable",
    "/getTable",
    "/createMenuItem",
    "/updateMenuItem",
    "/deleteMenuItem",
    "/getMenu"
  ]
  tags = local.common_tags
}

module "image_bucket" {
  source = "../../modules/image-bucket"

  project_name = var.project_name
  environment  = var.environment
  account_id   = data.aws_caller_identity.current.account_id
  tags         = local.common_tags
}
