// The sample bag: a made-up, evenly spaced bag a new visitor can load to try the app.
// It's no one's real bag. Distances are in meters, like every stored bag (ADR 0004).
import { clubRecord, newId } from "./storage.js";

// [club type, name, full carry, full total, ¾ carry, ½ carry]
const ROWS = [
  ["Driver", "", 210, 230, null, null],
  ["3 Wood", "", 190, 205, null, null],
  ["4 Hybrid", "", 170, null, null, null],
  ["5 Iron", "", 155, null, null, null],
  ["6 Iron", "", 145, null, null, null],
  ["7 Iron", "", 135, null, null, null],
  ["8 Iron", "", 125, null, null, null],
  ["9 Iron", "", 115, null, null, null],
  ["Pitching Wedge", "", 105, null, 90, 70],
  ["Gap Wedge", "", 95, null, 80, 60],
  ["Sand Wedge", "", 85, null, 70, 50],
  ["Other", "Chipper", 40, null, null, null],
];

// The sample bag as club records, each with a fresh id.
export function sampleBag(now = Date.now()) {
  return ROWS.map(([type, name, fullCarry, fullTotal, tqCarry, halfCarry], i) => clubRecord({
    id: newId(), type, name, inBag: true, created: now + i,
    fullCarry, fullTotal, tqCarry, halfCarry,
  }));
}
