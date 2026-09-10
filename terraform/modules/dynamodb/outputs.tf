output "users_table_name" {
  description = "The name of the DynamoDB users table."
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "The ARN of the DynamoDB users table."
  value       = aws_dynamodb_table.users.arn
}

output "menu_table_name" {
  description = "The name of the DynamoDB menu table."
  value       = aws_dynamodb_table.menu.name
}

output "menu_table_arn" {
  description = "The ARN of the DynamoDB menu table."
  value       = aws_dynamodb_table.menu.arn
}

output "tables_table_name" {
  description = "The name of the DynamoDB restaurant tables table."
  value       = aws_dynamodb_table.tables.name
}

output "tables_table_arn" {
  description = "The ARN of the DynamoDB restaurant tables table."
  value       = aws_dynamodb_table.tables.arn
}
