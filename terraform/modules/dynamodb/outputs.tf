output "users_table_name" {
  description = "The name of the DynamoDB users table."
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "The ARN of the DynamoDB users table."
  value       = aws_dynamodb_table.users.arn
}
