variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment name (e.g., dev, staging, prod)"
  type        = string
}


variable "account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
}

variable "api_origin_domain_name" {
  description = "Optional ALB DNS name used as the API origin behind CloudFront."
  type        = string
  default     = null
}

variable "api_path_patterns" {
  description = "API path patterns that CloudFront should route to the API origin."
  type        = list(string)
  default     = []
}

variable "domain_aliases" {
  description = "Custom hostnames served by the CloudFront distribution."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for the custom CloudFront hostnames."
  type        = string
  default     = null
}
