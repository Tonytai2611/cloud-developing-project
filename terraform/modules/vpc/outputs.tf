output "vpc-id" {
    description = "The ID of the created VPC"
    value       = aws_vpc.this.id
}


output "public-subnet-ids" {
    description = "List of IDs for the created public subnets"
    value       = [for subnet in aws_subnet.public : subnet.id]
}