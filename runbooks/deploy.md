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

`deploy.yml` runs a **`terraform` job before the site sync**: it assumes the OIDC deploy role, runs
`terraform init` against the remote backend above, then `terraform apply -auto-approve`. Because the
backend is the shared S3 bucket, the run picks up the exact state the previous run left — additive
applies, no re-creation. The job is GATED on `CI_DEPLOY_ROLE_ARN`: absent, it no-ops cleanly (infra
is then provisioned manually, below). The apply's `shortener_api_endpoint` output is passed to the
build as `VITE_SHORTENER_API` so the "Create short link" affordance is baked into the SPA.

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
npm ci
npm run build                                                # → dist/ (+ SEO gate + WC projectId injection)
aws s3 sync dist "s3://xchtip-app-site" --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'
```

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
```

Before DNS resolves you can test against the CloudFront domain
(`https://<cloudfront_domain_name>/`) with a Host header of `xchtip.app`.
