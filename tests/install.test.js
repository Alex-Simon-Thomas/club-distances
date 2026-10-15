// The install hint: only in the browser, never in the installed app, and gone once dismissed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isInstalled, showInstallHint, INSTALL_HINT } from "../js/install.js";

const fakeWindow = ({ mode = "browser", standalone } = {}) => ({
  navigator: standalone === undefined ? {} : { standalone },
  matchMedia: (q) => ({ matches: q === `(display-mode: ${mode})` }),
});

test("in a browser tab the app isn't installed", () => {
  assert.equal(isInstalled(fakeWindow()), false);
  assert.equal(isInstalled(fakeWindow({ standalone: false })), false);
});

test("opened from the home screen, the app is installed", () => {
  assert.equal(isInstalled(fakeWindow({ mode: "standalone" })), true); // Android and desktop
  assert.equal(isInstalled(fakeWindow({ standalone: true })), true); // iPhone
});

test("with no matchMedia, the app counts as in the browser", () => {
  assert.equal(isInstalled({ navigator: {} }), false);
});

test("the hint shows only in the browser and until it's dismissed", () => {
  assert.equal(showInstallHint({ installed: false, dismissed: false }), true);
  assert.equal(showInstallHint({ installed: true, dismissed: false }), false);
  assert.equal(showInstallHint({ installed: false, dismissed: true }), false);
  assert.equal(showInstallHint({ installed: true, dismissed: true }), false);
});

test("the hint says how to install on iPhone and Android", () => {
  assert.equal(`${INSTALL_HINT.lead} ${INSTALL_HINT.text}`,
    "Use it like an app. On iPhone: Share, then Add to Home Screen. On Android: menu, then Install app. Works with no signal.");
});

test("once dismissed, the hint stays dismissed on that phone", async () => {
  const { createStore } = await import("../js/storage.js");
  const m = new Map(), storage = { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) };
  assert.equal(createStore(storage).pref("installHintDismissed", false), false);
  createStore(storage).setPref("installHintDismissed", true);
  assert.equal(createStore(storage).pref("installHintDismissed", false), true);
});
