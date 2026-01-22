# AGENTS.md

## Bun-first standard

Rule: Default to Bun for runtime, package management, building, and testing.  
Do not introduce Node.js tooling (node, npm, pnpm, yarn, vite, webpack, esbuild, jest, vitest) unless explicitly required.

### Applies to

- TypeScript / JavaScript / React: `*.ts, *.tsx, *.js, *.jsx`
- Web assets: `*.html, *.css`
- `package.json`

---

## Commands

### Run files

- Use: `bun <file>`
- Do not use: `node <file>`, `ts-node <file>`

### Install dependencies

- Use: `bun install`
- Do not use: `npm install`, `yarn install`, `pnpm install`

### Run scripts

- Use: `bun run <script>`
- Do not use: `npm run <script>`, `yarn run <script>`, `pnpm run <script>`

### One-off CLI execution

- Use: `bunx <package> <command>`
- Do not use: `npx <package> <command>`

### Testing

- Use: `bun test`
- Do not use: `jest`, `vitest`

### Build / bundle

- Use: `bun build <file.html|file.ts|file.css>`
- Do not use: `webpack`, `esbuild`

### Environment variables

Bun automatically loads `.env`. Do not add or use `dotenv`.

---

## Testing (bun:test)

Use `bun test` and Bun’s built-in test runner.

```ts
// index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```
