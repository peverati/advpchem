# Class 8 · Debrief Exp. 3 · Dispersion and noncovalent interactions  (Before Exp. 4)

**Goal.** Debrief the "easy" reactions; explain dispersion and how it's added; brief Exp. 4.

**Before class**
- [ ] Slides `slides/l08-dispersion.qmd`; handout `lectures/l08-dispersion.qmd`; pages `experiments/ex03-organic-a.qmd`, `ex04-organic-b.qmd`.
- [ ] `python3 tools/aggregate.py ex03 "<OneDrive>/Apps/Microsoft Forms/Experiment 3"`; check `gradebook/ex03_gradebook.xlsx` for slips and `data/class/ex03.json`.
- [ ] `release_class_results: true` for ex03 in `data/course.json`; render/publish; open `class-results.qmd` (heatmap + functional-draft league).
- [ ] Charts on the Exp. 3 page: `signed-errors`, `cost-accuracy`.
- [ ] Exp. 4 page ready (predictions, 160 jobs).

## [0–15] Exp. 3 debrief
**Look for in class results** (answer key at def2-QZVP, D3(BJ) not D4: indicative only; your def2-TZVP numbers will differ by ~0.1):
- Almost every method is within ~0.3 kcal/mol on 3a–3d: error cancellation (same bonds, same atom types on both sides).
- Best: M06-2X and PBE0 (MAE ≈ 0.05), MN15 ~0.1; B3LYP ~0.17; PBE ~0.12.
- Outliers: SPW92 (3c +2.3) and HF (3c −1.6, 3d −0.6). The diol (3c) has an intramolecular H bond: weak interactions stress LSDA/HF; HF has no dispersion.
- -D4 changes little here (key: PBE-D3 on 3c 0.16 → 0.48, slightly worse): when dispersion is similar on both sides it cancels.
- Cost: hybrids cost more per SCF cycle than (meta-)GGAs; range-separated hybrids and VV10 more; B3LYP is not special. Use the `cost-accuracy` chart: "is the most expensive method the most accurate?" (no).
- Functional draft: show the league table; early leader will be tested by Exps. 4–5.
- **Common mistakes:** staggered/eclipsed ν reversed (barrier negative); -D4 job identical to plain job (flag missing; check PBE vs PBE-D4 energies differ); SCF energy instead of total energy; CPU instead of wall time; rounding totals; unconverged SCF (no "Convergence criterion met").
- **Board:** table: `rung | MAE`: LSDA/HF worst, hybrids best, GGAs in between.
- **Ask:** "Why are barriers of ethane rotation easy for DFT?" (nothing breaks; same electrons/bonds both sides)
- **Watch out:** concluding "DFT is accurate to 0.1 kcal/mol": only on cancellation-friendly problems.

## [15–35] Dispersion
- Origin: correlated fluctuating dipoles (London 1930): E_disp ≈ −C₆/R⁶ (attractive, long range, always present).
- Why semilocal DFT misses it: functional sees only local ρ (and ∇ρ, τ), no interaction between distant densities. HF has no correlation at all.
- Fixes: pairwise -D (D2, D3 as history, **D4** with charge-dependent C₆ and damping) [@grimme2010; @caldeweyher2019]; nonlocal VV10 kernel (-V, -rV); fitted (Minnesota).
- Intramolecular dispersion: branched alkanes (neohexane) are more stable than linear because of dispersion-like medium-range correlation [@grimme2006alkanes].
- **Board:** `E_disp = −Σ_AB f_damp C6_AB / R_AB^6`; sketch two-molecule curve: with and without -D.
- **Ask:** "Why does neohexane beat n-hexane in energy?" (more compact: more short-range contacts: dispersion)
- **Watch out:** treating -D as a "fix for everything"; stacking -D4 on a functional that already has VV10 (ωB97M-V, B97M-V): double counting; "dispersion = van der Waals radius".

## [35–50] Exp. 4 briefing
- Reactions: 4a Diels–Alder ethene + butadiene → cyclohexene (−45.4; σ formed from π); 4b n-hexane → neohexane (−2.49; intramolecular dispersion); 4c 2 ethane → (ethane)₂ (−1.34; pure dispersion); 4d MeOH + MeOH → (MeOH)₂ (−5.81; H bond).
- 16 methods, def2-TZVP, 10 species × 16 = **160 jobs**, all singlets. Expectations: -D4 helps 4b–4d; 4a tests bond formation.
- **Do first:** (1) lock 5 predictions (B3LYP on the ethane dimer, D4 effect, best for 4b, worst overall, harder than Exp. 3?); (2) one test job; (3) batch by method (10 jobs); (4) watch ν: **2 ethane** (ν = −2) for 4c; methanol dimer needs monomers A and B (−1 each).
- BSSE: not corrected here; dimers at TZVP carry ~0.1–0.3 kcal/mol (BSSE CP magnitude from HCl dimer: 0.3 at def2-TZVP).
- Use TOTAL energies; record energy, cycles, wall time.
- **Submission:** JSON → Exp. 4 Microsoft Form, Florida Tech email.
- **Ask:** "Which reaction will -D4 matter most for?" (4c, 4b; pure dispersion/intramolecular; don't pre-answer, they're locking predictions)
- **Watch out:** forgetting the 2; signs of association energies (negative = bound).

**If running late:** cut the cost discussion and the alkane example; keep the dispersion physics and briefing.
**If this becomes two classes:** not marked.
**Next class:** Class 9, debrief Exp. 4, why DFT fails, Exp. 5 briefing.
