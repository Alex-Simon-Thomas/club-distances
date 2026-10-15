// Everything saved in this phone's browser: the bag, the settings and the last target.
// The bag never leaves the phone (ADR 0001). Club records keep the prototype's shape (handoff 5.1).
import { FIELDS } from "./clubs.js";

export const TARGET_TTL = 5 * 60 * 60 * 1000; // a distance is kept for one round (5 hours)
const CLUBS_KEY = "bag-clubs";

// A random 20-character id, in the style of the prototype's ids.
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, b => (b % 36).toString(36)).join("");
}

// The prototype's record shape, in its field order.
export function clubRecord(c) {
  const r = { id: c.id, type: c.type, name: c.name ?? "", inBag: c.inBag !== false, created: c.created };
  for (const f of FIELDS) r[f] = c[f] ?? null;
  return r;
}

export function createStore(storage = globalThis.localStorage) {
  const get = (k) => { try { return storage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { storage.setItem(k, v); } catch {} };

  function loadClubs() {
    try { const list = JSON.parse(get(CLUBS_KEY) || "[]"); return Array.isArray(list) ? list : []; } catch { return []; }
  }
  // Saving the bag throws when the browser refuses, so the editor can say so.
  const saveClubs = (list) => storage.setItem(CLUBS_KEY, JSON.stringify(list.map(clubRecord)));

  return {
    loadClubs,
    addClub(data, now = Date.now()) {
      const club = clubRecord({ ...data, id: newId(), created: now });
      saveClubs([...loadClubs(), club]);
      return club;
    },
    updateClub(id, data) {
      saveClubs(loadClubs().map(c => c.id === id ? clubRecord({ ...c, ...data, id }) : c));
    },
    // Returns the deleted club, so Undo can put the same record back.
    deleteClub(id) {
      const list = loadClubs(), club = list.find(c => c.id === id);
      saveClubs(list.filter(c => c.id !== id));
      return club;
    },
    restoreClub(club) {
      saveClubs([...loadClubs().filter(c => c.id !== club.id), club]);
    },
    // Import bag: the file's clubs replace the whole bag.
    replaceClubs(list) { saveClubs(list); },

    // When Export bag last ran, or null if never.
    lastExport() { const v = Number(get("bag-last-export")); return v > 0 ? v : null; },
    setLastExport(now = Date.now()) { set("bag-last-export", String(now)); },

    // Settings: "1" on, "0" off; unset falls back to the default.
    pref(k, dflt) { const v = get("bag-" + k); return v === null || v === "" ? dflt : v === "1"; },
    setPref(k, v) { set("bag-" + k, v ? "1" : "0"); },

    // The target is remembered for 5 hours, then forgotten.
    loadTarget(now = Date.now()) {
      try { const s = JSON.parse(get("bag-target") || "null"); return s && s.v > 0 && now - s.at < TARGET_TTL ? s.v : null; } catch { return null; }
    },
    saveTarget(v, now = Date.now()) { set("bag-target", v ? JSON.stringify({ v, at: now }) : ""); },
  };
}
