output "frontend_bucket_name" {
  description = "Frontend S3 bucket name."
  value       = module.frontend_hosting.frontend_bucket_name
}

output "frontend_cloudfront_url" {
  description = "Frontend CloudFront URL."
  value       = "https://${module.frontend_hosting.cloudfront_domain_name}"
}

output "frontend_custom_domain_url" {
  description = "Custom HTTPS URL for the BrewCraft frontend."
  value       = "https://${var.domain_name}"
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

output "favorites_table_name" {
  description = "User favourites DynamoDB table name."
  value       = module.dynamodb.favorites_table_name
}

output "booking_events_topic_arn" {
  description = "SNS topic ARN for booking notification events."
  value       = module.notifications.booking_events_topic_arn
}

output "booking_notifications_queue_url" {
  description = "SQS queue URL for booking notification events."
  value       = module.notifications.booking_notifications_queue_url
}

output "booking_worker_function_name" {
  description = "Booking notification worker Lambda function name."
  value       = module.notifications.booking_worker_function_name
}

output "contact_handler_function_name" {
  description = "Contact Us Lambda function name."
  value       = module.notifications.contact_handler_function_name
}
