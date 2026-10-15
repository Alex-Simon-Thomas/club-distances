// The club detail's numbers: swing table, gaps in bag order, flight view geometry, mini ladder.
import { test } from "node:test";
import assert from "node:assert/strict";
import { swingRows, signed, gaps, flightAxis, flightSwings, miniLadder, LABEL_GAP } from "../js/detail.js";
import { options, matches } from "../js/clubs.js";

const club = (id, type, f = {}) => ({ id, type, name: "", inBag: true, created: 0, fullCarry: null, fullTotal: null, tqCarry: null, tqTotal: null, halfCarry: null, halfTotal: null, ...f });

test("swing table: a row per swing with any number, roll only when both carry and total are set", () => {
  const rows = swingRows(club("pw", "Pitching Wedge", { fullCarry: 110, fullTotal: 118, tqCarry: 92, halfTotal: 75 }));
  assert.deepEqual(rows.map(r => [r.k, r.carry, r.total, r.roll]), [["full", 110, 118, 8], ["tq", 92, null, null], ["half", null, 75, null]]);
});

test("swing table: % full for ¾ and ½, never on the full row or without a full carry", () => {
  const rows = swingRows(club("pw", "Pitching Wedge", { fullCarry: 110, tqCarry: 92, halfCarry: 70 }));
  assert.deepEqual(rows.map(r => r.pctFull), [null, 84, 64]);
  assert.deepEqual(swingRows(club("sw", "Sand Wedge", { tqCarry: 60, halfCarry: 40 })).map(r => r.pctFull), [null, null]);
});

test("swing table: To pin is carry minus target, only with a target and a carry", () => {
  const c = club("pw", "Pitching Wedge", { fullCarry: 110, tqCarry: 92, halfTotal: 75 });
  assert.deepEqual(swingRows(c, 95).map(r => r.toPin), [15, -3, null]);
  assert.deepEqual(swingRows(c).map(r => r.toPin), [null, null, null]);
  assert.deepEqual([15, -3, 0].map(signed), ["+15", "−3", "0"]);
});

test("swing table: suggestions are marked best and hit, like their cells on the card", () => {
  const pw = club("pw", "Pitching Wedge", { fullCarry: 110, tqCarry: 92, halfCarry: 70 });
  const gw = club("gw", "Gap Wedge", { fullCarry: 98 });
  const m = matches(options([pw, gw]), 93);
  assert.deepEqual(swingRows(pw, 93, m).map(r => r.mark), ["hit", "best", ""]);
  assert.deepEqual(swingRows(gw, 93, m).map(r => r.mark), ["hit"]);
});

test("a club with no numbers has no swing rows", () => {
  assert.deepEqual(swingRows(club("x", "7 Iron")), []);
});

const bag = [
  club("9i", "9 Iron", { fullCarry: 122 }),
  club("pw", "Pitching Wedge", { fullCarry: 110 }),
  club("gw", "Gap Wedge", { fullCarry: 98 }),
  club("6i", "6 Iron", { fullCarry: 140 }),
  club("7i", "7 Iron", { fullCarry: 144 }),
];

test("gaps: the full-carry gap to the clubs before and after, in bag order", () => {
  const { up, down } = gaps(bag, "pw");
  assert.deepEqual([up.c.id, up.carry, up.gap], ["9i", 122, 12]);
  assert.deepEqual([down.c.id, down.carry, down.gap], ["gw", 98, 12]);
});

test("gaps: an overlap is a plain negative number from either side (6i to 7i)", () => {
  assert.equal(gaps(bag, "6i").down.gap, -4);
  assert.equal(gaps(bag, "7i").up.gap, -4);
});

test("gaps: hidden on a side with no neighbour", () => {
  assert.equal(gaps(bag, "6i").up, null);
  assert.equal(gaps(bag, "gw").down, null);
});

test("gaps: hidden when either club has no full carry", () => {
  const b = [club("8i", "8 Iron", { tqCarry: 110 }), club("9i", "9 Iron", { fullCarry: 122 }), club("pw", "Pitching Wedge", { halfCarry: 60 })];
  assert.deepEqual(gaps(b, "9i"), { up: null, down: null });
  assert.deepEqual(gaps(b, "8i"), { up: null, down: null });
});

test("gaps: only clubs on the card count as neighbours", () => {
  const b = [club("8i", "8 Iron", { fullCarry: 133 }), club("9i", "9 Iron", { fullCarry: 122, inBag: false }), club("pw", "Pitching Wedge", { fullCarry: 110 })];
  assert.equal(gaps(b, "pw").up.c.id, "8i");
  assert.equal(gaps(b, "pw").up.gap, 23);
});

test("flight axis: from 0 past the longest carry or total, or the target when it's further", () => {
  const c = club("pw", "Pitching Wedge", { fullCarry: 110, fullTotal: 118, halfCarry: 70 });
  const a = flightAxis(c);
  assert.equal(a.ticks[0], 0);
  assert.ok(a.max >= 118 && a.max === a.ticks.at(-1));
  assert.ok(flightAxis(c, 160).max >= 160);
  assert.equal(flightAxis(c, 50).max, a.max);
  assert.ok(a.ticks.length <= 8);
  assert.equal(flightAxis(club("7i", "7 Iron", { fullCarry: 144, fullTotal: 150 })).max, 175);
  assert.equal(flightAxis(club("x", "7 Iron")), null);
});

test("flight swings: an arc per swing with a carry, the roll only when a longer total is entered", () => {
  const c = club("pw", "Pitching Wedge", { fullCarry: 110, fullTotal: 118, tqCarry: 92, tqTotal: 92, halfTotal: 75 });
  const s = flightSwings(c, flightAxis(c));
  assert.deepEqual(s.map(x => `${x.k}${x.roll ? "+roll" : ""}`), ["full+roll", "tq"]);
});

test("flight swings: labels that would touch go to the second line, so none overlap", () => {
  const c = club("pw", "Pitching Wedge", { fullCarry: 110, tqCarry: 104, halfCarry: 98 });
  const s = flightSwings(c, flightAxis(c));
  for (const line of [0, 1]) {
    const xs = s.filter(x => x.line === line).map(x => x.labelX).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= LABEL_GAP, `line ${line} overlaps`);
  }
  assert.ok(s.every(x => x.labelX >= LABEL_GAP / 2 && x.labelX <= 100 - LABEL_GAP / 2));
});

test("flight swings: labels far apart share the first line", () => {
  const c = club("pw", "Pitching Wedge", { fullCarry: 110, halfCarry: 40 });
  assert.deepEqual(flightSwings(c, flightAxis(c)).map(x => x.line), [0, 0]);
});

test("mini ladder: every option on the card, with this club's swings picked out", () => {
  const opts = options([club("pw", "Pitching Wedge", { fullCarry: 110, tqCarry: 92 }), club("dr", "Driver", { fullCarry: 230 })]);
  const pts = miniLadder(opts, "pw");
  assert.equal(pts.length, 3);
  assert.deepEqual(pts.filter(p => p.own).map(p => p.o.k), ["full", "tq"]);
  const x = Object.fromEntries(pts.map(p => [p.o.c.id + p.o.k, p.x]));
  assert.ok(x.pwtq < x.pwfull && x.pwfull < x.drfull, "short on the left, long on the right");
  assert.equal(miniLadder(opts, "nope"), null);
});
