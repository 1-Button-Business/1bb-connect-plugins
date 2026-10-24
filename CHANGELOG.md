# Changelog

## [2026-10-24]

### Added
- Claude Code marketplace and `1bb` plugin with a remote HTTP MCP config, so members can plug 1BB into Claude Code with one install.
- Codex plugin (`.codex-plugin` format) sharing the same folder and skills, using `bearer_token_env_var` because the portable format strips Authorization headers.
- Three playbook skills (plan-my-day, write-in-my-voice, source-to-content) that check the connection first, cite 1BB data, flag missing info and never claim a post went out.
- Claude Desktop extension (`.mcpb`) wrapping the existing stdio bridge, with the key stored as a sensitive keychain field and the API origin fixed.
- Config snippets for Codex config.toml, Cursor, Windsurf and Antigravity, all reading the key from `ONEBB_CONNECTION_TOKEN`.
- `scripts/validate.ts` (offline manifest checks) and `scripts/smoke-bridge.ts` (fake-key refusal test) so anyone can re-check the package without Claude.
- Plain-language README with per-app steps, the 7-day key note, a can/can't table and a flow diagram.
