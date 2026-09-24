provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "brewcraft"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "hostinger" {
  api_token = var.hostinger_api_token
}
