# Changelog

## [2026-10-26]
### Added
- `onebb_publish` and `onebb_cancel_post`: the AI posts after the member says yes in the chat, no 1BB visit (27 tools). post-everywhere skill branches on direct_posting.
- Bridge 0.3.0 with in-chat post card, photo picker and numbers views, and old-bridge-safe tool lists.
## [2026-10-25, version 0.3.0]

### Added
- `post-everywhere` playbook: show a card per platform, ask where (suggest every account), offer a photo (Gallery, phone link, or a file upload in Claude Code and Codex), ask draft / post now / next open time, then hand over one Approve link.
- `check-my-numbers` playbook: views, likes and more per post from `onebb_list_posts`, the best post, and one idea to do more of it.
- `tell-drey` playbook: sends a member's bug, idea or question to Drey with `onebb_send_feedback`.

### Changed
- Plugin, marketplace and extension versions bumped to 0.3.0.

## [2026-10-24, version 0.2.0]

### Added
- Claude on the web setup: add 1BB as a custom connector and sign in with 1BB, no key needed (1BB shipped OAuth).
- `import-a-call` playbook and the `onebb_import_call` tool: the AI fetches a call with the member's own connectors or a paste, and 1BB adds it to the Gallery once and finds moments.
- Claude Desktop bridge rebuilt so it offers `onebb_import_call`.

### Changed
- Keys no longer last 7 days. They keep working while the membership is active and stop if it ends. Removed every 7-day instruction from the README, playbooks and Claude Desktop extension.
- Posting is on in 1BB: the AI proposes a post and the member taps Approve on the review link. Nothing posts without that.
- Plugin, marketplace and extension versions bumped to 0.2.0.

## [2026-10-24]

### Added
- Claude Code marketplace and `1bb` plugin with a remote HTTP MCP config, so members can plug 1BB into Claude Code with one install.
- Codex plugin (`.codex-plugin` format) sharing the same folder and skills, using `bearer_token_env_var` because the portable format strips Authorization headers.
- Three playbook skills (plan-my-day, write-in-my-voice, source-to-content) that check the connection first, cite 1BB data, flag missing info and never claim a post went out.
- Claude Desktop extension (`.mcpb`) wrapping the existing stdio bridge, with the key stored as a sensitive keychain field and the API origin fixed.
- Config snippets for Codex config.toml, Cursor, Windsurf and Antigravity, all reading the key from `ONEBB_CONNECTION_TOKEN`.
- `scripts/validate.ts` (offline manifest checks) and `scripts/smoke-bridge.ts` (fake-key refusal test) so anyone can re-check the package without Claude.
- Plain-language README with per-app steps, the 7-day key note, a can/can't table and a flow diagram.
