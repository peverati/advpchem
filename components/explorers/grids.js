// Experiment 7 explorers: Ar2 dissociation curves on different integration grids.
import { h, verifiedRows, conditions, num, mean, basisLabel, localMinima, speciesFor } from "../core.js";
import { Plot, empty } from "../explore.js";

const dist = (r) => Number(r.id);

export const EXPLORERS = {
  async "ar2-curves"(exp, state, { store, redraw }) {
    const rows = verifiedRows(exp, state);
    const zoom = state.extra.ar2_zoom !== false;
    const toggle = h("label", { class: "form-check form-switch lab-small" },
      h("input", {
        class: "form-check-input", type: "checkbox", role: "switch", checked: zoom,
        onchange: (e) => { store.update((s) => (s.extra.ar2_zoom = e.target.checked), { silent: true }); redraw(); },
      }), " zoom into the van der Waals well");
    const ref = exp.reactions.map((r) => ({ r: dist(r), dE: r.ref }));
    const data = rows.map((q) => ({ r: Number(q.reaction), dE: q.delta, method: q.method, grid: q.basisLabel }));
    if (!data.length) return h("div", {}, empty("Enter the total energies of the Ar atom and the Ar₂ structures: the curves are drawn as soon as they're complete."));
    const P = await Plot();
    const grids = exp.bases.map(basisLabel);
    const plot = P.plot({
      title: "Ar₂ interaction energy: your curves (colours) and the reference (black)",
      width: 780, height: 360, marginLeft: 50,
      fx: { domain: grids, label: null },
      x: { label: "Ar–Ar distance (Å)", grid: true, ticks: [3, 4, 5, 6] },
      y: { label: "ΔE (kcal/mol)", grid: true, domain: zoom ? [-1.2, 0.8] : undefined, clamp: false },
      color: { legend: true, domain: exp.methods.map((m) => m.label) },
      marks: [
        P.ruleY([0], { strokeOpacity: 0.3 }),
        ...grids.map((g) => P.line(ref.map((p) => ({ ...p, grid: g })), { fx: "grid", x: "r", y: "dE", stroke: "currentColor", strokeWidth: 2.5, strokeDasharray: "5,3", clip: true })),
        P.line(data, { fx: "grid", x: "r", y: "dE", stroke: "method", z: "method", strokeWidth: 1.5, sort: "r", clip: true }),
        P.dot(data, { fx: "grid", x: "r", y: "dE", fill: "method", r: 2, tip: true, clip: true }),
      ],
    });
    return h("div", {}, toggle, plot);
  },

  // Count spurious minima and measure how far each curve is from the reference
  // and from the finest grid.
  async "grid-wiggles"(exp, state) {
    const rows = verifiedRows(exp, state);
    const grids = exp.bases;
    const finest = grids[grids.length - 1];
    const curve = (cKey) => {
      const v = exp.reactions.map((r) => rows.find((q) => q.cond === cKey && q.reaction === r.id)?.delta ?? null);
      return v.some((x) => x === null) ? null : v;
    };
    const body = [];
    let anything = false;
    for (const m of exp.methods) {
      const fine = curve(`${m.id}|${finest.id}`);
      const cells = grids.map((g) => {
        const c = conditions(exp).find((x) => x.method.id === m.id && x.basis.id === g.id);
        if (!c) return h("td", { class: "na-cell" }, "—");
        const v = curve(c.key);
        if (!v) return h("td", { class: "lab-muted" }, "·");
        anything = true;
        const mins = localMinima(v);
        const rms = Math.sqrt(mean(v.map((x, i) => (x - exp.reactions[i].ref) ** 2)));
        const dev = fine && g.id !== finest.id ? Math.max(...v.map((x, i) => Math.abs(x - fine[i]))) : null;
        return h("td", { class: "wiggle-cell " + (mins === 1 ? "smooth" : "wiggly") },
          h("div", { class: "strong" }, mins === 1 ? "smooth" : `${mins} minima`),
          h("div", { class: "lab-small" }, `RMS vs ref ${rms.toFixed(2)}`),
          dev !== null ? h("div", { class: "lab-small lab-muted" }, `max Δ vs ${basisLabel(finest)} ${dev.toFixed(2)}`) : null);
      });
      body.push(h("tr", {}, h("th", { scope: "row" }, m.label), cells));
    }
    if (!anything) return empty("Complete at least one full curve to see the wiggle report.");
    return h("div", {}, h("h4", { class: "explore-h" }, "Wiggle report"),
      h("div", { class: "table-responsive" }, h("table", { class: "res-table compact" },
        h("thead", {}, h("tr", {}, h("th", {}, "functional"), grids.map((g) => h("th", {}, basisLabel(g))))), h("tbody", {}, body))),
      h("p", { class: "lab-small lab-muted" }, "“Smooth” = exactly one minimum, like the reference curve. RMS = root-mean-square deviation from the reference over all 31 distances (kcal/mol). Max Δ = the largest difference from the same functional on the finest grid: a measure of grid convergence that doesn't depend on the reference."));
  },

  async "grid-timing"(exp, state) {
    const data = [];
    for (const c of conditions(exp)) {
      const ts = speciesFor(exp, c).map((s) => num(state.results?.[c.key]?.[s.id]?.time));
      if (ts.some((t) => t === null)) continue;
      data.push({ method: c.method.label, grid: basisLabel(c.basis), total: ts.reduce((a, b) => a + b, 0) / 60 });
    }
    if (!data.length) return empty("Enter the wall times of a complete curve to compare the cost of the grids.");
    const P = await Plot();
    return P.plot({
      title: "Total wall time for one full curve (32 jobs), by grid",
      width: 760, height: 300, marginLeft: 55,
      fx: { domain: exp.methods.map((m) => m.label), label: null },
      x: { domain: exp.bases.map(basisLabel), label: null },
      y: { label: "minutes", grid: true },
      color: { domain: exp.bases.map(basisLabel), range: ["#c6dbef", "#6baed6", "#08519c"], legend: true },
      marks: [P.barY(data, { fx: "method", x: "grid", y: "total", fill: "grid", tip: true }), P.ruleY([0])],
    });
  },
};
