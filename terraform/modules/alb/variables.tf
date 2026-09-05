variable "project_name" {
  description = "The name of the project"
  type        = string
  nullable    = false
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)"
  type        = string
  nullable    = false
}


variable "vpc_id" {
  description = "The ID of the VPC where the security groups will be created"
  type        = string
  nullable    = false
}

variable "public_subnet_ids" {
  description = "List of IDs for the public subnets where the ALB will be deployed"
  type        = list(string)
  nullable    = false
}

variable "alb_security_group_id" {
  description = "The ID of the ALB security group"
  type        = string
}

variable "app_port" {
  description = "The port number for the application (e.g., 80 for HTTP, 443 for HTTPS)"
  type        = number
  default     = 30002
  nullable    = false
}

variable "health_check_path" {
  description = "The path for the health check of the application"
  type        = string
  default     = "/health"
  nullable    = false
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
  nullable    = false
} 