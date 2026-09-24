variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "brewcraft"
}

variable "domain_name" {
  description = "Public domain served by the BrewCraft CloudFront distribution."
  type        = string
  default     = "brewcraft.cloud"
  nullable    = false
}

variable "hostinger_api_token" {
  description = "Hostinger API token used only by the DNS provider; supply through TF_VAR_hostinger_api_token."
  type        = string
  sensitive   = true
  nullable    = false
}


variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resource deployment."
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_backend" {
  description = "Whether to run the ECS backend and its Application Load Balancer."
  type        = bool
  default     = true
  nullable    = false
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID used by the backend runtime."
  type        = string
  default     = "us-east-1_5S0LcmBl2"
  nullable    = false
}

variable "cognito_client_id" {
  description = "Cognito app client ID used by the backend runtime."
  type        = string
  default     = "3b86tra521331e2dlqg2dmbekr"
  nullable    = false
}

variable "source_email" {
  description = "Verified SES sender email address used for BrewCraft notifications."
  type        = string
  default     = ""
  nullable    = false
}

variable "admin_emails" {
  description = "Optional comma-separated fallback admin email addresses. Cognito admin group emails are preferred."
  type        = string
  default     = ""
  nullable    = false
}

variable "admin_group_name" {
  description = "Cognito group name that marks users as BrewCraft admins."
  type        = string
  default     = "admin"
  nullable    = false
}

variable "ses_require_verified_recipients" {
  description = "Whether notifications should only be sent to SES-verified recipients. Keep true while SES is in sandbox."
  type        = bool
  default     = true
  nullable    = false
}
