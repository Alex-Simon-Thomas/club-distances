// Club pictures: metal-render icons, the coloured tile shown with icons off, and the ball-flight arc.
import { GCOL, esc, num, codeOf, groupOf } from "./clubs.js";

/* Metal-render club icons: one drawing per family, face-on, shaded. Group colour shows as the ferrule. */
const KIND = (c) => c.type === "Driver" ? "driver" : /Wood$/.test(c.type) ? "fairway" : ({ hybrid: "hybrid", iron: "iron", wedge: "wedge" })[groupOf(c)] || "ball";
const SH = [-0.383, -0.924];
const SHAPES = {
  driver: { head: "M12 39C10.5 33 11.5 26 17 23.5C24 20.5 36 20.5 41.5 25.5C45 29 45 36 42 39.5C40.5 41.3 38 42 35 42L16 42C14 42 12.5 41 12 39Z",
            face: "M15.4 38.2C14.8 34 16.2 30.6 20.4 29.6C27.4 28 35.8 28.4 39.8 31.6C41.9 33.4 41.7 37.4 39.5 39C36.6 40.2 24 40.2 18.4 40C16.9 39.9 15.7 39.2 15.4 38.2Z",
            gloss: "M19 25.6C25 23.4 33.6 23.4 38.6 26.4", hosel: [15.8, 24.2], graphite: true },
  fairway: { head: "M13 39.4C11.8 35 13 30 18 28C24.6 25.6 35.4 25.8 40.4 29.6C43.4 32 43.4 37 40.8 39.8C39.4 41.4 37.2 42 34.4 42L16.6 42C14.8 42 13.4 41 13 39.4Z",
             face: "M16 38.8C15.6 35.6 16.8 33.2 20.6 32.4C27 31 34.6 31.4 38.2 33.8C40 35.2 39.8 38.4 38 39.6C35.4 40.5 24.2 40.5 19 40.4C17.4 40.3 16.3 39.8 16 38.8Z",
             gloss: "M19.6 29.6C25.6 27.8 33.2 27.8 37.8 30.2", hosel: [16.6, 28.6], graphite: true },
  hybrid: { head: "M14.5 39.5C13.5 34.5 14.8 29.5 19.5 27.6C25.5 25.3 34.5 25.6 38.6 29.6C41.4 32.4 41.2 37.2 38.8 39.8C37.6 41.4 35.6 42 33 42L18 42C16.2 42 14.9 41 14.5 39.5Z",
            face: "M17.4 38.6C17 35.6 18.2 33.2 21.4 32.4C26.4 31.3 32.8 31.5 36.1 33.8C37.9 35.2 37.7 38.2 36.1 39.3C33.6 40.2 24.6 40.2 20.4 40.1C18.9 40 17.7 39.5 17.4 38.6Z",
            gloss: "M20.4 29.2C25.4 27.4 32.2 27.6 36.2 29.8", hosel: [17.8, 28], graphite: true },
  iron:   { head: "M14.5 42L15.3 34.5C15.6 31.6 17 30 19.6 29.6L36 26.6C40.6 25.9 43.4 28.4 43.4 32.4V37.6C43.4 40.2 41.6 42 39 42Z",
            grooves: ["M19.6 33.6L39.4 30.6", "M19.7 36L39.5 33.4", "M19.8 38.4L39.6 36.2"], toe: "M37 27.4C40.6 27 42.6 29 42.6 32", hosel: [16.8, 30.6] },
  wedge:  { head: "M14.5 42L15.3 34C15.6 31 17 29.2 19.6 28.4L35 22.6C40.4 20.8 43.6 23.6 43.6 28.4V37.6C43.6 40.2 41.8 42 39.2 42Z",
            grooves: ["M19.6 31.6L39.6 25.8", "M19.7 34.2L39.8 29", "M19.8 36.8L40 32.2", "M19.9 39.3L40.1 35.4"], toe: "M36.4 23.4C40.6 22 42.8 24.6 42.8 28", hosel: [16.8, 29.8] },
};
let UID = 0;
const shadowGrad = (id) => `<radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--shadow)"/><stop offset="1" style="stop-color:var(--shadow);stop-opacity:0"/></radialGradient>`;
export function clubIcon(c) {
  const kind = KIND(c), id = "ci" + (++UID);
  if (kind === "ball") {
    const dimples = [[23,19],[31,19],[27,24.5],[20.5,26],[33.5,26],[27,30],[23,33],[31,33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="#9aa5b1" opacity=".55"/>`).join("");
    return `<svg class="clubicon" viewBox="5 3 42 42" fill="none" aria-hidden="true"><defs><radialGradient id="${id}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ec"/><stop offset="1" stop-color="#a9b3bc"/></radialGradient>${shadowGrad(id)}</defs>
      <ellipse cx="27" cy="40.6" rx="11" ry="2" fill="url(#${id}g)"/><circle cx="27" cy="26" r="12" fill="url(#${id})"/>${dimples}</svg>`;
  }
  const d = SHAPES[kind], [x, y] = d.hosel, sx = x + SH[0] * ((y - 1) / -SH[1]);
  const fA = [x + SH[0] * 2, y + SH[1] * 2], fB = [x + SH[0] * 8.5, y + SH[1] * 8.5];
  const defs = `<defs>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f5a66"/><stop offset=".3" stop-color="#1b2229"/><stop offset="1" stop-color="#05070a"/></linearGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#f4f7f9"/><stop offset=".45" stop-color="#a7b2bd"/><stop offset=".75" stop-color="#7c8792"/><stop offset="1" stop-color="#c7cfd6"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#d0d7de"/><stop offset=".55" stop-color="#7d8894"/><stop offset=".78" stop-color="#e2e7ec"/><stop offset="1" stop-color="#97a1ab"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#dfe4e9"/><stop offset=".55" stop-color="#a0aab4"/><stop offset="1" stop-color="#6c7682"/></linearGradient>
    ${shadowGrad(id)}</defs>`;
  const shaft = d.graphite
    ? `<path d="M${x} ${y}L${sx.toFixed(1)} 1" stroke="#2a3038" stroke-width="2.4" stroke-linecap="round"/><path d="M${(x - .5).toFixed(1)} ${y}L${(sx - .5).toFixed(1)} 1" stroke="#7a8590" stroke-width=".6" stroke-linecap="round" opacity=".8"/>`
    : `<path d="M${x} ${y}L${sx.toFixed(1)} 1" stroke="#9aa5b1" stroke-width="2.1" stroke-linecap="round"/><path d="M${(x - .5).toFixed(1)} ${y}L${(sx - .5).toFixed(1)} 1" stroke="#f1f4f7" stroke-width=".7" stroke-linecap="round"/>`;
  const ferrule = `<path d="M${fA[0].toFixed(1)} ${fA[1].toFixed(1)}L${fB[0].toFixed(1)} ${fB[1].toFixed(1)}" style="stroke:${GCOL[groupOf(c)]}" stroke-width="3.6" stroke-linecap="round"/>`;
  const head = d.face
    ? `<path d="${d.head}" fill="url(#${id}c)" stroke="#8d99a6" stroke-opacity=".55" stroke-width=".8"/>
       <path d="${d.gloss}" stroke="#fff" stroke-opacity=".38" stroke-width="1.3" stroke-linecap="round"/>
       <path d="${d.face}" fill="url(#${id}t)"/><path d="${d.face}" stroke="#fff" stroke-opacity=".45" stroke-width=".55"/>`
    : `<path d="${d.head}" fill="url(#${id}${kind === "iron" ? "r" : "s"})" stroke="#2f3740" stroke-opacity=".9" stroke-width=".8"/>` +
      d.grooves.map(l => `<path d="${l}" stroke="#2a323b" stroke-width="1.1" stroke-linecap="round" opacity=".75"/>`).join("") +
      `<path d="${d.toe}" stroke="#fff" stroke-opacity=".7" stroke-width=".9" stroke-linecap="round"/>`;
  return `<svg class="clubicon" viewBox="5 3 42 42" fill="none" aria-hidden="true">${defs}<ellipse cx="29" cy="42.6" rx="16" ry="2.2" fill="url(#${id}g)"/>${shaft}${ferrule}${head}</svg>`;
}
export function tag(c) { return `<span class="tag-c" style="--g:${GCOL[groupOf(c)]}" aria-hidden="true">${esc(codeOf(c))}</span>`; }
// The label next to an icon: the club code, with the name and type below.
export function who(c) { return `<div class="who"><div class="code">${esc(codeOf(c))}</div><div class="nm2">${c.name ? esc(c.name) + " · " : ""}${esc(c.type)}</div></div>`; }
// The label next to a tile: the name on top, the type below.
export function whoTag(c) { return `<div class="who"><div class="nm1">${esc(c.name || c.type)}</div>${c.name ? `<div class="nm2">${esc(c.type)}</div>` : ""}</div>`; }

const ARC_H = { wood: 8, hybrid: 11, iron: 14, wedge: 19, other: 12 };
export function arc(c, scale) {
  const carry = num(c.fullCarry), total = num(c.fullTotal), g = groupOf(c), col = GCOL[g];
  const base = `<line x1="0" y1="20" x2="300" y2="20" style="stroke:var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  if (carry === null && total === null) return `<svg class="arc" viewBox="0 0 300 22" preserveAspectRatio="none" aria-hidden="true">${base}</svg>`;
  const sx = (v) => Math.min(298, (v / scale) * 300), x1 = sx(carry ?? total), x2 = total ? sx(total) : x1;
  return `<svg class="arc" viewBox="0 0 300 22" preserveAspectRatio="none" aria-hidden="true">${base}
    ${carry !== null ? `<path d="M2 20Q${(x1 * .55).toFixed(1)} ${20 - ARC_H[g] * 2} ${x1.toFixed(1)} 20" fill="none" style="stroke:${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>` : ""}
    ${x2 > x1 ? `<line x1="${x1.toFixed(1)}" y1="20" x2="${x2.toFixed(1)}" y2="20" style="stroke:${col}" stroke-width="2" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>` : ""}
    <circle cx="${x2.toFixed(1)}" cy="20" r="2.2" style="fill:${col}"/></svg>`;
}
