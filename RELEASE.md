# Release checklist

1. Update the version in `package.json` and the entry in `CHANGELOG.md`.
2. Run `bun test`.
3. Run `bun run build` and confirm `dist/` is up to date.
4. Tag the release (example: `v0.1.0`).
5. Publish with your preferred npm client.
