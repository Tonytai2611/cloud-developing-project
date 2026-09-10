output "frontend_bucket_name" {
  description = "Frontend S3 bucket name."
  value       = module.frontend_hosting.frontend_bucket_name
}

output "frontend_cloudfront_url" {
  description = "Frontend CloudFront URL."
  value       = "https://${module.frontend_hosting.cloudfront_domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend hosting."
  value       = module.frontend_hosting.cloudfront_distribution_id
}

output "image_bucket_name" {
  description = "Image upload S3 bucket name."
  value       = module.image_bucket.image_bucket_name
}

output "image_bucket_arn" {
  description = "Image upload S3 bucket ARN."
  value       = module.image_bucket.image_bucket_arn
}
