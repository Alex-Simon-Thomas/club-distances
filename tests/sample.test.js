// The sample bag: valid as a bag file, covering every group, and marked as a sample until cleared or edited.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleBag } from "../js/sample.js";
import { readBagFile, bagFileText } from "../js/bagfile.js";
import { createStore } from "../js/storage.js";
import { groupOf, num } from "../js/clubs.js";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) };
}

test("the sample bag passes Import bag's rules with nothing skipped", () => {
  const bag = sampleBag();
  const read = readBagFile(bagFileText(bag));
  assert.equal(read.error, undefined);
  assert.equal(read.clubs.length, bag.length);
  assert.deepEqual(read.skipped, { type: 0, distance: 0 });
  assert.deepEqual(read.clubs, bag);
});

test("the sample bag has about 12 clubs and covers every group", () => {
  const bag = sampleBag();
  assert.equal(bag.length, 12);
  assert.deepEqual(new Set(bag.map(groupOf)), new Set(["wood", "hybrid", "iron", "wedge", "other"]));
});

test("the wedges have ¾ and ½ swings, the woods have totals", () => {
  for (const c of sampleBag()) {
    const g = groupOf(c);
    if (g === "wedge") assert.ok(num(c.tqCarry) && num(c.halfCarry), c.type);
    if (g === "wood") assert.ok(num(c.fullTotal) > num(c.fullCarry), c.type);
  }
});

test("full carries step down evenly, longest club first", () => {
  const carries = sampleBag().map(c => c.fullCarry);
  const gaps = carries.slice(1).map((v, i) => carries[i] - v);
  assert.ok(gaps.every(g => g > 0));
  assert.ok(gaps.slice(3, 10).every(g => g === 10), "irons and wedges are 10 m apart");
});

test("every sample club gets its own id", () => {
  const ids = sampleBag().map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a loaded sample bag is marked as a sample, also after a reload", () => {
  const storage = memoryStorage();
  createStore(storage).loadSample(sampleBag());
  const store = createStore(storage);
  assert.equal(store.loadClubs().length, 12);
  assert.equal(store.isSample(), true);
});

test("Clear empties the bag and the sample mark goes", () => {
  const store = createStore(memoryStorage());
  store.loadSample(sampleBag());
  store.replaceClubs([]);
  assert.deepEqual(store.loadClubs(), []);
  assert.equal(store.isSample(), false);
});

test("editing, adding or deleting any club ends the sample", () => {
  for (const edit of [
    (s) => { const [c] = s.loadClubs(); s.updateClub(c.id, { ...c, fullCarry: 212 }); },
    (s) => s.addClub({ type: "Lob Wedge", fullCarry: 70 }),
    (s) => s.deleteClub(s.loadClubs()[0].id),
  ]) {
    const store = createStore(memoryStorage());
    store.loadSample(sampleBag());
    edit(store);
    assert.equal(store.isSample(), false);
  }
});

test("importing a bag file over the sample bag ends the sample", () => {
  const store = createStore(memoryStorage());
  store.loadSample(sampleBag());
  store.replaceClubs(readBagFile(bagFileText(sampleBag().slice(0, 3))).clubs);
  assert.equal(store.isSample(), false);
});

test("a bag that was never the sample isn't marked as one", () => {
  const store = createStore(memoryStorage());
  assert.equal(store.isSample(), false);
  store.addClub({ type: "7 Iron", fullCarry: 136 });
  assert.equal(store.isSample(), false);
});
