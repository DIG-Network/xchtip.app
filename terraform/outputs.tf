# Outputs — the values the deploy workflow + operators need: the bucket, the distribution id (for
# invalidations), the CloudFront domain (testable before DNS), the cert ARN, and the site URL.

output "s3_bucket" {
  description = "S3 bucket holding the built SPA (set repo var XCHTIP_S3_BUCKET to this)."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id (set repo var XCHTIP_CLOUDFRONT_DISTRIBUTION_ID to this)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "The CloudFront *.cloudfront.net domain (target of the Route53 alias; testable pre-DNS)."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "certificate_arn" {
  description = "The validated ACM certificate ARN."
  value       = aws_acm_certificate_validation.cert.certificate_arn
}

output "site_url" {
  description = "The public site URL."
  value       = "https://${var.domain_name}"
}
