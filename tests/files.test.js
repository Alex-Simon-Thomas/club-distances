// The offline cache list (files.js) must match the app files on disk:
// every app file is cached, and every cached file exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import vm from "node:vm";

const root = join(import.meta.dirname, "..");

// Files that aren't part of the running app, or that the browser handles itself.
const NOT_APP = [/^\./, /^tests\//, /^README\.md$/, /^LICENSE$/, /^sw\.js$/, /^files\.js$/];

function appFiles(dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    const rel = relative(root, full).split(sep).join("/");
    if (NOT_APP.some((re) => re.test(rel))) return [];
    return entry.isDirectory() ? appFiles(full) : [rel];
  });
}

function cachedFiles() {
  const sandbox = { self: {} };
  vm.runInNewContext(readFileSync(join(root, "files.js"), "utf8"), sandbox);
  // Copy into this realm: arrays from the vm context fail strict deep-equal on prototype.
  return [...sandbox.self.APP_FILES];
}

test("every app file is in the offline cache list", () => {
  const cached = new Set(cachedFiles());
  const missing = appFiles().filter((f) => !cached.has(f));
  assert.deepEqual(missing, [], `Add these to files.js: ${missing.join(", ")}`);
});

test("every file in the offline cache list exists", () => {
  const gone = cachedFiles().filter((f) => f !== "./" && !existsSync(join(root, f)));
  assert.deepEqual(gone, [], `Remove these from files.js: ${gone.join(", ")}`);
});

test("the start page is cached for offline launches", () => {
  assert.ok(cachedFiles().includes("./"));
});
