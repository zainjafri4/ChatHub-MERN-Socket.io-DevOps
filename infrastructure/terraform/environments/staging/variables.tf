variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "image_tag" {
  type        = string
  description = "Docker image tag to deploy (set by CI/CD)"
  default     = "latest"
}

variable "create_github_oidc_role" {
  type    = bool
  default = false
}

variable "github_repo" {
  type    = string
  default = "zainjafri4/ChatHub-MERN-DevOps"
}
