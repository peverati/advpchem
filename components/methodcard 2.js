// Experiment 10: the "method card". The student chooses and justifies every
// setting, sees a cost estimate against the free server's 10-minute limit,
// and gets the three Q-Chem inputs for their own choice.
import { h, loadText, downloadBlob } from "./core.js";
import { buildInput, parseXYZ, estimateNbf, risk } from "./qchem-input.js";

// Q-Chem METHOD keywords. "builtin" = the functional already contains a
// dispersion treatment (VV10, -D) so adding D4 on top would double count.
const FUNCTIONALS = [
  { id: "wB97M-V", label: "ωB97M-V", rung: "range-separated hybrid meta-GGA", builtin: "VV10" },
  { id: "wB97X-V", label: "ωB97X-V", rung: "range-separated hybrid GGA", builtin: "VV10" },
  { id: "wB97X-D", label: "ωB97X-D", rung: "range-separated hybrid GGA", builtin: "a -D correction" },
  { id: "B97M-V", label: "B97M-V", rung: "meta-GGA", builtin: "VV10" },
  { id: "B97M-rV", label: "B97M-rV", rung: "meta-GGA", builtin: "rVV10" },
  { id: "MN15", label: "MN15", rung: "hybrid meta-NGA" },
  { id: "MN15-L", label: "MN15-L", rung: "meta-NGA" },
  { id: "M06", label: "M06", rung: "hybrid meta-GGA" },
  { id: "M06-L", label: "M06-L", rung: "meta-GGA" },
  { id: "M06-2X", label: "M06-2X", rung: "hybrid meta-GGA" },
  { id: "SCAN", label: "SCAN", rung: "meta-GGA" },
  { id: "TPSSh", label: "TPSSh", rung: "hybrid meta-GGA" },
  { id: "PBE0", label: "PBE0", rung: "hybrid GGA" },
  { id: "B3LYP", label: "B3LYP", rung: "hybrid GGA" },
  { id: "PBE", label: "PBE", rung: "GGA" },
  { id: "BP86", label: "BP86", rung: "GGA" },
];
const BASES = [
  { id: "def2-SVP", zeta: 2 },
  { id: "def2-TZVP", zeta: 3 },
  { id: "def2-TZVPP", zeta: 3 },
  { id: "def2-QZVP", zeta: 4 },
];
const GRIDS = [
  { id: "", label: "program default" },
  { id: "2", label: "SG-2" },
  { id: "3", label: "SG-3" },
  { id: "000099000590", label: "(99,590)" },
];

export async function render(el, { exp, store }) {
  const geoms = {};
  await Promise.all(exp.species.map(async (s) => (geoms[s.id] = parseXYZ(await loadText(`data/geometries/${s.dir || exp.geometry_dir}/${s.file}`)))));
  const def = { functional: "", other: "", dispersion: "none", basis: "def2-TZVP", grid: "", stability: true, why_functional: "", why_basis: "", why_settings: "" };
  const card = () => Object.assign({}, def, store.state.extra.methodcard);
  const save = (patch) => { store.update((s) => (s.extra.methodcard = Object.assign(card(), patch))); refresh(); };

  const c0 = card();
  const funSel = h("select", { class: "form-select form-select-sm", "aria-label": "functional" },
    h("option", { value: "" }, "— choose a functional —"),
    FUNCTIONALS.map((f) => h("option", { value: f.id, selected: f.id === c0.functional }, `${f.label} (${f.rung})`)),
    h("option", { value: "other", selected: c0.functional === "other" }, "Other (type the Q-Chem keyword)…"));
  const other = h("input", { class: "form-control form-control-sm", placeholder: "Q-Chem METHOD keyword", value: c0.other });
  const dispSel = h("select", { class: "form-select form-select-sm" }, [["none", "none"], ["D4", "-D4 (Grimme D4)"]].map(([v, l]) => h("option", { value: v, selected: v === c0.dispersion }, l)));
  const basSel = h("select", { class: "form-select form-select-sm" }, BASES.map((b) => h("option", { value: b.id, selected: b.id === c0.basis }, b.id)));
  const gridSel = h("select", { class: "form-select form-select-sm" }, GRIDS.map((g) => h("option", { value: g.id, selected: g.id === c0.grid }, g.label)));
  const stab = h("input", { type: "checkbox", class: "form-check-input", id: "mc-stab", checked: c0.stability });
  const why = (key, ph) => {
    const t = h("textarea", { class: "form-control form-control-sm", rows: 2, placeholder: ph });
    t.value = c0[key];
    t.addEventListener("input", () => store.update((s) => (s.extra.methodcard = Object.assign(card(), { [key]: t.value })), { silent: true }));
    return t;
  };
  const wf = why("why_functional", "Why this functional? Cite a benchmark (e.g. GMTKN55, the Minnesota database, MGCDB84) and what you saw in Experiments 3–9.");
  const wb = why("why_basis", "Why this basis set? Think about Experiments 1 and 6, and the 10-minute limit.");
  const ws = why("why_settings", "Why this dispersion treatment, grid and stability setting?");
  const warn = h("div", { class: "mc-warn", "aria-live": "polite" });
  const cost = h("div", { class: "mc-cost" });
  const inputs = h("div", { class: "mc-inputs" });

  funSel.onchange = () => save({ functional: funSel.value });
  other.oninput = () => save({ other: other.value.trim() });
  dispSel.onchange = () => save({ dispersion: dispSel.value });
  basSel.onchange = () => save({ basis: basSel.value });
  gridSel.onchange = () => save({ grid: gridSel.value });
  stab.onchange = () => save({ stability: stab.checked });

  function condition(c) {
    const f = FUNCTIONALS.find((x) => x.id === c.functional);
    const methodKw = c.functional === "other" ? c.other : c.functional;
    const rem = { METHOD: methodKw };
    if (c.dispersion === "D4") rem.DFT_D = "D4";
    const brem = {};
    if (c.grid) brem.XC_GRID = c.grid;
    if (c.stability) brem.INTERNAL_STABILITY = "TRUE";
    const basis = BASES.find((b) => b.id === c.basis);
    return {
      key: "custom|custom",
      method: { id: methodKw || "custom", label: (f?.label || methodKw || "?") + (c.dispersion === "D4" ? "-D4" : ""), rem },
      basis: { id: c.basis, zeta: basis.zeta, rem: brem },
      label: "your method",
    };
  }

  function refresh() {
    const c = card();
    other.hidden = c.functional !== "other";
    const f = FUNCTIONALS.find((x) => x.id === c.functional);
    const msgs = [];
    if (f?.builtin && c.dispersion === "D4") msgs.push(`${f.label} already includes ${f.builtin}. Adding -D4 on top would count dispersion twice.`);
    if (/^M0|^MN|^M1/.test(c.functional) && c.dispersion === "D4") msgs.push("D4 parameters may not exist for this Minnesota functional in Q-Chem; check the manual, and justify the choice.");
    if (!c.stability) msgs.push("Pd(0) complexes are closed-shell, but Experiment 8 showed why a stability check is cheap insurance.");
    if (/^M0|^MN|^M1|SCAN/.test(c.functional) && !c.grid) msgs.push("Meta-GGAs can be grid-sensitive (Experiment 7). Consider choosing the grid explicitly.");
    warn.replaceChildren(...msgs.map((m) => h("div", {}, "⚠ ", m)));

    const methodKw = c.functional === "other" ? c.other : c.functional;
    if (!methodKw) {
      cost.replaceChildren(h("p", { class: "lab-small lab-muted" }, "Choose a functional to see the cost estimate and your inputs."));
      inputs.replaceChildren();
      return;
    }
    const cond = condition(c);
    cost.replaceChildren(h("div", { class: "table-responsive" }, h("table", { class: "res-table compact" },
      h("thead", {}, h("tr", {}, h("th", {}, "species"), h("th", {}, "≈ basis functions"), h("th", {}, "10-minute limit"))),
      h("tbody", {}, exp.species.map((s) => {
        const g = geoms[s.id];
        const r = risk(g.atoms, cond.basis, cond.method);
        return h("tr", {}, h("th", {}, s.label), h("td", { class: "num" }, `~${estimateNbf(g.atoms, cond.basis)}`), h("td", {}, h("span", { class: `risk risk-${r.level}` }, r.text)));
      })))),
      h("p", { class: "lab-small lab-muted" }, "Rough estimates. If a job is killed at 10 minutes, step down the basis or grid and explain the compromise in your report."));
    const texts = exp.species.map((s) => ({ s, text: buildInput(exp, cond, s, geoms[s.id]) }));
    const zip = h("button", { type: "button", class: "btn btn-primary btn-sm" }, "⬇ My three inputs (.zip)");
    zip.onclick = async () => {
      if (!window.JSZip) return alert("Zip library not loaded.");
      const z = new window.JSZip();
      texts.forEach(({ s, text }) => z.file(`ex10_${s.id}.in`, text));
      downloadBlob(await z.generateAsync({ type: "blob" }), "ex10_my_method_inputs.zip");
    };
    inputs.replaceChildren(h("div", { class: "lab-card-head" }, h("span", { class: "strong" }, "Your Q-Chem inputs"), h("span", { class: "lab-spacer" }), zip),
      ...texts.map(({ s, text }) => h("details", {}, h("summary", {}, s.label), h("pre", { class: "job-preview" }, text))));
  }

  el.replaceChildren(h("div", { class: "lab-card methodcard" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Method card"), h("span", { class: "lab-muted" }, " · your choices, your reasons")),
    h("div", { class: "mc-grid" },
      h("label", {}, "Functional", funSel, other),
      h("label", {}, "Dispersion", dispSel),
      h("label", {}, "Basis set", basSel, h("span", { class: "lab-small lab-muted" }, "Pd gets the def2 ECP automatically")),
      h("label", {}, "Integration grid", gridSel),
      h("label", { class: "form-check mc-check" }, stab, h("span", { class: "form-check-label" }, " Stability analysis"))),
    warn,
    h("div", { class: "mc-why" },
      h("label", {}, "Why this functional?", wf),
      h("label", {}, "Why this basis set?", wb),
      h("label", {}, "Why these other settings?", ws)),
    h("h4", { class: "explore-h" }, "Cost check"), cost,
    inputs));
  refresh();
}
