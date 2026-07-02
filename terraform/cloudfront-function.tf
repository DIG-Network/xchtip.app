# The viewer-request CloudFront Function that serves GET /embed.txt?<params> as a real text/plain
# embed snippet at the edge (see cloudfront-function.js). Attached to the default cache behavior; it
# passes every other request through unchanged.

resource "aws_cloudfront_function" "embed_txt" {
  name    = "${replace(var.s3_bucket, ".", "-")}-embed-txt"
  runtime = "cloudfront-js-2.0"
  comment = "Serve /embed.txt?<params> as text/plain embed snippet; pass everything else through."
  publish = true
  code    = file("${path.module}/cloudfront-function.js")
}
