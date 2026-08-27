// scripts/resolve-ext.mjs
//
// Node's ESM resolver requires explicit file extensions on relative
// imports; Vite's does not. The production source (emotionField.js,
// dominance.js, composite.js, clampEmotion.js, emotionAI.js, ...)
// correctly relies on Vite's resolution and should NOT be edited to
// satisfy Node — this loader makes plain `node` resolve the same way
// Vite already does, so the diagnostic scripts can import that source
// unmodified.
//
// Usage:
//   node --experimental-loader ./scripts/resolve-ext.mjs scripts/replay-real-log.mjs
//   node --experimental-loader ./scripts/resolve-ext.mjs scripts/run-regression.mjs
//
// What it does: for any relative/absolute specifier with no extension,
// try appending each candidate extension (and, failing that, an
// /index.<ext> inside it, same as Vite/webpack/Node's own CJS
// resolver) and hand the first match that exists on disk back to
// Node's normal resolution. Anything that already has an extension,
// or isn't a relative/absolute path (bare specifiers like "react" or
// "@huggingface/transformers"), is left completely alone.

import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EXTENSIONS = [".js", ".mjs", ".jsx", ".ts", ".tsx", ".json"];

function isRelativeOrAbsolute(specifier) {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/") ||
    /^[a-zA-Z]:[\\/]/.test(specifier) // Windows absolute path, e.g. Z:\...
  );
}

function tryResolve(baseDir, specifier) {
  const asIs = path.resolve(baseDir, specifier);

  // Already has a real extension and exists as-is — nothing to do.
  if (path.extname(specifier) && existsSync(asIs)) {
    return asIs;
  }

  // specifier + each candidate extension, e.g. "./composite" -> "./composite.js"
  for (const ext of EXTENSIONS) {
    const candidate = asIs + ext;
    if (existsSync(candidate)) return candidate;
  }

  // specifier as a directory with an index file, e.g. "./engine" -> "./engine/index.js"
  if (existsSync(asIs) && statSync(asIs).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const candidate = path.join(asIs, "index" + ext);
      if (existsSync(candidate)) return candidate;
    }
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (isRelativeOrAbsolute(specifier) && context.parentURL) {
    let parentPath;
    try {
      parentPath = fileURLToPath(context.parentURL);
    } catch {
      // parentURL isn't a file:// URL (e.g. resolving the entry script
      // itself on some platforms) — fall through to default resolution.
      return nextResolve(specifier, context);
    }

    const baseDir = path.dirname(parentPath);
    const resolved = tryResolve(baseDir, specifier);

    if (resolved) {
      const resolvedURL = new URL("file://" + resolved.split(path.sep).join("/"));
      // On Windows, file URLs need a leading slash before the drive letter.
      if (process.platform === "win32" && !resolved.startsWith("/")) {
        return nextResolve(
          "file:///" + resolved.split(path.sep).join("/"),
          context
        );
      }
      return nextResolve(resolvedURL.href, context);
    }
  }

  // Bare specifiers (react, @huggingface/transformers, ...), anything
  // already resolvable, or anything we couldn't find a match for —
  // hand back to Node's normal resolution untouched.
  return nextResolve(specifier, context);
}
