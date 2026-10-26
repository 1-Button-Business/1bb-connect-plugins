// Checks every manifest and config in this repo without network access.
// Run: npm run validate   (Node 22.18+ runs TypeScript directly)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MCP_URL = "https://1bbcommunity.com/api/connect/mcp";
const ENV_VAR = "ONEBB_CONNECTION_TOKEN";
const PLUGIN = "plugins/1bb";

let failures = 0;
let passes = 0;
function check(ok: boolean, label: string): void {
  if (ok) {
    passes += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`);
  }
}

type Json = Record<string, unknown>;
function readJson(path: string): Json {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8")) as Json;
}
function obj(value: unknown): Json {
  return (value ?? {}) as Json;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules" || name === "dist") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT).map((f) => relative(ROOT, f));
// The bridge bundle is a prebuilt third-party build output; scan everything else.
const ownText = files.filter(
  (f) => /\.(json|md|toml|ts|mmd)$/.test(f) && !f.endsWith("server/connect.mjs"),
);

console.log("JSON parses");
for (const f of files.filter((f) => f.endsWith(".json"))) {
  let ok = true;
  try {
    readJson(f);
  } catch {
    ok = false;
  }
  check(ok, f);
}

console.log("Claude Code marketplace + plugin");
const ccMarket = readJson(".claude-plugin/marketplace.json");
check(ccMarket.name === "1bb-connect", "marketplace name is 1bb-connect");
check(typeof obj(ccMarket.owner).name === "string", "marketplace owner.name set");
const ccEntry = (ccMarket.plugins as Json[])[0];
check(ccEntry.source === `./${PLUGIN}`, "marketplace points at ./plugins/1bb");
const ccPlugin = readJson(`${PLUGIN}/.claude-plugin/plugin.json`);
check(ccPlugin.name === ccEntry.name, "plugin name matches marketplace entry");
check(ccPlugin.version === ccEntry.version, "plugin version matches marketplace entry");
const ccMcp = obj(obj(readJson(`${PLUGIN}/.mcp.json`).mcpServers)["1bb"]);
check(ccMcp.type === "http" && ccMcp.url === MCP_URL, ".mcp.json uses remote http URL");
check(
  obj(ccMcp.headers).Authorization === `Bearer \${${ENV_VAR}}`,
  ".mcp.json reads the key from ${ONEBB_CONNECTION_TOKEN}",
);

console.log("Codex marketplace + plugin");
const cxMarket = readJson(".agents/plugins/marketplace.json");
const cxEntry = (cxMarket.plugins as Json[])[0];
const cxSource = obj(cxEntry.source);
check(cxSource.source === "local" && cxSource.path === `./${PLUGIN}`, "source.path is ./plugins/1bb");
check(
  ["AVAILABLE", "INSTALLED_BY_DEFAULT", "NOT_AVAILABLE"].includes(String(obj(cxEntry.policy).installation)),
  "policy.installation is a known value",
);
check(
  ["ON_INSTALL", "ON_USE"].includes(String(obj(cxEntry.policy).authentication)),
  "policy.authentication is a known value",
);
check(typeof cxEntry.category === "string", "category set");
const cxPlugin = readJson(`${PLUGIN}/.codex-plugin/plugin.json`);
check(cxPlugin.name === cxEntry.name, "codex plugin name matches marketplace entry");
check(cxPlugin.skills === "./skills/", "codex skills path is ./skills/");
check(cxPlugin.mcpServers === "./.codex-mcp.json", "codex mcpServers path is ./.codex-mcp.json");
check(existsSync(join(ROOT, PLUGIN, ".codex-mcp.json")), ".codex-mcp.json exists");
const cxMcp = obj(obj(readJson(`${PLUGIN}/.codex-mcp.json`).mcpServers)["1bb"]);
check(cxMcp.url === MCP_URL, ".codex-mcp.json URL");
check(cxMcp.bearer_token_env_var === ENV_VAR, ".codex-mcp.json uses bearer_token_env_var");
// Codex rejects unknown keys in this file, so only allow what config.toml allows.
check(
  Object.keys(cxMcp).every((k) => ["type", "url", "bearer_token_env_var"].includes(k)),
  ".codex-mcp.json has no unsupported keys",
);
check(!existsSync(join(ROOT, PLUGIN, "plugin.json")), "no root plugin.json (would switch Codex to the portable format, which strips Authorization)");

console.log("Skills");
const mcpb = readJson("claude-desktop/manifest.json");
const toolNames = new Set((mcpb.tools as Json[]).map((t) => String(t.name)));
const skillDirs = readdirSync(join(ROOT, PLUGIN, "skills"));
check(skillDirs.length === 7, "seven playbook skills");
for (const dir of skillDirs) {
  const text = readFileSync(join(ROOT, PLUGIN, "skills", dir, "SKILL.md"), "utf8");
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
  check(new RegExp(`^name: ${dir}$`, "m").test(front), `${dir}: frontmatter name matches folder`);
  check(/^description: This skill should be used when/m.test(front), `${dir}: third-person description`);
  check(text.includes("`onebb_connection_status` before anything else"), `${dir}: checks connection first`);
  check(/Never ask for the key in chat/.test(text), `${dir}: never asks for the key`);
  check(/1BB data used/.test(text), `${dir}: cites 1BB data used`);
  check(/Flag missing info/.test(text), `${dir}: flags missing business info`);
  check(/not posted|Never claim/.test(text), `${dir}: never claims posted`);
  const used = [...text.matchAll(/`(onebb_[a-z_]+)`/g)].map((m) => m[1]);
  const unknown = used.filter((t) => !toolNames.has(t));
  check(unknown.length === 0, `${dir}: every tool name exists${unknown.length ? ` (unknown: ${unknown.join(", ")})` : ""}`);
}

console.log("Claude Desktop extension");
const server = obj(mcpb.server);
const env = obj(obj(server.mcp_config).env);
check(/^https:\/\/[a-z0-9-]+\.convex\.site$/.test(String(env.ONEBB_API_ORIGIN)), "ONEBB_API_ORIGIN is a fixed https convex.site origin");
check(env[ENV_VAR] === "${user_config.connection_token}", "token comes from user_config");
const tokenField = obj(obj(mcpb.user_config).connection_token);
check(tokenField.sensitive === true && tokenField.required === true, "token field is sensitive and required");
check(existsSync(join(ROOT, "claude-desktop", String(server.entry_point))), "entry point bundle exists");
check(toolNames.size === 34, "34 tools listed");

console.log("Other client snippets");
const cursor = obj(obj(readJson("configs/cursor-mcp.json").mcpServers)["1bb"]);
check(cursor.url === MCP_URL && obj(cursor.headers).Authorization === `Bearer \${env:${ENV_VAR}}`, "cursor snippet");
const wind = obj(obj(readJson("configs/windsurf-antigravity-mcp_config.json").mcpServers)["1bb"]);
check(wind.serverUrl === MCP_URL && obj(wind.headers).Authorization === `Bearer \${env:${ENV_VAR}}`, "windsurf/antigravity snippet");
const toml = readFileSync(join(ROOT, "configs/codex-config.toml"), "utf8");
check(toml.includes(`url = "${MCP_URL}"`) && toml.includes(`bearer_token_env_var = "${ENV_VAR}"`), "codex config.toml snippet");

console.log("Repo-wide safety");
const realKey = /1bbct_[a-f0-9]{64}/;
const leaked = ownText.filter((f) => realKey.test(readFileSync(join(ROOT, f), "utf8")));
check(leaked.length === 0, `no real-looking key committed${leaked.length ? ` (${leaked.join(", ")})` : ""}`);
const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const dashy = ownText.filter((f) => DASHES.test(readFileSync(join(ROOT, f), "utf8")));
check(dashy.length === 0, `no em or en dashes${dashy.length ? ` (${dashy.join(", ")})` : ""}`);

console.log(`\n${passes} passed, ${failures} failed`);
process.exitCode = failures === 0 ? 0 : 1;
