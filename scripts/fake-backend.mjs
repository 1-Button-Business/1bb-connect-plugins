// Preloaded into the bridge by `npm run smoke` (node --import). It stands in
// for the 1BB API so the smoke test can list tools offline: the connection
// check says every tool in the manifest is allowed, and every other call is
// refused. No real key, member data or network is involved.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(process.env.FAKE_BACKEND_MANIFEST, "utf8"));
const allowed = manifest.tools.map((t) => t.name);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

globalThis.fetch = async (url) => {
  if (String(url).endsWith("/connect/v1/onebb_connection_status"))
    return json({
      result: {
        scopes: [],
        source_types: [],
        expires_at: Date.now() + 86_400_000,
        publishing_enabled: false,
        tools: allowed,
        available_tools: allowed,
      },
    });
  return json({ error: { code: "FAKE_BACKEND", message: "Smoke test backend answers only the connection check." } }, 403);
};
