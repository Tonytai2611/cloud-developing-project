variable "project_name" {
  description = "BrewCraft project name"
  type        = string
}


variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}


variable "repository_names" {
  description = "Name of the ECR repository"
  type        = set(string)
  default     = ["backend", "frontend"]
}

variable "image_tag_mutability" {
  description = "Image tag mutability setting for the ECR repository (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "max_image_count" {
  description = "Maximum number of images to retain in the ECR repository"
  type        = number
  default     = 10
}



variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
}


