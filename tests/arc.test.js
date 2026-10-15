// The ball-flight arc: which swings get an arc and a roll, and the scale they share.
import { test } from "node:test";
import assert from "node:assert/strict";
import { arc, arcSwings, arcScale } from "../js/icons.js";

const drawn = (c, scale = 300) => arcSwings(c, scale).map(({ k, roll }) => `${k}${roll ? "+roll" : ""}`);

test("full only: one arc, with the roll when a longer total is entered", () => {
  assert.deepEqual(drawn({ type: "7 Iron", fullCarry: 140 }), ["full"]);
  assert.deepEqual(drawn({ type: "7 Iron", fullCarry: 140, fullTotal: 150 }), ["full+roll"]);
});

test("full and ¾: an arc each, each with its own roll", () => {
  assert.deepEqual(drawn({ type: "7 Iron", fullCarry: 140, fullTotal: 150, tqCarry: 120 }), ["full+roll", "tq"]);
  assert.deepEqual(drawn({ type: "7 Iron", fullCarry: 140, tqCarry: 120, tqTotal: 128, halfCarry: 95, halfTotal: 101 }), ["full", "tq+roll", "half+roll"]);
});

test("a club with only ¾ numbers still draws its arc", () => {
  assert.deepEqual(drawn({ type: "Sand Wedge", tqCarry: 60, tqTotal: 64 }), ["tq+roll"]);
});

test("a swing with no carry draws nothing, even with a total", () => {
  assert.deepEqual(drawn({ type: "7 Iron", fullTotal: 150, tqCarry: 120 }), ["tq"]);
  assert.deepEqual(drawn({ type: "7 Iron" }), []);
});

test("a total no longer than the carry draws no roll", () => {
  assert.deepEqual(drawn({ type: "7 Iron", fullCarry: 140, fullTotal: 140 }), ["full"]);
});

test("¾ and ½ arcs peak lower than full", () => {
  const [full, tq, half] = arcSwings({ type: "7 Iron", fullCarry: 140, tqCarry: 120, halfCarry: 95 }, 300);
  assert.ok(full.peak > tq.peak && tq.peak > half.peak);
  assert.equal(tq.peak, full.peak * .75);
  assert.equal(half.peak, full.peak * .5);
});

test("the scale covers every carry and total on the card, not just full swings", () => {
  assert.equal(arcScale([{ fullCarry: 100 }, { tqTotal: 200 }]), 200 * 1.06);
  assert.equal(arcScale([{ halfCarry: 80 }]), 80 * 1.06);
  assert.equal(arcScale([]), 250);
});

test("arcs use the group colour and never amber", () => {
  const svg = arc({ type: "7 Iron", fullCarry: 140, fullTotal: 150, tqCarry: 120, halfCarry: 95 }, 300);
  assert.match(svg, /var\(--g-iron\)/);
  assert.doesNotMatch(svg, /amber/);
  assert.equal(svg.match(/<g class="arc-/g).length, 3);
});
