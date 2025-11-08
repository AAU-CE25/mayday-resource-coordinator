variable "project_name" {
  type        = string
  description = "Base name for all resources"
}

variable "aws_region" {
  type        = string
  default     = "eu-central-1"
}

variable "app_active" {
  description = "Toggle app deployment on/off"
  type        = bool
  default     = true
}

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "api_image_tag" {
  description = "Tag for API container image"
  type        = string
}

variable "db_image_tag" {
  description = "Tag for DB container image"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "subnets" {
  type = list(string)
}

variable "ecs_task_cpu" {
  default = 256
}

variable "ecs_task_memory" {
  default = 512
}
