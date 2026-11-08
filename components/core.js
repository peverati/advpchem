// Shared helpers for the lab components: data loading, per-student draft storage,
// unit conversion and the reaction-energy arithmetic used everywhere.

export const HARTREE_TO_KCAL = 627.5095;
export const SITE_ROOT = new URL("../", import.meta.url);

export function siteUrl(path) {
  return new URL(path, SITE_ROOT).href;
}

export async function loadJSON(path) {
  const r = await fetch(siteUrl(path), { cache: "no-cache" });
  if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
  return r.json();
}

export async function loadText(path) {
  const r = await fetch(siteUrl(path));
  if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
  return r.text();
}

// ---------------------------------------------------------------- storage --
// Drafts live in the student's own browser (localStorage). Every access is
// guarded: private windows or blocked storage must not break the page.
const memoryFallback = {};

export function createStore(expId) {
  const key = `advpchem:${expId}`;
  let state;
  try {
    state = JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    state = null;
  }
  state = state || memoryFallback[key] || {};
  const defaults = {
    student: { name: "", email: "" },
    predictions: { values: {}, locked_at: null },
    quiz: {},
    results: {},
    deltas: {},
    done: {},
    answers: {},
    muddiest: "",
    extra: {},
  };
  for (const [k, v] of Object.entries(defaults)) if (state[k] === undefined) state[k] = v;

  const listeners = new Set();
  let timer = null;
  let notifyTimer = null;
  let storageOK = true;
  try {
    localStorage.setItem("advpchem:test", "1");
    localStorage.removeItem("advpchem:test");
  } catch (e) {
    storageOK = false;
  }
  let version = 0;
  // Listeners are notified after a short pause, so typing in a big table
  // doesn't redraw every chart on each keystroke.
  const notify = () => {
    clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => listeners.forEach((l) => l(state)), 300);
  };

  function persist() {
    memoryFallback[key] = state;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      storageOK = true;
    } catch (e) {
      storageOK = false;
    }
  }

  return {
    get state() {
      return state;
    },
    get storageOK() {
      return storageOK;
    },
    get version() {
      return version;
    },
    update(fn, { silent = false } = {}) {
      fn(state);
      clearTimeout(timer);
      timer = setTimeout(persist, 250);
      if (!silent) notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    replace(newState) {
      state = Object.assign({}, defaults, newState);
      version += 1; // widgets that hold their own inputs redraw on this
      persist();
      notify();
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
      delete memoryFallback[key];
    },
  };
}

// ------------------------------------------------------------- experiment --
// A "condition" is one method + one setting (usually a basis set, but in some
// experiments an integration grid or a stability-analysis option, given as
// entries of exp.bases with their own label and $rem keywords). A "job" is a
// condition × species.
//
// By default every method is combined with every setting. An experiment can
// instead list its conditions explicitly, optionally restricted to some
// species:  "conditions": [{ "method": "B3LYP", "basis": "6-31G*", "species": ["a", "b"] }]
export function basisLabel(b) {
  return b.label || b.id;
}

export function conditions(exp) {
  const bases = exp.bases || [];
  const methods = exp.methods || [];
  const multi = bases.length > 1;
  const make = (m, b, species = null) => ({
    key: `${m.id}|${b.id}`,
    method: m,
    basis: b,
    species,
    label: multi ? `${m.label} / ${basisLabel(b)}` : m.label,
  });
  if (Array.isArray(exp.conditions)) {
    return exp.conditions.map((c) => {
      const m = methods.find((x) => x.id === c.method);
      const b = bases.find((x) => x.id === c.basis);
      if (!m || !b) throw new Error(`Unknown condition ${c.method} / ${c.basis} in ${exp.id}.json`);
      return make(m, b, c.species || null);
    });
  }
  const out = [];
  for (const b of bases) for (const m of methods) out.push(make(m, b));
  return out;
}

export function speciesFor(exp, cond) {
  const all = exp.species || [];
  return cond.species ? all.filter((s) => cond.species.includes(s.id)) : all;
}

// A reaction applies to a condition only if all of its species are run there.
export function applies(cond, rxn) {
  return !cond.species || Object.keys(rxn.nu).every((s) => cond.species.includes(s));
}

export function jobs(exp) {
  const out = [];
  for (const c of conditions(exp)) {
    for (const s of speciesFor(exp, c)) {
      out.push({ key: `${c.key}|${s.id}`, cond: c, species: s });
    }
  }
  return out;
}

export function num(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().replace(/−|–/g, "-").replace(/,/g, "");
  if (s === "") return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
}

// Reaction energy in kcal/mol from the student's own total energies (Eh):
// ΔE = Σ ν_i E_i with ν > 0 for products and ν < 0 for reactants.
export function computedDelta(exp, state, condKey, rxn) {
  let sum = 0;
  for (const [sid, nu] of Object.entries(rxn.nu)) {
    const e = num(state.results?.[condKey]?.[sid]?.energy);
    if (e === null) return null;
    sum += nu * e;
  }
  return sum * HARTREE_TO_KCAL;
}

// Tolerance for "your ΔE agrees with your own total energies": rounding to
// 0.01 kcal/mol or using 627.5 vs 627.5095 must still pass.
export function deltaTolerance(computed) {
  return Math.max(0.06, Math.abs(computed) * 0.002);
}

// Status of one reaction-energy cell: empty | incomplete | ok | mismatch.
// With exp.auto_delta the page computes ΔE itself (no typing), so any
// reaction with all its total energies present counts as "ok".
export function deltaStatus(exp, state, condKey, rxn) {
  const comp = computedDelta(exp, state, condKey, rxn);
  if (exp.auto_delta) return comp === null ? { status: "incomplete", entered: null, comp } : { status: "ok", entered: comp, comp };
  const entered = num(state.deltas?.[condKey]?.[rxn.id]);
  if (entered === null) return { status: "empty", entered, comp };
  if (comp === null) return { status: "incomplete", entered, comp };
  const ok = Math.abs(entered - comp) <= deltaTolerance(comp);
  return { status: ok ? "ok" : "mismatch", entered, comp };
}

// Verified (matching) reaction energies only, used by every chart/summary so
// a wrong entry never leaks the right number.
export function verifiedRows(exp, state) {
  const rows = [];
  for (const c of conditions(exp)) {
    for (const r of exp.reactions || []) {
      if (!applies(c, r)) continue;
      const s = deltaStatus(exp, state, c.key, r);
      if (s.status === "ok") {
        rows.push({
          cond: c.key,
          condLabel: c.label,
          method: c.method.label,
          methodId: c.method.id,
          rung: c.method.rung,
          disp: c.method.disp,
          basis: c.basis.id,
          basisLabel: basisLabel(c.basis),
          family: c.basis.family,
          zeta: c.basis.zeta,
          reaction: r.id,
          reactionLabel: r.label,
          group: r.group,
          delta: s.entered,
          ref: r.ref,
          error: s.entered - r.ref,
          absError: Math.abs(s.entered - r.ref),
          relError: r.ref ? (100 * (s.entered - r.ref)) / Math.abs(r.ref) : null,
        });
      }
    }
  }
  return rows;
}

// Number of reaction energies a condition is expected to produce.
export function expectedReactions(exp, cond) {
  return (exp.reactions || []).filter((r) => applies(cond, r)).length;
}

// Read-only access to the student's own work on another experiment (same
// browser), e.g. to compare Experiments 3, 4 and 5 or import def2-TZVP results.
export async function loadOther(expId) {
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem(`advpchem:${expId}`) || "null");
  } catch (e) {}
  const exp = await loadJSON(`data/experiments/${expId}.json`).catch(() => null);
  return { exp, state: state || { results: {}, deltas: {}, predictions: { values: {} } } };
}

export function mae(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + Math.abs(b), 0) / values.length;
}

export function mean(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function groupBy(arr, keyFn) {
  const m = new Map();
  for (const x of arr) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

// ------------------------------------------------------------------- DOM ---
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Tiny inline markdown for prompts: **bold**, *italic*.
export function md(text) {
  const esc = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function fmt(x, digits = 2) {
  return x === null || x === undefined || !Number.isFinite(x) ? "—" : x.toFixed(digits);
}

export function downloadBlob(blob, filename) {
  const a = h("a", { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

export function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Number of local minima along a curve (values ordered by distance). A smooth
// dissociation curve has exactly one; grid noise adds spurious extra minima.
// End points count as minima only if the curve rises from them.
export function localMinima(values, tol = 0.01) {
  let n = 0;
  for (let i = 0; i < values.length; i++) {
    const left = i === 0 ? Infinity : values[i - 1];
    const right = i === values.length - 1 ? -Infinity : values[i + 1];
    if (i === values.length - 1) continue; // the dissociation limit is not a minimum
    if (values[i] < left - tol && values[i] <= right + tol) n += 1; // plateaus count once
  }
  return n;
}
