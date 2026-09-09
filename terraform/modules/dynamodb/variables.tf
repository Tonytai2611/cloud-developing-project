variable "project_name" {
  description = "The name of the project."
  type        = string
  nullable    = false
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  nullable    = false
}


variable "enable_point_in_time_recovery" {
  description = "Enable point in time recovery for the DynamoDB table"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to the resource."
  type        = map(string)
  default     = {}
  nullable    = false
}