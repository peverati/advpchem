// Predict → observe → explain. Students commit to predictions before running
// anything; once locked they cannot be edited, and once results are entered the
// widget shows what their own data says next to each prediction.
//
// Each prediction's "check" (in the experiment JSON) says how to read the
// answer from the data; evaluate() returns the option the data supports, or
// null while there isn't enough data yet.
import { h, md, verifiedRows, groupBy, mae, mean, num, conditions, applies, speciesFor, expectedReactions, loadOther, HARTREE_TO_KCAL, localMinima } from "./core.js";

const TOL = 0.1;

function condsWith(exp, check) {
  let cs = conditions(exp);
  if (check.basis) cs = cs.filter((c) => c.basis.id === check.basis);
  else if (exp.bases.length > 1 && !check.allBases) cs = cs.filter((c) => c.basis.id === exp.bases[exp.bases.length - 1].id);
  if (check.methods) cs = cs.filter((c) => check.methods.includes(c.method.id));
  return cs;
}

// MAE of one condition over the reactions selected by the check (all must be verified).
function condError(exp, rows, cond, check, signed = false) {
  const want = exp.reactions.filter((r) => applies(cond, r) &&
    (!check.reaction || r.id === check.reaction) && (!check.group || r.group === check.group) &&
    (!check.reactions || check.reactions.includes(r.id)));
  const rs = rows.filter((r) => r.cond === cond.key && want.some((w) => w.id === r.reaction));
  if (!want.length || rs.length !== want.length) return null;
  return signed ? mean(rs.map((r) => r.error)) : mae(rs.map((r) => r.error));
}

const lab = (check, i, fallback) => (check.labels ? check.labels[i] : fallback);

export function evaluate(check, exp, state, others = {}) {
  const rows = verifiedRows(exp, state);
  switch (check?.type) {
    case "best":
    case "worst": {
      const list = condsWith(exp, check).map((c) => ({ label: c.method.label, v: condError(exp, rows, c, check) }));
      if (!list.length || list.some((x) => x.v === null)) return null;
      list.sort((a, b) => a.v - b.v);
      return (check.type === "best" ? list[0] : list[list.length - 1]).label;
    }
    case "trend": {
      const pts = exp.bases.filter((b) => b.family === check.family).sort((a, b) => a.zeta - b.zeta).map((b) => {
        const c = conditions(exp).find((x) => x.method.id === check.method && x.basis.id === b.id);
        return c ? condError(exp, rows, c, check) : null;
      });
      if (!pts.length || pts.some((p) => p === null)) return null;
      const dec = pts.every((p, i) => i === 0 || p <= pts[i - 1] + 0.01);
      const inc = pts.every((p, i) => i === 0 || p >= pts[i - 1] - 0.01);
      return dec ? "decrease steadily" : inc ? "increase" : "show no clear pattern";
    }
    case "family": {
      const fams = [...new Set(exp.bases.map((b) => b.family))];
      const m = fams.map((f) => {
        const cs = conditions(exp).filter((c) => c.basis.family === f);
        const vals = cs.map((c) => condError(exp, rows, c, check));
        return { f, v: vals.some((v) => v === null) ? null : mean(vals) };
      });
      if (m.some((x) => x.v === null)) return null;
      if (Math.abs(m[0].v - m[1].v) < 0.05) return "about the same";
      return m[0].v < m[1].v ? m[0].f : m[1].f;
    }
    case "pair": {
      const cs = conditions(exp).filter((c) => !check.bases || check.bases.includes(c.basis.id));
      const side = (id) => {
        const vals = cs.filter((c) => c.method.id === id).map((c) => condError(exp, rows, c, check));
        return vals.length && !vals.some((v) => v === null) ? mean(vals) : null;
      };
      const a = side(check.a), b = side(check.b);
      if (a === null || b === null) return null;
      if (Math.abs(a - b) < (check.tol ?? TOL)) return lab(check, 1, "about the same");
      return b < a ? lab(check, 0, "clearly smaller") : lab(check, 2, "clearly larger");
    }
    case "errsign": {
      const c = conditions(exp).find((x) => x.method.id === check.method && (!check.basis || x.basis.id === check.basis));
      const v = c ? condError(exp, rows, c, check, true) : null;
      if (v === null) return null;
      const tol = check.tol ?? 0.3;
      return v > tol ? check.labels[0] : v < -tol ? check.labels[2] : check.labels[1];
    }
    case "costliest": {
      const per = [];
      for (const c of condsWith(exp, check)) {
        const vals = [];
        for (const s of speciesFor(exp, c)) {
          const r = state.results?.[c.key]?.[s.id];
          const t = num(r?.time), n = num(r?.scf);
          if (t !== null && n) vals.push(t / n);
        }
        if (vals.length === speciesFor(exp, c).length) per.push({ label: c.method.label, v: mean(vals) });
      }
      const pool = per.filter((p) => !check.options || check.options.includes(p.label));
      if (!pool.length || (check.options && pool.length < check.options.length)) return null;
      pool.sort((a, b) => b.v - a.v);
      return pool[0].label;
    }
    case "best_basis": {
      const list = check.bases.map((bid) => {
        const c = conditions(exp).find((x) => x.method.id === check.method && x.basis.id === bid);
        return { label: exp.bases.find((b) => b.id === bid)?.label || bid, v: c ? condError(exp, rows, c, check) : null };
      });
      if (list.some((x) => x.v === null)) return null;
      list.sort((a, b) => a.v - b.v);
      return list[0].label;
    }
    case "anomaly_any": {
      const cs = conditions(exp);
      const small = cs.find((c) => c.method.id === check.method && c.basis.id === check.small);
      const large = cs.find((c) => c.method.id === check.method && c.basis.id === check.large);
      const groups = [...new Set(exp.reactions.map((r) => r.group))];
      let any = false;
      for (const g of groups) {
        const s = condError(exp, rows, small, { group: g }), l = condError(exp, rows, large, { group: g });
        if (s === null || l === null) return null;
        if (s < l) any = true;
      }
      return any ? check.labels[0] : check.labels[1];
    }
    case "vs_previous": {
      const here = conditions(exp).map((c) => condError(exp, rows, c, {}));
      if (here.some((v) => v === null)) return null;
      const prev = [];
      for (const id of check.exps) {
        const o = others[id];
        if (!o?.exp) return null;
        const prow = verifiedRows(o.exp, o.state);
        const vals = conditions(o.exp).map((c) => condError(o.exp, prow, c, {}));
        if (vals.some((v) => v === null)) return null;
        prev.push(mean(vals));
      }
      const ratio = mean(here) / mean(prev);
      return ratio > 2 ? check.labels[2] : ratio < 0.5 ? check.labels[0] : check.labels[1];
    }
    case "grid_sensitivity": {
      const out = [];
      for (const m of exp.methods) {
        const a = conditions(exp).find((c) => c.method.id === m.id && c.basis.id === check.from);
        const b = conditions(exp).find((c) => c.method.id === m.id && c.basis.id === check.to);
        if (!a || !b) continue;
        const diffs = exp.reactions.map((r) => {
          const x = rows.find((q) => q.cond === a.key && q.reaction === r.id), y = rows.find((q) => q.cond === b.key && q.reaction === r.id);
          return x && y ? Math.abs(x.delta - y.delta) : null;
        });
        if (diffs.some((d) => d === null)) return null;
        out.push({ label: m.label, v: mean(diffs) });
      }
      if (!out.length) return null;
      out.sort((p, q) => q.v - p.v);
      return out[0].label;
    }
    case "smooth": {
      const cs = conditions(exp).filter((c) => c.basis.id === check.basis && (!check.methods || check.methods.includes(c.method.id)));
      let allSmooth = true;
      for (const c of cs) {
        const curve = exp.reactions.map((r) => rows.find((q) => q.cond === c.key && q.reaction === r.id)?.delta ?? null);
        if (curve.some((v) => v === null)) return null;
        if (localMinima(curve) !== 1) allSmooth = false;
      }
      return allSmooth ? check.labels[0] : check.labels[1];
    }
    case "time_ratio": {
      const ratios = [];
      for (const m of exp.methods) {
        const a = conditions(exp).find((c) => c.method.id === m.id && c.basis.id === check.from);
        const b = conditions(exp).find((c) => c.method.id === m.id && c.basis.id === check.to);
        if (!a || !b) continue;
        for (const s of speciesFor(exp, a)) {
          const ta = num(state.results?.[a.key]?.[s.id]?.time), tb = num(state.results?.[b.key]?.[s.id]?.time);
          if (ta > 0 && tb > 0) ratios.push(tb / ta);
        }
      }
      if (ratios.length < exp.species.length) return null;
      const r = mean(ratios);
      return r < 1.5 ? check.labels[0] : r <= 3 ? check.labels[1] : check.labels[2];
    }
    case "stability_changes":
    case "stability_biggest": {
      // E(with stability) − E(without) for every species each functional runs.
      let complete = true, any = false;
      const by = {};
      for (const c of conditions(exp).filter((x) => x.basis.id === check.plain)) {
        for (const s of speciesFor(exp, c)) {
          const a = num(state.results?.[`${c.method.id}|${check.plain}`]?.[s.id]?.energy);
          const b = num(state.results?.[`${c.method.id}|${check.stab}`]?.[s.id]?.energy);
          if (a === null || b === null) { complete = false; continue; }
          const d = (b - a) * HARTREE_TO_KCAL;
          if (d < -0.1) any = true;
          by[c.method.label] = Math.max(by[c.method.label] || 0, -d);
        }
      }
      if (check.type === "stability_changes") return any ? check.labels[0] : complete ? check.labels[1] : null;
      if (!complete) return null;
      return Object.entries(by).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
    }
    case "biggest_gain": {
      // Reaction where the small basis improves most on the large one (|ε| large − |ε| small).
      const gains = exp.reactions.map((r) => {
        const s = rows.find((q) => q.cond === `${check.method}|${check.small}` && q.reaction === r.id);
        const l = rows.find((q) => q.cond === `${check.method}|${check.large}` && q.reaction === r.id);
        return s && l ? { label: r.group || r.id, g: l.absError - s.absError } : null;
      });
      if (gains.some((g) => g === null)) return null;
      return gains.sort((a, b) => b.g - a.g)[0].label;
    }
    case "harder": {
      const cs = condsWith(exp, check);
      const v = check.reactions.map((rid) => {
        const rx = exp.reactions.find((r) => r.id === rid);
        const vals = cs.filter((c) => applies(c, rx)).map((c) => condError(exp, rows, c, { reaction: rid }));
        return !vals.length || vals.some((x) => x === null) ? null : mean(vals);
      });
      if (v.some((x) => x === null)) return null;
      if (Math.abs(v[0] - v[1]) < 0.25 * Math.max(v[0], v[1])) return check.labels[2];
      return v[0] > v[1] ? check.labels[0] : check.labels[1];
    }
    case "compare_abs": {
      const a = rows.find((r) => r.cond === check.a && r.reaction === check.reaction);
      const b = rows.find((r) => r.cond === check.b && r.reaction === check.reaction);
      if (!a || !b) return null;
      if (Math.abs(a.absError - b.absError) < (check.tol ?? 0.5)) return check.labels[2];
      return a.absError < b.absError ? check.labels[0] : check.labels[1];
    }
    case "range": {
      const r = rows.find((q) => q.reaction === check.reaction && (!check.cond || q.cond === check.cond));
      if (!r) return null;
      const i = check.bins.findIndex((b) => r.delta < b);
      return check.labels[i < 0 ? check.bins.length : i];
    }
    default:
      return null;
  }
}

export async function render(el, { exp, store }) {
  const preds = exp.predictions || [];
  if (!preds.length) return;

  // Some checks compare with the student's own earlier experiments.
  const others = {};
  const need = new Set(preds.flatMap((p) => p.check?.exps || []));
  await Promise.all([...need].map(async (id) => (others[id] = await loadOther(id))));

  const draw = () => {
    const st = store.state;
    const locked = !!st.predictions.locked_at;
    const list = h("div", { class: "pred-list" });
    for (const p of preds) {
      const val = st.predictions.values[p.id];
      const check = p.check?.type === "costliest" ? { ...p.check, options: p.options } : p.check;
      const auto = check && check.type && check.type !== "none";
      const observed = locked && auto ? evaluate(check, exp, st, others) : null;
      const sel = h("select", {
        class: "form-select form-select-sm pred-select",
        disabled: locked,
        "aria-label": "Your prediction",
        onchange: (e) => store.update((s) => (s.predictions.values[p.id] = e.target.value)),
      }, h("option", { value: "" }, "— choose —"), p.options.map((o) => h("option", { value: o, selected: o === val }, o)));

      let verdict = null;
      if (locked && auto) {
        if (observed === null) verdict = h("span", { class: "pred-pending" }, p.pending || "Your data will answer this once the results table is complete.");
        else
          verdict = h("span", { class: "pred-verdict " + (observed === val ? "match" : "miss") },
            observed === val ? "✔ Your data agrees: " : "✘ Your data says: ", h("strong", {}, observed));
      } else if (locked && p.note) {
        verdict = h("span", { class: "pred-pending", html: md(p.note) });
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
