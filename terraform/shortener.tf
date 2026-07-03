# URL shortener for *.xchtip.app — mint + resolve short subdomain links to deterministic /jar tip
# pages. Serverless: DynamoDB (code → target) + one Lambda behind an API Gateway HTTP API with a
# WILDCARD custom domain `*.xchtip.app`. The apex/www static site is untouched (main.tf); this stack
# only claims the wildcard subdomain space + an `api.xchtip.app` create endpoint.
#
# Flow:
#   • POST https://api.xchtip.app/shorten { url }         → { code, shortUrl } (the builder calls this)
#   • GET  https://<code>.xchtip.app/…                     → 301 to the stored /jar target
#
# Gated behind var.enable_shortener so the base site can deploy before the backend is provisioned.

variable "enable_shortener" {
  description = "Provision the *.xchtip.app URL-shortener backend (DynamoDB + Lambda + API Gateway + wildcard cert/DNS)."
  type        = bool
  default     = true
}

variable "shortener_api_subdomain" {
  description = "Hostname for the create endpoint (POST /shorten)."
  type        = string
  default     = "api.xchtip.app"
}

locals {
  shortener_count = var.enable_shortener ? 1 : 0
}

# ── Store: code → target ────────────────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "shortlinks" {
  count        = local.shortener_count
  name         = "xchtip-shortlinks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "code"

  attribute {
    name = "code"
    type = "S"
  }
}

# ── Lambda: mint + resolve ──────────────────────────────────────────────────────────────────────
data "archive_file" "shortener_zip" {
  count       = local.shortener_count
  type        = "zip"
  source_dir  = "${path.module}/../lambda/shortener"
  output_path = "${path.module}/.build/shortener.zip"
  excludes    = ["lib.test.mjs", "node_modules"]
}

data "aws_iam_policy_document" "shortener_assume" {
  count = local.shortener_count
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "shortener" {
  count              = local.shortener_count
  name               = "xchtip-shortener"
  assume_role_policy = data.aws_iam_policy_document.shortener_assume[0].json
}

resource "aws_iam_role_policy_attachment" "shortener_logs" {
  count      = local.shortener_count
  role       = aws_iam_role.shortener[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "shortener_ddb" {
  count = local.shortener_count
  statement {
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem"]
    resources = [aws_dynamodb_table.shortlinks[0].arn]
  }
}

resource "aws_iam_role_policy" "shortener_ddb" {
  count  = local.shortener_count
  name   = "shortlinks-rw"
  role   = aws_iam_role.shortener[0].id
  policy = data.aws_iam_policy_document.shortener_ddb[0].json
}

resource "aws_lambda_function" "shortener" {
  count            = local.shortener_count
  function_name    = "xchtip-shortener"
  role             = aws_iam_role.shortener[0].arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.shortener_zip[0].output_path
  source_code_hash = data.archive_file.shortener_zip[0].output_base64sha256
  timeout          = 5
  memory_size      = 256

  environment {
    variables = {
      SHORTLINKS_TABLE = aws_dynamodb_table.shortlinks[0].name
      APEX_DOMAIN      = var.domain_name
    }
  }
}

# ── API Gateway HTTP API (one Lambda-proxy route for everything) ─────────────────────────────────
resource "aws_apigatewayv2_api" "shortener" {
  count         = local.shortener_count
  name          = "xchtip-shortener"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "shortener" {
  count                  = local.shortener_count
  api_id                 = aws_apigatewayv2_api.shortener[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.shortener[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "shortener_any" {
  count     = local.shortener_count
  api_id    = aws_apigatewayv2_api.shortener[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.shortener[0].id}"
}

resource "aws_apigatewayv2_stage" "shortener" {
  count       = local.shortener_count
  api_id      = aws_apigatewayv2_api.shortener[0].id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "shortener_apigw" {
  count         = local.shortener_count
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shortener[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.shortener[0].execution_arn}/*/*"
}

# ── TLS: a wildcard cert covering *.xchtip.app + api.xchtip.app ──────────────────────────────────
resource "aws_acm_certificate" "shortener" {
  count                     = local.shortener_count
  domain_name               = "*.${var.domain_name}"
  subject_alternative_names = [var.shortener_api_subdomain]
  validation_method         = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "shortener_cert_validation" {
  for_each = var.enable_shortener ? {
    for dvo in aws_acm_certificate.shortener[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}
  zone_id         = data.aws_route53_zone.primary.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "shortener" {
  count                   = local.shortener_count
  certificate_arn         = aws_acm_certificate.shortener[0].arn
  validation_record_fqdns = [for r in aws_route53_record.shortener_cert_validation : r.fqdn]
}

# ── Custom domains: *.xchtip.app (resolve) + api.xchtip.app (create) → the same API ──────────────
# API Gateway HTTP API supports a WILDCARD custom domain name, so every `<code>.xchtip.app` maps to
# this one API without a per-code record. The Lambda reads the Host header to get the code.
resource "aws_apigatewayv2_domain_name" "wildcard" {
  count       = local.shortener_count
  domain_name = "*.${var.domain_name}"
  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.shortener[0].certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_domain_name" "api" {
  count       = local.shortener_count
  domain_name = var.shortener_api_subdomain
  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.shortener[0].certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "wildcard" {
  count       = local.shortener_count
  api_id      = aws_apigatewayv2_api.shortener[0].id
  domain_name = aws_apigatewayv2_domain_name.wildcard[0].id
  stage       = aws_apigatewayv2_stage.shortener[0].id
}

resource "aws_apigatewayv2_api_mapping" "api" {
  count       = local.shortener_count
  api_id      = aws_apigatewayv2_api.shortener[0].id
  domain_name = aws_apigatewayv2_domain_name.api[0].id
  stage       = aws_apigatewayv2_stage.shortener[0].id
}

# ── DNS: wildcard + api aliases to the API Gateway regional domains (dualstack A + AAAA) ─────────
resource "aws_route53_record" "wildcard_a" {
  count   = local.shortener_count
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "*.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_apigatewayv2_domain_name.wildcard[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.wildcard[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "wildcard_aaaa" {
  count   = local.shortener_count
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "*.${var.domain_name}"
  type    = "AAAA"
  alias {
    name                   = aws_apigatewayv2_domain_name.wildcard[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.wildcard[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_a" {
  count   = local.shortener_count
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.shortener_api_subdomain
  type    = "A"
  alias {
    name                   = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_aaaa" {
  count   = local.shortener_count
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.shortener_api_subdomain
  type    = "AAAA"
  alias {
    name                   = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

output "shortener_api_endpoint" {
  description = "The create endpoint the frontend calls (VITE_SHORTENER_API)."
  value       = var.enable_shortener ? "https://${var.shortener_api_subdomain}" : null
}
