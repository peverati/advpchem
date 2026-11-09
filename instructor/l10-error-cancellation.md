# Lecture 10 · Debrief Exp. 5 · Basis-set error vs functional error  (Before Exp. 6)

**Goal.** Debrief the hard reactions; show total error = method + basis (+ others) and that cancellation can fool you; brief Exp. 6.

**Before class**
- [ ] Slides `slides/l10-error-cancellation.qmd`; handout `lectures/l10-error-cancellation.qmd`; pages `experiments/ex05-difficult-cases.qmd`, `ex06-b3lyp-631gs.qmd`.
- [ ] `python3 tools/aggregate.py ex05 "<OneDrive>/Apps/Microsoft Forms/Experiment 5"`; check gradebook; `release_class_results: true` for ex05; render/publish. The functional-draft league now covers Exps. 3–5.
- [ ] Exp. 5 charts: `signed-errors`, `relative-errors`, `cao-spotlight`, `difficulty-ladder`.
- [ ] Citation: [@kruse2012].

## [0–15] Exp. 5 debrief
**Look for in class results** (answer key, def2-QZVP, -D3(BJ); signs ε = calc − ref):
- 5a: B3LYP +3.5, PBE +7.6, B97M-V −0.06, M06-2X −11.2, MN15 −10.6, ωB97M-V −7.9; HF +21.
- 5b CaO: B3LYP +7.3, PBE/BP86 +27, SCAN +19.6, M06-2X +8.0, M11 +11.5, ωB97M-V +1.5, MN15 **+0.14** (training set), SPW92 +49, HF −86 (CaO barely bound).
- 5c H₂SO₄ (602): GGAs/hybrids ±10–25 (≈2–4%); SPW92 +148 (overbinds); HF −280 (underbinds); MN15 −1.9, SCAN −1.1 small.
- 5d 2 O₃ → 3 O₂: most methods off by 10–30; HF −67 (ozone looks as stable as O₂ at HF: multireference); PBE +31.
- Overall MAE (key): MN15 ≈ 5, SCAN/B97M-V/ωB97M-V ≈ 7, then 10–14 for hybrids and BLYP, ≈ 20 PBE/BP86, SPW92 ≈ 60, HF ≈ 110.
- Which rungs survive: meta-GGAs and fitted hybrids do best; GGAs mediocre; LSDA and HF fail.
- D4 does not fix static correlation or SIE: B3LYP-D3 changes 5a and 5c by few kcal, 5d not at all (key sheet 7 gives 18.7; ignore the 0.71 shown in the Exps. 1–3 summary sheet: looks like a typo).
- Relative vs absolute: 20 kcal/mol on 5c (3%) vs 4 on 5a (7%).
- CaO spotlight: MN15's 0.14 kcal/mol is not skill; the molecule is in its training set. Judge functionals on data they never saw.
- `difficulty-ladder`: errors rise 3 → 4 → 5; best overall = the functional-draft winner? Ask.
- **Common mistakes:** wrong multiplicity for O/S/H atoms (all methods shifted by tens of kcal/mol per atom; singlet O atom converges happily); ν missing (+4 O, +2 H in 5c; −2/+3 in 5d); using singlet for O₂; unrestricted not set; unconverged open-shell SCF; SCF vs total energy; the two ozone geometries mixed.
- **Board:** `rel. error = |ε| / |ΔE_ref|`; examples 5a vs 5c.
- **Ask:** "MN15 gives 0.14 on CaO. Is MN15 the best for CaO-like molecules?" (can't say: training set)
- **Watch out:** "lowest MAE = best method" with one training-set data point.

## [15–30] Total error = method + basis (+ others)
- ε_total ≈ ε_method(CBS) + ε_basis (+ ε_grid + ε_SCF …). Signs can oppose → cancellation.
- BSIE and BSSE in small bases. **Counterpoise (definition only):** `E_CP = E_AB(AB basis) − E_A(AB basis) − E_B(AB basis)`: fragments computed in the dimer's full basis. Magnitude (HCl dimer, DFT, key): ≈ 1.5 kcal/mol (def2-SVP), 0.3 (TZVP), 0.05 (QZVP).
- Why B3LYP/6-31G* is the most used level: 1990s cost, Gaussian defaults, citation momentum; it can be right for the wrong reasons [@kruse2012]; small-basis BSSE fakes the missing dispersion of B3LYP.
- **Board:** `ε_total = ε_method + ε_basis`; draw two arrows of opposite sign.
- **Ask:** "B3LYP/6-31G* matches experiment well. Does that mean B3LYP is good? Does it mean 6-31G* is good?" (neither: lucky cancellation; unpredictable)
- **Watch out:** "CP correction makes results right" (it removes one error, not the others); BSSE is not just a dimer problem (intramolecular too).

## [30–35] Not all double-ζ sets are equal
- Compare cyclohexene with 6-31G*, def2-SVP, cc-pVDZ, pc-1: 6-31G* is smaller (Cartesian d, no p on H), the other three are of similar size (hand estimates ≈ 110 vs ≈ 134: verify; students count in Exp. 6).
- Use the page's `nbf-counter` after students enter data; before that, show counts from a real output.
- **Ask:** "Both are 'double-ζ'. Why aren't they the same size?" (different polarization/contraction choices)
- **Watch out:** treating "double-ζ" as one quality level.

## [35–50] Exp. 6 briefing
- B3LYP and B3LYP-D4 with 6-31G*, def2-SVP, cc-pVDZ, pc-1 on 4a, 4b, 5b (8 species), compared with the def2-TZVP energies from Exps. 4–5: **64 new jobs** (2 methods × 4 bases × 8 species). All singlets except the O atom (triplet, `UNRESTRICTED`).
- **Do first:** (1) lock 4 predictions (widest margin for 6-31G*, CaO result, best double-ζ, effect of D4); (2) **Import** the def2-TZVP B3LYP/B3LYP-D4 energies: they're read from THIS browser's Exp. 4/5 drafts (same computer/browser or load saved files on those pages first); (3) batch by basis; (4) check pc-1 is accepted by the server (keyword `BASIS pc-1` unverified; fallback def2-SV(P)); (5) "Spot the anomaly" widget.
- Table columns: total energy and number of basis functions only (no cycles/times).
- Page's tip: B3LYP/6-31G* works by fortuitous cancellation (don't give results away).
- **Submission:** JSON → Exp. 6 Microsoft Form, Florida Tech email.
- **Watch out:** import empty because of a different browser; D4 flag missing; Ca atom spelled with wrong multiplicity (singlet).

**If running late:** cut the citation-history story; keep CP definition and the briefing.
**If this becomes two classes:** not marked.
**Next class:** Lecture 11, debrief Exp. 6, integration grids, Exp. 7 briefing (extraction script).
