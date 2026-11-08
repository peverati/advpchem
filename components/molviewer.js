// Molecule gallery: a rotatable 3D view of every species, its formula, charge
// and spin multiplicity, and one-click .xyz / .zip downloads.
import { h, loadText, siteUrl, downloadBlob } from "./core.js";

const SPIN = { 1: "singlet", 2: "doublet", 3: "triplet", 4: "quartet", 5: "quintet", 6: "sextet", 7: "septet" };
const SUB = "₀₁₂₃₄₅₆₇₈₉";

export function formula(xyz) {
  const counts = {};
  xyz.trim().split("\n").slice(2).forEach((l) => {
    const el = l.trim().split(/\s+/)[0];
    if (el) counts[el] = (counts[el] || 0) + 1;
  });
  // Hill order: C, H, then alphabetical
  const keys = Object.keys(counts).sort((a, b) => {
    const rank = (x) => (x === "C" ? 0 : x === "H" ? 1 : 2);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  if (!counts.C) keys.sort();
  return keys.map((k) => k + (counts[k] > 1 ? String(counts[k]).split("").map((d) => SUB[d]).join("") : "")).join("");
}

function geomPath(exp, s) {
  return `data/geometries/${s.dir || exp.geometry_dir}/${s.file}`;
}

function makeViewer(box, xyz) {
  if (!window.$3Dmol) {
    box.append(h("p", { class: "lab-muted" }, "3D viewer unavailable (offline?)."));
    return;
  }
  const v = window.$3Dmol.createViewer(box, { backgroundAlpha: 0, antialias: true });
  v.addModel(xyz, "xyz");
  v.setStyle({}, { stick: { radius: 0.14 }, sphere: { scale: 0.25 } });
  v.zoomTo();
  v.render();
  return v;
}

export async function render(el, { exp }) {
  const species = exp.species;
  const texts = await Promise.all(species.map((s) => loadText(geomPath(exp, s)).catch(() => null)));

  const zipBtn = h("button", { type: "button", class: "btn btn-primary btn-sm" }, "⬇ Download all geometries (.zip)");
  zipBtn.onclick = async () => {
    if (!window.JSZip) return alert("Zip library not loaded. Download the files one by one instead.");
    const zip = new window.JSZip();
    species.forEach((s, i) => texts[i] && zip.file(s.file, texts[i]));
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${exp.id}_geometries.zip`);
  };

  const head = h("div", { class: "lab-card-head" },
    h("span", { class: "lab-kicker" }, `${species.length} structures`),
    h("span", { class: "lab-spacer" }), zipBtn);

  const card = (s, i) => {
    const xyz = texts[i];
    const box = h("div", { class: "mol-view", role: "img", "aria-label": `3D model of ${s.label}. Drag to rotate, scroll to zoom.` });
    const meta = h("div", { class: "mol-meta" },
      h("div", { class: "mol-name" }, s.label),
      h("div", { class: "lab-muted" },
        xyz && /\nC\s/.test(xyz) ? formula(xyz) + " · " : "", "charge ", String(s.charge), " · ", SPIN[s.mult] || `mult. ${s.mult}`, ` (${s.mult})`),
      h("a", { class: "mol-dl", href: siteUrl(geomPath(exp, s)), download: s.file }, s.file));
    return { node: h("figure", { class: "mol-card" }, box, meta), box, xyz };
  };

  if (species.length <= 12) {
    const grid = h("div", { class: "mol-grid" });
    const cards = species.map(card);
    cards.forEach((c) => grid.append(c.node));
    el.replaceChildren(h("div", { class: "lab-card" }, head, grid,
      h("p", { class: "lab-muted lab-small" }, "Drag to rotate · scroll or pinch to zoom · the first line of each .xyz is the atom count, the second is charge and multiplicity.")));
    // At most 12 WebGL viewers per page, under the browser's ~16-context limit.
    requestAnimationFrame(() => cards.forEach((c) => c.xyz && (c.viewer = makeViewer(c.box, c.xyz))));
  } else {
    // Many structures (e.g. a dissociation curve): one viewer and a picker.
    const sel = h("select", { class: "form-select form-select-sm", "aria-label": "Choose a structure" },
      species.map((s, i) => h("option", { value: i }, s.label)));
    const holder = h("div");
    const show = () => {
      const c = card(species[sel.value], Number(sel.value));
      holder.replaceChildren(c.node);
      if (c.xyz) requestAnimationFrame(() => makeViewer(c.box, c.xyz));
    };
    sel.onchange = show;
    el.replaceChildren(h("div", { class: "lab-card" }, head, h("div", { class: "mol-picker" }, sel), holder));
    show();
  }
}
