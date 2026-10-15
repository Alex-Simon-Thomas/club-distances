// Bag files: reading one (validation), replacing the bag with it, and the export → import round trip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readBagFile, bagFileText, bagFileName, skippedText, skippedCount, confirmText } from "../js/bagfile.js";
import { createStore } from "../js/storage.js";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) };
}
// Records from the prototype's clubs-export.json, as it writes them.
const DRIVER = { id: "p9frpkga21oy9e7dto60", type: "Driver", name: "Cobra", inBag: true, created: 1792044522721, fullCarry: 221, fullTotal: 243, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null };
const HYBRID = { id: "w3bv28v288hrmrjphl84", type: "5 Hybrid", name: "Skymax", inBag: true, created: 1792044533784, fullCarry: 175, fullTotal: 185, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null };
const WEDGE = { id: "k2m9q8r7s6t5u4v3w2x1", type: "Sand Wedge", name: "", inBag: false, created: 1792044699000, fullCarry: 80, fullTotal: null, tqCarry: 62, tqTotal: null, halfCarry: 41, halfTotal: null };
const prototypeExport = (records) => "[\n" + records.map(r => "  " + JSON.stringify(r)).join(",\n") + "\n]\n";

test("a prototype export reads as it is, every field kept", () => {
  const { clubs, skipped, error } = readBagFile(prototypeExport([DRIVER, HYBRID, WEDGE]));
  assert.equal(error, undefined);
  assert.deepEqual(clubs, [DRIVER, HYBRID, WEDGE]);
  assert.equal(skippedCount(skipped), 0);
});

test("distances with one decimal are kept, since the bag is stored in meters with one decimal", () => {
  const { clubs } = readBagFile(JSON.stringify([{ ...DRIVER, fullCarry: 201.2, fullTotal: 400 }]));
  assert.equal(clubs[0].fullCarry, 201.2);
  assert.equal(clubs[0].fullTotal, 400);
});

test("missing optional fields are filled in, in the prototype's field order", () => {
  const { clubs } = readBagFile(JSON.stringify([{ type: "7 Iron", fullCarry: 136 }]), 1792000000000);
  const [c] = clubs;
  assert.deepEqual(Object.keys(c), ["id", "type", "name", "inBag", "created", "fullCarry", "fullTotal", "tqCarry", "tqTotal", "halfCarry", "halfTotal"]);
  assert.match(c.id, /^[0-9a-z]{20}$/);
  assert.equal(c.name, "");
  assert.equal(c.inBag, true);
  assert.equal(c.created, 1792000000000);
  assert.equal(c.tqCarry, null);
});

test("a repeated id gets a new one, so the bag never holds two clubs with the same id", () => {
  const { clubs } = readBagFile(JSON.stringify([DRIVER, { ...HYBRID, id: DRIVER.id }]));
  assert.equal(clubs[0].id, DRIVER.id);
  assert.notEqual(clubs[1].id, DRIVER.id);
});

test("records with an unknown club type or a distance outside 1–400 m are skipped and counted", () => {
  const file = JSON.stringify([
    DRIVER,
    { ...HYBRID, type: "Putter" },
    { ...WEDGE, fullCarry: 0 },
    { ...WEDGE, id: "a", halfTotal: 401 },
    { ...WEDGE, id: "b", tqCarry: "62" },
    { ...WEDGE, id: "c", fullCarry: -5 },
  ]);
  const { clubs, skipped } = readBagFile(file);
  assert.deepEqual(clubs, [DRIVER]);
  assert.deepEqual(skipped, { type: 1, distance: 4 });
  assert.equal(skippedCount(skipped), 5);
  assert.equal(skippedText(skipped), "1 with an unknown club type, 4 with a distance outside 1–400 m");
});

test("a file that isn't JSON is rejected", () => {
  assert.match(readBagFile("not json at all").error, /isn't a bag file/);
  assert.match(readBagFile("").error, /isn't a bag file/);
});

test("a file that isn't an array of club records is rejected", () => {
  for (const text of [JSON.stringify({ clubs: [DRIVER] }), "[]", "[1,2,3]", JSON.stringify([DRIVER, "7 Iron"]), JSON.stringify([{ name: "Ping" }]), "null"]) {
    const r = readBagFile(text);
    assert.match(r.error, /doesn't hold club records/, text);
    assert.equal(r.clubs, undefined);
  }
});

test("a file with no good records at all is rejected, and says why", () => {
  const r = readBagFile(JSON.stringify([{ ...DRIVER, type: "Putter" }, { ...HYBRID, fullCarry: 999 }]));
  assert.equal(r.clubs, undefined);
  assert.match(r.error, /None of the clubs/);
  assert.match(r.error, /1 with an unknown club type, 1 with a distance outside 1–400 m/);
});

test("importing replaces the whole bag", () => {
  const store = createStore(memoryStorage());
  store.addClub({ type: "9 Iron", fullCarry: 120 });
  store.addClub({ type: "Driver", fullCarry: 230 });
  store.replaceClubs(readBagFile(prototypeExport([HYBRID, WEDGE])).clubs);
  assert.deepEqual(store.loadClubs(), [HYBRID, WEDGE]);
});

test("export → import gives the same bag", () => {
  const phoneA = createStore(memoryStorage());
  phoneA.replaceClubs([DRIVER, WEDGE]);
  phoneA.addClub({ type: "Other", name: "Chipper", inBag: true, halfCarry: 22.5 });
  const file = bagFileText(phoneA.loadClubs());

  const phoneB = createStore(memoryStorage());
  phoneB.addClub({ type: "3 Wood", fullCarry: 200 });
  phoneB.replaceClubs(readBagFile(file).clubs);
  assert.deepEqual(phoneB.loadClubs(), phoneA.loadClubs());
});

test("the bag file is the prototype's format: a bare array, one record per line", () => {
  const text = bagFileText([DRIVER, HYBRID]);
  assert.equal(text, prototypeExport([DRIVER, HYBRID]));
  assert.ok(Array.isArray(JSON.parse(text)));
});

test("the last export date is remembered, and is never until the first export", () => {
  const storage = memoryStorage();
  assert.equal(createStore(storage).lastExport(), null);
  createStore(storage).setLastExport(1792044522721);
  assert.equal(createStore(storage).lastExport(), 1792044522721);
});

test("the file name carries the date, and the confirm counts the clubs", () => {
  assert.equal(bagFileName(new Date(2026, 9, 5)), "club-distances-bag-2026-10-05.json");
  assert.equal(confirmText(12, 9), "Replace your 12 clubs with 9 from the file?");
  assert.equal(confirmText(1, 9), "Replace your 1 club with 9 from the file?");
  assert.equal(confirmText(0, 9), "Load 9 clubs from the file?");
});
