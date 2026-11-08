// Ungraded concept check with instant feedback. Answers are remembered in the
// draft so a returning student sees what they already tried.
import { h, md } from "./core.js";

export function render(el, { exp, store }) {
  const items = exp.quiz || [];
  if (!items.length) return;
  const list = h("ol", { class: "quiz-list" });
  items.forEach((item, qi) => {
    const fb = h("div", { class: "quiz-feedback", "aria-live": "polite" });
    const opts = h("div", { class: "quiz-options", role: "radiogroup" });
    const show = (choice) => {
      opts.querySelectorAll("button").forEach((b, i) => {
        b.classList.toggle("is-correct", choice !== undefined && i === item.answer);
        b.classList.toggle("is-wrong", choice === i && i !== item.answer);
        b.setAttribute("aria-checked", String(choice === i));
      });
      if (choice === undefined) return fb.replaceChildren();
      const right = choice === item.answer;
      fb.className = "quiz-feedback " + (right ? "right" : "wrong");
      fb.innerHTML = `<strong>${right ? "Correct." : "Not quite."}</strong> ${md(item.explain)}`;
    };
    item.options.forEach((o, i) => {
      opts.append(
        h("button", {
          type: "button",
          role: "radio",
          class: "quiz-option",
          onclick: () => {
            store.update((s) => (s.quiz[qi] = i), { silent: true });
            show(i);
          },
          html: md(o),
        })
      );
    });
    list.append(h("li", {}, h("p", { class: "quiz-q", html: md(item.q) }), opts, fb));
    show(store.state.quiz[qi]);
  });
  el.replaceChildren(
    h("div", { class: "lab-card" },
      h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, "Concept check"),
        h("span", { class: "lab-muted" }, " · not graded, just warming up")),
      list)
  );
}
