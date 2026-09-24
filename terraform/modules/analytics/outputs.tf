output "summary_table_name" {
  description = "Analytics summary DynamoDB table name."
  value       = aws_dynamodb_table.summary.name
}

output "summary_table_arn" {
  description = "Analytics summary DynamoDB table ARN."
  value       = aws_dynamodb_table.summary.arn
}

output "aggregator_function_name" {
  description = "Analytics aggregator Lambda function name."
  value       = aws_lambda_function.aggregator.function_name
}
