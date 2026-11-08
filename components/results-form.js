// Results entry. Students type what they read in their Q-Chem outputs (total
// energy, SCF cycles, wall time, basis functions) and their own reaction
// energies. The form recomputes ΔE from their totals and flags disagreements
// WITHOUT showing the correct number. Pasting a block from a spreadsheet works.
//
// Experiments with "auto_delta": true (many reactions, arithmetic already
// practised) show the reaction energies computed by the page instead.
import {
  h, conditions, num, deltaStatus, fmt, loadJSON, loadOther, HARTREE_TO_KCAL, basisLabel, applies, speciesFor,
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
  const auto = !!exp.auto_delta;
  const tabs = [...fields.map((f) => ({ id: f, label: FIELD_INFO[f].tab })),
    { id: "delta", label: auto ? "Reaction energies (computed)" : "Reaction energies (kcal/mol)" }];
  let active = "energy";
  const rowHead = exp.condition_label || (exp.bases.length > 1 ? "Method / basis" : "Method");

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

  function outlierCheck(td, condKey, colId, err) {
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
      outlierCheck(td, condKey, colId, err);
    }
  }

  function refreshDeltaCells() {
    panel.querySelectorAll('input[data-field="delta"]').forEach((i) => cellState(i, i.dataset.cond, i.dataset.col, "delta"));
  }

  // Paste a rectangular block (tab/newline separated) starting at this cell.
  // Cells that don't apply (shown as —) are skipped, matching a spreadsheet
  // in which those cells are left empty.
  function onPaste(e) {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!/[\t\n]/.test(text.trim())) return;
    e.preventDefault();
    const start = e.target;
    const rows = text.replace(/\r/g, "").split("\n").filter((r, i, a) => r !== "" || i < a.length - 1);
    const grid = [...panel.querySelectorAll("tbody tr:not(.res-group)")].map((tr) => [...tr.querySelectorAll("td")].map((td) => td.querySelector("input")));
    const r0 = grid.findIndex((r) => r.includes(start));
    const c0 = grid[r0].indexOf(start);
    rows.forEach((line, dr) => {
      line.split("\t").forEach((v, dc) => {
        const inp = grid[r0 + dr]?.[c0 + dc];
        if (!inp) return;
        inp.value = v.trim();
        setVal(inp.dataset.cond, inp.dataset.col, inp.dataset.field, inp.value);
        cellState(inp, inp.dataset.cond, inp.dataset.col, inp.dataset.field);
      });
    });
    refreshDeltaCells();
    drawSummary();
  }

  function computedCell(c, rxn) {
    const st = deltaStatus(exp, store.state, c.key, rxn);
    if (st.status !== "ok") return h("td", { class: "num lab-muted", title: "Waiting for the total energies of this method" }, "·");
    const err = st.entered - rxn.ref;
    const td = h("td", { class: "num computed-cell" + (Math.abs(err) > 2 ? " err-big" : Math.abs(err) < 0.5 ? " err-small" : "") },
      st.entered.toFixed(2), h("span", { class: "cell-badge" }, (err >= 0 ? "+" : "") + err.toFixed(2)));
    td.title = `ΔE computed from your total energies; signed error vs reference ${err.toFixed(2)} kcal/mol`;
    outlierCheck(td, c.key, rxn.id, err);
    return td;
  }

  function drawPanel() {
    const field = active;
    const isDelta = field === "delta";
    const cols = isDelta
      ? exp.reactions.map((r) => ({ id: r.id, label: r.label, sub: `ref ${r.ref.toFixed(2)}` }))
      : exp.species.map((s) => ({ id: s.id, label: s.label }));
    const thead = h("thead", {}, h("tr", {}, h("th", { scope: "col" }, rowHead),
      cols.map((c) => h("th", { scope: "col" }, c.label, c.sub ? h("div", { class: "th-sub" }, c.sub) : null))));
    const tbody = h("tbody");
    let lastBasis = null;
    for (const c of conds) {
      if (exp.bases.length > 1 && c.basis.id !== lastBasis) {
        lastBasis = c.basis.id;
        tbody.append(h("tr", { class: "res-group" }, h("th", { colspan: cols.length + 1, scope: "rowgroup" }, basisLabel(c.basis))));
      }
      const tr = h("tr", {}, h("th", { scope: "row" }, exp.bases.length > 1 ? c.method.label : c.label));
      const runs = new Set(speciesFor(exp, c).map((s) => s.id));
      for (const col of cols) {
        const rxn = isDelta ? exp.reactions.find((r) => r.id === col.id) : null;
        const usable = isDelta ? applies(c, rxn) : runs.has(col.id);
        if (!usable) {
          tr.append(h("td", { class: "na-cell", title: "Not part of this calculation" }, "—"));
          continue;
        }
        if (isDelta && auto) {
          tr.append(computedCell(c, rxn));
          continue;
        }
        const input = h("input", {
          type: "text",
          inputmode: field === "scf" || field === "nbf" ? "numeric" : "decimal",
          class: "res-input",
          value: getVal(c.key, col.id, field),
          "aria-label": `${isDelta ? "Reaction energy" : FIELD_INFO[field].tab} for ${col.label}, ${c.label}`,
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
        tr.append(h("td", {}, input, isDelta ? h("span", { class: "cell-badge", "aria-hidden": "true" }) : null));
      }
      tbody.append(tr);
    }
    panel.replaceChildren(h("div", { class: "table-responsive res-scroll" }, h("table", { class: "res-table" }, thead, tbody)));
    panel.querySelectorAll("input").forEach((i) => cellState(i, i.dataset.cond, i.dataset.col, i.dataset.field));
    if (isDelta && auto) {
      help.innerHTML = `In this experiment the page computes every reaction energy for you from your total energies, ΔE = Σ ν<sub>i</sub>E<sub>i</sub> (1 E<sub>h</sub> = ${HARTREE_TO_KCAL} kcal/mol). Each cell shows ΔE and, in small type, the signed error vs the reference.`;
    } else if (isDelta) {
      help.innerHTML = `Enter ΔE = Σ ν<sub>i</sub>E<sub>i</sub> (ν > 0 for products, ν < 0 for reactants) in kcal/mol (1 E<sub>h</sub> = ${HARTREE_TO_KCAL} kcal/mol). Green = consistent with your energies (the small number is your signed error vs the reference); red = inconsistent; grey = energies missing.`;
    } else {
      help.innerHTML = `Where to find it in the output: ${FIELD_INFO[field].hint}. Tip: you can paste a whole block copied from Excel.` +
        (conds.some((c) => c.species) ? " Cells marked — are not part of that calculation." : "");
    }
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
      for (const s of speciesFor(exp, c)) {
        total += 1;
        if (num(store.state.results?.[c.key]?.[s.id]?.energy) !== null) filled += 1;
      }
      for (const r of exp.reactions) {
        if (!applies(c, r)) continue;
        nd += 1;
        const st = deltaStatus(exp, store.state, c.key, r).status;
        if (st === "ok") ok += 1;
        if (st === "mismatch") bad += 1;
      }
    }
    summary.replaceChildren(
      h("span", {}, `Energies: ${filled}/${total}`), " · ",
      h("span", { class: ok === nd ? "txt-ok" : "" }, `Reaction energies ${auto ? "computed" : "verified"}: ${ok}/${nd}`),
      ...(bad ? [h("span", { class: "txt-bad" }, ` · ${bad} to fix`)] : []));
  }

  // Import results already entered in earlier experiments (same browser).
  let importBox = null;
  if (exp.import) {
    const status = h("span", { class: "lab-small lab-muted" });
    const btn = h("button", { type: "button", class: "btn btn-outline-primary btn-sm" }, exp.import.label || "Import from earlier experiments");
    btn.onclick = async () => {
      let n = 0;
      const found = [];
      for (const src of exp.import.from) {
        const { state } = await loadOther(src);
        for (const ck of exp.import.conditions) {
          const block = state.results?.[ck];
          if (!block) continue;
          for (const [sid, vals] of Object.entries(block)) {
            if (!exp.species.some((s) => s.id === sid) || num(vals?.energy) === null) continue;
            if (num(store.state.results?.[ck]?.[sid]?.energy) !== null) continue; // never overwrite
            store.update((s) => {
              s.results[ck] = s.results[ck] || {};
              s.results[ck][sid] = Object.assign({}, s.results[ck][sid], vals);
            });
            n += 1;
          }
        }
        if (Object.keys(state.results || {}).length) found.push(src.replace("ex0", "Exp. "));
      }
      status.textContent = n
        ? `Imported ${n} energies from ${found.join(", ")}. Existing entries were not overwritten.`
        : "Nothing new to import: either it's already here, or this browser has no saved results for those experiments.";
      drawPanel();
      drawSummary();
    };
    importBox = h("div", { class: "res-import" }, btn, status);
  }

  drawTabs();
  drawPanel();
  drawSummary();
  let seen = store.version;
  store.subscribe(() => {
    if (store.version !== seen) { seen = store.version; drawPanel(); drawSummary(); }
    else if (active === "delta" && auto) drawPanel();
  });

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Your results"), h("span", { class: "lab-spacer" }), summary),
    importBox, tabBar, help, panel,
    classData ? h("p", { class: "lab-small lab-muted" }, `Class comparison is on: amber cells are far from the median of ${classData.n} submissions.`) : null));
}
