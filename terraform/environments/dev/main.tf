locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

data "aws_caller_identity" "current" {}

# CloudFront only accepts ACM certificates issued in us-east-1.
resource "aws_acm_certificate" "brewcraft_domain" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  tags = local.common_tags
}

resource "hostinger_dns_record" "acm_validation" {
  for_each = toset([var.domain_name])

  zone  = var.domain_name
  name  = trimsuffix(one(aws_acm_certificate.brewcraft_domain.domain_validation_options).resource_record_name, ".${var.domain_name}.")
  type  = one(aws_acm_certificate.brewcraft_domain.domain_validation_options).resource_record_type
  value = trimsuffix(one(aws_acm_certificate.brewcraft_domain.domain_validation_options).resource_record_value, ".")
  ttl   = 300
}

resource "aws_acm_certificate_validation" "brewcraft_domain" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.brewcraft_domain.arn
  validation_record_fqdns = [
    for record in values(hostinger_dns_record.acm_validation) : "${record.name}.${record.zone}"
  ]
}

resource "hostinger_dns_record" "frontend_alias" {
  zone  = var.domain_name
  name  = "@"
  type  = "ALIAS"
  value = module.frontend_hosting.cloudfront_domain_name
  ttl   = 300
}


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

module "notifications" {
  source = "../../modules/notifications"

  project_name                    = var.project_name
  environment                     = var.environment
  aws_region                      = var.aws_region
  booking_worker_source_path      = abspath("${path.root}/../../../lambda/email_sender.py")
  contact_handler_source_path     = abspath("${path.root}/../../../lambda/contact_handler.py")
  source_email                    = var.source_email
  admin_emails                    = var.admin_emails
  cognito_user_pool_id            = var.cognito_user_pool_id
  cognito_user_pool_arn           = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
  admin_group_name                = var.admin_group_name
  ses_require_verified_recipients = var.ses_require_verified_recipients
  tags                            = local.common_tags
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
    AWS_REGION                    = var.aws_region
    COGNITO_CLIENT_ID             = var.cognito_client_id
    COGNITO_USER_POOL_ID          = var.cognito_user_pool_id
    ADMIN_GROUP_NAME              = var.admin_group_name
    NODE_ENV                      = "production"
    PORT                          = "3001"
    IMAGE_BUCKET                  = module.image_bucket.image_bucket_name
    MENU_TABLE                    = module.dynamodb.menu_table_name
    BOOKING_TABLE                 = module.dynamodb.bookings_table_name
    TABLES_TABLE                  = module.dynamodb.tables_table_name
    USERS_TABLE                   = module.dynamodb.users_table_name
    FAVORITES_TABLE               = module.dynamodb.favorites_table_name
    BOOKING_EVENTS_TOPIC_ARN      = module.notifications.booking_events_topic_arn
    CONTACT_HANDLER_FUNCTION_NAME = module.notifications.contact_handler_function_name
  }

  cpu             = 256
  memory          = 512
  users_table_arn = module.dynamodb.users_table_arn
  additional_dynamodb_table_arns = [
    module.dynamodb.bookings_table_arn,
    module.dynamodb.menu_table_arn,
    module.dynamodb.tables_table_arn,
    module.dynamodb.favorites_table_arn
  ]
  cognito_user_pool_arn = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
  image_bucket_arn      = module.image_bucket.image_bucket_arn
  sns_topic_arns        = [module.notifications.booking_events_topic_arn]
  lambda_function_arns  = [module.notifications.contact_handler_function_arn]
  desired_count         = 1
  assign_public_ip      = true
  tags                  = local.common_tags
}

module "frontend_hosting" {
  source = "../../modules/frontend-hosting"

  project_name           = var.project_name
  environment            = var.environment
  account_id             = data.aws_caller_identity.current.account_id
  domain_aliases         = [var.domain_name]
  acm_certificate_arn    = aws_acm_certificate_validation.brewcraft_domain.certificate_arn
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
    "/getMenu",
    "/favorites",
    "/favorites/*"
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
