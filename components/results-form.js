// Results entry. Students type what they read in their Q-Chem outputs (total
// energy, SCF cycles, wall time, basis functions) and their own reaction
// energies. The form recomputes ΔE from their totals and flags disagreements
// WITHOUT showing the correct number. Pasting a block from a spreadsheet works.
//
// Experiments with "auto_delta": true (many reactions, arithmetic already
// practised) show the reaction energies computed by the page instead.
import {
  h, conditions, num, deltaStatus, fmt, loadJSON, loadOther, HARTREE_TO_KCAL, basisLabel, applies, speciesFor, jobs, siteUrl,
} from "./core.js";

// Minimal CSV reader: commas, tabs (pasted from a spreadsheet) or semicolons,
// double-quoted fields with "" escapes.
function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const first = text.split("\n", 1)[0];
  const sep = first.includes("\t") ? "\t" : !first.includes(",") && first.includes(";") ? ";" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") q = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

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

  // Import a CSV of results, e.g. the one written by downloads/extract_ex07.py.
  // Columns are found by name: method, grid (or basis), species, energy, scf,
  // time, status. Rows whose status is not "ok" or that have no energy are skipped.
  let csvBox = null;
  if (exp.csv_import) {
    const status = h("div", { class: "lab-small csv-status", role: "status" });
    const file = h("input", { type: "file", accept: ".csv,text/csv,text/plain", class: "visually-hidden", "aria-label": "Choose your results CSV file" });
    const pickBtn = h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => file.click() }, "⬆ Import CSV");
    const area = h("textarea", { class: "form-control form-control-sm csv-paste", rows: 4, spellcheck: "false", placeholder: "method,grid,species,distance_A,energy_Eh,scf_cycles,wall_time_s,status,file\nB3LYP,SG-1,ar,,-527.1234567890,9,3.04,ok,…" });
    const pasteBtn = h("button", { type: "button", class: "btn btn-outline-primary btn-sm" }, "Import pasted text");
    const run = (text, source) => {
      const msg = importCsv(text);
      status.replaceChildren(...msg.map((m, i) => h(i ? "div" : "strong", { class: m.cls || "" }, (i ? "" : source + ": ") + m.text)));
      drawPanel();
      drawSummary();
    };
    file.onchange = async () => {
      const f = file.files[0];
      if (f) run(await f.text(), f.name);
      file.value = "";
    };
    pasteBtn.onclick = () => area.value.trim() && run(area.value, "Pasted text");
    csvBox = h("div", { class: "csv-import" },
      h("div", { class: "res-import" }, pickBtn, file,
        h("span", { class: "lab-small lab-muted" }, "Load the ", h("code", {}, exp.csv_import.file || "results.csv"), " file made by the ",
          h("a", { href: siteUrl(exp.csv_import.script), download: "" }, "extraction script"), ". It fills in all three tabs at once.")),
      h("details", { class: "csv-details" }, h("summary", { class: "lab-small" }, "…or paste the CSV text"), area, h("div", { class: "mt-1" }, pasteBtn)),
      status);
  }

  function importCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) return [{ text: "No data rows found.", cls: "txt-bad" }];
    const head = rows[0].map((c) => c.trim().toLowerCase());
    const col = (test) => head.findIndex(test);
    const ci = {
      method: col((c) => c === "method" || c === "functional"),
      basis: col((c) => c === "grid" || c === "basis" || c === "setting"),
      species: col((c) => c === "species" || c === "molecule" || c === "structure"),
      energy: col((c) => c.startsWith("energy") || c.startsWith("total energy")),
      scf: col((c) => c.startsWith("scf")),
      time: col((c) => c.includes("time")),
      status: col((c) => c === "status"),
    };
    const need = ["method", "basis", "species", "energy"].filter((k) => ci[k] < 0);
    if (need.length) return [{ text: `The first line must name the columns; missing: ${need.join(", ")}. Use the CSV made by the script without editing it.`, cls: "txt-bad" }];

    const key = (s) => String(s).toLowerCase().replace(/ω/g, "w").replace(/[^a-z0-9.]/g, "");
    const conds = new Map(conditions(exp).map((c) => [`${key(c.method.id)}|${key(c.basis.id)}`, c]));
    for (const c of conditions(exp)) conds.set(`${key(c.method.label)}|${key(basisLabel(c.basis))}`, c);
    const fieldList = fields.filter((f) => ["energy", "scf", "time"].includes(f));

    const updates = [];
    const skipped = { status: 0, unknown: new Set(), noEnergy: 0 };
    const seen = new Set();
    let dupes = 0;
    for (const r of rows.slice(1)) {
      if (!r.some((c) => c.trim())) continue;
      const get = (k) => (ci[k] >= 0 ? (r[ci[k]] ?? "").trim() : "");
      const st = get("status");
      if (st && st.toLowerCase() !== "ok") { skipped.status += 1; continue; }
      const c = conds.get(`${key(get("method"))}|${key(get("basis"))}`);
      const sp = c && speciesFor(exp, c).find((s) => key(s.id) === key(get("species")) || key(s.label) === key(get("species")));
      if (!c || !sp) { skipped.unknown.add(`${get("method")} / ${get("basis")} / ${get("species")}`); continue; }
      const e = num(get("energy"));
      if (e === null || !FIELD_INFO.energy.check(e)) { skipped.noEnergy += 1; continue; }
      const id = `${c.key}|${sp.id}`;
      if (seen.has(id)) dupes += 1;
      seen.add(id);
      const vals = { energy: get("energy") };
      if (ci.scf >= 0 && get("scf")) vals.scf = get("scf");
      if (ci.time >= 0 && get("time")) vals.time = get("time");
      updates.push({ cond: c.key, sp: sp.id, vals });
    }
    if (!updates.length) return [{ text: "Nothing imported: no usable rows (check that the file is the one made by the script).", cls: "txt-bad" }];

    // Ask before replacing numbers that are already in the table.
    let conflicts = 0;
    for (const u of updates) {
      for (const f of fieldList) {
        const old = store.state.results?.[u.cond]?.[u.sp]?.[f];
        if (u.vals[f] !== undefined && old !== undefined && String(old).trim() !== "" && num(old) !== num(u.vals[f])) conflicts += 1;
      }
    }
    const replace = conflicts === 0 || window.confirm(`${conflicts} value(s) already in your table differ from the file.\n\nOK = replace them with the values from the file.\nCancel = keep your values and only fill the empty cells.`);
    let filled = 0;
    store.update((s) => {
      for (const u of updates) {
        s.results[u.cond] = s.results[u.cond] || {};
        const cell = (s.results[u.cond][u.sp] = s.results[u.cond][u.sp] || {});
        for (const f of fieldList) {
          if (u.vals[f] === undefined) continue;
          const empty = cell[f] === undefined || String(cell[f]).trim() === "";
          if (empty || replace) { if (String(cell[f] ?? "") !== u.vals[f]) filled += 1; cell[f] = u.vals[f]; }
        }
      }
    });
    const total = jobs(exp).length;
    const out = [{ text: `${updates.length} of ${total} jobs read from the file, ${filled} cell(s) changed.`, cls: "txt-ok" }];
    if (!replace && conflicts) out.push({ text: `${conflicts} existing value(s) kept.` });
    if (skipped.status) out.push({ text: `${skipped.status} row(s) skipped because the script flagged a problem (see its report; rerun those jobs).`, cls: "txt-bad" });
    if (skipped.noEnergy) out.push({ text: `${skipped.noEnergy} row(s) skipped: no valid total energy.`, cls: "txt-bad" });
    if (skipped.unknown.size) out.push({ text: `${skipped.unknown.size} row(s) not part of this experiment, ignored: ${[...skipped.unknown].slice(0, 4).join("; ")}${skipped.unknown.size > 4 ? "; …" : ""}` });
    if (dupes) out.push({ text: `${dupes} job(s) appeared more than once; the last row was used.`, cls: "txt-bad" });
    if (updates.length < total) out.push({ text: `Still missing: ${total - updates.length} jobs. Check the counts in the "Total energy" tab.` });
    return out;
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
    importBox, csvBox, tabBar, help, panel,
    classData ? h("p", { class: "lab-small lab-muted" }, `Class comparison is on: amber cells are far from the median of ${classData.n} submissions.`) : null));
}
