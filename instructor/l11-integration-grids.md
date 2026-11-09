# Class 11 · Debrief Exp. 6 · Numerical integration grids  (Before Exp. 7)

**Goal.** Debrief error cancellation with small bases; explain DFT integration grids; brief Exp. 7 including the extraction script and CSV import.

**Before class**
- [ ] Slides `slides/l11-integration-grids.qmd`; handout `lectures/l11-integration-grids.qmd`; pages `experiments/ex06-b3lyp-631gs.qmd`, `ex07-grids.qmd` (`#sec-extract`).
- [ ] `python3 tools/aggregate.py ex06 "<OneDrive>/Apps/Microsoft Forms/Experiment 6"`; check gradebook (import problems!); `release_class_results: true` for ex06; render/publish.
- [ ] Charts: `basis-mae`, `anomaly-spotter`, `nbf-counter`.
- [ ] **Test `downloads/extract_ex07.py` on 2–3 real Ar₂ outputs from the IQmol server before class** (only fake outputs tested so far): lines `Total energy in the final basis set`, `Convergence criterion met`, `Total job time`, echoed `$rem` (IQmol may write lowercase `key = value`), and where IQmol saves outputs. Also try `XC_GRID 1/2/3` input on the server (keyword unverified).
- [ ] Grid explorer widget on the Exp. 7 page for the demo (`data-lab="grid"`).

## [0–15] Exp. 6 debrief
**Look for in class results** (answer key: B3LYP at def2-QZVP vs small bases; your reference is def2-TZVP, so numbers differ slightly):
- 4a Diels–Alder: 6-31G* error **2.45** vs 11.4 at QZVP: the small basis looks far better (error cancellation: BSSE overbinding offsets B3LYP's underbinding).
- 4b: 3.64 vs 3.77: about the same.
- 5b CaO: 6-31G* **55** vs 7.3: far worse. Other double-ζ sets are fine (cc-pVDZ 3.5, pc-1 0.6, def2-SVP 0.7), so 6-31G* for Ca is the culprit (poor balance, chemical reasoning).
- Mean over three reactions: def2-SVP ≈ 2.5, pc-1 ≈ 4.0, cc-pVDZ ≈ 4.1, 6-31G* ≈ 20. With -D (D3 in key): 4a 6-31G* gets WORSE (2.45 → 3.0); 4b 3.6 → 1.0; small basis + -D partially double counts the BSSE "dispersion"; pc-1-D best (≈ 1.2).
- Lesson: compare at a converged basis first; "luck" is unpredictable (helps 4a, doesn't help 5b).
- **Common mistakes:** Import empty (different browser/computer; Exps. 4/5 not saved); def2-TZVP energies imported for the wrong method; D4 flag missing; pc-1 not available so def2-SV(P) used without saying so; counting basis functions from the wrong species (cyclohexene is the requested one).
- **Board:** `ε(6-31G*) < ε(def2-TZVP)` for 4a, with the explanation `ε_method + ε_BSSE = small`.
- **Ask:** "A small basis gives the smaller error. Do you trust it?" (no: compare at the converged basis; lucky cancellation)
- **Watch out:** "B3LYP/6-31G* is good for CaO" is the opposite of what the data show.

## [15–40] Integration grids
- E_xc has no analytic integral: quadrature. Becke partitioning into atomic cells [@becke1988a]; per-atom radial shells × angular (Lebedev) points: (75,302) = 75 radial shells, 302 angular points.
- Q-Chem: **XC_GRID 1 = SG-1** (~(50,194), pruned), **2 = SG-2** (~(75,302)), **3 = SG-3** (~(99,590)); explicit form `XC_GRID 000099000590` (used in Exp. 9). Pruning: fewer points near nuclei/far away.
- Rotational variance: a coarse grid breaks rotational invariance (energy changes if you rotate the molecule).
- Meta-GGAs (τ) and heavily parameterized functionals (Minnesota) are grid-sensitive [@wheeler2010; @mardirossian2016]; gradient/density-only (B3LYP) are forgiving.
- **HF needs no XC grid** (analytic integrals; the HF-exchange part of a hybrid is analytic too).
- Cost grows with the number of grid points (modest in practice).
- **Board:** `E_xc ≈ Σ_A Σ_{r,Ω} w_{A,rΩ} f(ρ, ∇ρ, τ)`; radial × angular sketch; (75,302).
- **Ask:** "Does Hartree–Fock depend on the integration grid?" (no XC grid; integrals are analytic)
- **Watch out:** "default grid is always fine" (Q-Chem's default depends on version/functional: don't rely on it; report your grid); confusing SG-n with (n,m) notation.

## [40–50] Exp. 7 briefing
- Ar₂ curve, 3.0–6.0 Å (31 distances) + Ar atom; reference well depth ≈ −0.28 kcal/mol near 3.7–3.8 Å. 5 functionals (B3LYP, M06-L, M11-L, M11, ωB97M-V) × 3 grids (SG-1/2/3) with **def2-TZVP** (switched from QZVP: in Fall 2026, SG-3/QZVP jobs often hit the 10-min limit and SG-2 took 5–7 min): **5 × 3 × 32 = 480 jobs**; SG-1 seconds, SG-2/SG-3 a few minutes each, all singlets. Tell students to report any SG-3 time-outs.
- **Do first:** (1) lock 4 predictions (most grid-sensitive, smooth at SG-3?, SG-3/SG-1 cost, HF dependence → answer in Q7); (2) test one job and **check `XC_GRID` appears in the echoed `$rem`** (default-grid jobs are rejected by the script); (3) work one functional + one grid at a time (page suggests splitting functionals across the class: assign!); (4) keep every output in ONE folder (subfolders per grid are fine).
- **Extraction script:** `downloads/extract_ex07.py` (Python 3.8+; macOS `python3`, Windows `py`; Colab fallback with unzip). Needs 32 jobs per functional/grid cell, 480 total. It reports missing, problem (crashed/not converged/wrong basis/missing `XC_GRID`), duplicate and unrecognized files. Writes `ex07_results.csv` next to the outputs. **Don't re-save the CSV from Excel.** Spot-check 2–3 outputs by hand.
- **Import CSV** on the results table fills energy, cycles, time; the page computes ΔE(r) = E(Ar₂) − 2E(Ar) (`auto_delta`) and draws the curves; it asks before overwriting.
- Deliverable: wiggle report and answers; JSON → Exp. 7 Microsoft Form, Florida Tech email.
- **Watch out:** runs with default grid; one folder per student machine but outputs missing; script run on a different folder; CSV edited; forgetting the Ar atom.

**If running late:** shorten Exp. 6 to the three headline numbers; cut Lebedev details; keep grids → wiggles and the briefing (script instructions are on the page).
**If this becomes two classes:** not marked.
**Next class:** Class 12, debrief Exp. 7 (grid wiggles), SCF stability, transition metals, Exp. 8 briefing.
