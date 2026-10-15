// The bag, settings and target saved in the phone's browser, using a stand-in for localStorage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, TARGET_TTL } from "../js/storage.js";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), raw: m };
}
const SEVEN = { type: "7 Iron", name: "Ping", inBag: true, fullCarry: 136, fullTotal: 146, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null };

test("an empty phone has an empty bag", () => {
  assert.deepEqual(createStore(memoryStorage()).loadClubs(), []);
});

test("an added club keeps the prototype's record shape and survives a reload", () => {
  const storage = memoryStorage();
  const club = createStore(storage).addClub(SEVEN, 1792044643509);
  const [loaded] = createStore(storage).loadClubs();
  assert.deepEqual(Object.keys(loaded), ["id", "type", "name", "inBag", "created", "fullCarry", "fullTotal", "tqCarry", "tqTotal", "halfCarry", "halfTotal"]);
  assert.deepEqual(loaded, club);
  assert.equal(loaded.created, 1792044643509);
  assert.match(loaded.id, /^[0-9a-z]{20}$/);
});

test("updating a club changes only that club", () => {
  const store = createStore(memoryStorage());
  const a = store.addClub(SEVEN), b = store.addClub({ ...SEVEN, type: "8 Iron" });
  store.updateClub(a.id, { ...SEVEN, fullCarry: 140, inBag: false });
  const [a2, b2] = store.loadClubs();
  assert.equal(a2.fullCarry, 140);
  assert.equal(a2.inBag, false);
  assert.equal(a2.created, a.created);
  assert.deepEqual(b2, b);
});

test("undo after delete restores the same club, with the same id", () => {
  const store = createStore(memoryStorage());
  const a = store.addClub(SEVEN);
  const removed = store.deleteClub(a.id);
  assert.deepEqual(store.loadClubs(), []);
  store.restoreClub(removed);
  assert.deepEqual(store.loadClubs(), [a]);
});

test("the prototype's export loads as it is", () => {
  const storage = memoryStorage();
  const exported = [{ id: "p9frpkga21oy9e7dto60", type: "Driver", name: "Cobra", inBag: true, created: 1792044522721, fullCarry: 221, fullTotal: 243, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null }];
  storage.setItem("bag-clubs", JSON.stringify(exported));
  assert.deepEqual(createStore(storage).loadClubs(), exported);
});

test("a damaged saved bag reads as empty instead of breaking the app", () => {
  const storage = memoryStorage();
  storage.setItem("bag-clubs", "{not json");
  assert.deepEqual(createStore(storage).loadClubs(), []);
});

test("saving the bag throws when the browser refuses, so the editor can say so", () => {
  const store = createStore({ getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); } });
  assert.throws(() => store.addClub(SEVEN));
});

test("settings are saved as 1 and 0, with defaults when unset", () => {
  const storage = memoryStorage(), store = createStore(storage);
  assert.equal(store.pref("icons", true), true);
  assert.equal(store.pref("arc", false), false);
  store.setPref("icons", false);
  store.setPref("sun", true);
  assert.equal(storage.raw.get("bag-icons"), "0");
  assert.equal(storage.raw.get("bag-sun"), "1");
  assert.equal(createStore(storage).pref("icons", true), false);
});

test("the target is remembered for 5 hours, then forgotten", () => {
  const store = createStore(memoryStorage()), at = 1_000_000;
  store.saveTarget(132, at);
  assert.equal(store.loadTarget(at + TARGET_TTL - 1), 132);
  assert.equal(store.loadTarget(at + TARGET_TTL), null);
  store.saveTarget(null, at);
  assert.equal(store.loadTarget(at), null);
});
