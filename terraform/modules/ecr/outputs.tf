output "repository_urls" {
  description = "Map of ECR repository URLs by repository name"
  value = {
    for name, repository in aws_ecr_repository.this :
    name => repository.repository_url
  }
}

output "repository_arns" {
  description = "Map of ECR repository ARNs by repository name"
  value = {
    for name, repository in aws_ecr_repository.this :
    name => repository.arn
  }
}