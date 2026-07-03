# Per-recipient <head> meta injection for /jar/* (#221 item 2): a crawler that never runs JS
# (Facebook/Twitter/Discord/Slack link-unfurlers) fetching `/jar/<recipient>?...` gets the SAME
# static index.html the SPA ships, with its <title>/description/canonical/Open-Graph/Twitter tags
# rewritten to the personalized values (lambda/jar-meta, using the shared src/lib/jarMeta.ts +
# src/lib/jar.ts + src/lib/htmlMeta.ts). A real, JS-executing browser gets a BYTE-IDENTICAL
# <body>/bundle reference, so the SPA is completely unaffected — only <head> meta differs.
#
# No AWS SDK / S3 IAM permissions needed: the Lambda fetches the site's OWN built index.html over
# plain HTTPS from SITE_ORIGIN (the SAME distribution's default behavior -> S3), so it only needs
# outbound network access (every Lambda has that by default) — see lambda/jar-meta/src/handler.ts.
#
# BUILD PREREQUISITE: `lambda/jar-meta/dist/` must exist (`npm ci && npm run build` inside
# lambda/jar-meta — pure JS/TS, no native deps, any OS) BEFORE `terraform apply`. deploy.yml does
# this on every CI run; a local/manual apply must do the same first.

data "archive_file" "jar_meta_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/jar-meta/dist"
  output_path = "${path.module}/.build/jar-meta.zip"
}

data "aws_iam_policy_document" "jar_meta_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "jar_meta" {
  name               = "xchtip-jar-meta"
  assume_role_policy = data.aws_iam_policy_document.jar_meta_assume.json
}

resource "aws_iam_role_policy_attachment" "jar_meta_logs" {
  role       = aws_iam_role.jar_meta.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "jar_meta" {
  function_name    = "xchtip-jar-meta"
  role             = aws_iam_role.jar_meta.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.jar_meta_zip.output_path
  source_code_hash = data.archive_file.jar_meta_zip.output_base64sha256
  timeout          = 5
  memory_size      = 256

  environment {
    variables = {
      SITE_ORIGIN = "https://${var.domain_name}"
    }
  }
}

resource "aws_lambda_function_url" "jar_meta" {
  function_name      = aws_lambda_function.jar_meta.function_name
  authorization_type = "AWS_IAM"
}

resource "aws_lambda_permission" "jar_meta_cloudfront" {
  statement_id           = "AllowCloudFrontInvokeFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.jar_meta.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
  function_url_auth_type = "AWS_IAM"
}

# See the matching comment in og.tf (aws_lambda_permission.og_image_cloudfront_invoke_function) —
# CloudFront's OAC-for-Lambda needs BOTH InvokeFunctionUrl AND InvokeFunction grants; this was the
# root cause of #221's live-broken /jar/* card.
resource "aws_lambda_permission" "jar_meta_cloudfront_invoke_function" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jar_meta.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.site.arn
}

resource "aws_cloudfront_origin_access_control" "jar_meta" {
  name                              = "${var.s3_bucket}-jar-meta-oac"
  description                       = "OAC for the /jar/* Lambda Function URL origin."
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# The rendered HTML depends on the full path (recipient) + the full querystring (asset/scheme/color/
# presets/label/symbol/name/logo), so both must be in the cache key. Short TTL + origin
# revalidation — the Lambda's own `Cache-Control: public, max-age=60, must-revalidate` (matching the
# site's html_open policy) keeps a frontend deploy's new hashed bundle reference reaching jar
# visitors quickly; max_ttl just caps the ceiling.
resource "aws_cloudfront_cache_policy" "jar_meta" {
  name        = "${var.s3_bucket}-jar-meta"
  comment     = "Cache /jar/* keyed on path + FULL querystring; short-revalidating (matches html_open)."
  default_ttl = 60
  min_ttl     = 0
  max_ttl     = 300

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "all"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

output "jar_meta_function_url" {
  description = "The /jar/* meta-injection Lambda's raw Function URL (SigV4-only; CloudFront is the public entry point)."
  value       = aws_lambda_function_url.jar_meta.function_url
}
