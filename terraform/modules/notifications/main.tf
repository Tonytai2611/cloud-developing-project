locals {
  name_prefix                 = "${var.project_name}-${var.environment}"
  booking_worker_name         = "${local.name_prefix}-booking-notification-worker"
  contact_handler_name        = "${local.name_prefix}-contact-handler"
  booking_worker_zip_path     = "${path.root}/.terraform/${local.booking_worker_name}.zip"
  contact_handler_zip_path    = "${path.root}/.terraform/${local.contact_handler_name}.zip"
  booking_notifications_queue = "${local.name_prefix}-booking-notifications"
  lambda_common_environment = merge(
    {
      COGNITO_USER_POOL_ID            = var.cognito_user_pool_id
      ADMIN_GROUP_NAME                = var.admin_group_name
      SES_REQUIRE_VERIFIED_RECIPIENTS = tostring(var.ses_require_verified_recipients)
    },
    trimspace(var.source_email) != "" ? { SOURCE_EMAIL = trimspace(var.source_email) } : {},
    trimspace(var.admin_emails) != "" ? { ADMIN_EMAILS = trimspace(var.admin_emails) } : {}
  )
}

data "archive_file" "booking_worker" {
  type        = "zip"
  source_file = var.booking_worker_source_path
  output_path = local.booking_worker_zip_path
}

data "archive_file" "contact_handler" {
  type        = "zip"
  source_file = var.contact_handler_source_path
  output_path = local.contact_handler_zip_path
}

resource "aws_sns_topic" "booking_events" {
  name = "${local.name_prefix}-booking-events"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-booking-events"
  })
}

resource "aws_sqs_queue" "booking_notifications_dlq" {
  name                      = "${local.booking_notifications_queue}-dlq"
  message_retention_seconds = 1209600

  tags = merge(var.tags, {
    Name = "${local.booking_notifications_queue}-dlq"
  })
}

resource "aws_sqs_queue" "booking_notifications" {
  name                       = local.booking_notifications_queue
  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.booking_notifications_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(var.tags, {
    Name = local.booking_notifications_queue
  })
}

resource "aws_sns_topic_subscription" "booking_notifications" {
  topic_arn = aws_sns_topic.booking_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.booking_notifications.arn
}

resource "aws_sqs_queue_policy" "allow_booking_events" {
  queue_url = aws_sqs_queue.booking_notifications.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBookingEventsTopic"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.booking_notifications.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.booking_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "booking_worker" {
  name              = "/aws/lambda/${local.booking_worker_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "contact_handler" {
  name              = "/aws/lambda/${local.contact_handler_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-notification-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "lambda" {
  name = "${local.name_prefix}-notification-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.booking_worker.arn}:*",
          "${aws_cloudwatch_log_group.contact_handler.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = aws_sqs_queue.booking_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:GetIdentityVerificationAttributes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:ListUsersInGroup"
        ]
        Resource = var.cognito_user_pool_arn
      }
    ]
  })
}

resource "aws_lambda_function" "booking_worker" {
  function_name    = local.booking_worker_name
  role             = aws_iam_role.lambda.arn
  handler          = "email_sender.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.booking_worker.output_path
  source_code_hash = data.archive_file.booking_worker.output_base64sha256
  timeout          = 30

  environment {
    variables = local.lambda_common_environment
  }

  depends_on = [
    aws_cloudwatch_log_group.booking_worker,
    aws_iam_role_policy.lambda
  ]

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "booking_notifications" {
  event_source_arn = aws_sqs_queue.booking_notifications.arn
  function_name    = aws_lambda_function.booking_worker.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_function" "contact_handler" {
  function_name    = local.contact_handler_name
  role             = aws_iam_role.lambda.arn
  handler          = "contact_handler.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.contact_handler.output_path
  source_code_hash = data.archive_file.contact_handler.output_base64sha256
  timeout          = 15

  environment {
    variables = local.lambda_common_environment
  }

  depends_on = [
    aws_cloudwatch_log_group.contact_handler,
    aws_iam_role_policy.lambda
  ]

  tags = var.tags
}
