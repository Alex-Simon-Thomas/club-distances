// Guards the update path: if any of these reads goes through the browser's HTTP cache,
// a pushed version reaches phones late or half-updated (found after the v1 push, 2026-10-15).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const read = (f) => readFileSync(join(root, f), "utf8");

test("install fetches every app file past the HTTP cache", () => {
  assert.match(read("sw.js"), /new Request\(f, \{ cache: "reload" \}\)/);
});

test("background refresh revalidates with the server", () => {
  assert.match(read("sw.js"), /fetch\(request, \{ cache: "no-cache" \}\)/);
});

test("the update check skips the HTTP cache for sw.js and files.js", () => {
  assert.match(read("app.js"), /register\("sw\.js", \{ updateViaCache: "none" \}\)/);
});
