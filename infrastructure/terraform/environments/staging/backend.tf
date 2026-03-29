terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3 + DynamoDB locking (both free / near-free tier)
  # Run bootstrap/ once before using this environment.
  backend "s3" {
    bucket         = "chathub-tfstate"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chathub-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "chathub"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}
