terraform {
  required_version = ">= 1.8"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # Uncomment when ready to use S3 remote state
  # backend "s3" {
  #   bucket         = "smartboard-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "eu-west-1"
  #   dynamodb_table = "smartboard-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "smartboard"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
