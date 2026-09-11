variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region for the chat resources."
  type        = string
}

variable "lambda_source_path" {
  description = "Path to the chat Lambda Python source file."
  type        = string
}

variable "enable_point_in_time_recovery" {
  description = "Enable point in time recovery for chat DynamoDB tables."
  type        = bool
  default     = true
}

variable "stage_name" {
  description = "WebSocket API Gateway stage name."
  type        = string
  default     = "production"
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
  default     = {}
}
