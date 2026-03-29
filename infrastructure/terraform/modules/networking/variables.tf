variable "project" { type = string }
variable "env"     { type = string }

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24"]
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
