// Starts the Claude Desktop bridge exactly the way the .mcpb manifest says,
// but with FAKE keys, and proves it refuses cleanly without leaking anything.
// Run: npm run smoke            (offline cases, including a fake 1BB API that
//                                 checks tools/list and onebb_guide)
//      npm run smoke -- --network  (also sends one well-formed fake key to the 1BB API)
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BUNDLE_DIR = process.env.SMOKE_BUNDLE_DIR ?? join(ROOT, "claude-desktop");
const EXPECTED = "1BB Connect could not start.";

type Manifest = {
  server: { mcp_config: { command: string; args: string[]; env: Record<string, string> } };
  tools: Array<{ name: string }>;
};
const manifest = JSON.parse(readFileSync(join(BUNDLE_DIR, "manifest.json"), "utf8")) as Manifest;

function resolve(value: string, token: string): string {
  return value.replaceAll("${__dirname}", BUNDLE_DIR).replaceAll("${user_config.connection_token}", token);
}

type Result = { code: number | null; stdout: string; stderr: string; ms: number };
function run(token: string): Promise<Result> {
  const { command, args, env } = manifest.server.mcp_config;
  const childEnv: Record<string, string> = { PATH: process.env.PATH ?? "" };
  for (const [k, v] of Object.entries(env)) childEnv[k] = resolve(v, token);
  const started = Date.now();
  return new Promise((done) => {
    const child = spawn(command === "node" ? process.execPath : command, args.map((a) => resolve(a, token)), {
      env: childEnv,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const kill = setTimeout(() => child.kill("SIGKILL"), 20_000);
    child.on("close", (code) => {
      clearTimeout(kill);
      done({ code, stdout, stderr, ms: Date.now() - started });
    });
    // What a real MCP client sends first.
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } },
      }) + "\n",
    );
  });
}

const cases: Array<{ label: string; token: string }> = [
  { label: "empty key", token: "" },
  { label: "malformed fake key", token: "1bbct_not-a-real-key" },
];
if (process.argv.includes("--network")) {
  // Well-formed but random, so it can never match a real key.
  cases.push({ label: "well-formed fake key (network)", token: `1bbct_${randomBytes(32).toString("hex")}` });
}

let failed = 0;
for (const c of cases) {
  const r = await run(c.token);
  const leaked = c.token.length > 0 && (r.stderr.includes(c.token) || r.stdout.includes(c.token));
  const ok = r.code === 1 && r.stderr.startsWith(EXPECTED) && r.stdout === "" && !leaked;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.label}: exit=${r.code} ${r.ms}ms stdout=${JSON.stringify(r.stdout)} key-leaked=${leaked}`);
  console.log(`     stderr: ${r.stderr.trim()}`);
}
process.exitCode = failed === 0 ? 0 : 1;

// Offline: a fake 1BB API (scripts/fake-backend.mjs) allows every manifest
// tool, so the bridge must list exactly those tools, answer onebb_guide on its
// own, and list the guides as resources.
async function listWithFakeBackend(): Promise<string[]> {
  const { args, env } = manifest.server.mcp_config;
  const token = `1bbct_${"0".repeat(64)}`;
  const childEnv: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    FAKE_BACKEND_MANIFEST: join(BUNDLE_DIR, "manifest.json"),
  };
  for (const [k, v] of Object.entries(env)) childEnv[k] = resolve(v, token);
  const child = spawn(
    process.execPath,
    ["--import", join(ROOT, "scripts/fake-backend.mjs"), ...args.map((a) => resolve(a, token))],
    { env: childEnv, stdio: ["pipe", "pipe", "pipe"] },
  );
  const replies = new Map<number, Record<string, unknown>>();
  let buffer = "";
  child.stdout.on("data", (d) => {
    buffer += d;
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      const msg = JSON.parse(line) as { id?: number };
      if (typeof msg.id === "number") replies.set(msg.id, msg as Record<string, unknown>);
    }
  });
  const ask = (id: number, method: string, params: unknown) =>
    new Promise<Record<string, unknown>>((done, fail) => {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      const started = Date.now();
      const poll = setInterval(() => {
        if (replies.has(id)) {
          clearInterval(poll);
          done(replies.get(id)!);
        } else if (Date.now() - started > 20_000) {
          clearInterval(poll);
          fail(new Error(`no reply to ${method}`));
        }
      }, 20);
    });
  const problems: string[] = [];
  try {
    await ask(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    const list = (await ask(2, "tools/list", {})).result as { tools: Array<{ name: string }> };
    const listed = list.tools.map((t) => t.name).sort();
    const expected = manifest.tools.map((t) => t.name).sort();
    if (JSON.stringify(listed) !== JSON.stringify(expected))
      problems.push(`tools/list has ${listed.length}, manifest has ${expected.length}`);
    const guide = (await ask(3, "tools/call", { name: "onebb_guide", arguments: { topic: "setup" } })).result as
      | { isError?: boolean; content: Array<{ text: string }> }
      | undefined;
    if (!guide || guide.isError || !guide.content[0]?.text.includes("SETUP WALK-THROUGH"))
      problems.push("onebb_guide setup did not answer locally");
    const resources = (await ask(4, "resources/list", {})).result as { resources: Array<{ uri: string }> };
    if (!resources.resources.some((r) => r.uri.startsWith("onebb://guide/"))) problems.push("no onebb://guide resources");
    return problems.length ? problems : [`ok: ${listed.length} tools, guide answered, ${resources.resources.filter((r) => r.uri.startsWith("onebb://guide/")).length} guide resources`];
  } catch (error) {
    return [String(error)];
  } finally {
    child.kill();
  }
}

const fake = await listWithFakeBackend();
const fakeOk = fake.length === 1 && fake[0].startsWith("ok:");
console.log(`${fakeOk ? "ok  " : "FAIL"} fake backend: ${fake.join("; ")}`);
if (!fakeOk) process.exitCode = 1;
