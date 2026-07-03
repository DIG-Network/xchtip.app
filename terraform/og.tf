# The per-recipient OG/Twitter-card image endpoint (#221 item 1): GET /og?recipient=&name=&asset=&
# scheme=&logo= -> a 1200x630 image/png, rendered by lambda/og-image (satori + @resvg/resvg-js) from
# the SAME shared schemes.ts/assetGlyph.ts resolution the jar page paints with (src/lib/ogCard.ts).
#
# BUILD PREREQUISITE: `lambda/og-image/dist/` must exist (built via `npm ci && npm run build` INSIDE
# lambda/og-image, on a linux/x64 host so npm resolves the `@resvg/resvg-js-linux-x64-gnu` native
# addon — see runbooks/deploy.md "OG image Lambda") BEFORE `terraform apply`. deploy.yml does this on
# every CI run (ubuntu-latest); a local/manual apply must do the same first.
#
# Architecture: Lambda (Node 20.x, Function URL, AWS_IAM auth) <- CloudFront (Origin Access Control,
# "lambda" type) on path `/og`, so the endpoint is served from the xchtip.app origin
# (`https://xchtip.app/og?...`) and the Function URL itself is invocable ONLY via this distribution
# (never a bare public URL reachable outside the CDN's cache).

data "archive_file" "og_image_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/og-image/dist"
  output_path = "${path.module}/.build/og-image.zip"
}

data "aws_iam_policy_document" "og_image_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "og_image" {
  name               = "xchtip-og-image"
  assume_role_policy = data.aws_iam_policy_document.og_image_assume.json
}

resource "aws_iam_role_policy_attachment" "og_image_logs" {
  role       = aws_iam_role.og_image.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "og_image" {
  function_name    = "xchtip-og-image"
  role             = aws_iam_role.og_image.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.og_image_zip.output_path
  source_code_hash = data.archive_file.og_image_zip.output_base64sha256
  timeout          = 10
  # satori (layout/shaping) + @resvg/resvg-js (rasterize) are memory-hungry for a 1200x630 render;
  # more memory also proportionally increases CPU on Lambda, keeping cold-render latency low.
  memory_size = 1024
}

resource "aws_lambda_function_url" "og_image" {
  function_name      = aws_lambda_function.og_image.function_name
  authorization_type = "AWS_IAM"
}

# CloudFront invokes the Function URL via SigV4 (OAC) — no public/anonymous invocation possible.
resource "aws_lambda_permission" "og_image_cloudfront" {
  statement_id           = "AllowCloudFrontInvokeFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.og_image.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
  function_url_auth_type = "AWS_IAM"
}

# A SECOND, companion grant is REQUIRED alongside InvokeFunctionUrl above: AWS's OAC-for-Lambda docs
# (private-content-restricting-access-to-lambda.html) list both `lambda:InvokeFunctionUrl` AND
# `lambda:InvokeFunction` as needed for CloudFront's OAC-signed request to be authorized. Without
# this second statement the Function URL's AWS_IAM authorizer rejects every CloudFront-signed
# request with a blanket `{"Message":"Forbidden. ..."}` BEFORE the function ever runs (no
# invocation, no CloudWatch log) — this was the root cause of the live-broken /og + /jar/* OG cards
# (#221): the failure was hidden behind the distribution's old blanket 403->200 error masking
# (removed — see main.tf) until it surfaced as a real, diagnosable error.
resource "aws_lambda_permission" "og_image_cloudfront_invoke_function" {
  statement_id  = "AllowCloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.og_image.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.site.arn
}

resource "aws_cloudfront_origin_access_control" "og_image" {
  name                              = "${var.s3_bucket}-og-image-oac"
  description                       = "OAC for the /og Lambda Function URL origin."
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# The card is fully determined by the querystring, so the cache key must include EVERY param the
# endpoint reads (recipient/name/asset/scheme/color/symbol/logo) — a bare path-only cache would
# serve one recipient's card to every other recipient. `query_string_behavior = "all"` is the
# simplest correct choice (an unrecognized extra param just dilutes the cache slightly; it can never
# cause a wrong card, since ogCard.ts's buildOgCardModel ignores unknown params deterministically).
# TTL is generous — the Lambda itself sets `Cache-Control: public, max-age=31536000, immutable`
# (a given querystring's rendered PNG never changes), so CloudFront should happily cache it for as
# long as the origin allows.
resource "aws_cloudfront_cache_policy" "og_image" {
  name        = "${var.s3_bucket}-og-image"
  comment     = "Cache /og keyed on the FULL querystring; honors the origin's long-lived immutable Cache-Control."
  default_ttl = 86400
  min_ttl     = 0
  max_ttl     = 31536000

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

output "og_image_function_url" {
  description = "The /og Lambda's raw Function URL (SigV4-only — not directly browsable; CloudFront is the public entry point)."
  value       = aws_lambda_function_url.og_image.function_url
}
