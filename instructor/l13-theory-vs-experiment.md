# Class 13 · Debrief Exp. 8 · From electronic energies to experiment  (Before Exp. 9)  *(may need two classes)*

**Goal.** Debrief stability analysis; connect ΔE_el to measurable quantities (ΔE₀, ΔH₂₉₈, ΔG); brief Exp. 9.

**Before class**
- [ ] Slides `slides/l13-theory-vs-experiment.qmd`; handout `lectures/l13-theory-vs-experiment.qmd`; pages `experiments/ex08-stability.qmd`, `ex09-experiment-vs-theory.qmd`.
- [ ] `python3 tools/aggregate.py ex08 "<OneDrive>/Apps/Microsoft Forms/Experiment 8"`; check gradebook; `release_class_results: true` for ex08; render/publish.
- [ ] Charts: `stability-lowering`, `signed-errors`; the NIST panel on the Exp. 9 page (`data-lab="nist"`) open in a tab; [NIST Chemistry WebBook](https://webbook.nist.gov/chemistry/) for FeCl, Fe, Cl.
- [ ] Do not use the answer key's "Experiment 10" Ru⁺ values (errors 130–430 kcal/mol): inconsistent with the real student report; trust the Fall 2026 report.

## [0–15] Exp. 8 debrief
**Look for in class results** (Fall 2026 sample report: plain → stable, signed error ε = calc − ref):
- Unchanged by stability analysis: PBE (Fe −15.9, Ru⁺ −1.95), BP86 Ru⁺ (−0.72), B97M-V Fe (−11.7).
- Big changes: **PBE0 Ru⁺ −20.5 → −0.67** (ΔE 1.5 → 21.3; plain run sat on an unstable solution); **M06-2X Fe +34.9 → −8.5** (ΔE 69.3 → 25.9). Likely "biggest change" answer: M06-2X.
- After stability: Fe errors −8 to −16 (harder), Ru⁺ errors ≤ 2 (easier). Stable ≠ accurate: PBE converged and stable but 16 kcal/mol off for Fe.
- Several functionals were dropped because SCF failed (SPW92, B3LYP, SCAN, ωB97M-V, HF): transition metals are SCF-hostile.
- Hard benchmark: spin-state energetics are very sensitive to HF-exchange fraction (PBE0 and M06-2X change; pure GGAs same).
- Landscape widget: a converged SCF sitting on a saddle.
- **Common mistakes:** wrong multiplicity (silent); Ru⁺ without ECP or charge; excited − ground direction; first "Total energy" line taken instead of the final one; stability run not actually using `INTERNAL_STABILITY TRUE`; unconverged jobs entered anyway; rounded energies (Fe totals ~1263 Eh: 4 decimals = 0.06 kcal/mol or worse).
- **Board:** table `functional | ε plain | ε stable`.
- **Ask:** "PBE0 fixed itself with stability analysis but PBE didn't change. Is PBE then right?" (no: stable and still 16 kcal/mol off for Fe)
- **Watch out:** "stability analysis = accuracy".

## [15–40] Comparing with experiment *(split point inside this block)*
- **A. (≈15–27)** Electronic ΔE_el → ΔE₀ = ΔE_el + ΔZPE (harmonic frequencies) → ΔH₂₉₈ = ΔE₀ + thermal terms (translation 3/2 RT, rotation, vibration, + Δ(pV) = ΔnRT; RT = 0.593 kcal/mol) → ΔG = ΔH − TΔS.
- **B. (≈27–40)** Spin–orbit corrections for atoms (Cl ≈ 0.8 kcal/mol, O ≈ 0.2, C ≈ 0.01); D₀ vs D_e (D₀ = D_e − ΔZPE: H₂ D_e 109.5 → D₀ ≈ 103.3); atomization energies vs enthalpies of formation (atoms must be in the same reference: ΔfH° of atoms from NIST); experimental uncertainty (transition-metal diatomics can have several kcal/mol); NIST Chemistry WebBook.
- ZPE sizes (approximate): H₂ 6.2, H₂O 13.3, CH₄ 27 kcal/mol: atomization energies need large corrections.
- Exp. 9 panel: ΔH₂₉₈ = ΔfH°(Fe) + ΔfH°(Cl) − ΔfH°(FeCl); compare with D_e = 78.5.
- **Board:** `E_el → E₀ = E_el + ZPE → H₂₉₈ = E₀ + ΔH_therm`; `D₀ = D_e − ΔZPE`.
- **Ask:** "Why can't you compare a DFT atomization energy with an enthalpy of formation directly?" (different quantity: ΔE_el vs ΔH; ΔfH° needs atom reference states, ZPE, thermal terms)
- **Watch out:** "total energy = enthalpy"; using kJ/mol vs kcal/mol; ZPE sign; "experiment is exact".

## [40–50] Exp. 9 briefing
- Reactions (7): tert-butanol C–O BDE (115.02), FeCl → Fe + Cl (78.5), atomizations H₂ 109.5, CH₄ 420.4, NH₃ 298.0, H₂O 233.0, O₃ 147.4 (kcal/mol).
- Methods: MN15-L, MN15, B3LYP, PBE, HF with **def2-TZVP**, grid `XC_GRID 000099000590`, `INTERNAL_STABILITY TRUE` in every job; plus B3LYP/6-31G* for tert-butanol and its two fragments: **78 jobs** (15 species × 5 methods + 3). Largest job: tert-butanol (may approach 10 min: submit early; job time unverified).
- **Multiplicities:** tert-butyl radical 2, OH 2, FeCl sextet (6), Fe quintet (5), Cl 2, H 2, C triplet (3), N quartet (4), O triplet (3); tert-butanol, H₂, CH₄, NH₃, H₂O, O₃ singlets.
- **Do first:** (1) lock 4 predictions (HF atomization sign, best for atomization, best for BDEs, 6-31G* vs TZVP for C–O); (2) test jobs for a radical and an atom; (3) batch by method; (4) do NOT reuse Exp. 5 atom energies (different grid/stability settings).
- ν: CH₄ −1, C +1, H +4; NH₃ −1, N +1, H +3; H₂O −1, O +1, H +2; O₃ −1, O +3; H₂ −1, H +2.
- Use the NIST panel after calculating. **Submission:** JSON → Exp. 9 Microsoft Form, Florida Tech email.
- **Watch out:** atoms as singlets; mixing C and N spin states; forgetting the 6-31G* subset; HF jobs not converging.

**If running late:** cut ΔG and spin–orbit details; keep ZPE/thermal/NIST and briefing.
**If this becomes two classes:** **split after block 2 part A (≈ min 27):** Meeting A = Exp. 8 debrief + ZPE/thermal corrections. Meeting B = 5-min recap, spin–orbit, atomization vs ΔfH°, experimental uncertainty, NIST demo, Exp. 9 briefing (same split as the slides and the handout).
**Next class:** Class 14, debrief Exp. 9, choosing and reporting a method, Exp. 10 briefing.
