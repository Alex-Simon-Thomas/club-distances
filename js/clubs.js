// The bag's clubs: club types, which clubs are on the card, and matching a target to options.
// Pure functions with no DOM, so tests can run them in Node.

export const TYPES = [
  ["Driver","Dr","wood"],["3 Wood","3W","wood"],["4 Wood","4W","wood"],["5 Wood","5W","wood"],["7 Wood","7W","wood"],["9 Wood","9W","wood"],
  ["2 Hybrid","2H","hybrid"],["3 Hybrid","3H","hybrid"],["4 Hybrid","4H","hybrid"],["5 Hybrid","5H","hybrid"],["6 Hybrid","6H","hybrid"],
  ["2 Iron","2i","iron"],["3 Iron","3i","iron"],["4 Iron","4i","iron"],["5 Iron","5i","iron"],["6 Iron","6i","iron"],["7 Iron","7i","iron"],["8 Iron","8i","iron"],["9 Iron","9i","iron"],
  ["Pitching Wedge","PW","wedge"],["Gap Wedge","GW","wedge"],["Sand Wedge","SW","wedge"],["Lob Wedge","LW","wedge"],["Other","··","other"]
];
const ORDER = Object.fromEntries(TYPES.map(([t], i) => [t, i]));
const CODE = Object.fromEntries(TYPES.map(([t, c]) => [t, c]));
const GROUP = Object.fromEntries(TYPES.map(([t, , g]) => [t, g]));
export const GCOL = { wood: "var(--g-wood)", hybrid: "var(--g-hybrid)", iron: "var(--g-iron)", wedge: "var(--g-wedge)", other: "var(--g-other)" };
export const SWINGS = [["full","Full"],["tq","¾"],["half","½"]];
export const FIELDS = SWINGS.flatMap(([k]) => [k + "Carry", k + "Total"]);

export const num = (v) => (typeof v === "number" && isFinite(v) && v > 0) ? v : null;
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const codeOf = (c) => CODE[c.type] || "··";
export const groupOf = (c) => GROUP[c.type] || "other";

export function sorted(list) {
  return [...list].sort((a, b) => (ORDER[a.type] ?? 99) - (ORDER[b.type] ?? 99) || (num(b.fullCarry) ?? 0) - (num(a.fullCarry) ?? 0) || (a.created ?? 0) - (b.created ?? 0));
}
export const hasNumbers = (c) => FIELDS.some(f => num(c[f]) !== null);
// The clubs on the card: in the bag today, with at least one number.
export const visible = (clubs) => sorted(clubs).filter(c => c.inBag !== false && hasNumbers(c));
export const activeSwings = (vis) => SWINGS.filter(([k]) => vis.some(c => num(c[k + "Carry"]) !== null || num(c[k + "Total"]) !== null));

// Every club and swing with a carry, from the clubs on the card.
export function options(clubs) {
  const out = [];
  for (const c of visible(clubs)) for (const [k, l] of SWINGS) { const v = num(c[k + "Carry"]); if (v !== null) out.push({ c, k, l, v }); }
  return out;
}
// The 3 suggestions closest to the target by carry. On a tie, the longer option comes first,
// or the shorter one when the tie setting is "shorter".
export function matches(opts, t, tie = "longer") {
  if (!t) return [];
  const dir = tie === "shorter" ? 1 : -1;
  return opts.map(o => ({ ...o, d: o.v - t })).sort((a, b) => Math.abs(a.d) - Math.abs(b.d) || dir * (a.d - b.d)).slice(0, 3);
}
// Mid-bag carry: the median full carry, rounded to 5. The first ± step starts here.
export function baseDistance(clubs) {
  const v = visible(clubs).map(c => num(c.fullCarry)).filter(x => x !== null).sort((a, b) => a - b);
  return v.length ? Math.round(v[Math.floor(v.length / 2)] / 5) * 5 : 100;
}
// A new club defaults to the first standard type not yet in the bag.
export function nextType(clubs) {
  const have = new Set(clubs.map(c => c.type));
  const t = TYPES.find(([n]) => n !== "Other" && !have.has(n));
  return t ? t[0] : "Other";
}
