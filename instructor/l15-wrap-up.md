# Class 15 · Debrief Exp. 10 · What we learned  (Debrief Exp. 10 / course end)

**Goal.** Debrief the consultant exercise; revisit the two approximations and the error hierarchy; collect course feedback.

**Before class**
- [ ] Slides `slides/l15-wrap-up.qmd`; handout `lectures/l15-wrap-up.qmd`; page `experiments/ex10-final-review.qmd`.
- [ ] `python3 tools/aggregate.py ex10 "<OneDrive>/Apps/Microsoft Forms/Experiment 10"` (add `--include-muddiest` for muddiest points); check gradebook; `release_class_results: true` for ex10 (shows "Methods the class chose" with median error); render/publish.
- [ ] Skim 5–6 reports to quote (anonymized) good/poor examples; check reproducibility (setup completeness) and references.
- [ ] Feedback form/muddiest-points prompt ready.

## [0–20] Exp. 10 debrief
**Look for in class results** (answer key: Pd complex 16.2 kcal/mol; MN15-L/def2-TZVP 15.19 (−1.0), MN15/TZVP 15.59 (−0.61), B3LYP/TZVP 3.27 (−12.9); def2-QZVP changes values by < 0.7):
- Spread of method choices (table "Methods the class chose"); how many landed within ±1, ±2 kcal/mol; modern fitted functionals with TZVP should cluster near 15–16.
- B3LYP without dispersion: ≈ −13 kcal/mol (misses the π/ligand dispersion binding in the complex); -D4 should recover a lot (check class data).
- Good choices: MN15, MN15-L, B97M-V/B97M-rV, ωB97M-V with def2-TZVP (or pc-2), (99,590) grid, stability analysis. Poor: double-ζ, SG-1, PBE/B3LYP/M06-2X without justification, D4 stacked on VV10.
- Basis effect: TZ vs QZ differs ≲ 0.7 kcal/mol; QZVP not worth 10-minute risk.
- **Classic mistakes:** no ECP for Pd; double-ζ basis; no stability analysis; double-counted dispersion; SG-1 with a meta-GGA; sign error (BDE negative); Eh vs kcal/mol; incomplete setup in the report (program/version/grid/convergence missing); no references; claiming "matches the reference" with 3 kcal/mol error; hitting the 10-minute limit.
- **Board:** table `choice | basis | grid | stab | ε`; mark ±1 band.
- **Ask:** "Whose report could you reproduce from the text alone?" (those with program, functional, basis, ECP, grid, stability, convergence, geometry source)
- **Watch out:** judging only by closeness to 16.2 (lucky cancellation again): judge the justification.

## [20–40] Synthesis
- The two approximations revisited: Ψ (basis: Exps. 1, 6) and Ĥ (method: Exps. 3–5, 9); plus numerical choices (grid: Exp. 7), SCF solution (stability: Exp. 8), and comparing with reality (ZPE/thermal: Exp. 9).
- Error hierarchy: method > basis > grid > SCF convergence in size, but every level can bite (Ex. 5/6: CaO; Ex. 7: wiggles; Ex. 8: stability).
- Error cancellation: can mislead (6-31G*, MN15 on CaO); rely on benchmark evidence and converged settings.
- "Black box" warning: defaults hide choices; report everything.
- Where the field goes: machine-learned functionals, local correlation methods (e.g. DLPNO-CCSD(T)), double hybrids, better benchmarks.
- **Board:** one diagram: `reaction energy error = method + basis + grid + SCF + geometry + (thermal/ZPE when comparing to experiment)`.
- **Ask:** "A colleague says 'I used B3LYP/6-31G* and it agrees with experiment'. What do you ask?" (reference, which property, basis-converged?, dispersion, grid, stability, why trust cancellation)
- **Watch out:** ending with "DFT is unreliable" (the point is knowing when and why).

## [40–50] Course feedback; muddiest points
- Collect: muddiest point per block (basis, SCF, ladder, grids, stability, thermal), which experiment taught most, workload (jobs per experiment), server issues, handout/slide usefulness.
- Note submission/IQmol/extraction problems for next semester; update guides with real IQmol screenshots and verified Q-Chem keywords.
- **Ask:** "What would you change in the order of the experiments?" (open)

**If running late:** drop the future-directions list; keep the error hierarchy and feedback.
**If this becomes two classes:** not marked.
**Next class:** none (end of course).
