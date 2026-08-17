locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_alb" "this" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  tags = merge(
    var.tags,
    {
      Name        = "${local.name_prefix}-alb"
      Environment = var.environment
    }
  )
}


resource "aws_alb_target_group" "this" {
  name        = "${local.name_prefix}-tg"
  port        = var.app_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = var.health_check_path
    interval            = 30
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
    matcher             = "200-399"
  }

  tags = merge(
    var.tags,
    {
      Name        = "${local.name_prefix}-tg"
      Environment = var.environment
    }
  )
}


resource "aws_alb_listener" "this" {
  load_balancer_arn = aws_alb.this.arn
  port              = 80
  protocol          = "HTTP"


  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.this.arn
  }

  tags = merge(
    var.tags,
    {
      Name        = "${local.name_prefix}-listener"
      Environment = var.environment
    }
  )
}

