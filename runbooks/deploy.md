# Runbook — deploy xchtip.app

xchtip.app is a static SPA served from S3 behind CloudFront, with a DNS-validated ACM cert and
Route53 records in the existing hosted zone. Two parts: (A) provision infra with Terraform (once, then
on infra change); (B) build + sync + invalidate on every content change (CI or manual).

## Targets

- **AWS account:** 873139760123, region **us-east-1** (required for CloudFront/ACM).
- **Hosted zone:** `Z05614961P7OR8IWYYF3` (`xchtip.app.`, Namecheap-registered, delegated to Route53).
  Read as a Terraform data source — NEVER created by this stack.
- **S3 bucket:** `xchtip-app-site` (private; CloudFront-only via OAC).
- **CloudFront:** distribution id + domain are Terraform outputs (`cloudfront_distribution_id`,
  `cloudfront_domain_name`). No WAF attached (embeddable-anywhere; see SPEC §10).
- **Remote state:** shared ecosystem backend — S3 `dighub-tfstate`, DynamoDB lock `dighub-tflock`,
  key `xchtip.app/prod/terraform.tfstate`.

## A. Provision infra (Terraform)

**State persistence.** Terraform state lives in the shared ecosystem **remote S3 backend** (bucket
`dighub-tfstate`, key `xchtip.app/prod/terraform.tfstate`) with a DynamoDB lock (`dighub-tflock`), so
it **persists across every run** — CI and local alike — and concurrent runs are serialized by the
lock. State is NEVER kept on a runner's ephemeral disk: each run does `terraform init
-backend-config=…` against that same S3 key, reading + writing the one durable state object.

### CI (automatic)

`deploy.yml` runs a **`terraform` job before the site sync**: it assumes the OIDC deploy role, builds
the two edge Lambdas (below), runs `terraform init` against the remote backend above, then
`terraform apply -auto-approve`. Because the backend is the shared S3 bucket, the run picks up the
exact state the previous run left — additive applies, no re-creation. The job is GATED on
`CI_DEPLOY_ROLE_ARN`: absent, it no-ops cleanly (infra is then provisioned manually, below). The
apply's `shortener_api_endpoint` output is passed to the build as `VITE_SHORTENER_API` so the
"Create short link" affordance is baked into the SPA.

**Build prerequisite — the `/og` + `/jar/*` edge Lambdas (#221).** `terraform/og.tf` and
`terraform/jar-meta.tf`'s `archive_file` data sources zip `lambda/og-image/dist/` and
`lambda/jar-meta/dist/` directly — those directories MUST exist and be freshly built BEFORE
`terraform apply` (`deploy.yml` does this as a dedicated step before the terraform step):

```bash
cd lambda/og-image  && npm ci && npm run build && cd ../..   # satori + @resvg/resvg-js
cd lambda/jar-meta   && npm ci && npm run build && cd ../..   # pure JS/TS, no native deps
```

`lambda/og-image` has a REAL native-addon dependency (`@resvg/resvg-js`) — `npm ci` MUST run on a
linux/x64 (glibc) host so npm resolves the `@resvg/resvg-js-linux-x64-gnu` optional dependency
matching the `nodejs20.x` Lambda runtime. CI runs on `ubuntu-latest`, so this is automatic there. For
a local/manual apply on Windows/macOS, build it in Docker instead:

```bash
docker run --rm -v "$PWD/lambda/og-image:/w" -w /w node:20-slim bash -c "npm ci && npm run build"
```

(`lambda/jar-meta` has no native deps — `npm ci && npm run build` works identically on any OS.)

Each package also has a `npm run smoke` script that builds AND exercises the built bundle end-to-end
with no AWS required (og-image: a real satori/resvg render of every scheme + a custom logo, written
to `.smoke-out/*.png` for a visual spot-check; jar-meta: a stubbed-`fetch` index.html rewrite,
asserting the injected `<head>` tags) — run it after a build to confirm the artifact actually works
before trusting it to `terraform apply`.

The backend location is overridable via repo vars `TF_STATE_BUCKET` / `TF_LOCK_TABLE` (defaulting to
`dighub-tfstate` / `dighub-tflock`).

### Manual (same backend — same persistent state)

Prereqs: Terraform ≥ 1.5, AWS creds for account 873139760123 (ambient credentials or a profile).

```bash
cd terraform
terraform init -reconfigure \
  -backend-config="bucket=dighub-tfstate" \
  -backend-config="dynamodb_table=dighub-tflock" \
  -backend-config="region=us-east-1" \
  -backend-config="key=xchtip.app/prod/terraform.tfstate"
terraform plan -out=xchtip.tfplan
terraform apply xchtip.tfplan
```

Because the manual and CI paths use the **same** `-backend-config`, they share one state object — a
local apply and a CI apply never diverge.

The ACM cert is DNS-validated automatically: Terraform writes the validation CNAME(s) into the
delegated zone and `aws_acm_certificate_validation` waits for validation (completes in ~1–2 min once
the zone is live). CloudFront then attaches the validated cert. Note the outputs:

```bash
terraform output   # s3_bucket, cloudfront_distribution_id, cloudfront_domain_name, certificate_arn, site_url
```

Set these as GitHub repo **variables** so CI can deploy:

- `XCHTIP_S3_BUCKET` = `s3_bucket`
- `XCHTIP_CLOUDFRONT_DISTRIBUTION_ID` = `cloudfront_distribution_id`
- `CI_DEPLOY_ROLE_ARN` = the OIDC deploy role ARN (see "OIDC" below)

## B. Build + deploy content

### Automatic (CI)

Pushing to `main` runs `.github/workflows/deploy.yml`: build → `aws s3 sync dist s3://$BUCKET --delete`
→ `aws cloudfront create-invalidation --paths '/*'`. It authenticates via OIDC
(`vars.CI_DEPLOY_ROLE_ARN`). The deploy step is GATED: without the infra vars it builds + verifies and
no-ops cleanly (stays green pre-provisioning).

### Manual

```bash
export XCHTIP_WC_PROJECT_ID=<the WalletConnect projectId>   # optional; else the widget needs data-wc-project-id
export VITE_SHORTENER_API=https://api.xchtip.app            # optional; enables the "Create short link" UI
npm ci
npm run build                                                # → dist/ (+ SEO gate + WC projectId injection)
aws s3 sync dist "s3://xchtip-app-site" --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'
```

Distribution id: `E36TX1HU0RTI0D`. The shortener API (`https://api.xchtip.app`) + `*.xchtip.app`
redirect are provisioned by Terraform (`enable_shortener = true`); `terraform output shortener_api_endpoint`
is the value for `VITE_SHORTENER_API`. NOTE: `/embed/xch-tip.js` is served with a SHORT revalidating
cache (not immutable) so widget updates reach embedders — always invalidate `/*` after a deploy.

## Secrets / env

- **`XCHTIP_WC_PROJECT_ID`** (build env / CI secret) — the WalletConnect (Reown) projectId baked into
  the deployed `embed/xch-tip.js` (placeholder `__XCHTIP_WC_PROJECT_ID__` substituted at build). NEVER
  commit it. Without it, the embed requires `data-wc-project-id` per-embed or shows its honest error.
  A shared `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is accepted as a fallback env name.

## OIDC deploy role (one admin follow-up)

CI assumes an OIDC role (`vars.CI_DEPLOY_ROLE_ARN`) to sync S3 + invalidate CloudFront. The ecosystem
OIDC provider + deploy role live in the shared account. Its trust policy MUST include this repo:

```
repo:DIG-Network/xchtip.app:ref:refs/heads/main
```

If that subject is not yet trusted, CI deploy auth fails — until then, deploy manually (§B manual) or
have an admin add the subject to the deploy role's trust policy. Terraform apply itself can be run
locally with ambient account creds regardless.

## Verify live

```bash
curl -sI https://xchtip.app/ | head            # 200, text/html
curl -sI https://xchtip.app/embed/xch-tip.js | grep -i access-control-allow-origin   # *
curl -s "https://xchtip.app/embed.txt?recipient=xch1...&asset=xch"                    # text/plain snippet
curl -s https://xchtip.app/llms.txt | head

# #221 — the per-recipient OG image (§6c SPEC.md): 200, image/png, 1200x630.
curl -sI "https://xchtip.app/og?recipient=xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq&name=Alice&asset=a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81&scheme=purple" | head

# #221 — the per-jar crawler-visible <head> meta (§6a "Personalized link-preview card"): the
# returned HTML's og:image/title are PERSONALIZED (no browser/JS involved — this is exactly what a
# non-JS crawler sees).
curl -s "https://xchtip.app/jar/xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0wg4qq?name=Alice&asset=a406d3a9de984d03c9591c10d917593b434d5263cabe2b42f6b367df16832f81&scheme=purple" \
  | grep -Eo '<title>[^<]*</title>|og:image" content="[^"]*"'
```

### If /og or /jar/* ever serve index.html instead of the real response

`/og` and `/jar/*` returning the SPA `index.html` (200, `text/html`, `Server: AmazonS3`) instead of
the image / personalized HTML means CloudFront could not get a good response from the Lambda origin.
**This is NOT a transient IAM-propagation thing to wait out** — a prior version of this note claimed
it "self-heals in a few minutes"; in practice it did not clear after 20+ minutes and needed an actual
fix (#221 live-broken OG cards). The distribution has NO `custom_error_response` (see main.tf) for
exactly this reason: a non-2xx from the Lambda origin must surface as a real error, not get silently
rewritten to a 200 SPA page that hides the failure.

Diagnose in order:
1. `curl -sD- "https://xchtip.app/og?recipient=xch1x&asset=xch&scheme=green"` — check the actual
   status code and `X-Cache` header now that nothing masks it.
2. Check `/aws/lambda/xchtip-og-image` (or `-jar-meta`) CloudWatch Logs for an invocation matching the
   request time. NO invocation logged means CloudFront never got an authorized request through to the
   Function URL (an OAC/SigV4/permission problem, upstream of the function code) — verify the
   Lambda's resource policy (`aws lambda get-policy --function-name xchtip-og-image`) grants
   `cloudfront.amazonaws.com` `lambda:InvokeFunctionUrl` with `SourceArn` = this distribution's ARN,
   and the OAC (`aws cloudfront get-origin-access-control`) is `signing_behavior=always`,
   `signing_protocol=sigv4`, `origin_access_control_origin_type=lambda`, and is actually attached to
   the origin (`aws cloudfront get-distribution` → `Origins.Items[].OriginAccessControlId`).
3. An invocation IS logged but with an error → the Lambda code/deps are the problem (e.g. a missing
   font or the wrong `@resvg/resvg-js` platform binary for `nodejs20.x`/`x86_64` — rebuild per the
   BUILD PREREQUISITE above, on a linux/x64 host).
4. To isolate the Lambda code from the OAC/CloudFront layer entirely, invoke it directly with a
   synthetic Function-URL-shaped event (bypasses Function URL auth, exercises only the handler):
   `aws lambda invoke --function-name xchtip-og-image --cli-binary-format raw-in-base64-out --payload '{"rawPath":"/og","rawQueryString":"recipient=xch1x&asset=xch&scheme=green","queryStringParameters":{"recipient":"xch1x","asset":"xch","scheme":"green"},"requestContext":{"http":{"method":"GET"}}}' out.json`
   — a `200`/`image/png` response here with a clean CloudWatch log confirms the Lambda itself is fine
   and the break is purely in the CloudFront ↔ Function-URL path.

Before DNS resolves you can test against the CloudFront domain
(`https://<cloudfront_domain_name>/`) with a Host header of `xchtip.app`.
