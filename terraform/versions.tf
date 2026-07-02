# Terraform + provider pins. us-east-1 is required: CloudFront reads ACM certs only from us-east-1,
# and the rest of the DIG ecosystem deploys there. Remote state lives in the shared ecosystem state
# bucket (created by the hub bootstrap): S3 `dighub-tfstate` + DynamoDB lock `dighub-tflock`, under a
# distinct key for this project. Backend config is passed at `init` time (see runbooks/deploy.md);
# left partial so `validate` works offline.
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {
    key     = "xchtip.app/prod/terraform.tfstate"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.tags
  }
}
