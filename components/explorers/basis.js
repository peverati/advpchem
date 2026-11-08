// Experiment 6 explorers: small basis sets vs def2-TZVP.
import { h, verifiedRows, conditions, num, basisLabel } from "../core.js";
import { Plot, empty, condMAE } from "../explore.js";

const groupsOf = (exp) => [...new Set(exp.reactions.map((r) => r.group))];

function maeTable(exp, rows) {
  const out = [];
  for (const c of conditions(exp))
    for (const g of groupsOf(exp)) {
      const v = condMAE(exp, rows, c, (r) => r.group === g);
      if (v !== null) out.push({ method: c.method.label, methodId: c.method.id, basis: basisLabel(c.basis), basisId: c.basis.id, group: g, mae: v });
    }
  return out;
}

export const EXPLORERS = {
  async "basis-mae"(exp, state) {
    const data = maeTable(exp, verifiedRows(exp, state));
    if (!data.length) return empty("Once all reactions of an experiment are complete for a method/basis pair, its MAE appears here.");
    const P = await Plot();
    return P.plot({
      title: "MAE by basis set, for the reactions of each experiment",
      width: 760, height: 420, marginLeft: 50, marginBottom: 40,
      fx: { label: null, domain: exp.bases.map(basisLabel) },
      fy: { label: null, domain: groupsOf(exp) },
      x: { label: null, domain: exp.methods.map((m) => m.label), axis: null },
      y: { label: "MAE (kcal/mol)", grid: true },
      color: { legend: true, domain: exp.methods.map((m) => m.label), range: ["#3182bd", "#e6550d"] },
      marks: [P.barY(data, { fx: "basis", fy: "group", x: "method", y: "mae", fill: "method", tip: true }), P.ruleY([0])],
    });
  },

  // Predict which small-basis cells beat def2-TZVP, then reveal.
  async "anomaly-spotter"(exp, state, { store, redraw }) {
    const ref = exp.anomaly?.reference || "def2-TZVP";
    const methods = exp.methods;
    const st = state.extra.anomaly || { method: methods[0].id, picks: [], revealed: false };
    const save = (fn) => { store.update((s) => { s.extra.anomaly = Object.assign({ method: methods[0].id, picks: [], revealed: false }, s.extra.anomaly); fn(s.extra.anomaly); }, { silent: true }); redraw(); };
    const data = maeTable(exp, verifiedRows(exp, state));
    const groups = groupsOf(exp);
    const small = exp.bases.filter((b) => b.id !== ref);
    const val = (bid, g) => data.find((d) => d.methodId === st.method && d.basisId === bid && d.group === g)?.mae ?? null;
    const complete = groups.every((g) => val(ref, g) !== null && small.every((b) => val(b.id, g) !== null));

    const methodSel = h("select", { class: "form-select form-select-sm", disabled: st.revealed, onchange: (e) => save((a) => (a.method = e.target.value)) },
      methods.map((m) => h("option", { value: m.id, selected: m.id === st.method }, m.label)));
    const table = h("table", { class: "res-table compact anomaly-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "basis set"), groups.map((g) => h("th", {}, g)))),
      h("tbody", {},
        h("tr", { class: "res-group" }, h("th", {}, `${ref} (reference)`), groups.map((g) => h("td", { class: "num" }, val(ref, g) === null ? "·" : val(ref, g).toFixed(2)))),
        small.map((b) => h("tr", {}, h("th", {}, basisLabel(b)), groups.map((g) => {
          const key = `${b.id}|${g}`;
          const picked = st.picks.includes(key);
          const v = val(b.id, g), r = val(ref, g);
          const isAnomaly = v !== null && r !== null && v < r;
          let cls = "anomaly-cell" + (picked ? " picked" : "");
          if (st.revealed) cls += isAnomaly === picked ? " right" : " wrong";
          return h("td", { class: cls },
            h("button", {
              type: "button", disabled: st.revealed, "aria-pressed": String(picked),
              onclick: () => save((a) => (a.picks = picked ? a.picks.filter((k) => k !== key) : [...a.picks, key])),
            }, st.revealed ? (v === null ? "·" : v.toFixed(2)) : picked ? "⚑ flagged" : "?"));
        })))));
    const nAnom = st.revealed ? small.reduce((n, b) => n + groups.filter((g) => { const v = val(b.id, g), r = val(ref, g); return v !== null && r !== null && v < r; }).length, 0) : 0;
    const revealBtn = h("button", {
      type: "button", class: "btn btn-sm " + (st.revealed ? "btn-outline-secondary" : "btn-warning"),
      disabled: !complete && !st.revealed,
      onclick: () => save((a) => (a.revealed = !a.revealed)),
    }, st.revealed ? "Hide the numbers and try again" : "Reveal the MAEs");
    return h("div", { class: "anomaly" },
      h("h4", { class: "explore-h" }, "Spot the anomaly"),
      h("p", { class: "lab-small" }, `Theory says a double-ζ basis should give a larger error than ${ref} with the same functional. Flag (⚑) every cell where you think the small basis will `, h("em", {}, "beat"), ` ${ref} for `, methodSel, ", then reveal the mean absolute errors."),
      h("div", { class: "table-responsive" }, table),
      h("div", { class: "anomaly-foot" }, revealBtn,
        !complete && !st.revealed ? h("span", { class: "lab-small lab-muted" }, " Complete all reactions for this functional to unlock the reveal.") : null,
        st.revealed ? h("span", { class: "lab-small" }, ` ${nAnom} anomal${nAnom === 1 ? "y" : "ies"}: green = you judged it right, red = you didn't. Each anomaly is a small basis "winning" for the wrong reason.`) : null));
  },

  async "nbf-counter"(exp, state, { store, redraw }) {
    const pick = state.extra.nbf_species || exp.nbf_species || exp.species[0].id;
    const sel = h("select", { class: "form-select form-select-sm", onchange: (e) => { store.update((s) => (s.extra.nbf_species = e.target.value), { silent: true }); redraw(); } },
      exp.species.map((s) => h("option", { value: s.id, selected: s.id === pick }, s.label)));
    const counts = exp.bases.map((b) => {
      const vals = exp.methods.map((m) => num(state.results?.[`${m.id}|${b.id}`]?.[pick]?.nbf)).filter((v) => v !== null);
      return { basis: basisLabel(b), nbf: vals.length ? vals[0] : null };
    });
    const have = counts.filter((c) => c.nbf !== null);
    const body = have.length
      ? h("table", { class: "res-table compact" }, h("thead", {}, h("tr", {}, h("th", {}, "basis set"), h("th", {}, "basis functions"))),
        h("tbody", {}, counts.map((c) => h("tr", {}, h("th", {}, c.basis), h("td", { class: "num" }, c.nbf ?? "·")))))
      : empty("Enter the number of basis functions (the “Basis functions” tab) for this molecule to fill this table.");
    return h("div", {}, h("h4", { class: "explore-h" }, "How big is each basis?"),
      h("p", { class: "lab-small" }, "Molecule: ", sel), body,
      h("p", { class: "lab-small lab-muted" }, "All four small basis sets are “polarized double-ζ”, yet their sizes differ. Do the bigger ones give smaller errors?"));
  },
};
