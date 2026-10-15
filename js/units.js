// Units: the bag is stored in meters with one decimal, and shown and typed in the chosen units (ADR 0004).
// Pure functions with no DOM, so tests can run them in Node.
import { FIELDS, num } from "./clubs.js";

export const M_PER_YD = 0.9144;
export const UNITS = { m: { short: "m", one: "meter", many: "meters" }, yd: { short: "yd", one: "yard", many: "yards" } };

// A stored distance (meters) as a whole number in the chosen units.
export function toShown(meters, unit) {
  const m = num(meters);
  if (m === null) return null;
  return Math.round(unit === "yd" ? m / M_PER_YD : m);
}

// A typed distance in the chosen units, as meters with one decimal.
// One decimal is fine enough that toShown gives back the same whole number.
export function toStored(shown, unit) {
  const v = num(shown);
  if (v === null) return null;
  return Math.round((unit === "yd" ? v * M_PER_YD : v) * 10) / 10;
}

// The bag with every distance in the chosen units, for the card, ladder and matching.
export function inUnits(clubs, unit) {
  return clubs.map(c => {
    const out = { ...c };
    for (const f of FIELDS) out[f] = toShown(c[f], unit);
    return out;
  });
}

// What the editor saves for one field. A number the golfer left as it was keeps its stored value,
// so opening and saving a club in yards doesn't nudge a number that was typed in meters.
export function storedField(typed, before, unit) {
  if (typed === null) return null;
  return typed === toShown(before, unit) ? before : toStored(typed, unit);
}
