// Predict → observe → explain. Students commit to predictions before running
// anything; once locked they cannot be edited, and once results are entered the
// widget shows what their own data says next to each prediction.
import { h, md, verifiedRows, groupBy, mae, num } from "./core.js";

// Evaluate a prediction's "check" against the student's verified data.
// Returns the option text the data supports, or null if not enough data yet.
export function evaluate(check, exp, state) {
  const rows = verifiedRows(exp, state);
  const labelOf = (id) => exp.methods.find((m) => m.id === id)?.label ?? id;
  const maeBy = (filter) => {
    const g = groupBy(rows.filter(filter), (r) => r.methodId);
    return [...g].map(([id, rs]) => ({ id, label: labelOf(id), mae: mae(rs.map((r) => r.error)), n: rs.length }));
  };
  const nReactions = exp.reactions.length;
  switch (check?.type) {
    case "best":
    case "worst": {
      const basis = check.basis || exp.bases[exp.bases.length - 1].id;
      const list = maeBy((r) => r.basis === basis).filter((x) => x.n === nReactions);
      if (list.length < exp.methods.length) return null;
      list.sort((a, b) => a.mae - b.mae);
      return (check.type === "best" ? list[0] : list[list.length - 1]).label;
    }
    case "trend": {
      const pts = exp.bases
        .filter((b) => b.family === check.family)
        .sort((a, b) => a.zeta - b.zeta)
        .map((b) => {
          const rs = rows.filter((r) => r.methodId === check.method && r.basis === b.id);
          return rs.length === nReactions ? mae(rs.map((r) => r.error)) : null;
        });
      if (pts.some((p) => p === null)) return null;
      const dec = pts.every((p, i) => i === 0 || p <= pts[i - 1] + 0.01);
      const inc = pts.every((p, i) => i === 0 || p >= pts[i - 1] - 0.01);
      return dec ? "decrease steadily" : inc ? "increase" : "show no clear pattern";
    }
    case "family": {
      const fams = [...new Set(exp.bases.map((b) => b.family))];
      const m = fams.map((f) => {
        const rs = rows.filter((r) => r.family === f);
        return { f, mae: mae(rs.map((r) => r.error)), n: rs.length };
      });
      const full = exp.methods.length * nReactions * exp.bases.filter((b) => b.family === fams[0]).length;
      if (m.some((x) => x.n < full)) return null;
      if (Math.abs(m[0].mae - m[1].mae) < 0.05) return "about the same";
      return m[0].mae < m[1].mae ? m[0].f : m[1].f;
    }
    case "pair": {
      const list = maeBy(() => true);
      const a = list.find((x) => x.id === check.a && x.n === nReactions * exp.bases.length);
      const b = list.find((x) => x.id === check.b && x.n === nReactions * exp.bases.length);
      if (!a || !b) return null;
      if (Math.abs(a.mae - b.mae) < 0.1) return "about the same";
      return b.mae < a.mae ? "clearly smaller" : "clearly larger";
    }
    case "costliest": {
      // Mean time per SCF cycle over all species, among the methods offered.
      const opts = check.options;
      const per = [];
      for (const m of exp.methods) {
        const vals = [];
        for (const b of exp.bases)
          for (const s of exp.species) {
            const r = state.results?.[`${m.id}|${b.id}`]?.[s.id];
            const t = num(r?.time), c = num(r?.scf);
            if (t !== null && c) vals.push(t / c);
          }
        if (vals.length === exp.species.length * exp.bases.length)
          per.push({ label: m.label, v: vals.reduce((a, b) => a + b, 0) / vals.length });
      }
      const pool = per.filter((p) => !opts || opts.includes(p.label));
      if (opts && pool.length < opts.length) return null;
      if (!pool.length) return null;
      pool.sort((a, b) => b.v - a.v);
      return pool[0].label;
    }
    default:
      return null;
  }
}

export function render(el, { exp, store }) {
  const preds = exp.predictions || [];
  if (!preds.length) return;

  const draw = () => {
    const st = store.state;
    const locked = !!st.predictions.locked_at;
    const list = h("div", { class: "pred-list" });
    for (const p of preds) {
      const val = st.predictions.values[p.id];
      const check = p.check?.type === "costliest" ? { ...p.check, options: p.options } : p.check;
      const observed = locked && check?.type !== "none" ? evaluate(check, exp, st) : null;
      const sel = h("select", {
        class: "form-select form-select-sm pred-select",
        disabled: locked,
        "aria-label": "Your prediction",
        onchange: (e) => store.update((s) => (s.predictions.values[p.id] = e.target.value)),
      }, h("option", { value: "" }, "— choose —"), p.options.map((o) => h("option", { value: o, selected: o === val }, o)));

      let verdict = null;
      if (locked && check?.type !== "none") {
        if (observed === null) verdict = h("span", { class: "pred-pending" }, "Your data will answer this once the results table is complete.");
        else
          verdict = h("span", { class: "pred-verdict " + (observed === val ? "match" : "miss") },
            observed === val ? "✔ Your data agrees: " : "✘ Your data says: ", h("strong", {}, observed));
      }
      list.append(h("div", { class: "pred-item" }, h("div", { class: "pred-prompt", html: md(p.prompt) }), sel, verdict));
    }

    const allChosen = preds.every((p) => st.predictions.values[p.id]);
    const lockBtn = h("button", {
      type: "button",
      class: "btn btn-sm " + (locked ? "btn-outline-secondary" : "btn-warning"),
      disabled: locked || !allChosen,
      onclick: () => {
        if (confirm("Lock your predictions? You won't be able to change them, and that's the point!"))
          store.update((s) => (s.predictions.locked_at = new Date().toISOString()));
      },
    }, locked ? "🔒 Locked" : "🔒 Lock my predictions");
    const status = locked
      ? h("span", { class: "lab-muted" }, `Locked ${new Date(st.predictions.locked_at).toLocaleString()}`)
      : h("span", { class: "lab-muted" }, allChosen ? "Ready to lock." : "Answer every item, then lock.");

    el.replaceChildren(h("div", { class: "lab-card pred-card" + (locked ? " is-locked" : "") },
      h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Predict first"),
        h("span", { class: "lab-muted" }, " · before you run anything"), h("span", { class: "lab-spacer" }), status, lockBtn),
      h("p", { class: "lab-small" }, "Commit to an answer using what you know so far. Predictions aren't graded on being right; they're part of your submission so we can see how your intuition changes."),
      list));
  };
  draw();
  store.subscribe(draw);
}
