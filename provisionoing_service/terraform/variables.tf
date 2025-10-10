variable "region" {
    description = "The AWS region to deploy resources in"
    type        = string
    default     = "eu-central-1"
}

variable "environment" {
    description = "Deployment environment (e.g., dev, stage, prod)"
    type        = string
    default     = "dev"
}

variable "instance_type" {
    description = "EC2 instance type"
    type        = string
    default     = "t3.micro"
}

variable "tags" {
    description = "A map of tags to assign to resources"
    type        = map(string)
    default     = {}
}

# Package path
variable "lambda_zip_path" {
    description = "Path to the zipped Lambda function code"
    type        = string
    default     = "../lambda.zip"
}