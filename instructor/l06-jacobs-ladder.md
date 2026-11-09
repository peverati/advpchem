# Lecture 6 · Approximating the Hamiltonian III: Jacob's ladder  (Before Exp. 2)

**Goal.** Students can place a functional on Jacob's ladder from its ingredients, decode names, and are ready for Experiment 2 (a classification exercise, no calculations).

**Before class**
- [ ] Slides `slides/l06-jacobs-ladder.qmd`; handout `lectures/l06-jacobs-ladder.qmd`; Exp. 2 page `experiments/ex02-jacobs-ladder.qmd`.
- [ ] Ladder diagram with the 16 Exp. 3–5 methods (table below).
- [ ] Note for answers (hold back until class 7): M11-L = local (no HF) meta-GGA; MN15-L = local meta-NGA, put on mGGA; M06-HF = 100% HF; ωB97M-V and M11 range-separated hybrid meta-GGAs.
- [ ] `data/course.json`: due date for Exp. 2 set?

## [0–5] The metaphor
- Perdew: rungs from the "Hartree world" up to heaven (chemical accuracy, 1 kcal/mol). Each rung adds an ingredient [@perdew2001].
- Rungs: 1 LSDA (ρ), 2 GGA (+∇ρ), 3 meta-GGA (+τ), 4 hybrid (+exact exchange), 5 double hybrid (+virtual orbitals).
- **Board:** ladder with ingredients: `ρ | ∇ρ | τ | E_x^HF | virtuals`.
- **Ask:** "Does a higher rung always mean more accurate?" (No: rung = ingredients, not guaranteed performance; Exps. 3–5)
- **Watch out:** "higher rung is better and costlier" only as a trend.

## [5–15] Rungs 2 and 3
- GGA adds gradient (reduced gradient s): B88 exchange [@becke1988], LYP [@lee1988], PBE [@perdew1996], PW91; BLYP, BP86, PBE.
- Meta-GGA adds kinetic-energy density τ (and/or ∇²ρ): TPSS, SCAN [@sun2015], M06-L, MN15-L, B97M-V.
- **Board:** `E_xc[ρ, ∇ρ]` (GGA); `E_xc[ρ, ∇ρ, τ]` (meta).
- **Ask:** "What ingredient separates PBE from SCAN?" (τ, kinetic-energy density)
- **Watch out:** meta-GGAs are semilocal without HF exchange even though "M" functionals sound like hybrids; local Minnesota functionals (M06-L, M11-L, MN15-L) have zero HF exchange.

## [15–27] Rung 4: hybrids
- Adiabatic-connection argument: mix a fraction of HF exchange.
- Global hybrids: **B3LYP 20% HF** [@becke1993; @stephens1994], **PBE0 25%** [@adamo1999], B3PW91 20%; hybrid meta-GGAs: **M06-2X 54%**, MN15 44%, M11.
- Range-separated: short-range DFT exchange, long-range HF; ω; ωB97X-V, ωB97M-V [@mardirossian2016a], M11 [@peverati2011] (rises from 42.8% to 100%).
- Why HF exchange helps: reduces self-interaction error (callback to class 4/5).
- **Board:** `E_xc = a E_x^HF + (1−a) E_x^DFT + E_c^DFT`, a = 0.20 (B3LYP), 0.25 (PBE0), 0.54 (M06-2X).
- **Ask:** "What fraction of HF exchange does B3LYP have?" (20%; the '3' = 3 empirical parameters)
- **Watch out:** "range-separated = double hybrid" (no); "M11-L is a hybrid" (no: local); percent HF mixed up: B3LYP 20, PBE0 25, M06-2X 54.

## [27–32] Rung 5
- Double hybrids add MP2-like correlation from virtuals (B2PLYP); RPA. Mention only; not used in this course.

## [32–40] Two orthogonal design questions
- (a) Dispersion: none / empirical -D3 (history) / **-D4** [@caldeweyher2017; @caldeweyher2019] / nonlocal VV10 ("-V", "-rV") [@vydrov2010] / built into a fitted functional (Minnesota).
- (b) Non-empirical (PBE, SCAN) vs empirical (B3LYP's 3 parameters, Minnesota, ωB97M-V by combinatorial optimization): overfitting and training sets (returns class 9).
- Decode: B3LYP-D4, ωB97M-V, M06-2X, MN15-L.
- **Board:** names decode: `ω B97 M -V` = range-separated | B97 form | meta | VV10; `B3LYP-D4` = hybrid + D4.
- **Ask:** "What's the difference between '-V' and '-D4'?" (-V = nonlocal VV10 kernel inside the functional; -D4 = pairwise atom-atom add-on; never stack both)
- **Watch out:** "-V" confused with "-D"; assuming empirical = bad; thinking D4 on ωB97M-V is fine (double counting).

## [40–48] Experiment 2 briefing (no calculations)
- **Do first:** (1) open the page; (2) classify all 20 functionals into LSDA / GGA / mGGA / H-GGA / H-mGGA (with range-separated and dispersion flags); (3) use original papers, reviews [@mardirossian2017; @goerigk2017] and the Q-Chem manual; (4) **lock predictions for Exp. 3 next week** (best, worst, effect of D4, costliest, functional draft).
- The 20: SPW92, SVWN5, BP86, BLYP, PBE, M06-L, M11-L, MN15-L, SCAN, B97M-V, B3LYP, B3PW91, M05-2X, M06, M06-2X, M06-HF, M11, MN15, PBE0, ωB97M-V.
- Submission: Exp. 2 JSON → Exp. 2 Microsoft Form, Florida Tech email.
- **Ask:** "Where would you put M11-L?" (mGGA: dual-range but local, no HF exchange)
- **Watch out:** classifying by name alone; MN15-L (meta-NGA) goes on the mGGA rung in this simplified ladder.

## [48–50] The 16 methods of Exps. 3–5 on the ladder
| Rung | Methods |
|---|---|
| LSDA | SPW92 |
| GGA | BP86, BLYP, PBE, PBE-D4 |
| meta-GGA | SCAN, B97M-V |
| hybrid GGA | B3LYP, B3LYP-D4, B3PW91, PBE0 |
| hybrid meta-GGA | M06-2X, M11, MN15, ωB97M-V |
| none (wave function) | HF |
- Flags: -D4 on PBE-D4, B3LYP-D4; VV10 in B97M-V and ωB97M-V; range-separated: M11, ωB97M-V.

**If running late:** skip rung 5 and the non-empirical vs empirical discussion (move to class 9); keep hybrids and the briefing.
**If this becomes two classes:** not marked.
**Next class:** Lecture 7, debrief Exp. 1–2, how to test a functional, Exp. 3 briefing. Make sure Exp. 1 and Exp. 2 submissions are in and aggregated.
