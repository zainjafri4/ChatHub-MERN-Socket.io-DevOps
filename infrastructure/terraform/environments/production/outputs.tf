output "public_ip"          { value = module.ecs.public_ip }
output "app_url"            { value = "http://${module.ecs.public_ip}" }
output "ecs_cluster_name"   { value = module.ecs.cluster_name }
output "ecs_service_name"   { value = module.ecs.service_name }
output "task_def_family"    { value = module.ecs.task_def_family }
output "ecr_backend_url"    { value = module.ecr.backend_repo_url }
output "ecr_frontend_url"   { value = module.ecr.frontend_repo_url }
output "github_actions_role_arn" { value = module.iam.github_actions_role_arn }
