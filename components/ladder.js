// Experiment 2: classify functionals onto the rungs of Jacob's ladder.
// Students pick a rung for each functional, then press "Check" to get
// per-item feedback with a one-line explanation. Choices autosave.
import { h, md } from "./core.js";

export function render(el, { exp, store }) {
  const items = exp.ladder || [];
  const rungs = exp.rungs;
  let checked = !!store.state.extra.ladder_checked;

  const draw = () => {
    const picks = store.state.answers.ladder || {};
    const score = items.filter((it) => picks[it.name] === it.answer).length;
    const grid = h("div", { class: "ladder-grid" });
    for (const it of items) {
      const pick = picks[it.name] || "";
      const right = pick === it.answer;
      const sel = h("select", {
        class: "form-select form-select-sm",
        "aria-label": `Rung for ${it.name}`,
        onchange: (e) => {
          store.update((s) => { s.answers.ladder = Object.assign({}, s.answers.ladder, { [it.name]: e.target.value }); }, { silent: true });
          if (checked) draw();
        },
      }, h("option", { value: "" }, "— rung —"), rungs.map((r) => h("option", { value: r, selected: r === pick }, r)));
      grid.append(h("div", { class: "ladder-item" + (checked && pick ? (right ? " is-right" : " is-wrong") : "") },
        h("div", { class: "ladder-name" }, it.name), sel,
        checked && pick ? h("div", { class: "ladder-why", html: (right ? "✔ " : `✘ It's <strong>${it.answer}</strong>. `) + md(it.why) }) : null));
    }
    const legend = h("dl", { class: "ladder-legend" }, rungs.map((r) => [h("dt", {}, r), h("dd", {}, exp.rung_help[r])]));
    const btn = h("button", {
      type: "button", class: "btn btn-primary btn-sm",
      onclick: () => { checked = true; store.update((s) => (s.extra.ladder_checked = true), { silent: true }); draw(); },
    }, checked ? "Re-check" : "Check my answers");
    el.replaceChildren(h("div", { class: "lab-card" },
      h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Climb the ladder"), h("span", { class: "lab-spacer" }),
        checked ? h("span", { class: score === items.length ? "txt-ok" : "lab-muted" }, `${score} / ${items.length} correct`) : null, btn),
      legend, grid));
  };
  draw();
}
