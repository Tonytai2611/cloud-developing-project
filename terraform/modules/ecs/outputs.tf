output "cluster_id" {
  description = "The ID of the created ECS cluster"
  value       = aws_ecs_cluster.this.id
}

output "task_definition_arn" {
  description = "The ARN of the created ECS task definition"
  value       = aws_ecs_task_definition.backend.arn
}

output "service_name" {
  description = "The name of the created ECS service"
  value       = aws_ecs_service.backend.name
}

output "service_id" {
  description = "The ID of the created ECS service"
  value       = aws_ecs_service.backend.id
}