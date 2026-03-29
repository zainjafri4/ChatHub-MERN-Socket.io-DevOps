variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "state_bucket_name" {
  type    = string
  default = "chathub-tfstate"
}

variable "lock_table_name" {
  type    = string
  default = "chathub-tfstate-lock"
}
