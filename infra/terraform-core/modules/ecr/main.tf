resource "aws_ecr_repository" "repositories" {
  for_each = var.repositories

  name                 = each.value.name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Name        = each.value.name
    Description = each.value.description
  })
}

resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each   = aws_ecr_repository.repositories
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.lifecycle_policy_max_image_count} images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.lifecycle_policy_max_image_count
      }
      action = {
        type = "expire"
      }
    }]
  })
}
