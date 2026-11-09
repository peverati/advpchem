// Submission: builds one JSON file with everything the student did (results,
// predictions, answers), offers a printable report, and opens the Microsoft
// Form where the file is uploaded. A saved file can be re-loaded to continue
// on another computer.
import { h, conditions, jobs, num, deltaStatus, verifiedRows, mae, fmt, downloadBlob, slug, md, applies, expectedReactions } from "./core.js";

export const SCHEMA_VERSION = 1;

export function buildSubmission(exp, state) {
  return {
    schema: SCHEMA_VERSION,
    experiment: exp.id,
    title: exp.title,
    generated_at: new Date().toISOString(),
    student: state.student,
    predictions: state.predictions,
    quiz: state.quiz,
    results: state.results,
    deltas: state.deltas,
    answers: state.answers,
    muddiest: state.muddiest,
    extra: state.extra,
  };
}

function completeness(exp, state) {
  const js = jobs(exp);
  const energies = js.filter((j) => num(state.results?.[j.cond.key]?.[j.species.id]?.energy) !== null).length;
  let verified = 0, total = 0;
  for (const c of conditions(exp))
    for (const r of exp.reactions || []) {
      if (!applies(c, r)) continue;
      total += 1;
      if (deltaStatus(exp, state, c.key, r).status === "ok") verified += 1;
    }
  const qs = (exp.questions || []).filter((q) => {
    const a = state.answers[q.id];
    if (q.type === "classify") return a && q.items.every((i) => a[i]);
    if (q.type === "report") return a && (String(a.body || "").trim().match(/\S+/g) || []).length >= (q.words || 300) * 0.5 && String(a.title || "").trim();
    return a && String(a).trim().length > 10;
  }).length;
  const list = [];
  if ((exp.predictions || []).length) list.push({ label: "Predictions locked", ok: !!state.predictions.locked_at });
  if (js.length) list.push({ label: `Energies entered: ${energies}/${js.length}`, ok: energies === js.length });
  if (total) list.push({ label: `Reaction energies ${exp.auto_delta ? "computed" : "verified"}: ${verified}/${total}`, ok: verified === total });
  if (exp.ladder) {
    const n = Object.values(state.answers.ladder || {}).filter(Boolean).length;
    list.push({ label: `Functionals classified: ${n}/${exp.ladder.length}`, ok: n === exp.ladder.length });
  }
  if ((exp.questions || []).length) list.push({ label: `Questions answered: ${qs}/${exp.questions.length}`, ok: qs === exp.questions.length });
  return list;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function reportHTML(exp, state) {
  const rows = verifiedRows(exp, state);
  const conds = conditions(exp);
  const ladder = exp.ladder ? `<h2>Jacob's ladder</h2><table><tbody>${exp.ladder.map((it) => `<tr><th>${esc(it.name)}</th><td>${esc(state.answers.ladder?.[it.name] || "—")}</td></tr>`).join("")}</tbody></table>` : "";
  if (!(exp.reactions || []).length) return reportShell(exp, state, ladder);
  const errTable = `<table><thead><tr><th>${exp.bases.length > 1 ? "Method / basis" : "Method"}</th>${exp.reactions.map((r) => `<th>${esc(r.id)}<br><small>ΔE / ε</small></th>`).join("")}<th>MAE</th></tr></thead><tbody>${conds.map((c) => {
    const rs = rows.filter((r) => r.cond === c.key);
    return `<tr><th>${esc(c.label)}</th>${exp.reactions.map((r) => {
      if (!applies(c, r)) return "<td>n/a</td>";
      const x = rs.find((q) => q.reaction === r.id);
      return `<td>${x ? `${x.delta.toFixed(2)} / ${x.error >= 0 ? "+" : ""}${x.error.toFixed(2)}` : "—"}</td>`;
    }).join("")}<td>${fmt(rs.length === expectedReactions(exp, c) ? mae(rs.map((r) => r.error)) : null)}</td></tr>`;
  }).join("")}</tbody></table>`;
  return reportShell(exp, state, `<h2>Reaction energies and signed errors (kcal/mol)</h2>${errTable}
<p class="meta">Only values consistent with the student's own total energies are shown.</p>`);
}

// Experiment-specific extras: Ex10 method card, Ex9 NIST lookup.
function extrasHTML(state) {
  let out = "";
  const mc = state.extra?.methodcard;
  if (mc && mc.functional) {
    const f = mc.functional === "other" ? mc.other : mc.functional;
    out += `<h2>Method card</h2><table><tbody>
<tr><th>Functional</th><td>${esc(f)}${mc.dispersion === "D4" ? "-D4" : ""}</td></tr>
<tr><th>Basis set</th><td>${esc(mc.basis)}</td></tr>
<tr><th>Grid</th><td>${esc(mc.grid || "default")}</td></tr>
<tr><th>Stability analysis</th><td>${mc.stability ? "yes" : "no"}</td></tr></tbody></table>
<p><b>Why this functional:</b> ${esc(mc.why_functional || "—")}</p><p><b>Why this basis:</b> ${esc(mc.why_basis || "—")}</p><p><b>Other settings:</b> ${esc(mc.why_settings || "—")}</p>`;
  }
  const n = state.extra?.nist;
  if (n && (n.fecl || n.notes)) {
    out += `<h2>NIST comparison (FeCl)</h2><p>ΔfH°: FeCl ${esc(n.fecl)}, Fe ${esc(n.fe)}, Cl ${esc(n.cl)} (${esc(n.unit)})</p><p class="ans">${esc(n.notes || "")}</p>`;
  }
  return out;
}

function reportShell(exp, state, dataHTML) {
  const preds = (exp.predictions || []).map((p) => `<li>${md(p.prompt)}<br><b>${esc(state.predictions.values[p.id] || "—")}</b></li>`).join("");
  const qs = (exp.questions || []).map((q) => {
    const a = state.answers[q.id];
    const body = q.type === "classify" ? `<ul>${q.items.map((i) => `<li>${esc(i)}: <b>${esc(a?.[i] || "—")}</b></li>`).join("")}</ul>`
      : q.type === "report" ? `<h3>${esc(a?.title || "(untitled)")}</h3><p class="ans">${esc(a?.body || "—")}</p><h4>References</h4><p class="ans">${esc(a?.refs || "—")}</p>`
      : `<p class="ans">${esc(a || "—")}</p>`;
    return `<li><p>${md(q.text)}</p>${body}</li>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(exp.id)} report – ${esc(state.student.name)}</title>
<style>body{font:13px/1.45 system-ui,sans-serif;margin:24px;color:#111}h1{font-size:20px;margin:0}h2{font-size:15px;margin:22px 0 6px;border-bottom:1px solid #ccc}
table{border-collapse:collapse;font-variant-numeric:tabular-nums}td,th{border:1px solid #bbb;padding:3px 7px;text-align:right}th{text-align:left;background:#f3f3f3}
.ans{white-space:pre-wrap;border-left:3px solid #ddd;padding-left:8px}.meta{color:#555}</style></head><body>
<h1>Experiment ${exp.number}: ${esc(exp.title)}</h1>
<p class="meta">${esc(state.student.name)} · ${esc(state.student.email || state.student.id)} · generated ${new Date().toLocaleString()}${state.predictions.locked_at ? ` · predictions locked ${new Date(state.predictions.locked_at).toLocaleString()}` : ""}</p>
${preds ? `<h2>Predictions</h2><ol>${preds}</ol>` : ""}
${dataHTML}
${extrasHTML(state)}
<h2>Answers</h2><ol>${qs}</ol>
<h2>Muddiest point</h2><p class="ans">${esc(state.muddiest || "—")}</p>
<script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
}

export function render(el, { exp, store, settings }) {
  const st = store.state;
  const name = h("input", { class: "form-control form-control-sm", placeholder: "Full name", value: st.student.name, "aria-label": "Full name", autocomplete: "name" });
  const sid = h("input", { type: "email", class: "form-control form-control-sm", placeholder: "Florida Tech email (e.g. jdoe2024@my.fit.edu)", value: st.student.email || st.student.id || "", "aria-label": "Florida Tech email", autocomplete: "email" });
  const honor = h("input", { type: "checkbox", class: "form-check-input", id: `honor-${exp.id}`, checked: !!st.extra.honor });
  const check = h("ul", { class: "submit-check" });
  const formUrl = settings.form;

  const save = () => store.update((s) => {
    s.student = { name: name.value.trim(), email: sid.value.trim().toLowerCase() };
    s.extra.honor = honor.checked;
  });
  [name, sid].forEach((i) => i.addEventListener("input", save));
  honor.addEventListener("change", save);

  const drawCheck = () => {
    check.replaceChildren(...completeness(exp, store.state).map((c) => h("li", { class: c.ok ? "ok" : "todo" }, c.ok ? "✔ " : "○ ", c.label)));
  };

  // Florida Tech addresses end in fit.edu (students: @my.fit.edu, faculty and staff: @fit.edu).
  const FT_EMAIL = /^[^@\s]+@(my\.)?fit\.edu$/i;
  const fileName = () => `${exp.id}_${slug((store.state.student.email || "").split("@")[0] || store.state.student.name || "student")}.json`;
  const ready = () => {
    if (!store.state.student.name || !store.state.student.email) { alert("Please enter your name and your Florida Tech email first."); return false; }
    if (!FT_EMAIL.test(store.state.student.email)) { alert("Please use your Florida Tech email address (ending in @my.fit.edu or @fit.edu): the same one you use to sign in to the submission form."); return false; }
    if (!store.state.extra.honor) { alert("Please confirm that you ran these calculations yourself."); return false; }
    return true;
  };

  const dl = h("button", { type: "button", class: "btn btn-primary" }, "1 · Download submission file");
  dl.onclick = () => {
    if (!ready()) return;
    const blob = new Blob([JSON.stringify(buildSubmission(exp, store.state), null, 1)], { type: "application/json" });
    downloadBlob(blob, fileName());
    store.update((s) => (s.extra.downloaded_at = new Date().toISOString()), { silent: true });
  };
  const report = h("button", { type: "button", class: "btn btn-outline-primary" }, "Printable report / PDF");
  report.onclick = () => {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups for this site to open the report.");
    w.document.write(reportHTML(exp, store.state));
    w.document.close();
  };
  const form = formUrl
    ? h("a", { class: "btn btn-success", href: formUrl, target: "_blank", rel: "noopener" }, "2 · Open the submission form ↗")
    : h("span", { class: "btn btn-outline-secondary disabled", "aria-disabled": "true" }, "2 · Submission form not posted yet");

  const loadInput = h("input", { type: "file", accept: ".json,application/json", class: "visually-hidden", id: `load-${exp.id}` });
  loadInput.onchange = async () => {
    const f = loadInput.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.experiment !== exp.id) throw new Error(`This file is for ${data.experiment}, not ${exp.id}.`);
      if (!confirm("Replace everything on this page with the contents of this file?")) return;
      store.replace({
        student: data.student, predictions: data.predictions, quiz: data.quiz || {}, results: data.results || {},
        deltas: data.deltas || {}, answers: data.answers || {}, muddiest: data.muddiest || "", extra: data.extra || {}, done: {},
      });
      location.reload();
    } catch (e) {
      alert("Could not load that file: " + e.message);
    }
  };
  const reset = h("button", { type: "button", class: "btn btn-link btn-sm text-danger" }, "Clear everything on this page");
  reset.onclick = () => {
    if (confirm("Delete all your entries for this experiment from this browser? Download your file first if you want to keep it.")) {
      store.clear();
      location.reload();
    }
  };

  el.replaceChildren(h("div", { class: "lab-card submit-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Submit"),
      settings.due ? h("span", { class: "lab-muted" }, ` · due ${new Date(settings.due + "T23:59").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`) : null),
    h("div", { class: "submit-grid" },
      h("div", {},
        h("div", { class: "submit-id" }, name, sid),
        h("div", { class: "form-check" }, honor, h("label", { class: "form-check-label", for: `honor-${exp.id}` }, "I ran these calculations myself and the numbers come from my own output files.")),
        h("div", { class: "submit-actions" }, dl, form, report),
        h("p", { class: "lab-small lab-muted" }, "Download the file, then open the form and upload it (sign in with your Florida Tech email). You can resubmit until the deadline; the latest upload counts.")),
      h("div", {}, h("div", { class: "lab-small strong" }, "Checklist"), check)),
    h("div", { class: "submit-foot" },
      h("label", { class: "btn btn-link btn-sm", for: `load-${exp.id}` }, "Continue from a saved file…"), loadInput, reset,
      store.storageOK ? null : h("span", { class: "txt-bad lab-small" }, "Your browser is blocking storage: entries will be lost when you close the page. Download your file often."))));
  drawCheck();
  store.subscribe(drawCheck);
}
