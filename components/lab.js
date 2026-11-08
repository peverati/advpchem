// Entry point: finds the placeholders an experiment page declares, e.g.
//   <div data-lab-exp="ex01" hidden></div>
//   <div data-lab="molecules"></div>
// and renders the matching widget into each one.

import { loadJSON, createStore, h } from "./core.js";

const WIDGETS = {
  quiz: () => import("./quiz.js"),
  molecules: () => import("./molviewer.js"),
  predict: () => import("./predict.js"),
  run: () => import("./qchem-input.js"),
  results: () => import("./results-form.js"),
  explore: () => import("./explore.js"),
  questions: () => import("./questions.js"),
  submit: () => import("./submit.js"),
  ladder: () => import("./ladder.js"),
};

async function main() {
  const marker = document.querySelector("[data-lab-exp]");
  if (!marker) return;
  const expId = marker.dataset.labExp;
  let exp, course;
  try {
    [exp, course] = await Promise.all([
      loadJSON(`data/experiments/${expId}.json`),
      loadJSON("data/course.json").catch(() => ({ experiments: {} })),
    ]);
  } catch (err) {
    document.querySelectorAll("[data-lab]").forEach((el) =>
      el.replaceChildren(h("div", { class: "callout callout-style-simple callout-warning lab-error" },
        "The interactive part of this page could not load. If you opened the file directly from disk, use the website address instead. (" + err.message + ")")));
    return;
  }
  const store = createStore(expId);
  const ctx = { exp, course, settings: course.experiments?.[expId] || {}, store };

  for (const el of document.querySelectorAll("[data-lab]")) {
    const kind = el.dataset.lab;
    const loader = WIDGETS[kind];
    if (!loader) continue;
    el.classList.add("lab-widget", `lab-${kind}`);
    try {
      const mod = await loader();
      await mod.render(el, ctx, el.dataset);
    } catch (err) {
      console.error(err);
      el.replaceChildren(h("p", { class: "lab-error" }, `This widget failed to load: ${err.message}`));
    }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
else main();
