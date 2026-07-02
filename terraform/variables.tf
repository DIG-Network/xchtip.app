# Input variables. Defaults target the xchtip.app deploy (AWS acct 873139760123, us-east-1, the
# existing Route53 hosted zone for xchtip.app). Every environment-specific value is a var.

variable "aws_region" {
  description = "AWS region. Must be us-east-1 for the CloudFront/ACM pairing."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Primary public hostname the site is served at."
  type        = string
  default     = "xchtip.app"
}

variable "www_alias" {
  description = "Also serve www.<domain> (adds it to the cert SANs + a CloudFront alias + A/AAAA)."
  type        = bool
  default     = true
}

variable "s3_bucket" {
  description = "S3 bucket holding the built static SPA (dist/)."
  type        = string
  default     = "xchtip-app-site"
}

variable "hosted_zone_id" {
  description = <<-EOT
    Route53 hosted zone id for xchtip.app. The zone ALREADY EXISTS (Namecheap-registered domain
    delegated to Route53) — this stack reads it as a data source and NEVER creates a zone.
  EOT
  type        = string
  default     = "Z05614961P7OR8IWYYF3"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_All = every edge PoP worldwide."
  type        = string
  default     = "PriceClass_All"
}

variable "tags" {
  description = "Tags applied to every taggable resource."
  type        = map(string)
  default = {
    Project   = "xchtip.app"
    ManagedBy = "terraform"
    System    = "DIG Network"
  }
}
