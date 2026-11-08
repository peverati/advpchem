// Interpretation questions (free text or per-item classification) plus the
// closing "muddiest point" reflection. Everything autosaves to the draft.
import { h, md } from "./core.js";

function autoGrow(t) {
  t.style.height = "auto";
  t.style.height = Math.max(t.scrollHeight, 80) + "px";
}

export function render(el, { exp, store }) {
  const items = exp.questions || [];
  const list = h("ol", { class: "q-list" });
  const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
  for (const q of items) {
    if (q.type === "report") {
      // A short report: title, body (with a live word count) and references.
      const cur = Object.assign({ title: "", body: "", refs: "" }, store.state.answers[q.id]);
      const save = () => store.update((s) => (s.answers[q.id] = { title: title.value, body: body.value, refs: refs.value }), { silent: true });
      const title = h("input", { class: "form-control", placeholder: "Title of your report", value: cur.title, oninput: save, "aria-label": "Report title" });
      const count = h("span", { class: "lab-small lab-muted report-count" });
      const target = q.words || 300;
      const upd = () => {
        const n = words(body.value);
        count.textContent = `${n} words (aim for about ${target})`;
        count.className = "lab-small report-count " + (n > target * 1.4 ? "txt-bad" : n >= target * 0.7 ? "txt-ok" : "lab-muted");
      };
      const body = h("textarea", { class: "form-control q-answer report-body", rows: 12, placeholder: "Method and why you chose it · computational setup (program, functional, basis, ECP, grid, stability, convergence) · results and comparison with the reference · conclusion",
        oninput: (e) => { autoGrow(e.target); upd(); save(); }, "aria-label": "Report text" });
      body.value = cur.body;
      const refs = h("textarea", { class: "form-control q-answer", rows: 4, placeholder: "References, one per line (author, journal, year, volume, pages)", oninput: (e) => { autoGrow(e.target); save(); }, "aria-label": "References" });
      refs.value = cur.refs;
      list.append(h("li", { class: "report-item" }, h("p", { class: "q-text", html: md(q.text) }), title, body, count, h("p", { class: "lab-small strong report-refs-label" }, "References"), refs));
      requestAnimationFrame(() => { autoGrow(body); autoGrow(refs); upd(); });
      continue;
    }
    if (q.type === "classify") {
      const cur = store.state.answers[q.id] || {};
      const grid = h("div", { class: "q-classify" },
        q.items.map((it) => h("label", { class: "q-classify-row" },
          h("span", {}, it),
          h("select", {
            class: "form-select form-select-sm",
            onchange: (e) => store.update((s) => { s.answers[q.id] = Object.assign({}, s.answers[q.id], { [it]: e.target.value }); }, { silent: true }),
          }, h("option", { value: "" }, "— choose —"), q.choices.map((c) => h("option", { value: c, selected: cur[it] === c }, c))))));
      list.append(h("li", {}, h("p", { class: "q-text", html: md(q.text) }), grid));
    } else {
      const t = h("textarea", {
        class: "form-control q-answer",
        rows: 3,
        "aria-label": q.text,
        placeholder: "Your answer… refer to specific numbers from your tables or plots.",
        oninput: (e) => { autoGrow(e.target); store.update((s) => (s.answers[q.id] = e.target.value), { silent: true }); },
      });
      t.value = store.state.answers[q.id] || "";
      list.append(h("li", {}, h("p", { class: "q-text", html: md(q.text) }), t));
      requestAnimationFrame(() => autoGrow(t));
    }
  }
  const muddy = h("textarea", {
    class: "form-control q-answer",
    rows: 2,
    "aria-label": "Muddiest point",
    placeholder: "One or two sentences. Anonymous in the class summary.",
    oninput: (e) => store.update((s) => (s.muddiest = e.target.value), { silent: true }),
  });
  muddy.value = store.state.muddiest || "";
  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Questions"), h("span", { class: "lab-muted" }, " · answers save automatically in this browser")),
    list,
    h("div", { class: "q-muddy" }, h("p", { class: "q-text" }, h("strong", {}, "Muddiest point. "), "What is the one thing from this experiment that is still unclear to you?"), muddy)));
}
