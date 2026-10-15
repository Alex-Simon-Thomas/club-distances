// The club detail's numbers: the swing table, gaps in bag order, the flight view's geometry
// and the mini ladder. Pure functions with no DOM, so tests can run them in Node.
// Every distance comes in already in the chosen units (the bag as shown, ADR 0004).
import { SWINGS, num, visible } from "./clubs.js";

// One row per swing with any number. Roll needs both carry and total; % full needs a full carry
// and is "—" on the full row; To pin needs a target. mark is "best", "hit" or "" from the suggestions.
export function swingRows(c, t = null, m = []) {
  const full = num(c.fullCarry);
  const marks = new Map(m.map((o, i) => [o.c.id + o.k, i ? "hit" : "best"]));
  return SWINGS.flatMap(([k, l]) => {
    const carry = num(c[k + "Carry"]), total = num(c[k + "Total"]);
    if (carry === null && total === null) return [];
    return [{
      k, l, carry, total,
      roll: carry !== null && total !== null ? total - carry : null,
      pctFull: k !== "full" && carry !== null && full !== null ? Math.round((carry / full) * 100) : null,
      toPin: t && carry !== null ? carry - t : null,
      mark: marks.get(c.id + k) || "",
    }];
  });
}

// A signed number with a real minus sign: +15, −3, 0.
export const signed = (n) => n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "0";

// The full-carry gap to the club before (longer) and after (shorter) this one in bag order,
// among the clubs on the card. Positive means the longer club flies further; negative is an overlap.
// A side is null when there's no neighbour or either club has no full carry.
export function gaps(clubs, id) {
  const list = visible(clubs), i = list.findIndex(c => c.id === id);
  if (i < 0) return { up: null, down: null };
  const own = num(list[i].fullCarry);
  const side = (other, gap) => {
    const v = other ? num(other.fullCarry) : null;
    return own === null || v === null ? null : { c: other, carry: v, gap: gap(v) };
  };
  return { up: side(list[i - 1], v => v - own), down: side(list[i + 1], v => own - v) };
}

// Each swing's arc on the flight view, peaking lower for ¾ and ½ (as on the card).
export const FLIGHT_SWING = { full: { h: 1, w: 2.6 }, tq: { h: .75, w: 2 }, half: { h: .5, w: 1.6 } };

// The axis runs from 0 to past the club's longest carry or total and the target, whichever is
// further, with round tick numbers. x() gives a distance's place on the axis as 0–100%.
export function flightAxis(c, t = null) {
  const far = Math.max(0, ...SWINGS.flatMap(([k]) => [num(c[k + "Carry"]) ?? 0, num(c[k + "Total"]) ?? 0]), num(t) ?? 0);
  if (!far) return null;
  const step = [10, 20, 25, 50, 100].find(s => Math.ceil(far * 1.05 / s) <= 7) || 100;
  const max = Math.ceil((far * 1.05) / step) * step;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return { max, step, ticks, x: (v) => (v / max) * 100 };
}

// The flight view's arcs and swing labels. Labels sit in a row under the axis numbers and move to
// a second line when they'd touch the label before them. When both lines are crowded, labels on a
// line slide apart (their tick slants to the landing point), so they never overlap.
export const LABEL_GAP = 22; // the width one label needs, as % of the axis
const LO = LABEL_GAP / 2, HI = 100 - LABEL_GAP / 2;
export function flightSwings(c, axis) {
  const swings = SWINGS.flatMap(([k, l]) => {
    const carry = num(c[k + "Carry"]), total = num(c[k + "Total"]);
    if (carry === null) return [];
    const x1 = axis.x(carry), x2 = total !== null ? Math.max(x1, axis.x(total)) : x1;
    return [{ k, l, carry, x1, x2, roll: x2 > x1, labelX: Math.max(LO, Math.min(HI, x1)) }];
  });
  const byX = [...swings].sort((a, b) => a.x1 - b.x1), last = [-Infinity, -Infinity];
  for (const s of byX) {
    s.line = s.labelX - last[0] >= LABEL_GAP ? 0 : s.labelX - last[1] >= LABEL_GAP ? 1 : (last[0] <= last[1] ? 0 : 1);
    last[s.line] = s.labelX;
  }
  for (const line of [0, 1]) {
    const on = byX.filter(s => s.line === line);
    for (let i = 1; i < on.length; i++) on[i].labelX = Math.max(on[i].labelX, on[i - 1].labelX + LABEL_GAP);
    for (let i = on.length - 1; i >= 0; i--) on[i].labelX = Math.min(on[i].labelX, i < on.length - 1 ? on[i + 1].labelX - LABEL_GAP : HI);
  }
  return swings;
}

// The mini ladder: every option on the card, with this club's own swings picked out.
// Short carries on the left, long on the right.
export function miniLadder(opts, id) {
  if (!opts.some(o => o.c.id === id)) return null;
  const vs = opts.map(o => o.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const x = (v) => 4 + ((v - lo) / span) * 92;
  return opts.map(o => ({ o, x: x(o.v), own: o.c.id === id }));
}
