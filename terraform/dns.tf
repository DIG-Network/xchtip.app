# DNS + TLS: read the EXISTING hosted zone (never create one), request a DNS-validated ACM cert in
# us-east-1 covering the apex (+ optional www), write the validation CNAME(s) into the zone, and wait
# for validation. The domain is delegated to Route53, so validation completes automatically once the
# CNAME records propagate (a couple of minutes) — no manual step.

data "aws_route53_zone" "primary" {
  zone_id = var.hosted_zone_id
}

locals {
  # The full set of names on the cert / CloudFront aliases.
  aliases = var.www_alias ? [var.domain_name, "www.${var.domain_name}"] : [var.domain_name]
}

resource "aws_acm_certificate" "cert" {
  domain_name               = var.domain_name
  subject_alternative_names = var.www_alias ? ["www.${var.domain_name}"] : []
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# One validation record per distinct validation option (apex + www share a name when identical).
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
  zone_id         = data.aws_route53_zone.primary.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Wait for the cert to validate. Because the zone is delegated + live, this completes automatically.
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Apex + www A/AAAA aliases to the CloudFront distribution (dualstack: both families).
resource "aws_route53_record" "alias_a" {
  for_each = toset(local.aliases)
  zone_id  = data.aws_route53_zone.primary.zone_id
  name     = each.value
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_aaaa" {
  for_each = toset(local.aliases)
  zone_id  = data.aws_route53_zone.primary.zone_id
  name     = each.value
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
