// "Run it" section: a checklist of every job with a ready-to-paste Q-Chem input,
// a rough 10-minute-limit risk flag, and a zip with all inputs.
import { h, jobs, conditions, loadText, downloadBlob, slug, basisLabel } from "./core.js";

const Z = { H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10, Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 19, Ca: 20, Fe: 26, Ru: 44, Pd: 46 };

// Very rough number of basis functions per atom (rows: H/He, 2nd period,
// 3rd period, 4th+ period) used ONLY for the cost warning, never shown as an answer.
const NBF = {
  2: [5, 14, 18, 32],
  3: [10, 31, 37, 50],
  4: [30, 57, 70, 90],
};
function row(z) {
  return z <= 2 ? 0 : z <= 10 ? 1 : z <= 18 ? 2 : 3;
}
function zetaOf(basis) {
  if (basis.zeta) return basis.zeta;
  const id = basis.id.toLowerCase();
  if (/qz/.test(id)) return 4;
  if (/tz/.test(id)) return 3;
  return 2;
}

export function estimateNbf(atoms, basis) {
  const t = NBF[zetaOf(basis)] || NBF[3];
  return atoms.reduce((n, el) => n + t[row(Z[el] || 30)], 0);
}

// Coarse cost class for the free server's 10-minute wall-time limit.
export function risk(atoms, basis, method) {
  const n = estimateNbf(atoms, basis);
  const id = method.id.toLowerCase();
  let f = 1;
  if (/hf|b3|pbe0|m06|m11|mn15|wb97|ω|2x|x$/.test(id)) f *= 1.6; // exact exchange
  if (/-v$|rv$/.test(id)) f *= 1.3; // nonlocal VV10 correlation
  if (/scan|m06|m11|mn15/.test(id)) f *= 1.3; // meta-GGAs like fine grids
  const grid = String(basis.rem?.XC_GRID || "");
  if (grid === "3" || /0590|0974/.test(grid)) f *= 1.5; // finer integration grids
  if (basis.rem?.INTERNAL_STABILITY) f *= 1.5; // stability analysis + re-optimization
  const heavy = atoms.some((el) => (Z[el] || 30) > 18);
  const score = Math.pow(n / 250, 3) * f * (heavy ? 2 : 1);
  if (score < 1) return { level: "low", text: "quick" };
  if (score < 6) return { level: "med", text: "a few minutes" };
  return { level: "high", text: "may hit the 10-min limit" };
}

export function parseXYZ(text) {
  const lines = text.trim().split("\n");
  const [charge, mult] = lines[1].trim().split(/\s+/).map(Number);
  const atomLines = lines.slice(2).filter((l) => l.trim());
  return { charge, mult, atomLines, atoms: atomLines.map((l) => l.trim().split(/\s+/)[0]) };
}

export function buildInput(exp, cond, species, geom) {
  const rem = Object.assign({}, exp.rem_common || {}, cond.method.rem || {}, { BASIS: cond.basis.id }, cond.basis.rem || {}, species.rem || {});
  if (geom.mult > 1 && rem.UNRESTRICTED === undefined) rem.UNRESTRICTED = "TRUE";
  // def2 basis sets describe elements beyond Kr (here Ru, Pd) with an effective core potential.
  if (/^def2/i.test(rem.BASIS) && geom.atoms.some((el) => (Z[el] || 0) > 36) && !rem.ECP) rem.ECP = "def2-ECP";
  const order = ["JOBTYPE", "METHOD", "DFT_D", "BASIS", "ECP", "UNRESTRICTED", "XC_GRID", "INTERNAL_STABILITY"];
  const keys = Object.keys(rem).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const remBlock = keys.map((k) => `   ${k.padEnd(20)} ${rem[k]}`).join("\n");
  // Q-Chem input files should stay plain ASCII.
  const ascii = (s) => String(s)
    .replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080))
    .replace(/ω/g, "w").replace(/[–—]/g, "-").replace(/⁺/g, "+").replace(/[→]/g, "->")
    .replace(/[^\x20-\x7E]/g, "");
  return [
    "$comment",
    ascii(`Experiment ${exp.number}: ${exp.title}`),
    ascii(`${cond.method.label} / ${basisLabel(cond.basis)} : ${species.label}`),
    "$end",
    "",
    "$molecule",
    `${species.charge ?? geom.charge} ${species.mult ?? geom.mult}`,
    ...geom.atomLines.map((l) => {
      const [el, x, y, z] = l.trim().split(/\s+/);
      return `${el.padEnd(3)}${x.padStart(15)}${y.padStart(15)}${z.padStart(15)}`;
    }),
    "$end",
    "",
    "$rem",
    remBlock,
    "$end",
    "",
  ].join("\n");
}

export function jobName(exp, cond, species) {
  return `${exp.id}_${slug(cond.method.id)}_${slug(cond.basis.id)}_${slug(species.id)}`;
}

export async function render(el, { exp, store }) {
  const geoms = {};
  await Promise.all(exp.species.map(async (s) => {
    geoms[s.id] = parseXYZ(await loadText(`data/geometries/${s.dir || exp.geometry_dir}/${s.file}`));
  }));
  const allJobs = jobs(exp);
  const conds = conditions(exp);

  const filter = h("select", { class: "form-select form-select-sm", "aria-label": "Show jobs for" },
    h("option", { value: "" }, `All ${conds.length} ${exp.bases.length > 1 ? "combinations" : "methods"}`),
    conds.map((c) => h("option", { value: c.key }, c.label)));

  const progress = h("div", { class: "job-progress" });
  const list = h("div", { class: "job-list" });
  const preview = h("pre", { class: "job-preview", tabindex: "0" });
  const previewTitle = h("div", { class: "job-preview-title" });
  const copyBtn = h("button", { type: "button", class: "btn btn-outline-primary btn-sm" }, "Copy input");
  const dlBtn = h("button", { type: "button", class: "btn btn-outline-secondary btn-sm" }, "Download .in");
  let current = null;

  const isDone = (j) => {
    const st = store.state;
    const [m, b] = [j.cond.method.id, j.cond.basis.id];
    return !!(st.done[j.key] || st.results?.[`${m}|${b}`]?.[j.species.id]?.energy);
  };

  const select = (j) => {
    current = j;
    const text = buildInput(exp, j.cond, j.species, geoms[j.species.id]);
    preview.textContent = text;
    previewTitle.textContent = `${jobName(exp, j.cond, j.species)}.in`;
    list.querySelectorAll(".job-row").forEach((r) => r.classList.toggle("is-current", r.dataset.key === j.key));
  };
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      copyBtn.textContent = "Copied ✓";
      setTimeout(() => (copyBtn.textContent = "Copy input"), 1500);
    } catch (e) {
      const r = document.createRange();
      r.selectNodeContents(preview);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    }
  };
  dlBtn.onclick = () => current && downloadBlob(new Blob([preview.textContent], { type: "text/plain" }), `${jobName(exp, current.cond, current.species)}.in`);

  const zipBtn = h("button", { type: "button", class: "btn btn-primary btn-sm" }, "⬇ All inputs (.zip)");
  zipBtn.onclick = async () => {
    if (!window.JSZip) return alert("Zip library not loaded.");
    const zip = new window.JSZip();
    const shown = filter.value ? allJobs.filter((j) => j.cond.key === filter.value) : allJobs;
    for (const j of shown) zip.file(`${slug(j.cond.label)}/${jobName(exp, j.cond, j.species)}.in`, buildInput(exp, j.cond, j.species, geoms[j.species.id]));
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${exp.id}_qchem_inputs.zip`);
  };

  const drawList = () => {
    const shown = filter.value ? allJobs.filter((j) => j.cond.key === filter.value) : allJobs;
    list.replaceChildren();
    let lastCond = null;
    for (const j of shown) {
      if (j.cond.key !== lastCond) {
        lastCond = j.cond.key;
        list.append(h("div", { class: "job-group" }, j.cond.label));
      }
      const r = risk(geoms[j.species.id].atoms, j.cond.basis, j.cond.method);
      const cb = h("input", {
        type: "checkbox",
        class: "form-check-input",
        checked: isDone(j),
        "aria-label": `Mark ${j.species.label} with ${j.cond.label} as done`,
        onchange: (e) => store.update((s) => (s.done[j.key] = e.target.checked), { silent: true }),
      });
      const row = h("div", { class: "job-row", dataset: { key: j.key } },
        cb,
        h("button", { type: "button", class: "job-link", onclick: () => select(j) }, j.species.label),
        h("span", { class: `risk risk-${r.level}`, title: "Rough estimate of run time on the free server" }, r.text));
      list.append(row);
    }
    const done = allJobs.filter(isDone).length;
    progress.replaceChildren(
      h("div", { class: "progress", role: "progressbar", "aria-valuenow": done, "aria-valuemin": 0, "aria-valuemax": allJobs.length },
        h("div", { class: "progress-bar", style: `width:${(100 * done) / allJobs.length}%` })),
      h("span", { class: "lab-muted lab-small" }, `${done} of ${allJobs.length} jobs done (a job is ticked automatically once you enter its energy below)`));
    if (current) select(current);
  };
  filter.onchange = drawList;

  el.replaceChildren(h("div", { class: "lab-card" },
    h("div", { class: "lab-card-head" }, h("span", { class: "lab-kicker" }, `${allJobs.length} Q-Chem jobs`), h("span", { class: "lab-spacer" }), filter, zipBtn),
    progress,
    h("div", { class: "job-layout" },
      list,
      h("div", { class: "job-preview-wrap" },
        h("div", { class: "job-preview-head" }, previewTitle, h("span", { class: "lab-spacer" }), copyBtn, dlBtn),
        preview,
        h("p", { class: "lab-muted lab-small" }, "In IQmol you can load the .xyz and pick these settings in the Q-Chem setup window, or paste this input into the input editor. See the ", h("a", { href: "../guides/first-job.html" }, "first-job guide"), ".")))));
  drawList();
  select(allJobs[0]);
  store.subscribe(drawList);
}
