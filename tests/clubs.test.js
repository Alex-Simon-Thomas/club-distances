// Matching: the 3 options closest to the target by carry, from the clubs on the card only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { options, matches, visible, baseDistance, nextType, activeSwings, sorted } from "../js/clubs.js";

let n = 0;
const club = (type, fields = {}, extra = {}) => ({
  id: "c" + ++n, type, name: "", inBag: true, created: n,
  fullCarry: null, fullTotal: null, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null,
  ...fields, ...extra,
});
const label = (o) => `${o.c.type} ${o.k} ${o.v}`;

test("suggests the 3 closest options by carry, best first", () => {
  const bag = [
    club("7 Iron", { fullCarry: 136, tqCarry: 120 }),
    club("8 Iron", { fullCarry: 128 }),
    club("9 Iron", { fullCarry: 118 }),
    club("Pitching Wedge", { fullCarry: 105, halfCarry: 70 }),
  ];
  assert.deepEqual(matches(options(bag), 125).map(label), ["8 Iron full 128", "7 Iron tq 120", "9 Iron full 118"]);
});

test("the distance from the target is signed: positive when the option is longer", () => {
  const [best] = matches(options([club("7 Iron", { fullCarry: 136 })]), 130);
  assert.equal(best.d, 6);
});

test("on a tie, the longer option comes first", () => {
  const bag = [club("8 Iron", { fullCarry: 125 }), club("7 Iron", { fullCarry: 135 })];
  assert.deepEqual(matches(options(bag), 130).map(label), ["7 Iron full 135", "8 Iron full 125"]);
});

test("on a tie with the tie setting Longer, the longer option comes first", () => {
  const bag = [club("8 Iron", { fullCarry: 125 }), club("7 Iron", { fullCarry: 135 })];
  assert.deepEqual(matches(options(bag), 130, "longer").map(label), ["7 Iron full 135", "8 Iron full 125"]);
});

test("on a tie with the tie setting Shorter, the shorter option comes first", () => {
  const bag = [club("7 Iron", { fullCarry: 135 }), club("8 Iron", { fullCarry: 125 })];
  assert.deepEqual(matches(options(bag), 130, "shorter").map(label), ["8 Iron full 125", "7 Iron full 135"]);
});

test("the tie setting only breaks ties: a closer option still wins", () => {
  const bag = [club("7 Iron", { fullCarry: 133 }), club("8 Iron", { fullCarry: 125 })];
  assert.deepEqual(matches(options(bag), 130, "shorter").map(label), ["7 Iron full 133", "8 Iron full 125"]);
});

test("only clubs on the card are matched: out of the bag is left out", () => {
  const bag = [club("7 Iron", { fullCarry: 130 }, { inBag: false }), club("8 Iron", { fullCarry: 120 })];
  assert.deepEqual(matches(options(bag), 130).map(label), ["8 Iron full 120"]);
});

test("a swing with only a total is not an option; matching uses carry only", () => {
  assert.deepEqual(options([club("Driver", { fullTotal: 240 })]), []);
});

test("no target, no suggestions", () => {
  assert.deepEqual(matches(options([club("7 Iron", { fullCarry: 130 })]), null), []);
});

test("the card shows clubs in the bag with a number, in bag order, longest first within a type", () => {
  const bag = [
    club("7 Iron", { fullCarry: 130 }),
    club("Driver", { fullCarry: 210 }),
    club("Driver", { fullCarry: 225 }),
    club("Sand Wedge"),
    club("5 Iron", { fullCarry: 150 }, { inBag: false }),
  ];
  assert.deepEqual(visible(bag).map(c => `${c.type} ${c.fullCarry}`), ["Driver 225", "Driver 210", "7 Iron 130"]);
});

test("unknown types sort after Other", () => {
  assert.deepEqual(sorted([club("Putter"), club("Other"), club("Driver")]).map(c => c.type), ["Driver", "Other", "Putter"]);
});

test("a swing column shows only when a club on the card has a value for it", () => {
  const vis = visible([club("Sand Wedge", { fullCarry: 80, halfTotal: 40 })]);
  assert.deepEqual(activeSwings(vis).map(([k]) => k), ["full", "half"]);
});

test("mid-bag carry is the median full carry rounded to 5", () => {
  const bag = [221, 175, 148, 132, 136, 134, 120, 108, 90].map((v, i) => club(i % 2 ? "7 Iron" : "8 Iron", { fullCarry: v }));
  assert.equal(baseDistance(bag), 135);
  assert.equal(baseDistance([]), 100);
});

test("a new club gets the first standard type not yet in the bag", () => {
  assert.equal(nextType([]), "Driver");
  assert.equal(nextType([club("Driver"), club("3 Wood")]), "4 Wood");
});
