output "task_execution_role_arn" { value = aws_iam_role.ecs_task_execution.arn }
output "task_role_arn"           { value = aws_iam_role.ecs_task.arn }
output "instance_profile_name"   { value = aws_iam_instance_profile.ecs_instance.name }
output "instance_profile_arn"    { value = aws_iam_instance_profile.ecs_instance.arn }
output "github_actions_role_arn" {
  value = var.create_github_oidc_role ? aws_iam_role.github_actions[0].arn : ""
}
