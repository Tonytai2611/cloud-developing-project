locals {
  name_prefix = "${var.project_name}-${var.environment}"
}


resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(
    var.tags,
    {
      Name        = "${local.name_prefix}-vpc"
      Environment = var.environment
    }
  )
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(
    var.tags,
    {
      Name        = "${local.name_prefix}-igw"
      Environment = var.environment
    }
  )
}


resource "aws_subnet" "public" {
  for_each = var.public_subnet_cidrs
  availability_zone       = each.key
  cidr_block              = each.value
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}


resource "aws_route" "public_internet" {
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
  route_table_id         = aws_route_table.public.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  route_table_id = aws_route_table.public.id
  subnet_id      = each.value.id
}