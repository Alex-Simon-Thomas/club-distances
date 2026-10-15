// The card, edit mode, the club editor and Settings. Ported from the prototype (artifact v7),
// with the bag saved in this phone's browser instead of window.claude.
import { TYPES, SWINGS, FIELDS, num, esc, codeOf, sorted, visible, activeSwings, options, matches, baseDistance, nextType } from "./js/clubs.js";
import { ladder } from "./js/ladder.js";
import { clubIcon, tag, who, whoTag, arc } from "./js/icons.js";
import { createStore } from "./js/storage.js";
import { readBagFile, bagFileText, bagFileName, skippedText, skippedCount, confirmText, plural } from "./js/bagfile.js";
import { UNITS, toShown, toStored, inUnits, storedField } from "./js/units.js";
import { sampleBag } from "./js/sample.js";
import { INSTALL_HINT, isInstalled, showInstallHint } from "./js/install.js";

const store = createStore();
let clubs = store.loadClubs(), mode = "card", lastBest = "";
const $ = (id) => document.getElementById(id);

let statusTimer;
function setStatus(t, sticky) { clearTimeout(statusTimer); $("status").textContent = t; if (t && !sticky) statusTimer = setTimeout(() => { $("status").textContent = ""; }, 2500); }

const mark = (c) => prefs.icons ? clubIcon(c) : tag(c);
const label = (c) => prefs.icons ? who(c) : whoTag(c);
// The bag stays in meters; everything on screen is in the chosen units (ADR 0004).
const unit = () => prefs.yards ? "yd" : "m";
const shownBag = () => inUnits(clubs, unit());
// The target as shown, in the chosen units. Like the bag, it's kept in meters (targetM),
// so switching units back and forth gives back the same number.
let targetM = null;
function target() { const t = Math.round(Number($("target").value)); return t > 0 ? t : null; }

/* ---------- Finder ---------- */
function renderChips(m, t) {
  $("clearBtn").hidden = !t;
  const box = $("chips");
  if (!t || mode === "manage") { box.innerHTML = ""; return; }
  if (!m.length) { box.innerHTML = `<div class="hint">Add carry distances to see which club fits.</div>`; return; }
  const bestKey = m[0].c.id + m[0].k;
  box.innerHTML = m.map((o, i) => {
    const d = o.d === 0 ? "exact" : (o.d > 0 ? "+" : "−") + Math.abs(o.d);
    return `<div class="chip${i ? "" : " best"}${!i && bestKey !== lastBest ? " pulse" : ""}">
      <div class="cl">${esc(codeOf(o.c))} ${o.l}</div>
      <div class="mv"><b>${o.v} ${unit()}</b><span>${d}</span></div>
      <div class="br">${esc(o.c.name || o.c.type)}</div></div>`;
  }).join("");
  lastBest = bestKey;
}

/* ---------- Views ---------- */
function renderCard() {
  const view = $("view"), t = target(), opts = options(shownBag()), m = matches(opts, t, prefs.tieShorter ? "shorter" : "longer");
  renderChips(m, t);
  const vis = visible(shownBag()), hiddenCount = clubs.length - vis.length;
  if (!vis.length) {
    view.innerHTML = `<div class="empty"><strong>${clubs.length ? "No clubs to show" : "Bag is empty"}</strong>${clubs.length
      ? "Clubs show here once they're in the bag and have at least one distance."
      : "Add your first club and its Map My Bag carry to get started."}</div><button class="add" data-add>+ Add club</button>${clubs.length ? "" : `
      <div class="first-acts"><button class="bag-btn" data-import>Import a bag file</button><button class="bag-btn" data-sample>Try a sample bag</button></div>`}`;
    return;
  }
  const sw = activeSwings(vis);
  const scale = Math.max(...vis.map(c => Math.max(num(c.fullTotal) ?? 0, num(c.fullCarry) ?? 0))) * 1.06 || 250;
  const hit = new Map(m.map((o, i) => [o.c.id + o.k, i ? "hit" : "hit best"]));
  const rows = vis.map(c => {
    const cells = sw.map(([k]) => {
      const cv = num(c[k + "Carry"]), tv = num(c[k + "Total"]);
      if (cv === null && tv === null) return `<div class="cell e"><div class="c">·</div></div>`;
      return `<div class="cell ${hit.get(c.id + k) || ""}"><div class="c">${cv ?? "–"}</div>${tv !== null ? `<div class="t">${tv} tot</div>` : ""}</div>`;
    }).join("");
    return `<div class="row${prefs.arc ? " has-arc" : ""}"><div class="nm">${mark(c)}${label(c)}</div>${cells}${prefs.arc ? arc(c, scale) : ""}</div>`;
  }).join("");
  view.style.setProperty("--n", sw.length);
  view.innerHTML = `${ladder(opts, m, t, unit())}
    <div class="cols"><span>Club</span>${sw.map(([, l]) => `<span>${l}</span>`).join("")}</div>${rows}
    <div class="foot">Carry in ${UNITS[unit()].many}, total below it. Columns appear once a club has a distance for that swing.${hiddenCount ? ` ${hiddenCount} club${hiddenCount > 1 ? "s" : ""} not shown (out of the bag or no distances).` : ""} <button data-manage>Edit clubs</button></div>`;
}

function renderManage() {
  const view = $("view"), list = sorted(shownBag());
  view.innerHTML = `<div class="l-cap" style="margin:14px 0 4px">All clubs · tap one to edit</div>` +
    (list.length ? list.map(c => {
      const fc = num(c.fullCarry);
      return `<div class="mrow${c.inBag === false ? " out" : ""}" role="button" tabindex="0" data-open="${esc(c.id)}">
        ${mark(c)}
        <div class="info">${label(c)}</div>
        ${c.inBag === false ? `<span class="tag">Out of bag</span>` : ""}
        <div class="meta">${fc !== null ? fc + " " + unit() : "no distances"}</div><span class="chev" aria-hidden="true">›</span></div>`;
    }).join("") : `<div class="empty"><strong>Bag is empty</strong>Add your first club below.</div>`) +
    `<button class="add" data-add>+ Add club</button>`;
}

/* ---------- Banners: the sample bag strip and the install hint ---------- */
function renderBanners() {
  const sample = store.isSample() ? `<div class="strip"><b>Sample bag</b><span aria-hidden="true">·</span><button data-clear-sample>Clear</button></div>` : "";
  const hint = showInstallHint({ installed: isInstalled(), dismissed: store.pref("installHintDismissed", false) })
    ? `<div class="install" role="note"><p><b>${INSTALL_HINT.lead}</b> ${INSTALL_HINT.text}</p><button class="x" data-hint-close aria-label="Dismiss install hint">×</button></div>` : "";
  $("banners").innerHTML = sample + hint;
}
function loadSampleBag() {
  try { changeBag(() => store.loadSample(sampleBag())); setStatus("Sample bag loaded"); } catch { setStatus("Couldn't save on this phone.", true); }
}
function clearSampleBag() {
  try { changeBag(() => store.replaceClubs([])); setStatus("Sample bag cleared"); } catch { setStatus("Couldn't clear the bag.", true); }
}

function render() {
  renderBanners();
  $("finder").hidden = mode === "manage";
  mode === "manage" ? (renderChips([], null), renderManage()) : renderCard();
}

function setMode(m) {
  mode = m;
  $("manageBtn").textContent = m === "manage" ? "Done" : "Edit";
  $("manageBtn").classList.toggle("on", m === "manage");
  render();
  window.scrollTo(0, 0);
}

// Every change to the bag goes through here: save on the phone, then redraw.
function changeBag(fn) {
  fn();
  clubs = store.loadClubs();
  render();
}

/* ---------- Sheet ---------- */
let sheetFor = null, lastFocus = null;
function openSheet(id) {
  const c = id ? shownBag().find(x => x.id === id) : { type: nextType(clubs), name: "", inBag: true };
  if (!c) return;
  sheetFor = id || null; lastFocus = document.activeElement;
  const opts = TYPES.map(([t]) => `<option${t === c.type ? " selected" : ""}>${t}</option>`).join("");
  const grid = SWINGS.map(([k, l]) => `<div class="rl">${l}</div>` + ["Carry", "Total"].map(s =>
    `<input type="number" inputmode="numeric" min="0" max="400" id="f-${k}${s}" aria-label="${l} ${s.toLowerCase()} in ${UNITS[unit()].many}" placeholder="add" value="${num(c[k + s]) ?? ""}">`).join("")).join("");
  $("sheetRoot").innerHTML = `<div class="dim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-title"><div class="sheet-in">
      <div class="grab"></div>
      <div class="sh-h"><div><div class="k" id="sh-title">${id ? esc(c.type) : "New club"}</div><div class="b">${id ? esc(c.name || "No name") : "Enter what you know. Empty boxes stay hidden on the card."}</div></div>
        <button class="x" data-close aria-label="Close">×</button></div>
      <div class="fld">
        <label><small>Type</small><select id="f-type">${opts}</select></label>
        <label><small>Name or brand</small><input id="f-name" type="text" maxlength="40" placeholder="e.g. Ping" value="${esc(c.name)}"></label>
      </div>
      <div class="g3"><span></span><span class="h">Carry</span><span class="h">Total</span>${grid}</div>
      <div class="sh-f">
        <label class="sw"><input type="checkbox" id="f-inBag"${c.inBag !== false ? " checked" : ""}><i></i>In bag today</label>
        <div class="acts">${id ? `<button class="del" id="delBtn">Delete</button>` : ""}<button class="save" id="saveBtn">Save</button></div>
      </div>
      <div class="err" id="sheetErr" aria-live="polite"></div>
    </div></div>`;
  $("f-type").focus();
  $("saveBtn").addEventListener("click", saveSheet);
  if (id) $("delBtn").addEventListener("click", deleteClub);
}
function closeSheet() { $("sheetRoot").innerHTML = ""; sheetFor = null; if (lastFocus && lastFocus.focus && lastFocus.isConnected) lastFocus.focus(); }

function saveSheet() {
  const data = { type: $("f-type").value, name: $("f-name").value.trim(), inBag: $("f-inBag").checked };
  const before = clubs.find(x => x.id === sheetFor) || {};
  for (const f of FIELDS) {
    const raw = $("f-" + f).value, n = Math.round(Number(raw));
    data[f] = storedField(raw === "" || !(n > 0) ? null : Math.min(n, 400), before[f], unit());
  }
  $("sheetErr").textContent = "";
  try {
    changeBag(() => sheetFor ? store.updateClub(sheetFor, data) : store.addClub(data));
    setStatus("Saved"); closeSheet();
  } catch {
    $("sheetErr").textContent = "Couldn't save on this phone. Check the browser's storage settings and try again.";
  }
}

let toastTimer;
function toast(msg, actionLabel, action) {
  clearTimeout(toastTimer);
  $("toastRoot").innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${actionLabel ? `<button id="toastAct">${actionLabel}</button>` : ""}</div>`;
  if (actionLabel) $("toastAct").addEventListener("click", () => { $("toastRoot").innerHTML = ""; action(); });
  toastTimer = setTimeout(() => { $("toastRoot").innerHTML = ""; }, 7000);
}

function deleteClub() {
  const c = clubs.find(x => x.id === sheetFor);
  if (!c) return;
  try {
    changeBag(() => store.deleteClub(c.id));
    closeSheet();
    toast(`${c.type}${c.name ? " · " + c.name : ""} deleted`, "Undo", () => {
      try { changeBag(() => store.restoreClub(c)); setStatus("Restored"); } catch { setStatus("Couldn't restore the club.", true); }
    });
  } catch { $("sheetErr").textContent = "Couldn't delete. Try again."; }
}

/* ---------- Events ---------- */
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-close]")) return closeSheet();
  if (t.closest("[data-add]")) return openSheet(null);
  if (t.closest("[data-manage]")) return setMode("manage");
  if (t.closest("[data-sample]")) return loadSampleBag();
  if (t.closest("[data-clear-sample]")) return clearSampleBag();
  if (t.closest("[data-hint-close]")) { store.setPref("installHintDismissed", true); return renderBanners(); }
  // Import a bag file uses Settings' Import bag, so the confirm and messages are the same.
  if (t.closest("[data-import]")) { openSettings(); return $("importFile").click(); }
  const o = t.closest("[data-open]"); if (o) return openSheet(o.dataset.open);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("sheetRoot").innerHTML) closeSheet();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-open]")) { e.preventDefault(); openSheet(e.target.dataset.open); }
});
$("manageBtn").addEventListener("click", () => setMode(mode === "manage" ? "card" : "manage"));
// Another tab of the app changed the bag: show the same bag here.
window.addEventListener("storage", (e) => { if (e.key === null || e.key === "bag-clubs") { clubs = store.loadClubs(); render(); } });

/* ---------- Settings (saved on this phone) ---------- */
function applySun(on) { if (on) document.documentElement.dataset.sun = "1"; else delete document.documentElement.dataset.sun; }
function setPref(k, v) {
  prefs[k] = v; store.setPref(k, v);
  if (k === "sun") applySun(v);
  if (k === "yards") applyUnits();
  render(); syncSettings();
}
function syncSettings() {
  if (!$("set-icons")) return;
  $("seg-dark").setAttribute("aria-pressed", prefs.sun ? "false" : "true");
  $("seg-sun").setAttribute("aria-pressed", prefs.sun ? "true" : "false");
  $("seg-m").setAttribute("aria-pressed", prefs.yards ? "false" : "true");
  $("seg-yd").setAttribute("aria-pressed", prefs.yards ? "true" : "false");
  $("seg-longer").setAttribute("aria-pressed", prefs.tieShorter ? "false" : "true");
  $("seg-shorter").setAttribute("aria-pressed", prefs.tieShorter ? "true" : "false");
  $("set-icons").checked = prefs.icons; $("set-arc").checked = prefs.arc;
}
function openSettings() {
  lastFocus = document.activeElement; sheetFor = null;
  $("sheetRoot").innerHTML = `<div class="dim" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="set-title"><div class="sheet-in">
      <div class="grab"></div>
      <div class="sh-h"><div class="k" id="set-title">Settings</div><button class="x" data-close aria-label="Close">×</button></div>
      <div class="set"><div class="l"><b>Screen</b><span>Sun is high contrast for bright daylight</span></div>
        <div class="seg" role="group" aria-label="Screen"><button id="seg-dark">Dark</button><button id="seg-sun">Sun</button></div></div>
      <div class="set"><div class="l"><b>Units</b><span>Your bag is shown and typed in these</span></div>
        <div class="seg" role="group" aria-label="Units"><button id="seg-m">Meters</button><button id="seg-yd">Yards</button></div></div>
      <div class="set"><div class="l"><b>On a tie</b><span>Which club comes first when two are equally close</span></div>
        <div class="seg" role="group" aria-label="On a tie"><button id="seg-longer">Longer</button><button id="seg-shorter">Shorter</button></div></div>
      <div class="set"><div class="l"><b>Club icons</b><span>Off shows coloured club tiles instead</span></div>
        <label class="sw"><input type="checkbox" id="set-icons" aria-label="Club icons"><i></i></label></div>
      <div class="set"><div class="l"><b>Ball-flight arc</b><span>A line under each club: carry, then dotted roll to total</span></div>
        <label class="sw"><input type="checkbox" id="set-arc" aria-label="Ball-flight arc"><i></i></label></div>
      ${bagSection()}
      <div class="saved-note">Settings are saved on this phone.</div>
    </div></div>`;
  syncSettings();
  $("seg-dark").addEventListener("click", () => setPref("sun", false));
  $("seg-sun").addEventListener("click", () => setPref("sun", true));
  $("seg-m").addEventListener("click", () => setPref("yards", false));
  $("seg-yd").addEventListener("click", () => setPref("yards", true));
  $("seg-longer").addEventListener("click", () => setPref("tieShorter", false));
  $("seg-shorter").addEventListener("click", () => setPref("tieShorter", true));
  $("set-icons").addEventListener("change", (e) => setPref("icons", e.target.checked));
  $("set-arc").addEventListener("change", (e) => setPref("arc", e.target.checked));
  wireBagSection();
  $("seg-dark").focus();
}
$("settingsBtn").addEventListener("click", openSettings);
const prefs = { sun: store.pref("sun", false), yards: store.pref("yards", false), tieShorter: store.pref("tieShorter", false),
  icons: store.pref("icons", true), arc: store.pref("arc", false) };
applySun(prefs.sun);

/* ---------- Your bag: Export bag and Import bag (ADR 0001) ---------- */
const lastExportText = () => {
  const at = store.lastExport();
  return "Last exported: " + (at ? new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "never");
};
function bagSection() {
  return `<div class="bag"><div class="l"><b>Your bag</b><span>Saved only on this phone. Export a copy to back it up or move it.</span></div>
    <div class="bag-acts" id="bagActs"><button class="bag-btn" id="exportBtn">Export bag</button><button class="bag-btn" id="importBtn">Import bag</button></div>
    <input type="file" id="importFile" accept=".json,application/json" hidden>
    <div class="bag-last" id="lastExport">${lastExportText()}</div>
    <div class="bag-msg" id="bagMsg" aria-live="polite"></div></div>`;
}
function bagMsg(text, isErr) { $("bagMsg").textContent = text; $("bagMsg").classList.toggle("err", !!isErr); }
function exportBag() {
  const url = URL.createObjectURL(new Blob([bagFileText(clubs)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: bagFileName() });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  store.setLastExport();
  $("lastExport").textContent = lastExportText();
  bagMsg(`Exported ${plural(clubs.length, "club")}.`);
}
// Asks before the file's clubs replace the bag. Cancel leaves the bag as it is.
function confirmImport({ clubs: incoming, skipped }) {
  const acts = $("bagActs"), keep = acts.innerHTML;
  acts.className = "bag-confirm";
  acts.innerHTML = `<p>${esc(confirmText(clubs.length, incoming.length))}</p>
    <div class="acts"><button class="bag-cancel" id="importCancel">Cancel</button><button class="save" id="importOk">${clubs.length ? "Replace" : "Load"}</button></div>`;
  const restore = () => { acts.className = "bag-acts"; acts.innerHTML = keep; wireBagButtons(); $("importBtn").focus(); };
  $("importCancel").addEventListener("click", () => { restore(); bagMsg("Import cancelled. Your bag is unchanged."); });
  $("importOk").addEventListener("click", () => {
    try { changeBag(() => store.replaceClubs(incoming)); } catch { restore(); return bagMsg("Couldn't save on this phone. Your bag is unchanged.", true); }
    restore();
    const n = skippedCount(skipped);
    bagMsg(`Imported ${plural(incoming.length, "club")}.` + (n ? ` ${n} skipped: ${skippedText(skipped)}.` : ""));
    setStatus("Bag imported");
  });
  $("importOk").focus();
}
async function importBag(file) {
  bagMsg("");
  const read = readBagFile(await file.text());
  if (read.error) return bagMsg(read.error, true);
  confirmImport(read);
}
function wireBagButtons() {
  $("exportBtn").addEventListener("click", exportBag);
  $("importBtn").addEventListener("click", () => $("importFile").click());
}
function wireBagSection() {
  wireBagButtons();
  $("importFile").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) importBag(f); });
}
// Asks the browser to keep the bag when it clears site data. It may say no; the app works either way.
if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});

// The distance bar's unit labels, and the target redrawn in the new units.
function applyUnits() {
  const u = UNITS[unit()];
  $("tgt-unit").textContent = u.short;
  $("target").setAttribute("aria-label", "Distance to pin in " + u.many);
  document.querySelectorAll("[data-step]").forEach(b => {
    const n = Number(b.dataset.step);
    b.setAttribute("aria-label", `${n < 0 ? "Minus" : "Plus"} ${Math.abs(n)} ${Math.abs(n) === 1 ? u.one : u.many}`);
  });
  $("target").value = toShown(targetM, unit()) ?? "";
}

function setTarget(v) {
  $("target").value = v ? v : "";
  targetM = toStored(v, unit());
  store.saveTarget(targetM);
  renderCard();
}
document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
  const t = target();
  setTarget(t ? Math.max(1, Math.min(400, t + Number(b.dataset.step))) : baseDistance(shownBag()));
}));
$("target").addEventListener("input", () => setTarget(target()));
$("target").addEventListener("blur", () => { if ($("target").value) $("target").value = target() ?? ""; });
$("clearBtn").addEventListener("click", () => setTarget(null));
try { new ResizeObserver(() => document.documentElement.style.setProperty("--dock-h", $("finder").offsetHeight + "px")).observe($("finder")); } catch {}
targetM = store.loadTarget();
applyUnits();

render();

// Registers the service worker so the app opens with no signal.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.error("Service worker failed to register", err));
}
