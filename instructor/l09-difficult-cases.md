# Class 9 · Debrief Exp. 4 · Why some reactions are hard for DFT  (Before Exp. 5)  *(may need two classes)*

**Goal.** Debrief the dispersion experiment; explain the failure modes (SIE, static correlation, atomization); brief Exp. 5.

**Before class**
- [ ] Slides `slides/l09-difficult-cases.qmd`; handout `lectures/l09-difficult-cases.qmd`; pages `experiments/ex04-organic-b.qmd`, `ex05-difficult-cases.qmd`.
- [ ] `python3 tools/aggregate.py ex04 "<OneDrive>/Apps/Microsoft Forms/Experiment 4"`; check gradebook; `release_class_results: true` for ex04 in `data/course.json`; render/publish.
- [ ] Exp. 4 charts: `signed-errors`, `d4-pairs`, `dispersion-dimers`, `cost-accuracy`.
- [ ] Cite for SIE: [@cohen2012].

## [0–15] Exp. 4 debrief
**Look for in class results** (answer key, def2-QZVP, -D3(BJ) analog of D4; signs in our convention ε = calc − ref):
- 4c ethane dimer: B3LYP does not bind it (calc ≈ +0.6 vs −1.34: error +2.0); -D (D3 in key) fixes it (error 0.03); PBE +1.2 → 0.2 with -D. M06-2X/ωB97M-V/M11 ≈ 0.1–0.3 without any add-on (fitted/VV10).
- 4b neohexane: B3LYP error +3.8 (wrong sign: n-hexane predicted more stable); -D → +1.1; M06-2X, ωB97M-V, B97M-V, M11 ≈ 0.2.
- 4d methanol dimer: B3LYP +0.9 → 0.04 with -D; H bond partly captured without dispersion.
- 4a Diels–Alder: errors much larger: B3LYP +11.4 (→ +5.9 with -D), BLYP +19.4, BP86 +7.2, SPW92 −16, HF +12; M06-2X −0.4, M11 +0.25, MN15 +1.0, ωB97M-V −1.3, PBE-D −0.4. -D helps but B3LYP-D remains poor: -D can't fix bond-changing errors.
- Overall worst: BLYP, then B3LYP/BP86/SPW92/HF; best: M06-2X, M11 (MAE ≈ 0.25), ωB97M-V, MN15, PBE-D.
- Typical error is 10× bigger than Exp. 3: error cancellation breaks down when bonds form (4a) or when the interaction is the whole effect (4c).
- Use `d4-pairs`: PBE vs PBE-D4, B3LYP vs B3LYP-D4: gain largest for 4c, 4b.
- **Common mistakes:** ν = −1 instead of −2 for ethane (4c error ≈ equals the binding energy); MeOH monomers mixed; association energy sign; -D4 flag missing (pair identical); SCF vs total energy; unconverged jobs.
- **Board:** table `reaction | B3LYP | B3LYP-D`: 4c 2.0 → 0.03; 4a 11 → 6.
- **Ask:** "-D4 reduced B3LYP's error for 4b but not for 4a. Why?" (4a is not mainly a dispersion problem: bond rearrangement/delocalization)
- **Watch out:** "D4 fixes B3LYP"; reading MAE averaged over 4a alone as dispersion.

## [15–35] Why DFT fails *(split point inside this block)*
- **A. Self-interaction / delocalization error (~minutes 15–25):** approximate functionals don't cancel J_ii exactly. Consequences: H₂⁺ stretched wrongly (energy too low: half an electron on each proton), too-low barriers, overstabilized delocalized/charge-transfer states [@cohen2012]; fix in part with HF exchange (hybrids, range separation).
- **B. Static correlation (~25–30):** near-degenerate configurations; single-determinant HF and KS fail: stretched H₂ (RHF), O₃ (diradical character), CaO (multireference), transition metals.
- **C. Atomization energies (~30–35):** molecule vs open-shell atoms; no error cancellation; spin polarization; LSDA/GGA overbind; HF underbinds hugely (missing correlation; atoms have the largest relative correlation energy).
- **Board:** `E_exact(H₂⁺, R→∞) = −0.5 Eh`; DFT curve dipping below; second sketch: H₂ RHF vs exact; third: `ΔE_atom = Σ E(atoms) − E(molecule)`.
- **Ask:** "Why is HF so bad for atomization energies when it's decent for conformers?" (atoms have no cancellation partner: different number of electron pairs)
- **Watch out:** "multireference = bad functional" (it's a limitation of single-determinant formalism); SIE only matters for charged/stretched cases (don't overgeneralize); "unrestricted fixes everything" (spin contamination).

## [35–50] Exp. 5 briefing
- 5a ozonolysis O₃ + C₂H₄ → primary ozonide (−58.7); 5b CaO → Ca + O (96.15; CaO is in some functionals' training sets: MN15 especially); 5c H₂SO₄ → S + 4 O + 2 H (602.18; largest number: relative vs absolute error); 5d 2 O₃ → 3 O₂ (−67.6).
- 16 methods, def2-TZVP, **12 species × 16 = 192 jobs listed on the page** (the O atom and O₃ appear twice, from different source sets; check what the page expects).
- **Multiplicities:** O triplet (3), S triplet (3), H doublet (2), O₂ triplet (3); Ca atom, CaO, O₃, H₂SO₄ singlets. Generator sets multiplicity and `UNRESTRICTED = TRUE` automatically; if building by hand in IQmol, set them yourself.
- **Do first:** (1) lock 4 predictions (harder than Exps. 3–4?, best, worst, effect of D4); (2) one test job per type; (3) batch by method (12 jobs); (4) ν: 5c is −1 (H₂SO₄), +1 (S), +4 (O), +2 (H); 5d is −2, +3.
- Record energy (all digits), SCF cycles, wall time. Check for "Convergence criterion met": open shells fail more often.
- **Submission:** JSON → Exp. 5 Microsoft Form, Florida Tech email.
- **Ask:** "Which of 5a–5d will have the biggest absolute error? biggest relative error?" (they predict; typically 5c in kcal/mol, but percent may differ)
- **Watch out:** wrong multiplicity for O/S/H atoms (converges happily; atomization too large by tens of kcal/mol per atom); forgetting ν = 4 and 2; mixing the two ozone geometries.

**If running late:** cut part A to the H₂⁺ picture only; reduce 5b to the training-set sentence.
**If this becomes two classes:** **split after block 2 part A (≈ min 25):** Meeting A = Exp. 4 debrief + self-interaction. Meeting B = 5-min recap, static correlation + atomization energies, Exp. 5 briefing (predictions must lock before jobs). Post the Exp. 5 page link after meeting A so students can read.
**Next class:** Class 10, debrief Exp. 5, basis-set vs functional error, Exp. 6 briefing.
