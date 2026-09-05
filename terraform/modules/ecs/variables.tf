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

variable "aws_region" {
  description = "AWS region used by the ECS log driver"
  type        = string
  nullable    = false
}

variable "subnet_ids" {
  description = "List of IDs for the subnets where the ECS service will be deployed"
  type        = list(string)
  nullable    = false
}


variable "ecs_security_group_id" {
  description = "The ID of the ECS security group"
  type        = string
  nullable    = false
}

variable "ecs_target_group_arn" {
  description = "The ARN of the ALB target group to associate with the ECS service"
  type        = string
  nullable    = false
}


variable "container_name" {
  description = "The name of the container to run in the ECS service"
  type        = string
  nullable    = false
}

variable "container_image" {
  description = "The Docker image to use for the container"
  type        = string
  nullable    = false
}

variable "container_port" {
  description = "The port number on which the container listens"
  type        = number
  default     = 3001
  nullable    = false
}

variable "desired_count" {
  description = "The desired number of ECS tasks to run"
  type        = number
  default     = 1
  nullable    = false
}

variable "cpu" {
  description = "The number of CPU units to reserve for the ECS task"
  type        = number
  default     = 512
}

variable "memory" {
  description = "The amount of memory in MiB to reserve for the ECS task"
  type        = number
  default     = 512
}

variable "assign_public_ip" {
  description = "Whether to assign a public IP address to the ECS tasks"
  type        = bool
  default     = true
}

variable "tags" {
  description = "A map of tags to assign to resources"
  type        = map(string)
  default     = {}
  nullable    = false
}
