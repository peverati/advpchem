# Lecture 7 · Debrief Exp. 1–2 · How we test a functional  (Before Exp. 3)

**Goal.** Debrief the basis-set and ladder experiments; teach how functionals are benchmarked; brief Exp. 3.

**Before class**
- [ ] Slides `slides/l07-benchmarking.qmd`; handout `lectures/l07-benchmarking.qmd`; pages `experiments/ex01-basis-sets.qmd`, `ex02-jacobs-ladder.qmd`, `ex03-organic-a.qmd`.
- [ ] OneDrive synced; run `python3 tools/aggregate.py ex01 "<OneDrive>/Apps/Microsoft Forms/Experiment 1"` (path as in README; add `--include-muddiest` if wanted). Exp. 2 has no energies: just check completeness in the Form.
- [ ] Check `gradebook/ex01_gradebook.xlsx` (private) for completeness, MAE, common slips; `data/class/ex01.json` written.
- [ ] Set `"release_class_results": true` for ex01 in `data/course.json`, `quarto render`, publish (or release at the start of class). Then open `class-results.qmd`.
- [ ] Have Exp. 3 page open for the briefing (predictions, 128 jobs, method list).

## [0–15] Exp. 1 debrief (use heatmap if released)
**Look for in class results** (reference 2.01 kcal/mol; from the answer key's HCl dimer, def2 sets, sign ε = calc − ref; cc-pVnZ is not in the key: check class data):
- Error does NOT decrease monotonically for every method. B3LYP: +1.19 (SVP), −0.45 (TZVP), −0.75 (QZVP); PBE +1.90, +0.33, +0.03; ωB97M-V +1.79, +0.16, −0.12; HF −0.30, −1.67, −1.84.
- Why: at def2-SVP, BSSE makes the dimer too stable (calc dissociation energy too large; CP correction ≈ −1.5 kcal/mol). With a larger basis the BSSE fades and the method's intrinsic error shows: B3LYP/BP86 settle at ~−0.8 (underbind), PBE and ωB97M-V near 0.
- HF fails at any basis: binds only ~0.2 of the ~2 kcal/mol (no dispersion). HF error GROWS with basis (small basis flatters it).
- Triple- to quadruple-ζ changes are ~0.05–0.3 kcal/mol: TZ is close to the limit; DZ is not converged (error 1–2 kcal/mol). Best accuracy/cost: triple-ζ.
- def2 vs cc: cc sets are built for correlated methods; def2 is often better for DFT at the same ζ; check the class "family" chart before claiming.
- Cost exponent: formal N⁴; measured is lower (screening, small N); HF vs DFT may differ; no key data: use class medians.
- **Common mistakes:** sign of ν (should be −1 for dimer, +2 for HCl); rounding totals; wrong basis spelled (cc-pVTZ vs def2-TZVP); wall vs CPU time; forgetting to record N_bf; predictions not locked.
- **Board:** `error(ζ)` sketch: DFT lines crossing zero then flattening; HF line drifting away.
- **Ask:** "Why can a double-ζ basis look better than a quadruple-ζ one?" (BSSE/incompleteness error cancels the method error)
- **Watch out:** "smaller error = better basis": compare to the CBS limit of the same method.

## [15–20] Exp. 2 debrief
- Typical misclassifications: M11-L (local, no HF → mGGA), MN15-L (meta-NGA, no HF → mGGA), M06-HF (100% HF, H-mGGA), M11 and ωB97M-V (range-separated hybrid meta-GGA), B97M-V (mGGA with VV10, NOT a hybrid), "-V" vs "-D", SCAN (mGGA), functionals named after the parameter count (B3LYP's 3).
- HF fractions: B3LYP 20%, B3PW91 20%, PBE0 25%, M06 27%, MN15 44%, M06-2X 54%, M05-2X 56%, M06-HF 100%.
- The 16 methods (Exp. 3–5): see class 6 table.
- **Ask:** "Is ωB97M-V a hybrid?" (yes: range-separated hybrid meta-GGA with VV10)

## [20–40] How functionals are tested
- Benchmark databases: GMTKN55 [@goerigk2017] (55 subsets, ~1500 relative energies), MGCDB84 [@mardirossian2017] (84 sets, ~5000 data points), Minnesota databases.
- References: CCSD(T)/CBS or experiment. Reaction types: thermochemistry, barriers, noncovalent, isomerizations, conformers.
- Error statistics: signed error ε = ΔE_comp − ΔE_ref, MSE (bias), MAE, RMSD, max error, relative error. Chemical accuracy ≈ 1 kcal/mol.
- A single number never tells the whole story: MSE vs MAE; one catastrophic failure hidden in an average; training-set bias (class 9).
- **Board:** `ε = ΔE_comp − ΔE_ref`; `MSE = (1/N)Σε`; `MAE = (1/N)Σ|ε|`; two toy sets with MSE = 0 and MAE large.
- **Ask:** "Method A: MAE 0.5, max 8. Method B: MAE 0.7, max 1.5. Which do you pick for a new reaction?" (depends; B is more robust; look at the max/worst case and the reaction type)
- **Watch out:** judging by one reaction; averaging across systems of very different size without relative errors.

## [40–50] Exp. 3 briefing
- Four "easy" organic reactions: 3a ethane rotation 2.73, 3b methanol rotation 1.01, 3c butane-1,4-diol conformers 3.29, 3d cis→trans pent-2-ene −1.15 kcal/mol.
- 16 methods (SPW92 … HF), def2-TZVP, 8 species × 16 = **128 jobs**, all closed-shell singlets. Why "easy": error cancellation (isodesmic-like).
- **Do first:** (1) lock 5 predictions (best, worst, D4 effect on B3LYP, costliest per SCF cycle, functional draft over Exps. 3–5); (2) one test job; (3) batch by method (8 jobs each); (4) record energy, SCF cycles, wall time (cost per SCF cycle = time/cycles).
- **-D4 inputs:** `PBE-D4` and `B3LYP-D4` need the dispersion keyword (generator writes `DFT_D D4`; keyword unverified on the free server): check D4 jobs differ from non-D4 jobs.
- Always use TOTAL energy (not SCF energy: differs with -D4).
- **Submission:** JSON → Exp. 3 Microsoft Form, Florida Tech email.
- **Watch out:** -D4 job identical to plain job (flag not applied); ν signs for the rotation barriers (staggered −1, eclipsed +1).

**If running late:** cut the cost-exponent discussion (leave for class 8); skim Exp. 2; keep error statistics and the briefing.
**If this becomes two classes:** not marked.
**Next class:** Lecture 8, debrief Exp. 3, dispersion, Exp. 4 briefing.
