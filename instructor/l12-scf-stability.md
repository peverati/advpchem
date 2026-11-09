# Lecture 12 · Debrief Exp. 7 · SCF stability, open shells and transition metals  (Before Exp. 8)  *(may need two classes)*

**Goal.** Debrief the grid study; explain that a converged SCF can be a saddle point; introduce transition-metal difficulties; brief Exp. 8.

**Before class**
- [ ] Slides `slides/l12-scf-stability.qmd`; handout `lectures/l12-scf-stability.qmd`; pages `experiments/ex07-grids.qmd`, `ex08-stability.qmd`.
- [ ] `python3 tools/aggregate.py ex07 "<OneDrive>/Apps/Microsoft Forms/Experiment 7"`; check gradebook (480 jobs: incomplete submissions are likely); `release_class_results: true` for ex07; render/publish.
- [ ] Charts: `ar2-curves`, `grid-wiggles`, `grid-timing`. Have 2–3 student curves ready (anonymized).
- [ ] Landscape widget on the Exp. 8 page (`data-lab="landscape"`) for the saddle-point demo.
- [ ] Collect feedback on the extraction script/CSV import (did it find the files? what failed?). Fix `downloads/extract_ex07.py` if needed.

## [0–15] Exp. 7 debrief
**Look for in class results** (answer key Ar₂ with SG-1, (75,302), (99,590), (175,974); QZVP; the course's SG-3 ≈ (99,590)):
- Wiggles = grid noise, not physics: extra minima/maxima in M06-L, M11, ωB97M-V at SG-1; reference has one smooth well.
- At 4.0 Å (ref −0.25): M06-L SG-1 +0.29, (75,302) −0.30, (99,590) −0.06; M11 −0.02/−0.15/−0.02; ωB97M-V −0.15/−0.37/−0.22: even SG-2 can still be 0.1–0.25 kcal/mol off; (99,590) ≈ (175,974).
- B3LYP is smooth and converged by SG-2 but wrong physically (no minimum, repulsive; no dispersion). M11-L is moderately grid-sensitive.
- Cost: bigger grid costs modestly; "worth it" for meta-GGAs.
- Recommendation: at least SG-2/SG-3 for meta-GGAs, SG-3 for Minnesota; always REPORT the grid.
- **Common mistakes:** missing/default `XC_GRID`; mixing def2-TZVP and another basis (the script flags it); Ar atom missing; CSV edited in Excel; plot at wrong range; claiming wiggles are "van der Waals physics"; HF answer (should be no grid dependence).
- **Board:** two curves: SG-1 wiggling around the reference; SG-3 smooth.
- **Ask:** "How can you tell grid noise from physics?" (refine the grid: noise disappears; physics doesn't)
- **Watch out:** "bigger grid is always better and free"; B3LYP smoothness ≠ accuracy.

## [15–35] SCF solutions and stability 
- **A. (≈15–25)** The SCF converges to a stationary point of E(orbital rotations): minimum, saddle point or maximum. Stability analysis = eigenvalues of the electronic Hessian (second derivatives of the ENERGY w.r.t. orbital rotations); negative eigenvalue → lower solution exists; follow it and reconverge.
- **B. (≈25–35)** Internal (same constraint class) vs external instabilities (RHF→UHF); spin contamination ⟨S²⟩ vs S(S+1); `INTERNAL_STABILITY TRUE`.
- **Board:** 2D landscape with a valley and a saddle; `H_ai,bj` eigenvalue < 0 → unstable; `⟨S²⟩ vs S(S+1)`.
- **Ask:** "The SCF says 'Convergence criterion met'. Does it prove it's the ground state?" (no: only a stationary point)
- **Watch out:** "converged = right"; confusing second derivatives of the wave function with those of the energy (handout corrected this); "stability analysis always lowers the energy" (often nothing changes).

## [35–50] Transition metals; Exp. 8 briefing
- Near-degenerate 3d/4s (4d/5s); many low-lying states; spin-state energetics; effective core potentials (`ECP def2-ECP` for Ru, scalar-relativistic effects).
- Exp. 8: Fe quintet → triplet (34.32) and Ru⁺ quartet → sextet (21.96) (both "excited − ground" in kcal/mol); only functionals that converged: **BP86 (Ru⁺), PBE (Fe, Ru⁺), PBE0 (Ru⁺), M06-2X (Fe), B97M-V (Fe)**; each run without and with stability analysis: **24 jobs** (BP86 2 + PBE 4 + PBE0 2 + M06-2X 2 + B97M-V 2 = 12 jobs, doubled), def2-TZVP.
- **Multiplicities/charges:** Fe quintet (5), Fe triplet (3), Ru⁺ charge +1 quartet (4), Ru⁺ sextet (6). Open shells: `UNRESTRICTED TRUE` (generator does it). Ru needs the ECP (generator adds `ECP def2-ECP` for Z > 36).
- **Do first:** (1) lock 3 predictions (does stability change anything, which functional changes most, Fe vs Ru⁺ harder); (2) one test job; (3) run all 12 plain jobs, then the 12 stable ones (`INTERNAL_STABILITY TRUE`); (4) in the stability output read the stability section: **menu/output wording not verified**; check a real output and which "Total energy" line to take (take the final energy after re-optimization; `Convergence criterion met` for the last SCF).
- Wall time: stability jobs are slower (e.g. 1–4 minutes; fine for the 10-minute limit).
- Record energy, cycles, time for both runs; enter the two excitation energies per run.
- **Submission:** JSON → Exp. 8 Microsoft Form, Florida Tech email.
- **Watch out:** wrong multiplicity (silent), forgetting ECP for Ru, Ru⁺ charge missing, subtracting in the wrong direction (excited − ground), jobs killed at 10 min (rerun with fewer concurrent).

**If running late:** one slide on spin contamination; shorten transition-metal text to ECP + multiplicity; keep stability concept and briefing.
**If this becomes two classes:** **split at the end of block 2, before transition metals (≈ min 35):** Meeting A = Exp. 7 debrief + SCF stability (Hessian, internal/external, spin contamination). Meeting B = 5-min recap, transition metals + ECPs, Exp. 8 briefing (same split as the slides and the handout).
**Next class:** Lecture 13, debrief Exp. 8, electronic energy vs experiment, Exp. 9 briefing.
