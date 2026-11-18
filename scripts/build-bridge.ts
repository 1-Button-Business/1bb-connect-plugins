// Rebuilds the Claude Desktop bridge from a 1bb-community checkout, so Desktop
// gets the same tools, instructions and guides as the hosted 1BB server.
// Run: npm run build:bridge -- /absolute/path/to/1bb-community
// The checkout must be on the branch you want to ship (normally dev) and have
// run `npm ci`. Nothing here talks to the network or touches member data.
//
// What it does:
// 1. Runs that repo's own `npm run connect:build` (esbuild bundles
//    scripts/connect-mcp.ts, the stdio entry, into one file).
// 2. Copies the bundle to claude-desktop/server/connect.mjs.
// 3. Rewrites the `tools` list in claude-desktop/manifest.json from the
//    server's real tool catalog (convex/connect/contracts.ts), never by hand.
// 4. Records the source commit and bundle hash in docs/bridge-source.json.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const source = process.argv[2];
if (!source || !existsSync(join(source, "scripts/build-connect-mcp.mjs")))
  throw new Error("Pass the path to a 1bb-community checkout: npm run build:bridge -- /path/to/1bb-community");
if (!existsSync(join(source, "node_modules")))
  throw new Error(`Run \`npm ci\` in ${source} first.`);

const git = (...args: string[]) => execFileSync("git", ["-C", source, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const dirty = git("status", "--porcelain", "--untracked-files=no") !== "";
if (dirty) throw new Error("The 1bb-community checkout has uncommitted changes. Build only from a committed state.");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
execFileSync(npm, ["run", "connect:build"], { cwd: source, stdio: "inherit" });
const bundlePath = join(ROOT, "claude-desktop/server/connect.mjs");
copyFileSync(join(source, "packages/connect-beta/dist/connect.mjs"), bundlePath);
const sha256 = createHash("sha256").update(readFileSync(bundlePath)).digest("hex");

// The catalog, straight from the server's contracts. First sentence of each
// description is enough for the Desktop extension's tool list.
const dump = `import { toolNames, toolDescriptions } from "./convex/connect/contracts";
console.log(JSON.stringify(toolNames.map((name) => ({
  name,
  description: (toolDescriptions[name].match(/^.*?[.!?](?=\\s|$)/)?.[0] ?? toolDescriptions[name]).trim(),
}))));`;
const tools = JSON.parse(
  execFileSync(join(source, "node_modules/.bin/tsx"), ["-e", dump], { cwd: source, encoding: "utf8" }),
) as Array<{ name: string; description: string }>;
if (!tools.some((t) => t.name === "onebb_guide")) throw new Error("Source has no onebb_guide; wrong branch?");

const manifestPath = join(ROOT, "claude-desktop/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
manifest.tools = tools;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

writeFileSync(
  join(ROOT, "docs/bridge-source.json"),
  JSON.stringify(
    { repo: "1-Button-Business/1bb-community", branch, commit, built: new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }), tools: tools.length, sha256 },
    null,
    2,
  ) + "\n",
);
console.log(`Bridge rebuilt from ${branch} @ ${commit.slice(0, 7)}: ${tools.length} tools.`);
