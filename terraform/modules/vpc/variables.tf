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


variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  nullable    = false
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = map(string)
  nullable    = false
  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least two public subnets are required."
  }
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
  nullable    = false
}