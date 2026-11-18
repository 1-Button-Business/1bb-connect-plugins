# Changelog

## [2026-11-17, version 0.3.5]
### Changed
- Claude Desktop bridge rebuilt from 1bb-community `dev` (commit a1a2070, PR #1919). It now knows all 106 Connect tools (was 35), including the setup tools and `onebb_guide`, plus the short instructions and the `onebb://guide/<topic>` guide resources. Why: Desktop members were missing every tool added since October and the new guides the hosted server's instructions point to.
- The extension's tool list is generated from the server's own catalog instead of typed by hand. Why: the hand-typed list had drifted to 35 of 106.
- The validator checks the bundle against `docs/bridge-source.json` (source commit, tool count, sha256) and that every listed tool is in the bundle, instead of expecting exactly 35. Why: catch a hand-edited or stale bundle before it ships.
- Plugin, marketplace and extension versions bumped to 0.3.5.
### Added
- `npm run build:bridge -- <1bb-community checkout>`: one repeatable command that bundles the bridge, copies it in, regenerates the tool list and records where it came from. Why: so the Desktop bridge never drifts from the hosted server again.
- `npm run smoke` also starts the bridge against a fake, offline 1BB API and checks that `tools/list` matches the manifest, `onebb_guide` answers on its own and the guides are listed as resources. Why: prove the bundle works without a real key.
### Note
- A member's Desktop shows only tools the live 1BB server allows for their key. Production does not list `onebb_guide` yet (checked 2026-11-17: hosted server and bridge both show 105 tools). It appears on Desktop automatically once PR #1919 reaches production; no new extension needed.

## [2026-11-17, version 0.3.4]
### Changed
- The validator knows `onebb_guide`, the new read-only tool that serves 1BB's playbook as topic guides (setup, posting, carousels, calls, fixing and more). Why: some AI apps cut the server's long instructions short, so the live server now sends short instructions and the AI reads the guide for each job on demand.
- The `onboarding` playbook reads the `setup` guide first when the connection lists `onebb_guide`. Older connections without it work as before.
- Plugin, marketplace and extension versions bumped to 0.3.4. The Desktop bridge itself is unchanged.

## [2026-11-16, version 0.3.3]
### Added
- `onboarding` playbook, so a new member can type `/1bb:onboarding` in Claude Code (or say "onboard me" in any app) and get set up in the chat. Why: new members had no single command to start with, and setup already works through the live 1BB tools.
### Changed
- The validator expects eight playbooks and knows the seven setup tools the live server added after Desktop bridge 0.3.2. The Desktop bridge itself is unchanged, so the playbook tells the AI what to say when a connection does not list the setup tools.
- Plugin, marketplace and extension versions bumped to 0.3.3.

## [2026-10-27, version 0.3.2]
### Added
- `onebb_publish_everywhere`: one yes lines up a post on several accounts, all or nothing. The post-everywhere playbook uses it.
- `onebb_list_posts` `show: "upcoming"` for "what's going out this week".
### Changed
- The in-chat post card shows the post the way its platform will: photos in the real crop, caption cut at "more", the chat's light or dark look, and a 1BB mark. It also shows when the AI posts, lines up, reschedules or changes photos.
- Plugin, marketplace and extension versions bumped to 0.3.2.

## [2026-10-26, version 0.3.1]
### Added
- Tools so nothing sends a member back to 1BB (34 tools): `onebb_delete_draft` and `onebb_restore_draft`, `onebb_set_photos` (remove or reorder), `onebb_reschedule_post`, `onebb_retry_post`, `onebb_delete_gallery_item` and `onebb_restore_gallery_item`. `onebb_cancel_post` also takes a `post_id`. Deletes can always be undone.

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
