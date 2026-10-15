// The ladder: its range, and labels closer than 7.5% of the range merging into one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ladderRange, groupLabels, ladder } from "../js/ladder.js";

const opt = (type, v, k = "full", l = "Full") => ({ c: { id: type + k, type }, k, l, v });

test("with no target, the range is the bag's carries ± 10, rounded to 10s", () => {
  assert.deepEqual(ladderRange([opt("Driver", 221), opt("Sand Wedge", 74)], null), { lo: 60, hi: 240, step: 50 });
  assert.deepEqual(ladderRange([opt("7 Iron", 136), opt("8 Iron", 128)], null), { lo: 110, hi: 150, step: 10 });
  assert.deepEqual(ladderRange([opt("7 Iron", 136), opt("9 Iron", 100)], null), { lo: 90, hi: 150, step: 10 });
  assert.deepEqual(ladderRange([opt("7 Iron", 136), opt("PW", 90)], null), { lo: 80, hi: 150, step: 20 });
});

test("with a target, the range is target ± 32 with ticks every 10", () => {
  assert.deepEqual(ladderRange([opt("7 Iron", 136)], 130), { lo: 98, hi: 162, step: 10 });
});

test("labels closer than 7.5% of the range merge; the rest stay apart", () => {
  // Range 64, so the threshold is 4.8.
  const opts = [opt("6i", 132), opt("8i", 134), opt("7i", 136), opt("9i", 141)];
  const groups = groupLabels(opts, 98, 162).map(g => g.map(o => o.c.type));
  assert.deepEqual(groups, [["6i", "8i", "7i"], ["9i"]]);
});

test("grouping is measured from the first label of a group", () => {
  // 100 → 104 merges (4 ≤ 4.8), 108 is 8 from the group's first label, so it starts a new group.
  const groups = groupLabels([opt("a", 100), opt("b", 104), opt("c", 108)], 98, 162).map(g => g.length);
  assert.deepEqual(groups, [2, 1]);
});

test("a merged label joins the club codes with a dot", () => {
  const html = ladder([opt("6 Iron", 132), opt("8 Iron", 134), opt("7 Iron", 136)], [], 130);
  assert.match(html, />6i · 8i · 7i</);
});

test("with no target, only full swings get labels", () => {
  const html = ladder([opt("Sand Wedge", 80), opt("Sand Wedge", 40, "half", "½")], [], null);
  assert.match(html, />SW</);
  assert.doesNotMatch(html, />SW½</);
  assert.match(html, /l-dot sm/);
});

test("a label holding the best match is solid amber", () => {
  const o = opt("7 Iron", 136);
  assert.match(ladder([o], [{ ...o, d: 6 }], 130), /l-lab best/);
});

test("no options, no ladder", () => {
  assert.equal(ladder([], [], 130), "");
});
