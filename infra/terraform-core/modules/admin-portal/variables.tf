variable "bucket_name" {
  description = "Name of the S3 bucket for static website"
  type        = string
}

variable "website_root_path" {
  description = "Path to the admin portal directory"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "table_name" {
  description = "Name of the DynamoDB table for admin users"
  type        = string
  default     = "mayday-admin-users"
}
