variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  nullable    = false
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  nullable    = false
}

variable "aws_region" {
  description = "AWS region for Lambda and SES clients."
  type        = string
  nullable    = false
}

variable "booking_worker_source_path" {
  description = "Path to the booking notification worker Lambda source file."
  type        = string
  nullable    = false
}

variable "contact_handler_source_path" {
  description = "Path to the Contact Us Lambda source file."
  type        = string
  nullable    = false
}

variable "source_email" {
  description = "Verified SES sender email address."
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

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID used to discover users in the admin group."
  type        = string
  nullable    = false
}

variable "cognito_user_pool_arn" {
  description = "Cognito user pool ARN used to scope admin group lookup permissions."
  type        = string
  nullable    = false
}

variable "admin_group_name" {
  description = "Cognito group name that marks users as BrewCraft admins."
  type        = string
  default     = "admin"
  nullable    = false
}

variable "ses_require_verified_recipients" {
  description = "Whether Lambda should only send email to SES-verified identities. Keep true while SES is in sandbox."
  type        = bool
  default     = true
  nullable    = false
}

variable "tags" {
  description = "A map of tags to assign to resources."
  type        = map(string)
  default     = {}
  nullable    = false
}
