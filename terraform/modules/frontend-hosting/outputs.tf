output "frontend_bucket_name" {
  description = "The name of the S3 bucket for frontend hosting."
  value       = aws_s3_bucket.frontend_hosting.bucket
}

output "frontend_bucket_arn" {
  description = "The ARN of the S3 bucket for frontend hosting."
  value       = aws_s3_bucket.frontend_hosting.arn
}

output "cloudfront_distribution_id" {
  description = "The CloudFront distribution ID for frontend hosting."
  value       = aws_cloudfront_distribution.frontend_hosting.id
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name for frontend hosting."
  value       = aws_cloudfront_distribution.frontend_hosting.domain_name
}
