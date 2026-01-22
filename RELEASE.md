# Release checklist

## Automated (recommended)

1. Run `bun run release -- <version>` (auto-updates `package.json` + `CHANGELOG.md`).
2. Optional: pass notes with `--note "message"` or a trailing description.
   Example: `bun run release -- 0.1.1 --note "Fix list union handling"`.
3. Optional: add `--push` to push the commit and tag to `origin` (auto-detects default branch).
4. Optional: set `--push-branch <name>` to push a specific branch.
   Example: `bun run release -- 0.1.1 --push --push-branch release`.
5. Optional: add `--gh-release` to create a GitHub Release (requires `gh` CLI auth).
   Example: `bun run release -- 0.1.1 --push --gh-release`.

## Manual

1. Update the version in `package.json` and the entry in `CHANGELOG.md`.
2. Run `bun test`.
3. Run `bun run build` and confirm `dist/` is up to date.
4. Tag the release (example: `v0.1.0`).
5. Publish with your preferred npm client.
