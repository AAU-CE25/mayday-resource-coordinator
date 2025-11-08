resource "aws_ecr_repository" "api_repo" {
  name = "${var.project_name}-api"
}

resource "aws_ecr_repository" "db_repo" {
  name = "${var.project_name}-db"
}
