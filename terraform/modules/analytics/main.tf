locals {
  name_prefix       = "${var.project_name}-${var.environment}"
  lambda_name       = "${local.name_prefix}-analytics-aggregator"
  lambda_zip        = "${path.root}/.terraform/${local.lambda_name}.zip"
}

data "archive_file" "aggregator" {
  type        = "zip"
  source_file = var.lambda_source_path
  output_path = local.lambda_zip
}

resource "aws_dynamodb_table" "summary" {
  name         = "${local.name_prefix}-analytics-summary"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  server_side_encryption { enabled = true }
  point_in_time_recovery { enabled = var.enable_point_in_time_recovery }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-analytics-summary"
  })
}

resource "aws_cloudwatch_log_group" "aggregator" {
  name              = "/aws/lambda/${local.lambda_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_iam_role" "aggregator" {
  name = "${local.name_prefix}-analytics-aggregator-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy" "aggregator" {
  name = "${local.name_prefix}-analytics-aggregator-policy"
  role = aws_iam_role.aggregator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.aggregator.arn}:*"
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:GetRecords", "dynamodb:GetShardIterator", "dynamodb:DescribeStream", "dynamodb:ListStreams"]
        Resource = var.bookings_stream_arn
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"]
        Resource = aws_dynamodb_table.summary.arn
      }
    ]
  })
}

resource "aws_lambda_function" "aggregator" {
  function_name    = local.lambda_name
  role             = aws_iam_role.aggregator.arn
  handler          = "analytics_aggregator.lambda_handler"
  runtime          = "python3.11"
  filename         = data.archive_file.aggregator.output_path
  source_code_hash = data.archive_file.aggregator.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = { ANALYTICS_TABLE = aws_dynamodb_table.summary.name }
  }

  depends_on = [aws_cloudwatch_log_group.aggregator, aws_iam_role_policy.aggregator]
  tags       = var.tags
}

resource "aws_lambda_event_source_mapping" "bookings" {
  event_source_arn  = var.bookings_stream_arn
  function_name     = aws_lambda_function.aggregator.arn
  starting_position = "LATEST"
  batch_size        = 100
  enabled           = true
}
