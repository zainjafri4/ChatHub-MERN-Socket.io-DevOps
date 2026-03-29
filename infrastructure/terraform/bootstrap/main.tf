###############################################################################
# Bootstrap — run ONCE per AWS account before using any environment.
#
# Creates:
#   - S3 bucket for Terraform remote state   (free tier: 5 GB storage)
#   - DynamoDB table for state locking        (free tier: 25 GB, 25 RCU/WCU)
#
# Usage:
#   cd infrastructure/terraform/bootstrap
#   terraform init
#   terraform apply
###############################################################################

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "tfstate" {
  bucket        = var.state_bucket_name
  force_destroy = false

  tags = {
    Project   = "chathub"
    ManagedBy = "terraform-bootstrap"
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tfstate_lock" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST" # Free tier: 25 WCU / 25 RCU covered
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Project   = "chathub"
    ManagedBy = "terraform-bootstrap"
  }
}

output "state_bucket_name" { value = aws_s3_bucket.tfstate.bucket }
output "lock_table_name"   { value = aws_dynamodb_table.tfstate_lock.name }
