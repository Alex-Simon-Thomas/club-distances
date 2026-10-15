// Units: the bag is stored in meters with one decimal and shown in the chosen units (ADR 0004).
import { test } from "node:test";
import assert from "node:assert/strict";
import { toShown, toStored, inUnits, storedField } from "../js/units.js";
import { options, baseDistance } from "../js/clubs.js";

test("a stored meter number shows as itself in meters and converts to yards", () => {
  assert.equal(toShown(150, "m"), 150);
  assert.equal(toShown(150, "yd"), 164);
  assert.equal(toShown(null, "yd"), null);
});

test("a typed number is stored in meters with one decimal", () => {
  assert.equal(toStored(164, "yd"), 150);
  assert.equal(toStored(165, "yd"), 150.9);
  assert.equal(toStored(150, "m"), 150);
  assert.equal(toStored(null, "yd"), null);
});

test("every whole number of yards 1–400 survives yards → meters → yards", () => {
  for (let y = 1; y <= 400; y++) assert.equal(toShown(toStored(y, "yd"), "yd"), y, `${y} yd`);
});

test("every whole number of meters 1–400 survives meters → yards → meters", () => {
  for (let m = 1; m <= 400; m++) {
    const stored = toStored(m, "m");
    assert.equal(toShown(stored, "yd"), Math.round(m / 0.9144));
    assert.equal(toShown(stored, "m"), m, `${m} m`);
  }
});

test("switching units back and forth never changes the stored bag", () => {
  const bag = [{ id: "a", type: "7 Iron", fullCarry: 150.9, fullTotal: 160, tqCarry: null, tqTotal: null, halfCarry: 70.4, halfTotal: null }];
  const before = JSON.stringify(bag);
  for (let i = 0; i < 10; i++) { inUnits(bag, "yd"); inUnits(bag, "m"); }
  assert.equal(JSON.stringify(bag), before);
  assert.deepEqual(inUnits(bag, "yd")[0].fullCarry, 165);
  assert.deepEqual(inUnits(bag, "m")[0].fullCarry, 151);
});

test("saving a club in yards keeps numbers the golfer didn't change", () => {
  // 150 m shows as 164 yd; saving 164 yd unchanged keeps 150, not 150.0 rounded from yards.
  assert.equal(storedField(164, 150, "yd"), 150);
  assert.equal(storedField(165, 150, "yd"), 150.9);
  assert.equal(storedField(null, 150, "yd"), null);
  assert.equal(storedField(120, undefined, "yd"), 109.7);
});

test("matching and mid-bag rounding work in the chosen units", () => {
  const club = (id, fullCarry) => ({ id, type: "7 Iron", inBag: true, fullCarry, fullTotal: null, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null });
  const bag = [club("a", 100), club("b", 137.2), club("c", 160)];
  assert.deepEqual(options(inUnits(bag, "yd")).map(o => o.v).sort((a, b) => a - b), [109, 150, 175]);
  assert.equal(baseDistance(inUnits(bag, "yd")), 150);
  assert.equal(baseDistance(inUnits(bag, "m")), 135);
});
