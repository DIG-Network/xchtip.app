# xchtip.app infrastructure — a private S3 bucket served via CloudFront (Origin Access Control),
# fronted by Route53 + a per-domain ACM cert (see dns.tf). Pattern-matched from the dig.net /
# apt.dig.net static-site deploys.
#
# OPENNESS (normative, see SPEC.md "Openness"): xchtip.app exists to be EMBEDDED on arbitrary
# third-party sites, so this stack is deliberately as OPEN as possible:
#   • NO WAF / web ACL is attached to the distribution.
#   • NO frame-ancestors / X-Frame-Options — the site + widget are frameable from any origin.
#   • Permissive CORS (Access-Control-Allow-Origin: *) on the embed assets (and site-wide) so any
#     page on any domain can load /embed/xch-tip.js + the vendored wasm/glue.
#   • No referrer/origin gating, no rate-limit rules, no geo restriction.
#   • Long/immutable cache for the content-hashed build assets.

locals {
  s3_origin_id = "s3-${var.s3_bucket}"
}

# --- S3 bucket (private; CloudFront-only via OAC) -----------------------------------------------

resource "aws_s3_bucket" "site" {
  bucket = var.s3_bucket
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

# --- CloudFront Origin Access Control (sign requests to the private bucket) ---------------------

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.s3_bucket}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS-managed cache policies.
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}
data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

# --- Response-headers policy: permissive CORS (*) + long cache for embed assets; NO frame guard ---
#
# CORS is set to Access-Control-Allow-Origin: * with all methods a static read needs, so the embed
# script + wasm load from ANY origin. Deliberately NO Content-Security-Policy frame-ancestors and NO
# X-Frame-Options — the site + widget must be embeddable/frameable anywhere. Only a zero-cost
# X-Content-Type-Options: nosniff guard is set (it does not affect embedding).

resource "aws_cloudfront_response_headers_policy" "embed_open" {
  name    = "${var.s3_bucket}-embed-open"
  comment = "Permissive CORS (*), long-immutable cache; NO frame restrictions (embeddable anywhere)."

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    origin_override = true
  }

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = false
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
    # NOTE: intentionally NO frame_options / content_security_policy — embeddable anywhere.
  }
}

# Response-headers for the SPA HTML + machine files (permissive CORS so agents can fetch llms.txt /
# raw snippets cross-origin), but WITHOUT the immutable cache (the HTML/txt must refresh on deploy).
resource "aws_cloudfront_response_headers_policy" "html_open" {
  name    = "${var.s3_bucket}-html-open"
  comment = "Permissive CORS (*) for HTML + machine files; NO frame restrictions."

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    origin_override = true
  }

  security_headers_config {
    content_type_options {
      override = true
    }
  }
}

# --- CloudFront distribution (NO web_acl_id — see OPENNESS above) --------------------------------

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "${var.domain_name} — xchtip.app embeddable Chia tip-widget builder"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = local.aliases
  http_version        = "http2and3"
  is_ipv6_enabled     = true # dualstack AAAA + A

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # Default behavior: the SPA (HTML + hashed assets). Permissive CORS, no frame guard.
  default_cache_behavior {
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.html_open.id
    compress                   = true

    # /embed.txt?<params> → a text/plain snippet, computed at the edge (see cloudfront-function.tf).
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.embed_txt.arn
    }
  }

  # The embed assets (script + vendored wasm/glue): permissive CORS + long-immutable cache.
  ordered_cache_behavior {
    path_pattern               = "/embed/*"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.embed_open.id
    compress                   = true
  }

  # Hashed build assets: long-immutable cache.
  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.embed_open.id
    compress                   = true
  }

  # SPA routing: any non-asset path (deep links, /?params) serves index.html (the SPA reads the URL).
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none" # no geo gating (embeddable anywhere)
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# --- S3 bucket policy: allow only this CloudFront distribution (via OAC) -------------------------

data "aws_iam_policy_document" "site" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json
}
