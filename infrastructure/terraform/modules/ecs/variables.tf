variable "project"    { type = string }
variable "env"        { type = string }
variable "aws_region" { type = string }
variable "tags"       { type = map(string); default = {} }

variable "subnet_id"             { type = string }
variable "ecs_sg_id"             { type = string }
variable "instance_profile_name" { type = string }

variable "task_execution_role_arn" { type = string }
variable "task_role_arn"           { type = string }

variable "backend_image"  { type = string }
variable "frontend_image" { type = string }
variable "image_tag"      { type = string; default = "latest" }

variable "ssm_prefix" {
  type        = string
  description = "SSM parameter store path prefix, e.g. /chathub/staging"
}
