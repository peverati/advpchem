// Experiment 7: what an integration grid looks like. Points are arranged on
// spherical shells around each atom: N_radial shells × N_angular points.
// The angular points are drawn as an even (Fibonacci) spread, a stand-in for
// the symmetric Lebedev arrangement real programs use.
import { h } from "./core.js";

const RADIAL = [50, 75, 99, 175];
const ANGULAR = [110, 194, 302, 590, 974];
const PRESETS = [
  { name: "SG-1", nr: 50, na: 194, note: "pruned from (50,194)" },
  { name: "SG-2", nr: 75, na: 302, note: "pruned from (75,302)" },
  { name: "SG-3", nr: 99, na: 590, note: "pruned from (99,590)" },
  { name: "(175,974)", nr: 175, na: 974, note: "a very fine, unpruned grid" },
];

function fibonacciSphere(n) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return pts;
}

// Becke-style radial mapping: shells crowd near the nucleus, spread far out.
function radii(nr, R = 1.2) {
  const out = [];
  for (let i = 1; i <= nr; i++) {
    const x = Math.cos((i * Math.PI) / (nr + 1));
    out.push((R * (1 + x)) / (1 - x));
  }
  return out.sort((a, b) => a - b);
}

export function render(el, { store }) {
  const st = Object.assign({ nr: 75, na: 302 }, store.state.extra.grid_explorer);
  const canvas = h("canvas", { class: "grid-canvas", width: 640, height: 400, role: "img", "aria-label": "Rotating cloud of integration-grid points around an argon atom" });
  const stats = h("div", { class: "grid-stats" });
  const selR = h("select", { class: "form-select form-select-sm", "aria-label": "radial shells" }, RADIAL.map((v) => h("option", { value: v, selected: v === st.nr }, `${v} radial shells`)));
  const selA = h("select", { class: "form-select form-select-sm", "aria-label": "angular points" }, ANGULAR.map((v) => h("option", { value: v, selected: v === st.na }, `${v} angular points`)));
  const presets = h("div", { class: "grid-presets" }, PRESETS.map((p) => h("button", {
    type: "button", class: "btn btn-outline-primary btn-sm", title: p.note,
    onclick: () => { selR.value = p.nr; selA.value = p.na; update(); },
  }, p.name)));
  let paused = false;
  const pauseBtn = h("button", { type: "button", class: "btn btn-outline-secondary btn-sm", onclick: () => { paused = !paused; pauseBtn.textContent = paused ? "▶ rotate" : "⏸ pause"; } }, "⏸ pause");

  let cloud = [];
  function update() {
    const nr = Number(selR.value), na = Number(selA.value);
    store.update((s) => (s.extra.grid_explorer = { nr, na }), { silent: true });
    const sphere = fibonacciSphere(na);
    // Show the shells inside 4 Å; thin out when there are many, to keep it readable.
    const shown = radii(nr).filter((r) => r < 4);
    const step = Math.max(1, Math.ceil(shown.length / 14));
    cloud = [];
    shown.forEach((r, i) => { if (i % step === 0) sphere.forEach(([x, y, z]) => cloud.push([x * r, y * r, z * r, r])); });
    const preset = PRESETS.find((p) => p.nr === nr && p.na === na);
    stats.replaceChildren(
      h("div", {}, h("span", { class: "big" }, (nr * na).toLocaleString()), " points per atom"),
      h("div", {}, h("span", { class: "big" }, (2 * nr * na).toLocaleString()), " points for Ar₂"),
      h("div", { class: "lab-small lab-muted" }, `(${nr},${na}) = ${nr} shells × ${na} points per shell.`,
        preset && preset.name.startsWith("SG") ? ` ${preset.name} is ${preset.note}: it uses fewer points close to the nucleus and far away, where the density is simple, so the real count is lower.` : ""),
      h("div", { class: "lab-small lab-muted" }, `Showing ${Math.ceil(shown.length / step)} of the ${shown.length} shells within 4 Å.`));
  }
  selR.onchange = update;
  selA.onchange = update;
  update();

  const ctx = canvas.getContext("2d");
  let angle = 0;
  function frame() {
    if (!canvas.isConnected) return;
    if (!paused) angle += 0.004;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const dark = document.body.classList.contains("quarto-dark");
    const ca = Math.cos(angle), sa = Math.sin(angle), tilt = 0.35, ct = Math.cos(tilt), stt = Math.sin(tilt);
    const scale = 52;
    for (const [x, y, z, r] of cloud) {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y2 = y * ct - z1 * stt, z2 = y * stt + z1 * ct;
      const persp = 6 / (6 + z2);
      const px = W / 2 + x1 * scale * persp, py = H / 2 + y2 * scale * persp;
      const shade = Math.max(0.12, Math.min(0.85, 0.5 - z2 / 9));
      const hue = 210 - Math.min(r, 4) * 35;
      ctx.fillStyle = `hsla(${hue}, 75%, ${dark ? 65 : 45}%, ${shade})`;
      ctx.fillRect(px, py, 1.6, 1.6);
    }
    ctx.fillStyle = dark ? "#ddd" : "#333";
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Ar", W / 2 + 9, H / 2 - 8);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Grid explorer"), h("span", { class: "lab-muted" }, " · where the xc integrand is sampled"), h("span", { class: "lab-spacer" }), pauseBtn),
    h("div", { class: "grid-controls" }, selR, selA, presets),
    h("div", { class: "grid-layout" }, canvas, stats),
    h("p", { class: "lab-small lab-muted" }, "Colours go from blue (inner shells) to green (outer shells). Angular points are drawn evenly spread, a stand-in for the symmetric Lebedev arrangement Q-Chem actually uses. The exchange–correlation energy is a weighted sum of the integrand over all these points, and every point moves with its atom: as the two argon atoms approach, the sampling of the density between them changes, and that is where the wiggles come from.")));
}
