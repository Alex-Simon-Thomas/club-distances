// Bag files: Export bag writes one, Import bag reads one (ADR 0001).
// A bag file is a bare array of club records in the prototype's shape (handoff 5.1), in meters,
// so the prototype's clubs-export.json imports as it is. Pure functions, so tests run them in Node.
import { TYPES, FIELDS } from "./clubs.js";
import { clubRecord, newId } from "./storage.js";

const KNOWN = new Set(TYPES.map(([t]) => t));
export const MIN = 1, MAX = 400; // meters

const isDistance = (v) => v === null || v === undefined || (typeof v === "number" && isFinite(v) && v >= MIN && v <= MAX);
const isRecord = (r) => r !== null && typeof r === "object" && !Array.isArray(r) && typeof r.type === "string";

// Why a record was skipped, in the words the app shows.
export const REASONS = { type: "an unknown club type", distance: "a distance outside 1–400 m" };

// Reads a bag file's text. Returns { clubs, skipped } with skipped counted per reason,
// or { error } when the whole file is rejected, so the bag stays as it is.
export function readBagFile(text, now = Date.now()) {
  let data;
  try { data = JSON.parse(text); } catch { return { error: "This file isn't a bag file. Choose a .json file made by Export bag." }; }
  if (!Array.isArray(data) || !data.length || !data.every(isRecord)) {
    return { error: "This file doesn't hold club records. Choose a .json file made by Export bag." };
  }
  const clubs = [], skipped = { type: 0, distance: 0 }, ids = new Set();
  for (const r of data) {
    if (!KNOWN.has(r.type)) { skipped.type++; continue; }
    if (!FIELDS.every(f => isDistance(r[f]))) { skipped.distance++; continue; }
    const id = typeof r.id === "string" && r.id && !ids.has(r.id) ? r.id : newId();
    ids.add(id);
    clubs.push(clubRecord({
      ...r, id,
      name: typeof r.name === "string" ? r.name.slice(0, 40) : "",
      inBag: r.inBag !== false,
      created: typeof r.created === "number" && isFinite(r.created) ? r.created : now,
    }));
  }
  if (!clubs.length) return { error: `None of the clubs in this file could be read (${skippedText(skipped)}). Your bag is unchanged.` };
  return { clubs, skipped };
}

// "1 with an unknown club type, 2 with a distance outside 1–400 m", or "" when none were skipped.
export function skippedText(skipped) {
  return Object.entries(skipped).filter(([, n]) => n).map(([k, n]) => `${n} with ${REASONS[k]}`).join(", ");
}
export const skippedCount = (skipped) => Object.values(skipped).reduce((a, n) => a + n, 0);

// The bag as a file: one club record per line, like the prototype's export.
export function bagFileText(clubs) {
  return "[\n" + clubs.map(c => "  " + JSON.stringify(clubRecord(c))).join(",\n") + "\n]\n";
}

export function bagFileName(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `club-distances-bag-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
// With an empty bag there's nothing to replace, so the confirm says so.
export const confirmText = (have, incoming) => have
  ? `Replace your ${plural(have, "club")} with ${incoming} from the file?`
  : `Load ${plural(incoming, "club")} from the file?`;
