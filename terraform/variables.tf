variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region to deploy resources to"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment name (dev, staging, prod)"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for the VPC"
}
