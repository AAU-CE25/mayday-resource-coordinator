terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Data: Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Shared CloudWatch Log Group for all ECS services
resource "aws_cloudwatch_log_group" "ecs_cluster" {
  name              = "/aws/ecs/${var.cluster_name}/all"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-ecs-logs"
  })
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-igw"
  })
}

# Subnets
resource "aws_subnet" "public" {
  count                   = length(var.subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-subnet-${count.index + 1}"
  })
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-private-subnet-${count.index + 1}"
  })
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-nat-eip"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (in first public subnet)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-nat"
  })

  depends_on = [aws_internet_gateway.main]
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-private-rt"
  })
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group
resource "aws_security_group" "ecs" {
  name        = "${var.cluster_name}-sg"
  description = "Security group for ${var.cluster_name} ECS services"
  vpc_id      = aws_vpc.main.id

  # ALB HTTP - Public access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "ALB HTTP from internet"
  }

  # API Service - Internal only
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    self        = true
    description = "API Service internal"
  }

  # Frontend - Internal only
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    self        = true
    description = "Frontend internal"
  }

  # SUV UI - Internal only
  ingress {
    from_port   = 3030
    to_port     = 3030
    protocol    = "tcp"
    self        = true
    description = "SUV UI internal"
  }

  # PostgreSQL - Internal only
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
    description = "PostgreSQL internal"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-sg"
  })
}

# Application Load Balancer
resource "aws_lb" "api" {
  name               = "${var.cluster_name}-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-api-alb"
  })
}

# Target Group for API
resource "aws_lb_target_group" "api" {
  name        = "${var.cluster_name}-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-api-tg"
  })
}

# Target Group for Frontend
resource "aws_lb_target_group" "frontend" {
  name        = "${var.cluster_name}-frontend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-frontend-tg"
  })
}

# Target Group for SUV UI
resource "aws_lb_target_group" "suv_ui" {
  name        = "${var.cluster_name}-suv-ui-tg"
  port        = 3030
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-suv-ui-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = "80"
  protocol          = "HTTP"

  # Default action - forward to API
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = var.tags
}

# Listener Rule for Dashboard/Frontend (path-based routing)
resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    path_pattern {
      values = ["/dashboard", "/dashboard/*"]
    }
  }

  tags = var.tags
}

# Listener Rule for SUV UI (path-based routing)
resource "aws_lb_listener_rule" "suv_ui" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.suv_ui.arn
  }

  condition {
    path_pattern {
      values = ["/suv", "/suv/*"]
    }
  }

  tags = var.tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = var.cluster_name
  })
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.cluster_name}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-task-execution-role"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.cluster_name}.local"
  description = "Service discovery namespace for ${var.cluster_name}"
  vpc         = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.cluster_name}.local"
  })
}
