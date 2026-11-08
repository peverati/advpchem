// Experiment 10 explorer: the student's own method against the reference.
import { h, verifiedRows } from "../core.js";
import { empty } from "../explore.js";

export const EXPLORERS = {
  async "result-card"(exp, state) {
    const rx = exp.reactions[0];
    const row = verifiedRows(exp, state).find((r) => r.reaction === rx.id);
    const card = state.extra.methodcard || {};
    if (!row) return empty("Enter your three total energies and your reaction energy to see your result here.");
    const err = row.error;
    const verdict = Math.abs(err) <= 1 ? ["within chemical accuracy (±1 kcal/mol)", "txt-ok"]
      : Math.abs(err) <= 3 ? ["close, but outside chemical accuracy", ""] : ["far from the reference", "txt-bad"];
    // A simple number line from −10 to +10 kcal/mol around the reference.
    const span = 10, pos = Math.max(-span, Math.min(span, err));
    const pct = (x) => `${50 + (50 * x) / span}%`;
    return h("div", { class: "result-card" },
      h("div", { class: "result-method" }, [card.functional, card.dispersion === "D4" ? "-D4" : ""].join(""), card.basis ? ` / ${card.basis}` : ""),
      h("div", { class: "result-numbers" },
        h("div", {}, h("div", { class: "lab-small lab-muted" }, "your ΔE"), h("div", { class: "big" }, row.delta.toFixed(2))),
        h("div", {}, h("div", { class: "lab-small lab-muted" }, "reference"), h("div", { class: "big" }, rx.ref.toFixed(2))),
        h("div", {}, h("div", { class: "lab-small lab-muted" }, "signed error"), h("div", { class: "big " + verdict[1] }, (err >= 0 ? "+" : "") + err.toFixed(2)))),
      h("div", { class: "numline", "aria-hidden": "true" },
        h("div", { class: "numline-band", style: `left:${pct(-1)};width:${100 / span}%` }), // ±1 kcal/mol
        h("div", { class: "numline-zero", style: `left:${pct(0)}` }),
        h("div", { class: "numline-dot", style: `left:${pct(pos)}` })),
      h("div", { class: "numline-labels lab-small lab-muted" }, h("span", {}, `−${span}`), h("span", {}, "0"), h("span", {}, `+${span} kcal/mol`)),
      h("p", { class: "lab-small" }, "Your result is ", h("strong", { class: verdict[1] }, verdict[0]), ". Whatever the number, your report should explain ", h("em", {}, "why"), " you expected your method to work, and whether it did."));
  },
};
