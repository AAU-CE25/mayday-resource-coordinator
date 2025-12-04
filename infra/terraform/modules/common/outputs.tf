output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "subnets" {
  description = "Public subnet IDs for ECS services"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnets" {
  description = "Private subnet IDs for database and internal services"
  value       = aws_subnet.private[*].id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ecs.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.api.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.api.dns_name
}

output "alb_target_group_arn" {
  description = "ARN of the API ALB target group"
  value       = aws_lb_target_group.api.arn
}

output "alb_frontend_target_group_arn" {
  description = "ARN of the Frontend ALB target group"
  value       = aws_lb_target_group.frontend.arn
}

output "alb_suv_ui_target_group_arn" {
  description = "ARN of the SUV UI ALB target group"
  value       = aws_lb_target_group.suv_ui.arn
}

output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster (alias)"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role (alias)"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "service_discovery_namespace_id" {
  description = "ID of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "service_discovery_namespace_name" {
  description = "Name of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}
