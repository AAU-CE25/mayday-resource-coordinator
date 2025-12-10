variable "bucket_name" {
  description = "Name of the S3 bucket for static website"
  type        = string
}

variable "index_html_path" {
  description = "Path to the index.html file"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
