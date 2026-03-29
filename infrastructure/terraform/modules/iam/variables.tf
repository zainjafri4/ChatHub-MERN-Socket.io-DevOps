variable "project" { type = string }
variable "env"     { type = string }
variable "tags"    { type = map(string); default = {} }

variable "create_github_oidc_role" {
  type        = bool
  description = "Create an OIDC role for GitHub Actions (requires OIDC provider to exist in account)"
  default     = false
}

variable "github_repo" {
  type        = string
  description = "GitHub repo in owner/repo format, e.g. zainjafri4/ChatHub-MERN-DevOps"
  default     = ""
}

variable "ecr_repo_arns" {
  type        = list(string)
  description = "ECR repository ARNs the GitHub Actions role may push to"
  default     = []
}
