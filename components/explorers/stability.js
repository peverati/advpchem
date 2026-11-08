// Experiment 8 explorer: what stability analysis changed.
import { h, verifiedRows, num, HARTREE_TO_KCAL, conditions, speciesFor } from "../core.js";
import { Plot, empty } from "../explore.js";

export const EXPLORERS = {
  async "stability-lowering"(exp, state) {
    const [plain, stab] = exp.bases;
    // Energy lowering per state: E(with stability) − E(without), kcal/mol.
    let any = false;
    const runs = (m) => {
      const c = conditions(exp).find((x) => x.method.id === m.id && x.basis.id === plain.id);
      return new Set(c ? speciesFor(exp, c).map((s) => s.id) : []);
    };
    const body = exp.methods.map((m) => h("tr", {}, h("th", { scope: "row" }, m.label), exp.species.map((s) => {
      if (!runs(m).has(s.id)) return h("td", { class: "num na-cell", title: "Not part of this experiment" }, "—");
      const a = num(state.results?.[`${m.id}|${plain.id}`]?.[s.id]?.energy);
      const b = num(state.results?.[`${m.id}|${stab.id}`]?.[s.id]?.energy);
      if (a === null || b === null) return h("td", { class: "num lab-muted" }, "·");
      any = true;
      const d = (b - a) * HARTREE_TO_KCAL;
      const cls = d < -0.1 ? "num err-big strong" : Math.abs(d) <= 0.1 ? "num err-small" : "num txt-bad";
      return h("td", { class: cls, title: d < -0.1 ? "Stability analysis found a lower solution" : d > 0.1 ? "Higher energy with stability analysis: check that both jobs used the same settings" : "No change" }, (d >= 0 ? "+" : "") + d.toFixed(2));
    })));
    const table = any
      ? h("div", { class: "table-responsive" }, h("table", { class: "res-table compact" },
        h("thead", {}, h("tr", {}, h("th", {}, "method"), exp.species.map((s) => h("th", {}, s.label)))), h("tbody", {}, body)),
        h("p", { class: "lab-small lab-muted" }, "E(with stability analysis) − E(without), in kcal/mol. Red, negative numbers mean the first SCF solution was unstable and a lower one was found. It should never go up: if it does, check that both jobs used the same settings."))
      : empty("Enter energies for both runs (without and with stability analysis) to see what changed.");

    const rows = verifiedRows(exp, state);
    let chart = null;
    if (rows.length) {
      const P = await Plot();
      const data = rows.map((r) => ({ ...r, run: r.basis === stab.id ? "with stability analysis" : "without" }));
      chart = P.plot({
        title: "Excitation-energy errors without (grey) and with (red) stability analysis",
        width: 760, height: 70 + 22 * exp.methods.length, marginLeft: 85,
        fx: { label: null },
        y: { domain: exp.methods.map((m) => m.label), label: null },
        x: { label: "ε (kcal/mol)", grid: true },
        color: { legend: true, domain: ["without", "with stability analysis"], range: ["#9e9e9e", "#d62728"] },
        marks: [
          P.ruleX([0]),
          P.link(exp.reactions.flatMap((rx) => exp.methods.map((m) => {
            const a = rows.find((r) => r.methodId === m.id && r.reaction === rx.id && r.basis === plain.id);
            const b = rows.find((r) => r.methodId === m.id && r.reaction === rx.id && r.basis === stab.id);
            return a && b ? { reaction: rx.id, method: m.label, x1: a.error, x2: b.error } : null;
          }).filter(Boolean)), { fx: "reaction", y: "method", x1: "x1", x2: "x2", stroke: "#d62728", strokeOpacity: 0.5, markerEnd: "arrow" }),
          P.dot(data, { fx: "reaction", y: "method", x: "error", fill: "run", r: 4.5, tip: true }),
        ],
      });
    }
    return h("div", {}, h("h4", { class: "explore-h" }, "Did stability analysis change anything?"), table, chart);
  },
};
