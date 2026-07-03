# The viewer-request CloudFront Function attached to the default cache behavior (see
# cloudfront-function.js): serves GET /embed.txt?<params> as a real text/plain embed snippet at the
# edge, AND rewrites any other extensionless path (a client-side SPA route) to /index.html before
# the request reaches the S3 origin — real static files (dotted extensions) pass through unchanged.

resource "aws_cloudfront_function" "embed_txt" {
  name    = "${replace(var.s3_bucket, ".", "-")}-embed-txt"
  runtime = "cloudfront-js-2.0"
  comment = "Serve /embed.txt?<params> as text/plain embed snippet; pass everything else through."
  publish = true
  code    = file("${path.module}/cloudfront-function.js")
}
