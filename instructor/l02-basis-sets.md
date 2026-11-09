# Class 2 · Approximating the wave function: basis sets  (Before Exp. 1)

**Goal.** Students know what a basis set is, can decode a basis-set name, and know that more (well-chosen) functions give lower energy and approach the CBS limit at steeply growing cost.

**Before class**
- [ ] Slides `slides/l02-basis-sets.qmd`; handout `lectures/l02-basis-sets.qmd`; Exp. 1 page `experiments/ex01-basis-sets.qmd` (do NOT show predictions/answers yet).
- [ ] pchem2: [Bonds](https://peverati.github.io/pchem2/Bonds.html), [Poly §13.1–13.2](https://peverati.github.io/pchem2/Poly.html).
- [ ] Basis-function table for H2O: cc-pVDZ 24, cc-pVTZ 58, cc-pVQZ 115 (standard values); 6-31G* 19 (Cartesian d); def2-SVP 24, def2-TZVP 43, def2-QZVP 117 (O [7s4p3d2f1g] = 57, H [4s3p2d1f] = 30 each; def2 counts are hand counts with pure d/f/g: check against a real Q-Chem output).
- [ ] Plan is 48 min: 2 min buffer.

## [0–5] LCAO and the variational promise
- MO: φ_i = Σ_μ c_μi χ_μ. Finite sum = approximation; SCF finds the best c for the chosen χ.
- Variational principle: adding functions can only lower the HF/DFT energy; limit = complete basis set (CBS).
- **Board:** `φ_i = Σ_μ c_μi χ_μ`; energy vs number of functions curve flattening to E_CBS.
- **Ask:** "If the energy always goes down with a bigger basis, is a bigger basis always better for a reaction energy?" (Total energy yes; ΔE not guaranteed: errors can cancel at small basis. Exp. 1 shows this; don't resolve yet.)
- **Watch out:** "basis set = atomic orbitals". They are mathematical functions, no physical meaning.

## [5–13] STO vs GTO; contraction
- STO: correct cusp at nucleus, exponential tail; integrals hard. GTO: wrong cusp (flat), too fast decay; Gaussian product theorem makes integrals cheap.
- Contracted GTO: fixed combination of primitives mimics one STO (STO-3G = 3 primitives per STO).
- Cartesian vs spherical d: 6d vs 5d (extra s-like combination). Basis sets define which; mention Q-Chem handles it per basis.
- **Board:** `STO ~ e^(−ζr)`, `GTO ~ e^(−αr²)`; sketch cusp and tail.
- **Ask:** "Why is a Gaussian product of two centers a single Gaussian useful?" (four-center integrals collapse to simple ones: speed)
- **Watch out:** "GTOs are more accurate": no, only faster; we use many to compensate.

## [13–23] Building better sets
- Minimal (1 function per orbital) → split valence: DZ, TZ, QZ = 2, 3, 4 functions per valence orbital (lets orbitals change size). ζ = "cardinal number".
- Polarization: higher l (d on C/O, p on H) lets orbitals change shape.
- Diffuse (small exponents): anions, weak interactions, Rydberg; aug-cc-pVnZ, "+" in Pople.
- **Board:** table: `H: 1s → 1s,2s (DZ) → +2p (DZP)`; `C: 1s2s2p → +3d`.
- **Ask:** "Which would you add to describe an anion's loosely held electron?" (diffuse functions)
- **Watch out:** confusing "double-ζ" with "double basis functions total"; ζ counts per valence orbital.

## [23–31] Pople sets: how to read the names
- STO-3G, 3-21G, 6-31G: core = 6 primitives contracted; valence split 3 + 1.
- `*`/(d): d on heavy atoms; `**`/(d,p): plus p on H; `+`: diffuse on heavy atoms; 6-311G**: triple split.
- Historical, still very common (6-31G*), but unbalanced and not designed for systematic convergence. Exp. 6 revisits 6-31G*.
- **Board:** `6-31+G(d,p)` decoded: core 6 | valence 3+1 | + diffuse | d on heavy | p on H.
- **Ask:** "What's the difference between 6-31G* and 6-31G**?" (** adds p on hydrogen)
- **Watch out:** thinking 6-31G* is "double-ζ so same as def2-SVP"; sizes and quality differ (Class 10).

## [31–43] The modern families
- **def2 (Karlsruhe):** def2-SVP, def2-TZVP, def2-QZVP; almost the whole periodic table; effective core potentials from Rb on (Q-Chem keyword `ECP def2-ECP`; matters for Ru, Pd later) [@weigend2005].
- **cc-pVnZ (Dunning):** n = D, T, Q, 5; aug- for diffuse; built for smooth convergence of correlation energy (correlated wave-function methods) [@dunning1989; @woon1993].
- **pc-n (Jensen):** polarization-consistent, optimized for DFT; pc-1 appears in Exp. 6 [@jensen2001].
- Show the H2O table: functions vs family; "double-ζ" sets differ in size.
- Cost: formal N⁴ for HF/hybrid integrals; measured exponent is lower (screening). Students measure it in Exp. 1.
- **Board:** `N_bf(H2O): cc-pVDZ 24 → TZ 58 → QZ 115`; roughly 2.4× per ζ step.
- **Ask:** "Why do cc-pVnZ sets exist if def2 works for DFT?" (cc built for correlated WFT convergence; def2 broad and cost-efficient; compare in Exp. 1)
- **Watch out:** don't tell them which family wins Exp. 1 (they predict it). Say only "designed for different purposes".

## [43–48] The big message; BSIE and BSSE
- More functions → better, systematic → CBS; price = cost grows as a high power of N.
- CBS extrapolation (outlook; Exp. 1 Colab notebook): `E(n) = E_CBS + A·e^(−αn)` (HF), `E(n) = E_CBS + A/n³` (correlation).
- BSIE: error from a truncated basis. BSSE: fragments "borrow" each other's functions in a dimer, so the dimer looks too stable. Defined now; returns in classes 8 and 10.
- Keep for later (do NOT reveal before predictions lock): in the answer key the BSSE of the HCl dimer is about 1.5 kcal/mol at def2-SVP, 0.3 at def2-TZVP, 0.05 at def2-QZVP (DFT).
- **Ask:** "Name two ways an energy difference can be wrong because of the basis." (BSIE; BSSE)

**If running late:** skip STO/GTO details beyond the product-theorem line; shorten Pople decoding to the `*`, `**`, `+` rules; give the H2O table as a handout.
**If this becomes two classes:** not marked.
**Next class:** Class 3, IQmol and Q-Chem hands-on, Exp. 1 briefing.
