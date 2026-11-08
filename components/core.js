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
    student: { name: "", id: "" },
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
// A "condition" is one method/basis combination; a "job" is a condition × species.
export function conditions(exp) {
  const out = [];
  const bases = exp.bases || [];
  for (const b of bases) {
    for (const m of exp.methods || []) {
      out.push({
        key: `${m.id}|${b.id}`,
        method: m,
        basis: b,
        label: bases.length > 1 ? `${m.label} / ${b.id}` : m.label,
      });
    }
  }
  return out;
}

export function jobs(exp) {
  const out = [];
  for (const c of conditions(exp)) {
    for (const s of exp.species || []) {
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

// Reaction energy in kcal/mol from the student's own total energies (Eh).
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

// Status of one reaction-energy cell: empty | incomplete | ok | mismatch
export function deltaStatus(exp, state, condKey, rxn) {
  const entered = num(state.deltas?.[condKey]?.[rxn.id]);
  const comp = computedDelta(exp, state, condKey, rxn);
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
    for (const r of exp.reactions) {
      const s = deltaStatus(exp, state, c.key, r);
      if (s.status === "ok") {
        rows.push({
          cond: c.key,
          method: c.method.label,
          methodId: c.method.id,
          rung: c.method.rung,
          basis: c.basis.id,
          family: c.basis.family,
          zeta: c.basis.zeta,
          reaction: r.id,
          reactionLabel: r.label,
          delta: s.entered,
          ref: r.ref,
          error: s.entered - r.ref,
          absError: Math.abs(s.entered - r.ref),
        });
      }
    }
  }
  return rows;
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
