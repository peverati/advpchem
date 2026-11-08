// Results entry. Students type what they read in their Q-Chem outputs (total
// energy, SCF cycles, wall time, basis functions) and their own reaction
// energies. The form recomputes ΔE from their totals and flags disagreements
// WITHOUT showing the correct number. Pasting a block from a spreadsheet works.
import {
  h, conditions, num, deltaStatus, fmt, loadJSON, HARTREE_TO_KCAL,
} from "./core.js";

const FIELD_INFO = {
  energy: { tab: "Total energy (Eh)", hint: "“Total energy in the final basis set”", check: (x) => x < 0, bad: "Total energies are negative numbers in hartree." },
  scf: { tab: "SCF cycles", hint: "number of the last SCF cycle", check: (x) => Number.isInteger(x) && x > 0 && x < 500, bad: "A whole number of cycles, e.g. 12." },
  time: { tab: "Wall time (s)", hint: "“Total job time … s(wall)”", check: (x) => x > 0, bad: "Seconds, a positive number." },
  nbf: { tab: "Basis functions", hint: "“There are … basis functions”", check: (x) => Number.isInteger(x) && x > 0, bad: "A whole number, e.g. 41." },
};

export async function render(el, { exp, store, settings }) {
  const conds = conditions(exp);
  const fields = exp.fields || ["energy", "scf", "time"];
  const tabs = [...fields.map((f) => ({ id: f, label: FIELD_INFO[f].tab })), { id: "delta", label: "Reaction energies (kcal/mol)" }];
  let active = "energy";

  // Optional class comparison, only after the instructor releases it.
  let classData = null;
  if (settings.release_class_results) classData = await loadJSON(`data/class/${exp.id}.json`).catch(() => null);

  const tabBar = h("div", { class: "res-tabs", role: "tablist" });
  const panel = h("div", { class: "res-panel" });
  const summary = h("div", { class: "res-summary" });
  const help = h("p", { class: "lab-small lab-muted res-help" });

  const getVal = (condKey, colId, field) =>
    field === "delta" ? store.state.deltas?.[condKey]?.[colId] ?? "" : store.state.results?.[condKey]?.[colId]?.[field] ?? "";

  const setVal = (condKey, colId, field, v) =>
    store.update((s) => {
      if (field === "delta") {
        s.deltas[condKey] = s.deltas[condKey] || {};
        s.deltas[condKey][colId] = v;
      } else {
        s.results[condKey] = s.results[condKey] || {};
        s.results[condKey][colId] = s.results[condKey][colId] || {};
        s.results[condKey][colId][field] = v;
      }
    });

  function cellState(input, condKey, colId, field) {
    const td = input.closest("td");
    td.classList.remove("is-ok", "is-bad", "is-mismatch", "is-incomplete", "is-outlier");
    td.title = "";
    const badge = td.querySelector(".cell-badge");
    if (badge) badge.textContent = "";
    const raw = input.value.trim();
    if (!raw) return;
    const x = num(raw);
    if (field !== "delta") {
      if (x === null || !FIELD_INFO[field].check(x)) {
        td.classList.add("is-bad");
        td.title = FIELD_INFO[field].bad;
      }
      return;
    }
    const rxn = exp.reactions.find((r) => r.id === colId);
    const st = deltaStatus(exp, store.state, condKey, rxn);
    if (x === null) {
      td.classList.add("is-bad");
      td.title = "Enter a number in kcal/mol.";
    } else if (st.status === "incomplete") {
      td.classList.add("is-incomplete");
      td.title = "Enter all the total energies for this method first, so the value can be checked.";
    } else if (st.status === "mismatch") {
      td.classList.add("is-mismatch");
      td.title = "This doesn't agree with your own total energies. Check: ΔE = Σ νᵢEᵢ with ν > 0 for products and ν < 0 for reactants, the size of each coefficient, and 1 Eh = 627.5095 kcal/mol.";
    } else if (st.status === "ok") {
      td.classList.add("is-ok");
      const err = x - rxn.ref;
      if (badge) badge.textContent = (err >= 0 ? "+" : "") + err.toFixed(2);
      td.title = `Agrees with your total energies. Signed error vs reference: ${err.toFixed(2)} kcal/mol`;
      // Class stats are signed errors (ΔE − ref), so compare errors with errors.
      const c = classData?.stats?.[condKey]?.[colId];
      if (c && c.n >= 4) {
        const spread = Math.max(1.0, 3 * (c.q3 - c.q1));
        if (Math.abs(err - c.median) > spread) {
          td.classList.add("is-outlier");
          td.title += ` · Your error is far from the class median error (${c.median >= 0 ? "+" : ""}${c.median.toFixed(2)}). Double-check the multiplicity, the basis and that the SCF converged.`;
        }
      }
    }
  }

  function refreshDeltaCells() {
    panel.querySelectorAll('input[data-field="delta"]').forEach((i) => cellState(i, i.dataset.cond, i.dataset.col, "delta"));
  }

  // Paste a rectangular block (tab/newline separated) starting at this cell.
  function onPaste(e) {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!/[\t\n]/.test(text.trim())) return;
    e.preventDefault();
    const start = e.target;
    const rows = text.replace(/\r/g, "").split("\n").filter((r, i, a) => r !== "" || i < a.length - 1);
    const allInputs = [...panel.querySelectorAll("tbody tr")].map((tr) => [...tr.querySelectorAll("input")]);
    const r0 = allInputs.findIndex((r) => r.includes(start));
    const c0 = allInputs[r0].indexOf(start);
    rows.forEach((line, dr) => {
      line.split("\t").forEach((v, dc) => {
        const inp = allInputs[r0 + dr]?.[c0 + dc];
        if (!inp) return;
        inp.value = v.trim();
        setVal(inp.dataset.cond, inp.dataset.col, inp.dataset.field, inp.value);
        cellState(inp, inp.dataset.cond, inp.dataset.col, inp.dataset.field);
      });
    });
    refreshDeltaCells();
    drawSummary();
  }

  function drawPanel() {
    const field = active;
    const cols = field === "delta" ? exp.reactions.map((r) => ({ id: r.id, label: r.label, sub: `ref ${r.ref.toFixed(2)}` })) : exp.species.map((s) => ({ id: s.id, label: s.label }));
    const thead = h("thead", {}, h("tr", {}, h("th", { scope: "col" }, exp.bases.length > 1 ? "Method / basis" : "Method"),
      cols.map((c) => h("th", { scope: "col" }, c.label, c.sub ? h("div", { class: "th-sub" }, c.sub) : null))));
    const tbody = h("tbody");
    let lastBasis = null;
    for (const c of conds) {
      if (exp.bases.length > 1 && c.basis.id !== lastBasis) {
        lastBasis = c.basis.id;
        tbody.append(h("tr", { class: "res-group" }, h("th", { colspan: cols.length + 1, scope: "rowgroup" }, c.basis.id)));
      }
      const tr = h("tr", {}, h("th", { scope: "row" }, exp.bases.length > 1 ? c.method.label : c.label));
      for (const col of cols) {
        const input = h("input", {
          type: "text",
          inputmode: field === "scf" || field === "nbf" ? "numeric" : "decimal",
          class: "res-input",
          value: getVal(c.key, col.id, field),
          "aria-label": `${field === "delta" ? "Reaction energy" : FIELD_INFO[field].tab} for ${col.label}, ${c.label}`,
          dataset: { cond: c.key, col: col.id, field },
          autocomplete: "off",
          spellcheck: "false",
        });
        input.addEventListener("input", () => {
          setVal(c.key, col.id, field, input.value);
          cellState(input, c.key, col.id, field);
          drawSummary();
        });
        input.addEventListener("paste", onPaste);
        const td = h("td", {}, input, field === "delta" ? h("span", { class: "cell-badge", "aria-hidden": "true" }) : null);
        tr.append(td);
      }
      tbody.append(tr);
    }
    panel.replaceChildren(h("div", { class: "table-responsive res-scroll" }, h("table", { class: "res-table" }, thead, tbody)));
    panel.querySelectorAll("input").forEach((i) => cellState(i, i.dataset.cond, i.dataset.col, i.dataset.field));
    help.innerHTML = field === "delta"
      ? `Enter ΔE = Σ ν<sub>i</sub>E<sub>i</sub> (ν > 0 for products, ν < 0 for reactants) in kcal/mol (1 E<sub>h</sub> = ${HARTREE_TO_KCAL} kcal/mol). Green = consistent with your energies (the small number is your signed error vs the reference); red = inconsistent; grey = energies missing.`
      : `Where to find it in the output: ${FIELD_INFO[field].hint}. Tip: you can paste a whole block copied from Excel.`;
  }

  function drawTabs() {
    tabBar.replaceChildren(...tabs.map((t) =>
      h("button", {
        type: "button", role: "tab", class: "res-tab" + (t.id === active ? " active" : ""), "aria-selected": String(t.id === active),
        onclick: () => { active = t.id; drawTabs(); drawPanel(); },
      }, t.label)));
  }

  function drawSummary() {
    let filled = 0, total = 0, ok = 0, bad = 0, nd = 0;
    for (const c of conds) {
      for (const s of exp.species) {
        total += 1;
        if (num(store.state.results?.[c.key]?.[s.id]?.energy) !== null) filled += 1;
      }
      for (const r of exp.reactions) {
        nd += 1;
        const st = deltaStatus(exp, store.state, c.key, r).status;
        if (st === "ok") ok += 1;
        if (st === "mismatch") bad += 1;
      }
    }
    summary.replaceChildren(
      h("span", {}, `Energies: ${filled}/${total}`), " · ",
      h("span", { class: ok === nd ? "txt-ok" : "" }, `Reaction energies verified: ${ok}/${nd}`),
      ...(bad ? [h("span", { class: "txt-bad" }, ` · ${bad} to fix`)] : []));
  }

  drawTabs();
  drawPanel();
  drawSummary();
  let seen = store.version;
  store.subscribe(() => {
    if (store.version !== seen) { seen = store.version; drawPanel(); drawSummary(); }
  });

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Your results"), h("span", { class: "lab-spacer" }), summary),
    tabBar, help, panel,
    classData ? h("p", { class: "lab-small lab-muted" }, `Class comparison is on: amber cells are far from the median of ${classData.n} submissions.`) : null));
}
