// Experiment 9: from NIST enthalpies of formation to an experimental bond
// enthalpy, and why it differs from the computed electronic energy.
import { h, num } from "./core.js";

const KJ_TO_KCAL = 1 / 4.184;

export function render(el, { exp, store }) {
  const ref = exp.nist?.reference ?? 78.5;
  const st = Object.assign({ unit: "kJ/mol", fecl: "", fe: "", cl: "", notes: "" }, store.state.extra.nist);
  const save = () => store.update((s) => (s.extra.nist = { unit: unit.value, fecl: f1.value, fe: f2.value, cl: f3.value, notes: notes.value }), { silent: true });
  const unit = h("select", { class: "form-select form-select-sm", "aria-label": "unit" }, ["kJ/mol", "kcal/mol"].map((u) => h("option", { value: u, selected: u === st.unit }, u)));
  const field = (v, label) => h("input", { type: "text", inputmode: "decimal", class: "form-control form-control-sm", value: v, "aria-label": label, placeholder: "value from NIST" });
  const f1 = field(st.fecl, "ΔfH° of FeCl(g)"), f2 = field(st.fe, "ΔfH° of Fe(g)"), f3 = field(st.cl, "ΔfH° of Cl(g)");
  const notes = h("textarea", { class: "form-control", rows: 3, placeholder: "Which corrections separate the two numbers? Estimate the size of each one if you can." });
  notes.value = st.notes;
  const out = h("div", { class: "nist-out", "aria-live": "polite" });

  const calc = () => {
    save();
    const k = unit.value === "kJ/mol" ? KJ_TO_KCAL : 1;
    const a = num(f1.value), b = num(f2.value), c = num(f3.value);
    if (a === null || b === null || c === null) {
      out.replaceChildren(h("p", { class: "lab-small lab-muted" }, "Fill in all three values to compute the experimental bond enthalpy."));
      return;
    }
    const D = (b + c - a) * k;
    out.replaceChildren(
      h("p", {}, "Bond dissociation enthalpy at 298 K from experiment:"),
      h("p", { class: "nist-eq" }, "ΔH", h("sub", {}, "298"), " = ΔfH°(Fe) + ΔfH°(Cl) − ΔfH°(FeCl) = ", h("strong", {}, `${D.toFixed(1)} kcal/mol`)),
      h("p", {}, "Reference electronic dissociation energy used in this experiment: ", h("strong", {}, `D`, h("sub", {}, "e"), ` = ${ref} kcal/mol`),
        ". Difference: ", h("strong", {}, `${(D - ref >= 0 ? "+" : "")}${(D - ref).toFixed(1)} kcal/mol`), "."),
      h("p", { class: "lab-small" }, "These two numbers are not the same quantity. Before comparing them, think about:"),
      h("ul", { class: "lab-small" },
        h("li", {}, h("strong", {}, "Zero-point energy: "), "the molecule keeps ½hν of vibrational energy even at 0 K, while the atoms have none, so D", h("sub", {}, "0"), " < D", h("sub", {}, "e"), "."),
        h("li", {}, h("strong", {}, "Thermal energy: "), "the experiment is at 298 K, so translational, rotational and vibrational enthalpy (and pV work) enter."),
        h("li", {}, h("strong", {}, "Spin–orbit coupling: "), "the Fe and Cl atoms have orbital angular momentum, and spin–orbit coupling lowers their ground-state energies. Standard DFT ignores it."),
        h("li", {}, h("strong", {}, "Experimental uncertainty: "), "check the uncertainty NIST quotes for FeCl. Gas-phase data for transition-metal diatomics are often uncertain by several kcal/mol.")));
  };
  [unit, f1, f2, f3].forEach((x) => x.addEventListener("input", calc));
  unit.addEventListener("change", calc);
  notes.addEventListener("input", save);

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Theory meets experiment"), h("span", { class: "lab-muted" }, " · FeCl")),
    h("p", { class: "lab-small" }, "Look up the gas-phase standard enthalpies of formation of FeCl, Fe and Cl in the ",
      h("a", { href: "https://webbook.nist.gov/chemistry/", target: "_blank", rel: "noopener" }, "NIST Chemistry WebBook ↗"),
      " (search by formula, then open “Gas phase thermochemistry data”). Copy the values with their units."),
    h("div", { class: "nist-grid" },
      h("label", {}, "Unit", unit),
      h("label", {}, "ΔfH°(FeCl, g)", f1),
      h("label", {}, "ΔfH°(Fe, g)", f2),
      h("label", {}, "ΔfH°(Cl, g)", f3)),
    out,
    h("label", { class: "lab-small strong" }, "Your notes on the corrections"), notes));
  calc();
}
