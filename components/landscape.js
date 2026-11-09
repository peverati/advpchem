// Experiment 8: a toy model of SCF (in)stability.
// E(θ) = Δ sin²θ − c sin²2θ, where θ mixes two orbitals and Δ plays the role
// of the gap between two low-lying states. At θ = 0 the gradient is zero, so
// an SCF can converge there. The curvature E''(0) = 2Δ − 8c decides whether it
// is a minimum (stable) or a maximum (unstable, lower solution at cos2θ* = Δ/4c).
import { h } from "./core.js";

const C = 1;
const E = (t, d) => d * Math.sin(t) ** 2 - C * Math.sin(2 * t) ** 2;

export function render(el, { store }) {
  const st = Object.assign({ gap: 2.0 }, store.state.extra.landscape);
  const W = 640, H = 300, pad = 40;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "landscape-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Energy as a function of the orbital-mixing angle");
  const slider = h("input", { type: "range", min: "0.5", max: "8", step: "0.1", value: st.gap, class: "form-range", "aria-label": "gap between the two low-lying states" });
  const gapOut = h("span", { class: "strong" });
  const msg = h("div", { class: "landscape-msg", "aria-live": "polite" });
  const runBtn = h("button", { type: "button", class: "btn btn-warning btn-sm" }, "Run stability analysis");
  const resetBtn = h("button", { type: "button", class: "btn btn-outline-secondary btn-sm" }, "Reset to the SCF solution");
  let ballT = 0, anim = null;

  const xs = (t) => pad + ((t + Math.PI / 2) / Math.PI) * (W - 2 * pad);
  function yRange(d) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 200; i++) { const t = -Math.PI / 2 + (i / 200) * Math.PI; const e = E(t, d); lo = Math.min(lo, e); hi = Math.max(hi, e); }
    return [lo - 0.3, hi + 0.3];
  }
  function draw() {
    const d = Number(slider.value);
    const [lo, hi] = yRange(d);
    const ys = (e) => H - pad - ((e - lo) / (hi - lo)) * (H - 2 * pad);
    let path = "";
    for (let i = 0; i <= 200; i++) { const t = -Math.PI / 2 + (i / 200) * Math.PI; path += `${i ? "L" : "M"}${xs(t).toFixed(1)},${ys(E(t, d)).toFixed(1)}`; }
    const curv = 2 * d - 8 * C;
    svg.innerHTML = `
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" class="ax"/>
      <line x1="${xs(0)}" y1="${pad - 10}" x2="${xs(0)}" y2="${H - pad}" class="ax dashed"/>
      <text x="${W / 2}" y="${H - 8}" class="lbl" text-anchor="middle">orbital-mixing angle θ</text>
      <text x="14" y="${H / 2}" class="lbl" transform="rotate(-90 14 ${H / 2})" text-anchor="middle">energy</text>
      <text x="${xs(0) + 6}" y="${pad - 14}" class="lbl">θ = 0: where the SCF converged</text>
      <path d="${path}" class="curve"/>
      <circle cx="${xs(ballT).toFixed(1)}" cy="${(ys(E(ballT, d)) - 9).toFixed(1)}" r="9" class="ball"/>`;
    gapOut.textContent = d.toFixed(1);
    return curv;
  }
  function setMsg(kind, text) { msg.className = "landscape-msg " + kind; msg.innerHTML = text; }
  function reset() {
    cancelAnimationFrame(anim);
    ballT = 0;
    draw();
    setMsg("", "The SCF has converged at θ = 0: the gradient there is zero. But is it a minimum? Press <strong>Run stability analysis</strong>.");
  }
  slider.oninput = () => { store.update((s) => (s.extra.landscape = { gap: Number(slider.value) }), { silent: true }); reset(); };
  resetBtn.onclick = reset;
  runBtn.onclick = () => {
    cancelAnimationFrame(anim);
    ballT = 0;
    const d = Number(slider.value);
    const curv = draw();
    if (curv >= 0) {
      setMsg("ok", `Curvature at θ = 0: <strong>+${curv.toFixed(1)}</strong> (all Hessian eigenvalues positive). <strong>Stable:</strong> the SCF solution is a true minimum. Nothing to fix.`);
      return;
    }
    const target = Math.acos(Math.min(1, d / (4 * C))) / 2;
    const dE = E(target, d) - E(0, d);
    setMsg("bad", `Curvature at θ = 0: <strong>${curv.toFixed(1)}</strong>, a negative eigenvalue. <strong>Unstable:</strong> the SCF converged on a saddle point/maximum. Following the unstable direction downhill…`);
    const t0 = performance.now();
    const step = (now) => {
      const f = Math.min(1, (now - t0) / 1400);
      ballT = target * (1 - Math.cos(Math.PI * f)) / 2;
      draw();
      if (f < 1) anim = requestAnimationFrame(step);
      else setMsg("bad", `Re-optimized at θ = ${(target * 180 / Math.PI).toFixed(0)}°. The energy went <strong>down by ${(-dE).toFixed(2)}</strong> units. Without stability analysis you would have reported the higher, wrong energy.`);
    };
    anim = requestAnimationFrame(step);
  };

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Stability landscape"), h("span", { class: "lab-muted" }, " · a toy model")),
    h("p", { class: "lab-small" }, "θ mixes two orbitals. The slider sets the energy gap between two low-lying states: ",
      h("em", {}, "large"), " for a typical organic molecule, ", h("em", {}, "small"), " for a transition-metal atom with nearly degenerate d configurations."),
    h("div", { class: "landscape-controls" }, h("label", { class: "lab-small" }, "gap Δ = ", gapOut), slider, runBtn, resetBtn),
    svg, msg,
    h("p", { class: "lab-small lab-muted" }, "Model: E(θ) = Δ·sin²θ − sin²2θ. The real electronic Hessian has many directions (orbital pairs, restricted → unrestricted, real → complex), but the logic is the same: a negative eigenvalue means a lower solution exists.")));
  reset();
}
