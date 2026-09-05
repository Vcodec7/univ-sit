# Agent operating rules for YoungPortal / ty.idivles.ru / py.idivles.ru

## Operating style (mandatory)

- Use **best practices**: root-cause fixes, small focused diffs, verify before claiming done.
- Use **available tools productively**: shell, git, `gh` (read-only), MCP/`cursor-cloud` when useful, scripts — not guesswork or long browser loops.
- Prefer **automation over narration**: run existing scripts; extend them when a step repeats. Goal = fewer tokens, fewer rebuilds, faster feedback.
- Default verify path: scripts + HTTP smoke, not manual clicking unless the bug is visual/mobile UX.
- Batch related fixes → one commit/push → one staging deploy → smoke. Never rebuild Docker for docs/script-only sync (`SKIP_BUILD=1`).

## How to work (save time)

- Batch code fixes, **one** git push, **one** apply to ty: `bash scripts/apply-staging.sh`
  (builds Next off the VPS, then a small Docker image on staging). Do not `docker compose --build` on the 2GB box.
- Verify with scripts, not a browser: `bash scripts/smoke-sites.sh --staging-only`
- SSH/SCP only via workflow scripts (`scripts/lib/vps.sh` retries Connection reset). No ad-hoc retry loops.
- Brand CSS only: `bash scripts/apply-staging.sh static`
- Script/nginx/docs-only on VPS: `bash scripts/apply-staging.sh sync`
- Promote reuses the existing image (`--no-build`); do not run `safe-rebuild-web.sh` unless recreate failed.
- Reuse helpers: `scripts/apply-staging.sh`, `scripts/lib/vps.sh`, `workflow-deploy-staging.sh`, `manual-promote-to-young.sh`, `smoke-sites.sh`.

## Deploy workflow (mandatory)

1. **GitHub first** — commit, push, update PR. Never leave changes only on the VPS.
2. **Staging next** — `bash scripts/apply-staging.sh` then smoke. GitHub Action `apply-staging` can do the same on push to `main` after secret `STAGING_SSH_KEY` is set. Then `bash scripts/smoke-sites.sh --staging-only`
3. **Human checks ty** — wait for «одобряю» / «кати на py» / «promote». Do not promote early.
4. **Only then prod** —  
   `CONFIRM=PROMOTE_YOUNG APPROVE=YES bash scripts/manual-promote-to-young.sh`  
   then `bash scripts/smoke-sites.sh`

Full doc: `docs/WORKFLOW.md`

## After every completed user request (mandatory)

When the user’s task is finished (especially after approve/promote), always:

1. **Clean junk** — temp promote/staging archives, stale duplicate kits under `artifacts/`.
2. **Full project backup** — `bash scripts/make-full-backup.sh` (+ VPS `full-backup.sh` when SSH is available).
3. **Handoff kits** — `bash scripts/post-request-handoff.sh`  
   - **org kit** (`--with-live`): archive to re-deploy on another VPS if this one dies (code + live DB/uploads + deploy docs).  
   - **sale source**: clean source kit for sale / modernization.  
   - **portable**: source-only portable/dev kit.  
4. Publish kits via existing `pack-dev-deploy-kit.sh` / `publish-public-backup.sh` and refresh `scripts/download-kit.sh` URLs + `docs/ORG-HANDOFF.md` when new public URLs appear.

Do not skip this for “small” tasks that changed runnable code or ops scripts. Doc-only edits may use `SKIP_ORG_LIVE=1`.

## Domains (current)

- `ty.idivles.ru` = staging / test (check here first)
- `py.idivles.ru` = production (after promote)
- VPS: `root@77.110.125.241` port `22` (SSH key `~/.ssh/id_ed25519_yp`)

Do **not** use legacy `young.idivles.ru` / `y1.idivles.ru` / `176.124.204.53` as defaults.

## Safety

- Never commit `.env`, passwords, user uploads (avatars/gallery/portfolio).
- Public MinTsifry CA `certs/russian_trusted_ca.pem` may be committed; other PEMs stay ignored.
- Do not promote to production without explicit approval in the conversation.
- Prefer SSH keys over root passwords; rotate if a password was pasted into chat.
- User-facing UI and statuses must be **Russian** (no raw PENDING/APPROVED in the interface).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
