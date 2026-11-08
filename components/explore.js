// "Explore your data": live tables and charts built only from the student's
// verified results. Which explorers appear is set by exp.explore in the JSON.
// Shared explorers live here; experiment-specific ones in ./explorers/*.js.
import { h, conditions, verifiedRows, groupBy, mae, mean, num, fmt, applies, speciesFor, expectedReactions } from "./core.js";

let PlotLib = null;
export async function Plot() {
  if (!PlotLib) PlotLib = await import("https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.16/+esm");
  return PlotLib;
}

export const RUNG_ORDER = ["LSDA", "GGA", "meta-GGA", "hybrid GGA", "hybrid meta-GGA", "Hartree–Fock"];
export const RUNG_COLORS = ["#8c6d31", "#e6550d", "#31a354", "#3182bd", "#756bb1", "#636363"];

export const EMPTY = "Enter and verify reaction energies above; this view fills in as you go.";
export const empty = (text = EMPTY) => h("p", { class: "lab-muted" }, text);

// MAE of one condition, only when all of its reactions are verified.
export function condMAE(exp, rows, cond, filter = () => true) {
  const want = (exp.reactions || []).filter((r) => applies(cond, r) && filter(r));
  const rs = rows.filter((r) => r.cond === cond.key && want.some((w) => w.id === r.reaction));
  return want.length && rs.length === want.length ? mae(rs.map((r) => r.error)) : null;
}

// ---------------------------------------------------------- error table ----
function errorTable(exp, state) {
  const rows = verifiedRows(exp, state);
  if (!rows.length) return empty();
  const by = groupBy(rows, (r) => r.cond);
  const head = exp.condition_label || (exp.bases.length > 1 ? "Method / basis" : "Method");
  const thead = h("thead", {}, h("tr", {}, h("th", {}, head),
    exp.reactions.map((r) => h("th", {}, r.id, h("div", { class: "th-sub" }, "signed error"))), h("th", {}, "MAE")));
  const tbody = h("tbody");
  for (const c of conditions(exp)) {
    const rs = by.get(c.key) || [];
    const cells = exp.reactions.map((r) => {
      if (!applies(c, r)) return h("td", { class: "num na-cell" }, "—");
      const x = rs.find((q) => q.reaction === r.id);
      return h("td", { class: "num" + (x ? (Math.abs(x.error) > 2 ? " err-big" : Math.abs(x.error) < 0.5 ? " err-small" : "") : "") }, x ? (x.error >= 0 ? "+" : "") + x.error.toFixed(2) : "·");
    });
    const m = rs.length === expectedReactions(exp, c) ? mae(rs.map((r) => r.error)) : null;
    tbody.append(h("tr", {}, h("th", { scope: "row" }, c.label), cells, h("td", { class: "num strong" }, fmt(m))));
  }
  return h("div", { class: "table-responsive res-scroll" }, h("table", { class: "res-table compact" }, thead, tbody),
    h("p", { class: "lab-small lab-muted" }, "Signed error ε = ΔE(computed) − ΔE(reference), in kcal/mol. MAE = mean absolute error. Green < 0.5, red > 2 kcal/mol."));
}

// --------------------------------------------------------- explorers -------
const EXPLORERS = {
  // Ex1: |ε| vs ζ, one line per method, one panel per basis-set family.
  async "error-vs-zeta"(exp, state) {
    const rows = verifiedRows(exp, state);
    if (!rows.length) return empty();
    const P = await Plot();
    const zl = { 2: "DZ", 3: "TZ", 4: "QZ" };
    return P.plot({
      title: "How the error changes as the basis grows",
      width: 720, height: 320, marginLeft: 55,
      fx: { label: null },
      x: { label: "basis-set size (ζ)", domain: [2, 3, 4], tickFormat: (d) => zl[d], ticks: [2, 3, 4] },
      y: { label: "|ε| (kcal/mol)", grid: true, zero: true },
      color: { legend: true, domain: exp.methods.map((m) => m.label) },
      marks: [
        P.lineY(rows, { fx: "family", x: "zeta", y: "absError", stroke: "method", sort: "zeta", strokeWidth: 2 }),
        P.dot(rows, { fx: "family", x: "zeta", y: "absError", fill: "method", r: 4, tip: { format: { fx: false } }, channels: { basis: "basis", "signed ε": "error" } }),
      ],
    });
  },

  // Ex1: cost scaling with the number of basis functions (log-log fit).
  async scaling(exp, state) {
    const pts = [];
    for (const c of conditions(exp))
      for (const s of speciesFor(exp, c)) {
        const r = state.results?.[c.key]?.[s.id];
        const t = num(r?.time), n = num(r?.nbf);
        if (t > 0 && n > 0) pts.push({ method: c.method.label, nbf: n, time: t, label: `${s.label} / ${c.basis.id}` });
      }
    if (pts.length < 3) return empty("Enter wall times and numbers of basis functions to see how the cost scales.");
    const fits = [];
    for (const [m, ps] of groupBy(pts, (p) => p.method)) {
      const xs = ps.map((p) => Math.log(p.nbf)), ys = ps.map((p) => Math.log(p.time));
      if (new Set(xs).size < 3) continue;
      const mx = mean(xs), my = mean(ys);
      const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      fits.push({ method: m, slope });
    }
    const P = await Plot();
    const plot = P.plot({
      title: "Wall time vs number of basis functions (log–log)",
      width: 720, height: 340, marginLeft: 55,
      x: { type: "log", label: "number of basis functions N", grid: true, tickFormat: "~g" },
      y: { type: "log", label: "wall time (s)", grid: true, tickFormat: "~g" },
      color: { legend: true, domain: exp.methods.map((m) => m.label) },
      marks: [
        P.dot(pts, { x: "nbf", y: "time", fill: "method", r: 4, tip: true, channels: { job: "label" } }),
        P.linearRegressionY(pts, { x: "nbf", y: "time", stroke: "method", ci: 0 }),
      ],
    });
    return h("div", {}, plot,
      h("p", { class: "lab-small" }, "Measured exponent n in time ∝ Nⁿ (slope of each line): ",
        fits.length ? fits.map((f, i) => [i ? " · " : "", h("strong", {}, f.method), ` n ≈ ${f.slope.toFixed(2)}`]) : "need at least three basis sizes per method."),
      h("p", { class: "lab-small lab-muted" }, "Small jobs are dominated by fixed overhead (start-up, file I/O), which flattens the slope. Which points would you trust most?"));
  },

  // Ex3+: signed errors per reaction, coloured by rung of Jacob's ladder.
  // Reactions with a "group" field get one chart per group.
  async "signed-errors"(exp, state) {
    const rows = verifiedRows(exp, state);
    if (!rows.length) return empty();
    const P = await Plot();
    const multi = exp.bases.length > 1;
    const order = conditions(exp).map((c) => c.label);
    const yKey = multi ? "condLabel" : "method";
    const groups = [...new Set(exp.reactions.map((r) => r.group || ""))];
    const plots = groups.map((g) => {
      const rs = rows.filter((r) => (r.group || "") === g);
      if (!rs.length) return null;
      const yDomain = order.filter((l) => rs.some((r) => r[yKey] === l));
      return P.plot({
        title: g ? `Signed errors: ${g}` : "Signed error for each reaction, coloured by rung of Jacob’s ladder",
        width: 760, height: 70 + 20 * yDomain.length, marginLeft: multi ? 190 : 85,
        fx: { label: null },
        y: { domain: yDomain, label: null },
        x: { label: "ε (kcal/mol)", grid: true },
        color: { legend: true, domain: RUNG_ORDER, range: RUNG_COLORS },
        marks: [
          P.ruleX([0]),
          P.barX(rs, { fx: "reaction", y: yKey, x: "error", fill: "rung", tip: true, channels: { "ΔE": "delta", ref: "ref" } }),
        ],
      });
    });
    return h("div", {}, plots);
  },

  // Ex3+: cost (time per SCF cycle) vs accuracy (MAE).
  async "cost-accuracy"(exp, state) {
    const rows = verifiedRows(exp, state);
    const pts = [];
    const timing = [];
    for (const c of conditions(exp)) {
      const per = [];
      const sp = speciesFor(exp, c);
      for (const s of sp) {
        const r = state.results?.[c.key]?.[s.id];
        const t = num(r?.time), n = num(r?.scf);
        if (t > 0 && n > 0) per.push(t / n);
      }
      const tpc = per.length === sp.length ? mean(per) : null;
      const m = condMAE(exp, rows, c);
      timing.push({ label: c.label, tpc });
      if (tpc !== null && m !== null) pts.push({ method: c.label, rung: c.method.rung, tpc, mae: m });
    }
    const table = h("div", { class: "table-responsive" }, h("table", { class: "res-table compact" },
      h("thead", {}, h("tr", {}, h("th", {}, "Method"), h("th", {}, "time per SCF cycle (s)", h("div", { class: "th-sub" }, "mean over all molecules")))),
      h("tbody", {}, timing.map((t) => h("tr", {}, h("th", { scope: "row" }, t.label), h("td", { class: "num" }, t.tpc === null ? "·" : t.tpc.toFixed(3)))))));
    if (!pts.length) return h("div", {}, table, empty("Complete the SCF cycles, wall times and reaction energies for a method to place it on the cost-vs-accuracy plot."));
    const P = await Plot();
    const plot = P.plot({
      title: "Cost vs accuracy: the ideal method sits bottom-left",
      width: 720, height: 380, marginLeft: 55, marginTop: 34, marginRight: 30, inset: 18,
      x: { type: "log", label: "time per SCF cycle (s)", grid: true, tickFormat: "~g" },
      y: { label: "MAE (kcal/mol)", grid: true, zero: true },
      color: { legend: true, domain: RUNG_ORDER, range: RUNG_COLORS },
      marks: [
        P.dot(pts, { x: "tpc", y: "mae", fill: "rung", r: 6, tip: true, channels: { method: "method" } }),
        P.text(pts, { x: "tpc", y: "mae", text: "method", dy: -11, fontSize: 10 }),
      ],
    });
    return h("div", {}, plot, table);
  },
};

// Experiment-specific explorers, loaded on demand.
const MODULES = {
  "d4-pairs": "dispersion", "dispersion-dimers": "dispersion",
  "relative-errors": "difficulty", "cao-spotlight": "difficulty", "difficulty-ladder": "difficulty",
  "basis-mae": "basis", "anomaly-spotter": "basis", "nbf-counter": "basis",
  "ar2-curves": "grids", "grid-wiggles": "grids", "grid-timing": "grids",
  "stability-lowering": "stability",
  "result-card": "custom",
};

async function explorer(name) {
  if (EXPLORERS[name]) return EXPLORERS[name];
  const mod = MODULES[name];
  if (!mod) return null;
  const m = await import(`./explorers/${mod}.js`);
  return m.EXPLORERS[name];
}

export async function render(el, ctx) {
  const { exp, store } = ctx;
  const names = exp.explore || [];
  const showTable = exp.explore_table !== false;
  const tableBox = h("div");
  const boxes = names.map(() => h("div", { class: "explore-chart" }));
  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Explore your data"),
      h("span", { class: "lab-muted" }, " · updates live from the verified values above")),
    showTable ? h("h4", { class: "explore-h" }, "Error summary") : null, showTable ? tableBox : null,
    ...boxes));
  let running = false, again = false;
  const draw = async () => {
    if (running) { again = true; return; }
    running = true;
    if (showTable) tableBox.replaceChildren(errorTable(exp, store.state));
    for (let i = 0; i < names.length; i++) {
      try {
        const fn = await explorer(names[i]);
        if (!fn) continue;
        boxes[i].replaceChildren(await fn(exp, store.state, { store, redraw: draw }));
      } catch (err) {
        console.error(err);
        boxes[i].replaceChildren(h("p", { class: "lab-error" }, `Chart failed: ${err.message}`));
      }
    }
    running = false;
    if (again) { again = false; draw(); }
  };
  await draw();
  store.subscribe(draw);
}
