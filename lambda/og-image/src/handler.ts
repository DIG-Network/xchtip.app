// handler.ts — the OG/Twitter-card image Lambda entry (#221). GET /og?recipient=&name=&asset=&
// scheme=&logo= -> a 1200x630 image/png. Thin AWS glue ONLY: everything about WHICH color/mark/text
// the card shows lives in the shared, unit-tested ../../src/lib/ogCard.ts (buildOgCardModel,
// resolveOgLogo, buildOgTree) — the same module the root vitest suite covers. This file just wires
// that pure model through satori (JSX/HTML->SVG) + @resvg/resvg-js (SVG->PNG) and shapes the Lambda
// Function URL / API Gateway HTTP-API response envelope.
//
// Deployed behind a CloudFront `/og*` behavior (terraform/og.tf) fronting a Lambda Function URL, so
// the endpoint is served from the xchtip.app origin (`https://xchtip.app/og?...`) and cached hard at
// the edge keyed on the full querystring (see terraform/og.tf's cache policy).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import {
  buildOgCardModel,
  buildOgTree,
  resolveOgLogo,
  OG_CARD_WIDTH,
  OG_CARD_HEIGHT,
  type OgCardQuery,
} from "../../../src/lib/ogCard.js";
import { parseAsset } from "../../../src/lib/embed.js";

// `__dirname` (NOT `import.meta.url`/`fileURLToPath`) — build.mjs bundles this handler to a single
// CommonJS dist/index.js via esbuild (`format: "cjs"`), and esbuild does NOT shim `import.meta.url`
// for a CJS output target (it becomes an empty object at runtime — a real bug hit + fixed here: a
// bundle built that way throws at Lambda cold start on the very first `fetchAsDataUri`-free request).
// `__dirname` is a genuine CJS runtime global (declared ambiently by @types/node, so it type-checks
// even though this file is AUTHORED as an ES module) and resolves correctly to the bundle's own
// directory (dist/), right alongside the `fonts/` directory build.mjs copies next to dist/index.js.
const fontsDir = join(__dirname, "fonts");

const FONTS = [
  { name: "Inter", data: readFileSync(join(fontsDir, "Inter-Regular.ttf")), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: readFileSync(join(fontsDir, "Inter-SemiBold.ttf")), weight: 600 as const, style: "normal" as const },
  { name: "Inter", data: readFileSync(join(fontsDir, "Inter-Bold.ttf")), weight: 700 as const, style: "normal" as const },
];

/** The subset of a Lambda Function URL / API Gateway HTTP-API v2 event this handler needs. */
interface OgLambdaEvent {
  queryStringParameters?: Record<string, string | undefined> | null;
}

interface OgLambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

/** Render `model`'s tree (with `glyph` already logo-resolved) to a PNG response body. */
async function renderPng(model: ReturnType<typeof buildOgCardModel>, glyph: Awaited<ReturnType<typeof resolveOgLogo>>) {
  const tree = buildOgTree(model, glyph);
  // satori's element-tree type is structurally compatible with our plain-object SatoriNode, but its
  // own `ReactNode` type is nominally JSX-shaped — a narrow cast at this ONE boundary is the
  // pragmatic seam (buildOgTree itself stays satori-import-free and unit-testable without it).
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: OG_CARD_WIDTH,
    height: OG_CARD_HEIGHT,
    fonts: FONTS,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: OG_CARD_WIDTH } });
  return resvg.render().asPng();
}

export async function handler(event: OgLambdaEvent): Promise<OgLambdaResponse> {
  const qs: OgCardQuery = event.queryStringParameters ?? {};

  try {
    const model = buildOgCardModel(qs);
    const asset = parseAsset(qs.asset) ?? { kind: "xch" as const };
    const glyph = await resolveOgLogo(model.glyph, asset, model.symbol);
    const png = await renderPng(model, glyph);
    return pngResponse(png);
  } catch {
    // Never a hard 500 for a link-preview image — fall back to the safe generic card (no async
    // logo fetch in this branch, so it cannot fail a second way).
    const fallback = buildOgCardModel({});
    const png = await renderPng(fallback, fallback.glyph);
    return pngResponse(png);
  }
}

function pngResponse(png: Buffer): OgLambdaResponse {
  return {
    statusCode: 200,
    headers: {
      "content-type": "image/png",
      // Keyed on the full querystring at the edge (terraform/og.tf) — safe to cache hard/long.
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*",
    },
    body: png.toString("base64"),
    isBase64Encoded: true,
  };
}
