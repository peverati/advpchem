// Experiment 5 explorers: hard reactions, relative errors, training sets, and
// the "easy → medium → hard" picture across Experiments 3, 4 and 5.
import { h, verifiedRows, conditions, loadOther, mean } from "../core.js";
import { Plot, empty, condMAE, RUNG_ORDER, RUNG_COLORS } from "../explore.js";

export const EXPLORERS = {
  // Absolute vs relative error: 6 kcal/mol on 600 is 1 %, on 1 is 600 %.
  async "relative-errors"(exp, state) {
    const rows = verifiedRows(exp, state).filter((r) => r.relError !== null);
    if (!rows.length) return empty();
    const P = await Plot();
    const order = conditions(exp).map((c) => c.label);
    const data = rows.map((r) => ({ ...r, rel: Math.abs(r.relError) }));
    return h("div", {}, P.plot({
      title: "The same errors as a percentage of each reference value",
      width: 760, height: 70 + 20 * order.length, marginLeft: exp.bases.length > 1 ? 190 : 85,
      fx: { label: null },
      y: { domain: order, label: null },
      x: { type: "log", label: "|ε| / |ΔE ref| (%)", grid: true, tickFormat: "~g" },
      color: { legend: true, domain: RUNG_ORDER, range: RUNG_COLORS },
      marks: [P.dot(data, { fx: "reaction", y: exp.bases.length > 1 ? "condLabel" : "method", x: (d) => Math.max(d.rel, 0.01), fill: "rung", r: 4, tip: true, channels: { "|ε| kcal/mol": "absError", "%": "rel" } })],
    }),
    h("p", { class: "lab-small lab-muted" }, "Chemistry is decided by absolute energies (kcal/mol), not percentages, but this view shows why a large atomization energy can carry a large absolute error even when the method is “only” 1–2 % off."));
  },

  // CaO (5b): MN15 was fitted to this very molecule.
  async "cao-spotlight"(exp, state) {
    const rid = exp.spotlight?.reaction || "5b";
    const star = exp.spotlight?.method || "MN15";
    const rows = verifiedRows(exp, state).filter((r) => r.reaction === rid);
    if (!rows.length) return empty("Verify the CaO dissociation energies (5b) to light up this chart.");
    const P = await Plot();
    const order = exp.methods.map((m) => m.label);
    const data = rows.map((r) => ({ ...r, who: r.methodId === star ? star : "other methods" }));
    return h("div", {}, P.plot({
      title: `Spotlight on reaction ${rid}: CaO → Ca + O`,
      width: 640, height: 70 + 20 * order.length, marginLeft: 85,
      y: { domain: order, label: null },
      x: { label: "ε (kcal/mol)", grid: true },
      color: { domain: [star, "other methods"], range: ["#d62728", "#9e9e9e"], legend: true },
      marks: [P.ruleX([0]), P.barX(data, { y: "method", x: "error", fill: "who", tip: true })],
    }),
    h("details", { class: "lab-reveal" }, h("summary", {}, `Why does ${star} stand out? (open after you've looked)`),
      h("p", {}, `${star} was parametrized on the Minnesota 2015 database, which contains this CaO data point. A method reproducing its own training data is not an independent test. Good performance on a training-set molecule tells you little about molecules the functional has never seen. Always check whether a benchmark was part of a functional's training set before using it to judge the functional.`)));
  },

  // MAE per method in Experiments 3 (easy), 4 (medium), 5 (hard), from the
  // student's own saved work in this browser.
  async "difficulty-ladder"(exp, state) {
    const sets = [];
    for (const [id, tag] of [["ex03", "Exp. 3 · easy"], ["ex04", "Exp. 4 · medium"]]) {
      const o = await loadOther(id);
      if (o.exp) sets.push({ tag, exp: o.exp, state: o.state, draft: o.state.predictions?.values?.draft });
    }
    sets.push({ tag: "Exp. 5 · hard", exp, state });
    const data = [];
    for (const s of sets) {
      const rows = verifiedRows(s.exp, s.state);
      for (const c of conditions(s.exp)) {
        const m = condMAE(s.exp, rows, c);
        if (m !== null) data.push({ method: c.method.label, rung: c.method.rung, set: s.tag, mae: m });
      }
    }
    const tags = sets.map((s) => s.tag);
    const haveAll = (method) => tags.every((t) => data.some((d) => d.method === method && d.set === t));
    const complete = [...new Set(data.map((d) => d.method))].filter(haveAll);
    if (data.length < 3) return empty("This chart combines your verified results from Experiments 3, 4 and 5 saved in this browser. Finish this experiment's table to see it.");
    const draft = sets[0].draft;
    const overall = complete.map((m) => ({ method: m, v: mean(data.filter((d) => d.method === m).map((d) => d.mae)) })).sort((a, b) => a.v - b.v);
    const last = data.filter((d) => d.set === tags[tags.length - 1]).sort((a, b) => a.mae - b.mae);
    const labelled = new Set([draft, ...last.slice(0, 3).map((d) => d.method), last[last.length - 1]?.method].filter(Boolean));
    const P = await Plot();
    const plot = P.plot({
      title: "From easy to hard: MAE of each method across Experiments 3–5",
      subtitle: "Thick line: your Experiment 3 draft pick. Hover over a point to see the method.",
      width: 760, height: 380, marginLeft: 55, marginRight: 90,
      x: { domain: tags, label: null, padding: 0.3 },
      y: { type: "log", label: "MAE (kcal/mol, log scale)", grid: true, tickFormat: "~g" },
      color: { legend: true, domain: RUNG_ORDER, range: RUNG_COLORS },
      marks: [
        P.line(data.filter((d) => complete.includes(d.method)), { x: "set", y: "mae", z: "method", stroke: "rung", strokeOpacity: 0.5, strokeWidth: (d) => (d.method === draft ? 3.5 : 1.2) }),
        P.dot(data, { x: "set", y: "mae", fill: "rung", r: 4, tip: true, channels: { method: "method" } }),
        // Label only the draft pick, the three best and the worst (hover for the rest).
        P.text(data.filter((d) => d.set === tags[tags.length - 1] && labelled.has(d.method)), { x: "set", y: "mae", text: "method", dx: 8, textAnchor: "start", fontSize: 10 }),
      ],
    });
    const missing = sets.length < 3 || tags.some((t) => !data.some((d) => d.set === t));
    return h("div", {}, plot,
      overall.length ? h("p", { class: "lab-small" },
        h("strong", {}, "Your overall winner: "), `${overall[0].method} (mean MAE ${overall[0].v.toFixed(2)} kcal/mol)`,
        draft ? [" · ", h("strong", {}, "Your Experiment 3 draft pick: "), `${draft}${draft === overall[0].method ? " 🏆 well called!" : ` (ranked ${overall.findIndex((o) => o.method === draft) + 1 || "—"} of ${overall.length})`}`] : null) : null,
      missing ? h("p", { class: "lab-small lab-muted" }, "Some experiments are missing or incomplete in this browser. If you worked on another computer, load your saved file on that experiment's page first.") : null);
  },
};
