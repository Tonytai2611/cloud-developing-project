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
