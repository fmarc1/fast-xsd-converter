# Release checklist

## Automated (recommended)

1. Run `bun run release -- <version>` (auto-updates `package.json` + `CHANGELOG.md`).
2. Optional: pass notes with `--note "message"` or a trailing description.
   Example: `bun run release -- 0.1.1 --note "Fix list union handling"`.

## Manual

1. Update the version in `package.json` and the entry in `CHANGELOG.md`.
2. Run `bun test`.
3. Run `bun run build` and confirm `dist/` is up to date.
4. Tag the release (example: `v0.1.0`).
5. Publish with your preferred npm client.
