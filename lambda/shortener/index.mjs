// xchtip.app URL shortener — a single Lambda behind a wildcard `*.xchtip.app` API Gateway HTTP API.
//
// Two jobs, dispatched by the incoming request:
//   1. CREATE — `POST /shorten { url }`: validate that `url` is an xchtip.app tip page
//      (`/jar/<recipient>…`), mint a short code, store `code → url` in DynamoDB, and return
//      `{ code, shortUrl }` where shortUrl = `https://<code>.xchtip.app`.
//   2. RESOLVE — any `GET` on `<code>.xchtip.app/*`: read the code from the Host subdomain, look it
//      up, and 301-redirect to the stored target. Unknown code → 302 to the apex builder.
//
// The tip PAGE itself is fully deterministic + backend-free (the long /jar URL always works); this
// service only maps a short subdomain onto that long URL. Pure logic is in lib.mjs (unit-tested);
// this file wires it to DynamoDB + the HTTP-API event shape.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  APEX_DOMAIN,
  RESERVED_CODES,
  makeCode,
  validateTargetUrl,
  codeFromHost,
} from "./lib.mjs";

const TABLE = process.env.SHORTLINKS_TABLE || "xchtip-shortlinks";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/** Build the JSON HTTP-API response envelope (CORS-open — the builder calls it cross-origin). */
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(body),
  };
}

/** A redirect response (301 permanent for a hit, 302 for the unknown-code soft landing). */
function redirect(location, permanent = true) {
  return { statusCode: permanent ? 301 : 302, headers: { location }, body: "" };
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || "GET";
  const host = event.headers?.host || event.headers?.Host || "";
  const path = event.rawPath || event.requestContext?.http?.path || "/";

  if (method === "OPTIONS") return json(204, {});

  // CREATE: POST /shorten
  if (method === "POST" && path.replace(/\/+$/, "").endsWith("/shorten")) {
    let url;
    try {
      url = JSON.parse(event.body || "{}").url;
    } catch {
      return json(400, { error: "Body must be JSON: { url }." });
    }
    const target = validateTargetUrl(url);
    if (!target) return json(400, { error: "url must be an https://xchtip.app/jar/… tip page." });
    const code = await mintUniqueCode(target);
    if (!code) return json(503, { error: "Could not allocate a short code; please retry." });
    return json(200, { code, shortUrl: `https://${code}.${APEX_DOMAIN}` });
  }

  // RESOLVE: GET <code>.xchtip.app/* → 301 to the stored target.
  const code = codeFromHost(host);
  if (code) {
    const target = await lookup(code);
    if (target) return redirect(target, true);
    return redirect(`https://${APEX_DOMAIN}/`, false); // unknown code → soft-land on the builder
  }

  return json(404, { error: "Not found." });
}

async function lookup(code) {
  try {
    const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { code } }));
    return res.Item?.target || null;
  } catch {
    return null;
  }
}

// Try up to 5 random codes; store the first that doesn't already exist (conditional put).
async function mintUniqueCode(target) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode(6);
    if (RESERVED_CODES.has(code)) continue;
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: { code, target, created_at: new Date().toISOString() },
          ConditionExpression: "attribute_not_exists(code)",
        }),
      );
      return code;
    } catch (e) {
      if (e?.name !== "ConditionalCheckFailedException") return null; // collision → retry; else stop
    }
  }
  return null;
}
