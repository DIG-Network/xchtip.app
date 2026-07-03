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
  s3_origin_id       = "s3-${var.s3_bucket}"
  og_image_origin_id = "lambda-og-image"
  jar_meta_origin_id = "lambda-jar-meta"

  # A Lambda Function URL looks like `https://<url-id>.lambda-url.<region>.on.aws/` — CloudFront's
  # custom-origin `domain_name` wants the bare host, no scheme/trailing slash (og.tf / jar-meta.tf).
  og_image_origin_domain = trimsuffix(trimprefix(aws_lambda_function_url.og_image.function_url, "https://"), "/")
  jar_meta_origin_domain = trimsuffix(trimprefix(aws_lambda_function_url.jar_meta.function_url, "https://"), "/")
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
  comment = "Permissive CORS (*), long-immutable cache for CONTENT-HASHED assets; NO frame restrictions."

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

# Response-headers for the EMBED assets (/embed/xch-tip.js + vendored wasm/glue). These live at
# STABLE urls whose CONTENT changes on deploy, so they MUST be revalidated — never immutable, or an
# embedder keeps the old widget forever. A short public max-age + must-revalidate keeps them fresh
# while still cacheable. Same permissive CORS + no frame guard (embeddable anywhere).
resource "aws_cloudfront_response_headers_policy" "embed_stable" {
  name    = "${var.s3_bucket}-embed-stable"
  comment = "Permissive CORS (*), SHORT revalidating cache for the stable-url embed script + wasm."

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
      header = "Cache-Control"
      # 5 min browser cache, then revalidate; allow a day of stale-while-revalidate for speed.
      value    = "public, max-age=300, must-revalidate, stale-while-revalidate=86400"
      override = true
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
  }
}

# A short-TTL edge cache policy for the embed assets so CloudFront itself revalidates with the origin
# quickly after a deploy (the Managed-CachingOptimized policy caches for up to a year at the edge).
resource "aws_cloudfront_cache_policy" "embed_short" {
  name        = "${var.s3_bucket}-embed-short"
  comment     = "Short edge TTL for the stable-url embed script + wasm (revalidate soon after deploy)."
  default_ttl = 300
  min_ttl     = 0
  max_ttl     = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
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

  # index.html + machine files live at STABLE urls whose content changes on deploy (index.html points
  # at the new content-hashed bundle each build). They MUST revalidate — otherwise a cached index.html
  # keeps loading the OLD bundle and users never get new features. Short max-age + must-revalidate.
  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=60, must-revalidate, stale-while-revalidate=86400"
      override = true
    }
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

  # The per-recipient OG/Twitter-card image Lambda (#221 item 1 — og.tf).
  origin {
    domain_name              = local.og_image_origin_domain
    origin_id                = local.og_image_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.og_image.id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # The /jar/* per-recipient <head> meta injection Lambda (#221 item 2 — jar-meta.tf).
  origin {
    domain_name              = local.jar_meta_origin_domain
    origin_id                = local.jar_meta_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.jar_meta.id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: the SPA (HTML + hashed assets). Permissive CORS, no frame guard.
  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    # SHORT edge TTL so index.html (which references the new content-hashed bundle each deploy)
    # revalidates quickly — the hashed /assets/* keep their own long-immutable behavior below.
    cache_policy_id            = aws_cloudfront_cache_policy.embed_short.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.html_open.id
    compress                   = true

    # /embed.txt?<params> → a text/plain snippet, computed at the edge (see cloudfront-function.tf).
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.embed_txt.arn
    }
  }

  # The embed assets (script + vendored wasm/glue) live at STABLE urls whose content changes on
  # deploy → a SHORT revalidating cache (never immutable), so embedders always get the current widget.
  ordered_cache_behavior {
    path_pattern               = "/embed/*"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    cache_policy_id            = aws_cloudfront_cache_policy.embed_short.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.embed_stable.id
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

  # #221 item 1 — GET /og?recipient=&name=&asset=&scheme=&logo= -> a 1200x630 image/png (og.tf). No
  # response-headers policy: the Lambda itself sets the full correct header set (content-type,
  # long-immutable Cache-Control, permissive CORS) — see lambda/og-image/src/handler.ts.
  ordered_cache_behavior {
    path_pattern           = "/og"
    target_origin_id       = local.og_image_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.og_image.id
    compress               = true
  }

  # #221 item 2 — GET /jar/<recipient>?... -> the static SPA shell with a PERSONALIZED <head>
  # (jar-meta.tf). Takes priority over the default behavior's 403/404->index.html SPA fallback, so
  # a crawler unfurling a jar link sees the per-recipient card without ever needing to run JS.
  ordered_cache_behavior {
    path_pattern           = "/jar/*"
    target_origin_id       = local.jar_meta_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = aws_cloudfront_cache_policy.jar_meta.id
    compress               = true
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
