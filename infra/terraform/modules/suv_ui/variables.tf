variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the service"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the service"
  type        = string
}

variable "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  type        = string
}

variable "service_discovery_namespace_id" {
  description = "ID of the service discovery namespace"
  type        = string
}

variable "cpu" {
  description = "CPU units for the task"
  type        = string
  default     = "512"
}

variable "memory" {
  description = "Memory for the task in MB"
  type        = string
  default     = "1024"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
