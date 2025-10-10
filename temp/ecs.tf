resource "aws_ecs_cluster" "main" {
  name = "provisioning-cluster"
}

resource "aws_ecs_task_definition" "main" {
  family                   = "user-session-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = file("ecs/task_definition.json")
}
