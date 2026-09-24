variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region for analytics resources."
  type        = string
}

variable "bookings_table_name" {
  description = "DynamoDB bookings table name."
  type        = string
}

variable "bookings_stream_arn" {
  description = "DynamoDB Streams ARN for bookings."
  type        = string
}

variable "lambda_source_path" {
  description = "Analytics aggregator Lambda source path."
  type        = string
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for analytics summary."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Resource tags."
  type        = map(string)
  default     = {}
}
