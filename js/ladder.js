// The ladder: a horizontal scale of the bag's carries, zoomed around the target when one is set.
import { GCOL, esc, codeOf, groupOf } from "./clubs.js";

// The ladder's range and tick spacing. With a target it shows target ± 32.
export function ladderRange(opts, t) {
  if (t) return { lo: t - 32, hi: t + 32, step: 10 };
  const vs = opts.map(o => o.v);
  const lo = Math.max(0, Math.floor((Math.min(...vs) - 10) / 10) * 10), hi = Math.ceil((Math.max(...vs) + 10) / 10) * 10;
  return { lo, hi, step: hi - lo > 120 ? 50 : hi - lo > 60 ? 20 : 10 };
}

// Labels closer together than 7.5% of the range merge into one. Expects options sorted by carry.
export function groupLabels(labelled, lo, hi) {
  const thr = (hi - lo) * 0.075, clusters = [];
  for (const o of labelled) {
    const last = clusters[clusters.length - 1];
    if (last && o.v - last[0].v <= thr) last.push(o); else clusters.push([o]);
  }
  return clusters;
}

export function ladder(opts, m, t) {
  if (!opts.length) return "";
  const { lo, hi, step } = ladderRange(opts, t);
  const items = opts.filter(o => o.v >= lo && o.v <= hi);
  const x = (v) => ((v - lo) / (hi - lo)) * 100;
  const clampX = (p) => Math.max(5, Math.min(95, p));
  const state = new Map(m.map((o, i) => [o.c.id + o.k, i ? "hit" : "best"]));
  let h = `<span class="l-axis"></span>`;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) h += `<span class="l-tick" style="left:${x(v)}%"></span><span class="l-num" style="left:${x(v)}%">${v}</span>`;

  // In overview, only full swings get labels; other swings are small dots.
  const labelled = items.filter(o => t || o.k === "full").sort((a, b) => a.v - b.v);
  if (!t) items.filter(o => o.k !== "full").forEach(o => { h += `<span class="l-dot sm" style="left:${x(o.v)}%;background:${GCOL[groupOf(o.c)]}"></span>`; });

  // With a target, labels sit below the axis so the pin flag stays clear.
  const SLOTS = t ? [{ up: false, top: 66 }, { up: false, top: 80 }]
                  : [{ up: true, top: 16 }, { up: false, top: 66 }, { up: true, top: 0 }, { up: false, top: 80 }];
  groupLabels(labelled, lo, hi).forEach((cl, n) => {
    const s = SLOTS[n % SLOTS.length];
    const mean = cl.reduce((a, o) => a + o.v, 0) / cl.length, X = x(mean), LX = clampX(X);
    const st = cl.some(o => state.get(o.c.id + o.k) === "best") ? "best" : cl.some(o => state.has(o.c.id + o.k)) ? "hit" : "";
    const lbl = cl.map(o => esc(codeOf(o.c)) + (o.k === "full" ? "" : o.l)).join(" · ");
    if (s.up) h += `<span class="l-stem" style="left:${X}%;top:${s.top + 14}px;height:${42 - s.top - 14}px"></span>`;
    else h += `<span class="l-stem" style="left:${X}%;top:51px;height:${s.top - 51}px"></span>`;
    cl.forEach(o => { h += `<span class="l-dot" style="left:${x(o.v)}%;background:${GCOL[groupOf(o.c)]}"></span>`; });
    h += `<span class="l-lab ${st}" style="left:${LX}%;top:${s.top}px">${lbl}</span>`;
  });
  if (t) h += `<span class="l-flag" style="left:${x(t)}%"></span>`;
  return `<div class="ladder-box"><div class="l-cap">${t ? `Around ${t} m` : "Your bag by carry"}</div><div class="ladder" aria-hidden="true">${h}</div></div>`;
}
