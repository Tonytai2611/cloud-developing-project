locals {
  name_prefix              = "${var.project_name}-${var.environment}"
  lambda_name              = "${local.name_prefix}-chat-handler"
  connections_table_name   = "${local.name_prefix}-chat-connections"
  messages_table_name      = "${local.name_prefix}-chat-messages"
  lambda_zip_output_path   = "${path.root}/.terraform/${local.lambda_name}.zip"
  websocket_route_keys     = ["sendMessage", "getMessages", "getUsers", "getConversations"]
  websocket_api_invoke_arn = "${aws_apigatewayv2_api.chat.execution_arn}/*"
}

data "archive_file" "chat_lambda" {
  type        = "zip"
  source_file = var.lambda_source_path
  output_path = local.lambda_zip_output_path
}

resource "aws_dynamodb_table" "chat_connections" {
  name         = local.connections_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(var.tags, { Name = local.connections_table_name })
}

resource "aws_dynamodb_table" "chat_messages" {
  name         = local.messages_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "messageId"

  attribute {
    name = "messageId"
    type = "S"
  }

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "conversationId-timestamp-index"
    hash_key        = "conversationId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(var.tags, { Name = local.messages_table_name })
}

resource "aws_cloudwatch_log_group" "chat_lambda" {
  name              = "/aws/lambda/${local.lambda_name}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_iam_role" "chat_lambda" {
  name = "${local.name_prefix}-chat-lambda-role"

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

resource "aws_iam_role_policy" "chat_lambda" {
  name = "${local.name_prefix}-chat-lambda-policy"
  role = aws_iam_role.chat_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.chat_lambda.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.chat_connections.arn,
          aws_dynamodb_table.chat_messages.arn,
          "${aws_dynamodb_table.chat_messages.arn}/index/conversationId-timestamp-index"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "execute-api:ManageConnections"
        ]
        Resource = "${aws_apigatewayv2_api.chat.execution_arn}/*/*/@connections/*"
      }
    ]
  })
}

resource "aws_lambda_function" "chat_handler" {
  function_name    = local.lambda_name
  role             = aws_iam_role.chat_lambda.arn
  handler          = "chat_handler.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.chat_lambda.output_path
  source_code_hash = data.archive_file.chat_lambda.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CHAT_CONNECTIONS_TABLE = aws_dynamodb_table.chat_connections.name
      CHAT_MESSAGES_TABLE    = aws_dynamodb_table.chat_messages.name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.chat_lambda,
    aws_iam_role_policy.chat_lambda
  ]

  tags = var.tags
}

resource "aws_apigatewayv2_api" "chat" {
  name                       = "${local.name_prefix}-chat-websocket"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "chat_lambda" {
  api_id                 = aws_apigatewayv2_api.chat.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat_handler.invoke_arn
  integration_method     = "POST"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.chat.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.chat_lambda.id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.chat.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.chat_lambda.id}"
}

resource "aws_apigatewayv2_route" "actions" {
  for_each = toset(local.websocket_route_keys)

  api_id    = aws_apigatewayv2_api.chat.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.chat_lambda.id}"
}

resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowExecutionFromWebSocketApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "chat" {
  api_id      = aws_apigatewayv2_api.chat.id
  name        = var.stage_name
  auto_deploy = true

  depends_on = [
    aws_apigatewayv2_route.connect,
    aws_apigatewayv2_route.disconnect,
    aws_apigatewayv2_route.actions
  ]

  tags = var.tags
}
