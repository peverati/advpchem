# Class 14 · Debrief Exp. 9 · Choosing, running and reporting a method  (Before Exp. 10)

**Goal.** Debrief experiment vs theory; teach how to choose and report a method; brief Exp. 10 (students act as consultants).

**Before class**
- [ ] Slides `slides/l14-choosing-a-method.qmd`; handout `lectures/l14-choosing-a-method.qmd`; pages `experiments/ex09-experiment-vs-theory.qmd`, `ex10-final-review.qmd`.
- [ ] `python3 tools/aggregate.py ex09 "<OneDrive>/Apps/Microsoft Forms/Experiment 9"`; check gradebook; `release_class_results: true` for ex09; render/publish.
- [ ] Charts: `signed-errors`, `relative-errors`; NIST panel results.
- [ ] Exp. 10 method card (`data-lab="methodcard"`) open to demo live.
- [ ] **Check the tert-butanol reference.** The course uses 115.02 kcal/mol (as in the original handout). In the answer key that cell shows 147.428 (a copy of the O₃ value); its errors (≈47–56) imply computed BDEs near 91–100 kcal/mol for all good functionals, i.e. errors of about −15 to −24 vs 115.02. If students see a uniform large negative error, that is the data, not their mistake: verify the reference first.

## [0–15] Exp. 9 debrief
**Look for in class results** (answer key, def2-QZVP, unsigned errors; yours are def2-TZVP):
- Atomization energies: HF fails dramatically (H₂ 26, CH₄ 92, NH₃ 97, H₂O 77, O₃ 152 kcal/mol; underbinds; missing correlation; O₃ essentially unbound at HF). B3LYP/MN15/MN15-L: ≈1–6 (O₃ B3LYP 5.8, PBE 37). PBE overbinds typically.
- Radicals/atoms vs closed-shell molecules: errors larger for open-shell atoms (no cancellation, spin polarization).
- FeCl (D_e 78.5): M06-2X 0.3, MN15 3.9, PBE 7.5, B3LYP 7.8, MN15-L 8.9, HF 36: transition-metal difficulty.
- tert-butanol C–O: all DFT functionals within ≈10 kcal/mol of each other (B3LYP lowest BDE ≈ 91, MN15/MN15-L ≈ 98–100 in the key's frame); HF ≈ 58 (underbinds). B3LYP/6-31G* gives a BDE ≈ 3 kcal/mol higher than the large basis: error "improves" by BSSE cancellation (callback to Exp. 6).
- NIST: ΔH₂₉₈(FeCl) from ΔfH° vs D_e 78.5: difference = ZPE + thermal + spin–orbit + experimental uncertainty; typically a few kcal/mol; check students' NIST entries and units (kJ/mol vs kcal/mol).
- **Common mistakes:** atoms as singlets; wrong spin states for C (3), N (4), Fe (5), FeCl (6); missing `XC_GRID 000099000590` or `INTERNAL_STABILITY`; ν missing (CH₄ +4 H); reusing Exp. 5 atom energies; NIST kJ vs kcal; B3LYP/6-31G* done for wrong species; HF/open-shell non-converged; first "Total energy" line instead of the post-stability one.
- **Board:** table `type | HF | DFT`: atomization 25–150 vs 1–6; BDE 36 vs 4–9.
- **Ask:** "Why is HF fine for conformers (Exp. 3) but terrible for atomization?" (no cancellation; atoms/molecules have different correlation energies)
- **Watch out:** comparing D_e with ΔH₂₉₈ directly.

## [15–35] How to choose a method
- Decision tree: (1) system size/cost and the 10-minute budget; (2) property/reaction type; (3) known failure modes (SIE, static correlation, dispersion, open shells, transition metals); (4) benchmark evidence for similar reactions; (5) basis set: triple-ζ (def2-TZVP, pc-2), ECPs for heavy elements (`def2-ECP`); (6) dispersion: -D4 unless the functional already has VV10/is fitted (never both); (7) grid ≥ (99,590)/SG-3 for meta-GGAs; (8) stability analysis for open shells/metals; (9) convergence settings.
- The course evidence by experiment: Exp. 1 basis convergence; Exps. 3–5 methods; Exp. 6 cancellation; Exp. 7 grids; Exp. 8 stability; Exp. 9 reality check.
- Reproducibility checklist: program and version (Q-Chem version of the free server), functional (with fractions/dispersion), basis, ECP, grid, dispersion, SCF convergence, stability, geometry source, multiplicity, charge.
- From your own key (Exp. 10 choices): suggested MN15, B97M-V, ωB97M-V; good MN15-L, B97M-rV; B3LYP/PBE/M06-2X "avoid" for this complex; def2-TZVP good, def2-QZVP too expensive here; small bases (6-31G*, def2-SVP, cc-pVDZ) no; (99,590) recommended; stability analysis required; no symmetry suggested. (The key says D3(BJ); say -D4.)
- **Board:** checklist `size → property → failures → evidence → basis → dispersion → grid → stability`.
- **Ask:** "ωB97M-V with D4 on top: good idea?" (no: VV10 already included; double counting)
- **Watch out:** "pick B3LYP because everyone does"; reporting only the functional.

## [35–50] Exp. 10 briefing
- Pd(PH₃)₂(C₆H₈) → Pd(PH₃)₂ + C₆H₈, reference 16.2 kcal/mol (PdBE2); 3 species, singlets, **you are the consultant**; free choice of method, basis, grid, stability, dispersion.
- **Do first:** (1) lock predictions (energy range; within ±1 kcal/mol?); (2) fill the **method card** and justify every choice with literature; (3) check the cost warnings against the 10-minute limit (Pd complex is the largest job; time unverified: test before submitting everything); (4) set up inputs: Pd needs `ECP def2-ECP` with def2 basis sets (generator adds it).
- Deliverables: results table (energies, cycles, wall times; ΔE = E(PdL₂) + E(C₆H₈) − E(complex)), **report (~300 words)**: title, method and why (cited), complete setup, result vs 16.2, reference list; optionally a second file upload (PDF) and peer review on Canvas.
- **Submission:** JSON (+ report) → Exp. 10 Microsoft Form, Florida Tech email.
- **Watch out:** forgetting ECP; double counting dispersion; double-ζ basis; no stability/grid in the report; reporting Eh as kcal/mol.

**If running late:** shorten the NIST discussion; show the checklist but skip the tree detail; never skip briefing.
**If this becomes two classes:** not marked.
**Next class:** Class 15, debrief Exp. 10, synthesis, course feedback.
