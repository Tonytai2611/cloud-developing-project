output "websocket_api_id" {
  description = "The WebSocket API Gateway API ID."
  value       = aws_apigatewayv2_api.chat.id
}

output "websocket_api_endpoint" {
  description = "The base WebSocket API endpoint."
  value       = aws_apigatewayv2_api.chat.api_endpoint
}

output "websocket_url" {
  description = "The deployed WebSocket URL for frontend REACT_APP_WEBSOCKET_URL."
  value       = "${aws_apigatewayv2_api.chat.api_endpoint}/${aws_apigatewayv2_stage.chat.name}"
}

output "chat_lambda_function_name" {
  description = "The chat Lambda function name."
  value       = aws_lambda_function.chat_handler.function_name
}

output "chat_connections_table_name" {
  description = "The chat connections DynamoDB table name."
  value       = aws_dynamodb_table.chat_connections.name
}

output "chat_messages_table_name" {
  description = "The chat messages DynamoDB table name."
  value       = aws_dynamodb_table.chat_messages.name
}
