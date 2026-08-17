output "alb_id" {
  description = "The ID of the created ALB"
  value       = aws_alb.this.id
}

output "alb_arn" {
  description = "The ARN of the created ALB"
  value       = aws_alb.this.arn
}

output "alb_dns_name" {
  description = "The DNS name of the created ALB"
  value       = aws_alb.this.dns_name
}

output "alb_listener_arn" {
  description = "The ARN of the ALB listener"
  value       = aws_alb_listener.this.arn
}

output "alb_target_group_arn" {
  description = "The ARN of the ALB target group"
  value       = aws_alb_target_group.this.arn
}
