// Lets `node --test` run TypeScript sources the way the Next.js bundler does:
// resolves the `@/` alias (tsconfig "paths") and extensionless relative imports
// such as `./engine` → `./engine.ts` or `./engine/index.ts`.
import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const srcRoot = new URL("../src/", import.meta.url);
const candidates = [".ts", "/index.ts"];

function resolveTypeScript(base) {
  for (const suffix of candidates) {
    const candidate = new URL(base.href + suffix);
    const path = fileURLToPath(candidate);
    if (existsSync(path) && statSync(path).isFile()) return candidate.href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) {
      base = new URL(specifier.slice(2), srcRoot);
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.endsWith(".ts") &&
      !/\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      base = new URL(specifier, context.parentURL);
    }
    const resolved = base && resolveTypeScript(base);
    return nextResolve(resolved ?? specifier, context);
  },
});
