variable "project" { type = string }
variable "tags"    { type = map(string); default = {} }

variable "image_retention_count" {
  type        = number
  description = "Number of images to retain per repo (lower = less storage = stay in free tier)"
  default     = 3
}
