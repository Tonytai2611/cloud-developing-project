output "frontend_bucket_name" {
  description = "Frontend S3 bucket name."
  value       = module.frontend_hosting.frontend_bucket_name
}

output "frontend_cloudfront_url" {
  description = "Frontend CloudFront URL."
  value       = "https://${module.frontend_hosting.cloudfront_domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend hosting."
  value       = module.frontend_hosting.cloudfront_distribution_id
}

output "chat_websocket_url" {
  description = "WebSocket URL for REACT_APP_WEBSOCKET_URL."
  value       = module.websocket_chat.websocket_url
}

output "chat_lambda_function_name" {
  description = "Chat Lambda function name."
  value       = module.websocket_chat.chat_lambda_function_name
}

output "chat_connections_table_name" {
  description = "Chat connections DynamoDB table name."
  value       = module.websocket_chat.chat_connections_table_name
}

output "chat_messages_table_name" {
  description = "Chat messages DynamoDB table name."
  value       = module.websocket_chat.chat_messages_table_name
}

output "image_bucket_name" {
  description = "Image upload S3 bucket name."
  value       = module.image_bucket.image_bucket_name
}

output "image_bucket_arn" {
  description = "Image upload S3 bucket ARN."
  value       = module.image_bucket.image_bucket_arn
}

output "menu_table_name" {
  description = "Menu DynamoDB table name."
  value       = module.dynamodb.menu_table_name
}

output "tables_table_name" {
  description = "Restaurant tables DynamoDB table name."
  value       = module.dynamodb.tables_table_name
}
