// Experiment 4 explorers: what dispersion corrections do.
import { h, verifiedRows } from "../core.js";
import { Plot, empty } from "../explore.js";

const DISP_ORDER = ["none", "D4", "VV10 (nonlocal)", "fitted (Minnesota)"];
const DISP_COLORS = ["#9e9e9e", "#e6550d", "#3182bd", "#756bb1"];

export const EXPLORERS = {
  // Side-by-side errors with and without -D4 for the two functional pairs.
  async "d4-pairs"(exp, state, { store, redraw }) {
    const pairs = [["PBE", "PBE-D4"], ["B3LYP", "B3LYP-D4"]];
    const ids = pairs.flat();
    const rows = verifiedRows(exp, state).filter((r) => ids.includes(r.methodId));
    if (!rows.length) return empty("Verify the reaction energies of PBE, PBE-D4, B3LYP and B3LYP-D4 to compare them here.");
    const absMode = !!state.extra.d4_abs;
    const toggle = h("label", { class: "form-check form-switch lab-small" },
      h("input", {
        class: "form-check-input", type: "checkbox", role: "switch", checked: absMode,
        onchange: (e) => { store.update((s) => (s.extra.d4_abs = e.target.checked), { silent: true }); redraw(); },
      }), " show absolute errors |ε|");
    const data = rows.map((r) => ({ ...r, d4: /-D4$/.test(r.methodId) ? "with -D4" : "without", y: absMode ? r.absError : r.error }));
    let better = 0, total = 0;
    for (const [a, b] of pairs)
      for (const rx of exp.reactions) {
        const x = rows.find((r) => r.methodId === a && r.reaction === rx.id), y = rows.find((r) => r.methodId === b && r.reaction === rx.id);
        if (x && y) { total += 1; if (y.absError < x.absError) better += 1; }
      }
    const P = await Plot();
    const plot = P.plot({
      title: "Does -D4 help? Each pair: the functional without and with the dispersion correction",
      width: 760, height: 300, marginLeft: 55,
      fx: { label: null },
      x: { domain: ids, label: null, tickRotate: -30 },
      y: { label: absMode ? "|ε| (kcal/mol)" : "ε (kcal/mol)", grid: true },
      color: { legend: true, domain: ["without", "with -D4"], range: ["#9e9e9e", "#e6550d"] },
      marginBottom: 55,
      marks: [P.ruleY([0]), P.barY(data, { fx: "reaction", x: "method", y: "y", fill: "d4", tip: true, channels: { "ΔE": "delta", ref: "ref" } })],
    });
    return h("div", {}, toggle, plot,
      total ? h("p", { class: "lab-small" }, h("strong", {}, `-D4 lowered the error in ${better} of ${total} cases.`),
        " Look at which reactions those are: what kind of interaction changes most between reactants and products?") : null);
  },

  // The two dimers, coloured by how each method treats dispersion.
  async "dispersion-dimers"(exp, state) {
    const ids = exp.dimers || ["4c", "4d"];
    const rows = verifiedRows(exp, state).filter((r) => ids.includes(r.reaction));
    if (!rows.length) return empty("Verify the reaction energies of the two dimers (4c, 4d) to see this chart.");
    const P = await Plot();
    const order = exp.methods.map((m) => m.label);
    const data = rows.map((r) => ({ ...r, dispersion: r.disp || "none" }));
    return h("div", {}, P.plot({
      title: "Binding of the two dimers: error by how each method treats dispersion",
      subtitle: "Positive ε = the dimer is bound too weakly; negative = too strongly.",
      width: 760, height: 70 + 20 * order.length, marginLeft: 85,
      fx: { label: null },
      y: { domain: order, label: null },
      x: { label: "ε (kcal/mol)", grid: true },
      color: { legend: true, domain: DISP_ORDER, range: DISP_COLORS },
      marks: [P.ruleX([0]), P.barX(data, { fx: "reactionLabel", y: "method", x: "error", fill: "dispersion", tip: true, channels: { "ΔE": "delta", ref: "ref" } })],
    }),
    h("p", { class: "lab-small lab-muted" }, "“Fitted (Minnesota)” functionals have no explicit dispersion term, but their parameters were fitted to data that include noncovalent complexes."));
  },
};
