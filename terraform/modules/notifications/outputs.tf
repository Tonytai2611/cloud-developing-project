output "booking_events_topic_arn" {
  description = "SNS topic ARN for booking domain events."
  value       = aws_sns_topic.booking_events.arn
}

output "booking_notifications_queue_url" {
  description = "SQS queue URL for booking notification events."
  value       = aws_sqs_queue.booking_notifications.url
}

output "booking_notifications_queue_arn" {
  description = "SQS queue ARN for booking notification events."
  value       = aws_sqs_queue.booking_notifications.arn
}

output "booking_worker_function_name" {
  description = "Booking notification worker Lambda function name."
  value       = aws_lambda_function.booking_worker.function_name
}

output "contact_handler_function_name" {
  description = "Contact Us Lambda function name."
  value       = aws_lambda_function.contact_handler.function_name
}

output "contact_handler_function_arn" {
  description = "Contact Us Lambda function ARN."
  value       = aws_lambda_function.contact_handler.arn
}
