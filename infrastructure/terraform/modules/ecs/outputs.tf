output "cluster_name"     { value = aws_ecs_cluster.main.name }
output "cluster_arn"      { value = aws_ecs_cluster.main.arn }
output "public_ip"        { value = aws_eip.ecs_host.public_ip }
output "service_name"     { value = aws_ecs_service.app.name }
output "task_def_arn"     { value = aws_ecs_task_definition.app.arn }
output "task_def_family"  { value = aws_ecs_task_definition.app.family }
