variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "brewcraft"
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
