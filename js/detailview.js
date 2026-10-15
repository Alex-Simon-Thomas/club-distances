// The club detail sheet (ADR 0006): a list of sections, each returning "" when it has nothing to show,
// so later details slot in as new sections. The numbers come from detail.js.
import { GCOL, esc, codeOf, groupOf } from "./clubs.js";
import { clubIcon, tag } from "./icons.js";
import { swingRows, signed, gaps, flightAxis, flightSwings, FLIGHT_SWING, miniLadder } from "./detail.js";

// Arcs peak higher for shorter, more lofted clubs, as on the card (px, full swing).
const PEAK = { wood: 62, hybrid: 72, iron: 82, wedge: 96, other: 76 };
const PLOT = 112; // height of the arcs' area, px

// ctx: { c (the club, in the chosen units), clubs (the bag as shown), opts, m (suggestions), t, unit, icons }
function header({ c, icons }) {
  return `<div class="sh-h dt-h">
    <div class="dt-who">${icons ? clubIcon(c) : tag(c)}<div><div class="k" id="dt-title">${esc(c.type)}</div>
      <div class="b">${esc(c.name || codeOf(c))} · in bag today</div></div></div>
    <div class="dt-acts"><button class="pill" data-detail-edit="${esc(c.id)}">Edit</button><button class="x" data-close aria-label="Close">×</button></div></div>`;
}

function flight({ c, t, unit }) {
  const axis = flightAxis(c, t), swings = axis ? flightSwings(c, axis) : [];
  if (!swings.length) return "";
  const col = GCOL[groupOf(c)], peak = PEAK[groupOf(c)];
  // The arcs live in a stretched SVG (non-scaling strokes); dots, numbers and labels are HTML, so they stay round and crisp.
  const paths = [...swings].reverse().map(s => {
    const p = peak * FLIGHT_SWING[s.k].h, w = FLIGHT_SWING[s.k].w;
    return `<g class="arc-${s.k}"><path d="M0 ${PLOT}Q${(s.x1 * .55).toFixed(2)} ${(PLOT - 2 * p).toFixed(1)} ${s.x1.toFixed(2)} ${PLOT}" fill="none" style="stroke:${col}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>
      ${s.roll ? `<line x1="${s.x1.toFixed(2)}" y1="${PLOT}" x2="${s.x2.toFixed(2)}" y2="${PLOT}" style="stroke:${col}" stroke-width="${w + .6}" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>` : ""}</g>`;
  }).join("");
  const ticks = swings.map(s => `<line class="arc-${s.k}" x1="${s.x1.toFixed(2)}" y1="0" x2="${s.labelX.toFixed(2)}" y2="${s.line ? 42 : 22}" style="stroke:${col}" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join("");
  const dots = swings.map(s => `<span class="fv-dot arc-${s.k}" style="left:${s.x2}%;background:${col}"></span>`).join("");
  const nums = axis.ticks.map(v => `<span class="fv-num" style="left:${axis.x(v)}%">${v}</span>`).join("");
  const labels = swings.map(s => `<span class="fv-lab${s.line ? " l2" : ""}" style="left:${s.labelX}%;color:${col}">${s.l} ${s.carry}</span>`).join("");
  const pin = t ? `<span class="fv-pill" style="left:${Math.max(8, Math.min(92, axis.x(t)))}%">${t}</span><span class="fv-flag" style="left:${axis.x(t)}%"></span>` : "";
  const said = swings.map(s => `${s.l} ${s.carry}`).join(", ");
  return `<section class="dt-sec"><div class="l-cap">Flight · carry in ${unit}</div>
    <div class="fv${t ? " has-pin" : ""}" role="img" aria-label="Ball flight: ${said}${t ? `; target ${t}` : ""}">
      ${pin}<svg class="fv-arcs" viewBox="0 0 100 ${PLOT}" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>
      <span class="fv-axis"></span>${dots}<div class="fv-nums" aria-hidden="true">${nums}</div>
      <div class="fv-labs" aria-hidden="true"><svg class="fv-ticks" viewBox="0 0 100 42" preserveAspectRatio="none">${ticks}</svg>${labels}</div>
    </div></section>`;
}

// Laid out as grid rows, so a marked swing is one rounded strip; the roles keep it a table for screen readers.
function table({ c, t, m, unit }) {
  const rows = swingRows(c, t, m);
  if (!rows.length) return "";
  const v = (n) => n ?? "–";
  const head = ["Carry", "Total", "Roll", "% full", ...(t ? ["To pin"] : [])];
  const body = rows.map(r => `<tr role="row" class="${r.mark ? "hit " + r.mark : ""}"><th role="rowheader" scope="row">${r.l}</th><td role="cell">${v(r.carry)}</td><td role="cell">${v(r.total)}</td><td role="cell">${v(r.roll)}</td>
    <td role="cell">${r.pctFull !== null ? r.pctFull + "%" : "—"}</td>${t ? `<td role="cell">${r.toPin !== null ? signed(r.toPin) : "–"}</td>` : ""}</tr>`).join("");
  return `<section class="dt-sec"><div class="l-cap">Swings · ${unit}</div><table class="dt-tab" role="table" style="--cols:${head.length}">
    <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Swing</th>${head.map(h => `<th role="columnheader" scope="col">${h}</th>`).join("")}</tr></thead>
    <tbody role="rowgroup">${body}</tbody></table></section>`;
}

function gapSection({ c, clubs }) {
  const { up, down } = gaps(clubs, c.id);
  if (!up && !down) return "";
  const line = (arrow, g, aria) => g ? `<div class="dt-gap"><span aria-hidden="true">${arrow}</span> <b>${esc(codeOf(g.c))}</b> ${g.carry} <span class="dt-sep" aria-hidden="true">·</span> <b>${signed(g.gap).replace(/^\+/, "")}</b><span class="vh"> ${aria}</span></div>` : "";
  return `<section class="dt-sec"><div class="l-cap">Gaps · full carry</div>
    ${line("↑", up, "gap to the next longer club")}${line("↓", down, "gap to the next shorter club")}</section>`;
}

function inBag({ c, opts }) {
  const pts = miniLadder(opts, c.id);
  if (!pts) return "";
  const dots = [...pts].sort((a, b) => a.own - b.own).map(p =>
    `<span class="ml-dot${p.own ? " own" : ""}${p.own && p.o.k === "full" ? " full" : ""}" style="left:${p.x}%;background:${GCOL[groupOf(p.o.c)]}"></span>`).join("");
  return `<section class="dt-sec"><div class="l-cap">In the bag</div>
    <div class="ml" aria-hidden="true"><span class="ml-axis"></span>${dots}</div>
    <div class="ml-ends" aria-hidden="true"><span>short</span><span>long</span></div></section>`;
}

export const SECTIONS = [header, flight, table, gapSection, inBag];
export const detailHTML = (ctx) => SECTIONS.map(s => s(ctx)).join("");
