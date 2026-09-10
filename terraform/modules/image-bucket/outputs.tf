output "image_bucket_name" {
  value       = aws_s3_bucket.image_bucket.bucket
  description = "The name of the S3 bucket for image storage"
}

output "image_bucket_arn" {
  value       = aws_s3_bucket.image_bucket.arn
  description = "The ARN of the S3 bucket for image storage"
}

output "image_bucket_domain_name" {
  value       = aws_s3_bucket.image_bucket.bucket_domain_name
  description = "The domain name of the S3 bucket for image storage"
}