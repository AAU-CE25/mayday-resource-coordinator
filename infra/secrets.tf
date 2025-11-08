# Sensitive values in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password_v" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.project_name}-jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret_v" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# Non-sensitive configuration in SSM Parameter Store
resource "aws_ssm_parameter" "db_user" {
  name  = "/${var.project_name}/db_user"
  type  = "String"
  value = var.db_user
}
