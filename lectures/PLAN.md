# Lecture plan: Advanced Physical Chemistry (CHM 5111), computational lab

This is the single source of truth for the lecture materials. Three products are
built from it, and they must agree with it and with each other:

| Product | Folder | Audience | Published? |
|---|---|---|---|
| **Handouts**: the students' textbook | `lectures/lNN-slug.qmd` | students | yes, on the website (Lectures menu) |
| **Slides**: one deck per class | `slides/lNN-slug.qmd` (Quarto revealjs) | projected in class | later, in a separate section (not in the site render list for now) |
| **Instructor notes**: bullet points to teach from | `instructor/lNN-slug.md` | instructor only | in the GitHub repository, but not rendered on the website |

Each class is 50 minutes. Fifteen classes are planned. Lectures 1–3 come before
Experiment 1 and classes 4–6 before Experiment 2 (theory blocks). From class 7
on, each class first debriefs the previous experiment and then introduces the
next one. Classes marked *(may need two)* can be split over two meetings if
time runs short. Split points (same in slides, notes and handouts): Lecture 9 after
self-interaction error; Lecture 12 before transition metals; Lecture 13 after thermal
corrections (before spin–orbit).

## Schedule

| # | Slug | Title | Before | Type |
|---|---|---|---|---|
| 1 | `l01-molecular-schrodinger` | The molecular Schrödinger equation | Exp. 1 | theory |
| 2 | `l02-basis-sets` | Approximating the wave function: basis sets | Exp. 1 | theory |
| 3 | `l03-from-theory-to-a-calculation` | From theory to a calculation: IQmol, Q-Chem and Experiment 1 | Exp. 1 | practical + briefing |
| 4 | `l04-hartree-fock` | Approximating the Hamiltonian I: Hartree–Fock and the SCF | Exp. 2 | theory |
| 5 | `l05-density-functional-theory` | Approximating the Hamiltonian II: density functional theory | Exp. 2 | theory |
| 6 | `l06-jacobs-ladder` | Approximating the Hamiltonian III: Jacob's ladder | Exp. 2 | theory + briefing |
| 7 | `l07-benchmarking` | Debrief Exp. 1–2 · How we test a functional | Exp. 3 | debrief + intro |
| 8 | `l08-dispersion` | Debrief Exp. 3 · Dispersion and noncovalent interactions | Exp. 4 | debrief + intro |
| 9 | `l09-difficult-cases` | Debrief Exp. 4 · Why some reactions are hard for DFT | Exp. 5 | debrief + intro *(may need two)* |
| 10 | `l10-error-cancellation` | Debrief Exp. 5 · Basis-set error vs functional error | Exp. 6 | debrief + intro |
| 11 | `l11-integration-grids` | Debrief Exp. 6 · Numerical integration grids | Exp. 7 | debrief + intro |
| 12 | `l12-scf-stability` | Debrief Exp. 7 · SCF stability, open shells and transition metals | Exp. 8 | debrief + intro *(may need two)* |
| 13 | `l13-theory-vs-experiment` | Debrief Exp. 8 · From electronic energies to experiment | Exp. 9 | debrief + intro *(may need two)* |
| 14 | `l14-choosing-a-method` | Debrief Exp. 9 · Choosing, running and reporting a method | Exp. 10 | debrief + intro |
| 15 | `l15-wrap-up` | Debrief Exp. 10 · What we learned | — | debrief + synthesis |

## Content of each class

Times in brackets are a guide for the 50 minutes. "→ pchem2" points to the
instructor's P-Chem 2 textbook, <https://peverati.github.io/pchem2/>, for review
material; link the specific chapter/section URL listed.

### Lecture 1 · The molecular Schrödinger equation

Goal: everyone can write the electronic Hamiltonian of a molecule and say why it
can't be solved exactly, and what "approximating Ψ" vs "approximating Ĥ" means.

1. [5] Why compute? What a computational chemist actually predicts (energies of reactions, barriers, structures); the course roadmap: ten experiments, the two big approximations (Ψ → basis set, Ĥ → method).
2. [10] Review: TISE ĤΨ = EΨ, operators, eigenvalues; the hydrogen atom as the one exactly solvable atom (orbitals = one-electron wave functions, quantum numbers, radial nodes). → pchem2 [Schrödinger](https://peverati.github.io/pchem2/Schrodinger.html), [Operators](https://peverati.github.io/pchem2/Operators.html), [Hydrogen](https://peverati.github.io/pchem2/Hydrogen.html)
3. [10] The molecular Hamiltonian: five terms (T_n, T_e, V_ne, V_ee, V_nn). Atomic units (ħ = mₑ = e = 4πε₀ = 1; energies in hartree; 1 Eh = 627.5095 kcal/mol = 27.211 eV = 2625.5 kJ/mol; lengths in bohr, 1 a₀ = 0.529177 Å). → pchem2 [Molecules §11.1](https://peverati.github.io/pchem2/Molecules.html#the-molecular-hamiltonian)
4. [10] Born–Oppenheimer approximation: clamped nuclei, electronic Hamiltonian, E_el(R) + V_nn = potential energy surface; what "total energy" in a Q-Chem output means (electronic energy + nuclear repulsion at fixed geometry; no ZPE, no thermal terms; this returns in class 13). → pchem2 [§11.2](https://peverati.github.io/pchem2/Molecules.html#the-born-oppenheimer-approximation)
5. [10] Many electrons: V_ee couples all electrons → no analytic solution for N ≥ 2. Spin, Pauli principle, antisymmetry; the Slater determinant as the simplest antisymmetric Ψ; orbitals as building blocks. Variational principle: E[Ψ_trial] ≥ E₀, so lower = better (sets up basis sets). → pchem2 [Spin](https://peverati.github.io/pchem2/Spin.html), [Postulate 6](https://peverati.github.io/pchem2/Postulates.html#postulate-6-pauli-exclusion-principle), [Atoms §10.1–10.2](https://peverati.github.io/pchem2/Atoms.html)
6. [5] The two approximations of every calculation ("model chemistry" = method/basis, e.g. B3LYP/def2-TZVP). What's next: class 2 = how to build orbitals from basis functions.

### Lecture 2 · Approximating the wave function: basis sets

Goal: students know what a basis set is, can decode a basis-set name, and know that more (well-chosen) functions → lower energy and → the complete-basis-set (CBS) limit, at a steeply growing cost.

1. [5] LCAO: molecular orbitals φᵢ = Σ_μ c_μi χ_μ. A finite expansion = an approximation; the variational principle guarantees the energy decreases toward the CBS limit as the basis grows (for HF/DFT). → pchem2 [Bonds](https://peverati.github.io/pchem2/Bonds.html), [Poly §13.1–13.2](https://peverati.github.io/pchem2/Poly.html)
2. [8] Slater-type vs Gaussian-type orbitals: STO correct cusp and exponential tail but expensive integrals; GTO wrong cusp/tail but the Gaussian product theorem makes integrals fast; contracted GTOs (a fixed combination of primitives mimics one STO; STO-3G). Cartesian vs spherical d functions (6d vs 5d) briefly.
3. [10] Building better sets: minimal → split valence (double-ζ, triple-ζ: more than one function per valence orbital, lets orbitals change size); polarization functions (higher angular momentum: d on C, p on H; lets orbitals change shape); diffuse functions (small exponents; anions, weak interactions, Rydberg). ζ and "cardinal number".
4. [8] Pople sets (historical, still common): STO-3G, 3-21G, 6-31G, 6-31G*/6-31G(d), 6-31G**/(d,p), 6-31+G*, 6-311G** — how to read the name. Know they exist (Exp. 6 revisits 6-31G*), but they are unbalanced and not designed to converge systematically.
5. [12] The modern families used in this course: Karlsruhe **def2** (def2-SVP, def2-TZVP, def2-QZVP; available for almost the whole periodic table, with effective core potentials beyond Kr) [@weigend2005]; Dunning **correlation-consistent** cc-pVnZ (n = D, T, Q, 5; aug- for diffuse) [@dunning1989; @woon1993] built for systematic convergence of the correlation energy; mention Jensen's pc-n (polarization-consistent, optimized for DFT) [@jensen2001]. Number of basis functions for a small molecule in each (e.g., H₂O or HCl table).
6. [5] The big message: more functions → better results, systematic convergence → CBS; the price: cost scales as a high power of N (formal N⁴ for HF/hybrid DFT integrals, lower in practice; students measure the exponent in Exp. 1). Extrapolation to CBS (e.g., E(n) = E_CBS + A·e^(−αn) for HF, E_CBS + A/n³ for correlation) as an outlook (Exp. 1 Colab notebook). Basis-set incompleteness error (BSIE) and basis-set superposition error (BSSE) defined briefly; BSSE returns in classes 8 and 10.

### Lecture 3 · From theory to a calculation: IQmol, Q-Chem and Experiment 1

Goal: every student can set up, submit and read a Q-Chem job from IQmol and knows exactly what to do in Experiment 1.

1. [5] Recap classes 1–2 with a "model chemistry" decoder: HF/cc-pVTZ, B3LYP/def2-SVP, ωB97M-V/def2-QZVP.
2. [10] Tools: IQmol (builder/viewer, Q-Chem setup window, free server with the 10-minute limit, Job Monitor); Q-Chem input file anatomy: `$molecule` (charge, multiplicity, Cartesian coordinates in Å), `$rem` (JOBTYPE, METHOD, BASIS, SCF_CONVERGENCE); the course website's input generator, job checklist and "download all inputs". Point to guides: `guides/iqmol-setup.qmd`, `guides/first-job.qmd`, `guides/shared-machines.qmd`.
3. [8] Live demo plan: HCl with HF/def2-SVP (guide 2). Change only `BASIS` to see a different basis. Multiplicity basics (line 2 of every .xyz file in this lab is "charge multiplicity").
4. [8] Reading the output (guide 3): total energy, SCF cycles and "Convergence criterion met", wall time vs CPU time, number of basis functions; "Thank you very much for using Q-Chem" = finished.
5. [5] From total energies to a reaction energy: ΔE = Σ νᵢEᵢ with **signed** stoichiometric coefficients (ν > 0 products, ν < 0 reactants), × 627.5095 kcal/mol per Eh; why total energies must have all their digits; signed error vs absolute error (`guides/units-and-errors.qmd`).
6. [12] Experiment 1 briefing: (HCl)₂ → 2 HCl from the NCCE30 subset (reference 2.01 kcal/mol); 4 methods (HF, PBE, B3LYP, ωB97M-V) × 6 bases (def2-SVP/TZVP/QZVP, cc-pVDZ/TZ/QZ) = 48 jobs; what students will see (error vs ζ, the two families, timing vs N and the fitted exponent); predictions to lock in first; how to submit (Microsoft Form, JSON file, Florida Tech email).
7. [2] Before next class: run the first jobs; preview of class 4.

### Lecture 4 · Approximating the Hamiltonian I: Hartree–Fock and the SCF

Goal: students understand the mean-field idea, what an SCF iteration does (and why it can fail to converge), and what "correlation energy" means.

1. [5] Where we are: we fixed Ψ's flexibility (basis); now the method. Short Exp. 1 check-in (any problems running jobs?). Full debrief in class 7.
2. [12] Hartree's idea: each electron moves in the average field of the others (mean field). Hartree–Fock: a single Slater determinant + variational principle → Fock equations f̂φᵢ = εᵢφᵢ; Fock operator = core Hamiltonian + Coulomb Ĵ − exchange K̂; exchange is a consequence of antisymmetry (no classical analogue); self-interaction cancels exactly in HF (Ĵᵢᵢ = K̂ᵢᵢ) — remember this for DFT. [@hartree1928; @fock1930; @slater1930] → pchem2 [§11.3.1](https://peverati.github.io/pchem2/Molecules.html#the-hartree-fock-method), [Poly §13.2](https://peverati.github.io/pchem2/Poly.html#hartree-fock-calculation-for-water)
3. [10] Roothaan–Hall equations FC = SCε in a basis; why it must be solved iteratively (F depends on C); the SCF loop step by step: initial guess → build F → diagonalize → new density → check convergence (energy change and DIIS error, SCF_CONVERGENCE 8 = 10⁻⁸) → repeat. Link to the SCF table students see in the output. Where it goes wrong: oscillations, slow convergence, converging to a wrong (excited or unstable) solution (preview of class 12). Restricted vs unrestricted (RHF/UHF) for open shells.
4. [8] Orbital energies, Koopmans' theorem (IP ≈ −ε_HOMO), occupied vs virtual orbitals; what MO pictures in IQmol show.
5. [10] What HF misses: electron correlation. E_corr = E_exact − E_HF (in the same basis, at the CBS limit ideally); dynamic vs static (nondynamic) correlation with simple examples (H₂ dissociation: RHF wrong at long distance); typical size (~1% of the total energy but comparable to reaction energies); HF has no dispersion at all.
6. [5] Ways forward: wave-function methods (MP2, CCSD(T) — "gold standard", used for the reference values of this lab) with their steep cost scaling (N⁵, N⁷) vs DFT: next class.

### Lecture 5 · Approximating the Hamiltonian II: density functional theory

Goal: students understand why the density is enough in principle, what the Kohn–Sham scheme is, and that everything hard is in E_xc.

1. [5] Motivation: Ψ depends on 3N coordinates, ρ(r) on 3; cost of correlated wave-function methods.
2. [10] The electron density: definition, integrates to N, observable (X-ray). Hohenberg–Kohn theorems (1964): ρ determines v_ext and so everything; variational principle for E[ρ] [@hohenberg1964]. Thomas–Fermi as a cautionary tale (orbital-free kinetic energy fails; no binding).
3. [15] Kohn–Sham (1965) [@kohn1965]: a fictitious non-interacting system with the same density; orbitals return; E[ρ] = T_s + E_ne + J + E_xc; KS equations look like HF equations, solved by the same SCF machinery (same output table!). E_xc collects everything we don't know (exchange, correlation, and the kinetic-energy correction). KS-DFT would be exact with the exact E_xc.
4. [10] The first approximation: local (spin) density approximation, LSDA: uniform electron gas, Slater/Dirac exchange ∝ ρ^(4/3), correlation fitted to QMC data (VWN, PW92) [@slater1951; @vosko1980; @perdew1992]; SPW92 in this course. What LSDA gets right (geometries, surprisingly) and wrong (overbinding, atomization energies too large).
5. [5] Numerical integration: E_xc has no analytic integral → evaluated on a grid of points around each atom (one sentence now; full story in class 11). Hybrid functionals mix in HF exchange (preview of class 6).
6. [5] Known errors of approximate functionals to keep in mind: self-interaction/delocalization error, missing long-range dispersion, static correlation (each returns in classes 8–9).

### Lecture 6 · Approximating the Hamiltonian III: Jacob's ladder

Goal: students can place any functional on Jacob's ladder from its ingredients, decode names, and are ready for Experiment 2.

1. [5] Perdew's Jacob's ladder metaphor: each rung adds an ingredient and climbs toward "chemical accuracy" (1 kcal/mol) [@perdew2001; @perdew2005 if available].
2. [10] Rung 2, GGA: adds ∇ρ (reduced gradient s); B88 exchange [@becke1988], LYP [@lee1988], PBE [@perdew1996], PW91; BLYP, BP86, PBE. Rung 3, meta-GGA: adds kinetic-energy density τ (and/or ∇²ρ); TPSS, SCAN [@sun2015], M06-L, MN15-L, B97M-V.
3. [12] Rung 4, hybrids: global hybrids mix a fraction of HF exchange (adiabatic-connection argument); B3LYP [@becke1993; @stephens1994] (20% HF), PBE0 (25%) [@adamo1999], B3PW91; hybrid meta-GGAs (M06-2X 54%, M11, MN15); range-separated hybrids (short-range DFT, long-range HF exchange; ω): ωB97X-V, ωB97M-V [@mardirossian2016a], M11 [@peverati2011]; why HF exchange helps (reduces self-interaction error).
4. [5] Rung 5 (mention): double hybrids add MP2-like correlation from virtual orbitals (B2PLYP); RPA.
5. [8] Two orthogonal design questions: (a) how dispersion is added: none / empirical -D3 / **-D4** [@caldeweyher2017; @caldeweyher2019] / nonlocal VV10 [@vydrov2010] ("-V", "-rV") / built into a fitted functional; (b) non-empirical (constraint-satisfying: PBE, SCAN) vs empirical (fitted to data: B3LYP's 3 parameters, Minnesota functionals, ωB97M-V via combinatorial optimization) — overfitting and training sets (returns in class 9). Decoding names: B3LYP-D4, ωB97M-V, M06-2X, MN15-L.
6. [8] Experiment 2 briefing: no calculations; classify 20 functionals into LSDA/GGA/meta-GGA/hybrid GGA/hybrid meta-GGA (with range-separated and dispersion flags); where to find the information (original papers, reviews [@mardirossian2017; @goerigk2017], the Q-Chem manual). Lock predictions for Exp. 3 next week.
7. [2] The 16 methods students will use in Exps. 3–5 placed on the ladder (table).

### Lecture 7 · Debrief Exp. 1–2 · How we test a functional (intro Exp. 3)

1. [15] Exp. 1 debrief: error vs ζ for each method (HF and DFT converge from the basis side quickly; dispersion-bound (HCl)₂ shows HF fails at any basis); def2 vs cc-pVnZ (cc sets designed for correlated methods, def2 often better for DFT at the same ζ); double-ζ is not converged, quadruple-ζ is close to CBS; measured cost exponent vs formal scaling and why practical scaling is lower (screening, density fitting, small N); the best accuracy/cost choice (triple-ζ). Use the class-results heatmap if released.
2. [5] Exp. 2 debrief: common misclassifications (range-separated hybrids, "-V" vs "-D", meta-GGA vs hybrid meta-GGA, functionals named after their parameters); the 16 methods on the ladder.
3. [20] How functionals are tested: benchmark databases (GMTKN55 [@goerigk2017], MGCDB84 [@mardirossian2017], Minnesota databases); reference values from CCSD(T)/CBS or experiment; reaction types (thermochemistry, barrier heights, noncovalent, isomerizations, conformers); error statistics: signed error, MAE, MSE, max error, relative error; chemical accuracy (1 kcal/mol); why a single number never tells the whole story.
4. [10] Exp. 3 briefing: four "easy" organic reactions (3a ethane rotation barrier 2.73, 3b methanol rotation 1.01, 3c butane-1,4-diol conformers 3.29, 3d cis→trans pent-2-ene −1.15 kcal/mol), 16 methods (SPW92 … HF) with def2-TZVP, 128 jobs; cost per SCF cycle; error cancellation in isodesmic-like reactions (why "easy").

### Lecture 8 · Debrief Exp. 3 · Dispersion and noncovalent interactions (intro Exp. 4)

1. [15] Exp. 3 debrief: most methods do well on conformational/rotational energies thanks to error cancellation; LSDA and HF outliers; intramolecular H-bond in butanediol; cost vs accuracy plot — hybrids cost more per SCF cycle than (meta-)GGAs, range-separated and VV10 add more; B3LYP is not special in cost.
2. [20] Dispersion: physical origin (correlated fluctuating dipoles, London 1930, −C₆/R⁶); why semilocal functionals and HF miss it (they only see local density; HF has no correlation); fixes: pairwise -D (D2/D3/D4, damping functions, D4's charge-dependent C₆) [@grimme2010; @caldeweyher2019], nonlocal VV10 kernels, fitted (Minnesota). Intramolecular dispersion: branched vs linear alkanes (neohexane more stable) [@grimme2006alkanes].
3. [15] Exp. 4 briefing: 4a Diels–Alder (−45.4, bond changes: σ formed from π), 4b n-hexane → neohexane (−2.49, intramolecular dispersion), 4c ethane dimer (−1.34, pure dispersion), 4d methanol dimer (−5.81, H-bond); expectations: D4 helps 4b–4d; 4a tests bond-forming. BSSE mention for dimers.

### Lecture 9 · Debrief Exp. 4 · Why some reactions are hard for DFT (intro Exp. 5) *(may need two)*

1. [15] Exp. 4 debrief: D4 on/off pairs; dimer chart (none vs D4 vs VV10 vs fitted); Diels–Alder errors larger; error cancellation breaking down when bonds change.
2. [20] Why DFT fails: self-interaction / delocalization error (H₂⁺ dissociation, too-low barriers, overstabilized delocalized states) [@cohen2012]; static correlation / multireference character (O₃, stretched bonds, CaO); atomization energies (open-shell atoms vs closed-shell molecule — no error cancellation, spin polarization); why HF fails dramatically for atomizations. Split point for two classes here.
3. [15] Exp. 5 briefing: 5a ozonolysis (−58.7), 5b CaO → Ca + O (96.15; CaO is in some functionals' training sets — what that means), 5c H₂SO₄ atomization (602.18; the largest number; relative vs absolute error), 5d 2 O₃ → 3 O₂ (−67.6); multiplicities of atoms (O triplet, S triplet, H doublet, Ca singlet); unrestricted calculations for open shells.

### Lecture 10 · Debrief Exp. 5 · Basis-set error vs functional error (intro Exp. 6)

1. [15] Exp. 5 debrief: error sizes in absolute vs relative terms; which rungs survive; D4 doesn't fix static correlation/SIE; the CaO training-set spotlight and the danger of judging a functional on its training data; the easy → hard chart across Exps. 3–5 (best overall method).
2. [15] Total error = method error + basis-set error (+ others). Error cancellation between them; BSSE and BSIE in small basis sets; the counterpoise correction (definition only); why "B3LYP/6-31G*" became the most used level of theory (1990s cost, Gaussian defaults, citation numbers) and why it can be right for the wrong reasons [@kruse2012].
3. [5] Not all double-ζ sets are equal: number of basis functions for cyclohexene with 6-31G*, def2-SVP, cc-pVDZ, pc-1 (students compute in Exp. 6).
4. [15] Exp. 6 briefing: B3LYP and B3LYP-D4 with 6-31G*, def2-SVP, cc-pVDZ, pc-1 vs def2-TZVP on 4a, 4b, 5b (64 jobs); import of def2-TZVP results from Exps. 4–5; "spot the anomaly".

### Lecture 11 · Debrief Exp. 6 · Numerical integration grids (intro Exp. 7)

1. [15] Exp. 6 debrief: 6-31G* "better" than def2-TZVP for 4a — error cancellation; about the same for 4b; much worse for 5b (CaO); D4 + small basis double-counting/overbinding; lesson: compare at converged basis first.
2. [25] Integration grids: why E_xc needs quadrature; Becke's partitioning into atomic cells [@becke1988a]; radial shells × angular (Lebedev) points, (75,302) notation, pruning; SG-0/SG-1/SG-2/SG-3 in Q-Chem (XC_GRID 1/2/3) [@gill1993 if available]; rotational variance; why meta-GGAs (τ) and heavily parametrized functionals are grid-sensitive [@wheeler2010; @mardirossian2016]; HF needs no xc grid; cost grows with grid points.
3. [10] Exp. 7 briefing: Ar₂ curve 3.0–6.0 Å (well depth −0.28 kcal/mol at ≈3.75 Å), 5 functionals × SG-1/2/3 with def2-TZVP, 480 jobs; the extraction script and CSV import (`downloads/extract_ex07.py`); the wiggle report.

### Lecture 12 · Debrief Exp. 7 · SCF stability, open shells and transition metals (intro Exp. 8) *(may need two)*

1. [15] Exp. 7 debrief: wiggles = grid noise, not physics; which functionals needed SG-3 (M06-L, M11-L, M11 typically) vs converged at SG-1/SG-2 (B3LYP); ωB97M-V and grid; timing cost of bigger grids is modest; recommendation: use at least SG-2/SG-3 for meta-GGAs; report your grid.
2. [20] SCF solutions: the SCF can converge to a saddle point, not a minimum, of E with respect to orbital rotations; stability analysis = check eigenvalues of the electronic Hessian (second derivatives of the energy w.r.t. orbital rotations); internal vs external instabilities (RHF→UHF); `INTERNAL_STABILITY TRUE`; spin contamination ⟨S²⟩. Split point for two classes here.
3. [15] Transition metals: near-degenerate 3d/4s (4d/5s) configurations, many low-lying states, spin-state energetics; effective core potentials (def2-ECP for Ru and heavier, scalar relativistic effects); Exp. 8 briefing: Fe quintet → triplet (34.32), Ru⁺ quartet → sextet (21.96), functionals that converged (PBE, BP86, PBE0, M06-2X, B97M-V), with/without stability, 24 jobs.

### Lecture 13 · Debrief Exp. 8 · From electronic energies to experiment (intro Exp. 9) *(may need two)*

1. [15] Exp. 8 debrief: how much stability analysis lowered the energy; stable ≠ accurate (remaining functional errors); why several functionals failed to converge; spin-state energetics are a hard benchmark.
2. [25] Comparing with experiment: ΔE_el vs ΔE₀ (ZPE from harmonic frequencies) vs ΔH₂₉₈ (thermal corrections from statistical mechanics: translational, rotational, vibrational) vs ΔG; spin–orbit corrections for atoms; bond dissociation energy D₀ vs D_e; atomization energies and enthalpies of formation (why you can't compare directly); experimental uncertainties; the NIST Chemistry WebBook. Split point for two classes here.
3. [10] Exp. 9 briefing: tert-butanol C–O BDE (115.02), FeCl (78.5), atomization of H₂, CH₄, NH₃, H₂O, O₃; MN15-L, MN15, B3LYP, PBE, HF with def2-TZVP, (99,590) grid and stability analysis; B3LYP/6-31G* for tBuOH; 78 jobs.

### Lecture 14 · Debrief Exp. 9 · Choosing, running and reporting a method (intro Exp. 10)

1. [15] Exp. 9 debrief: radicals and atoms vs closed-shell molecules; HF's failure on atomization (missing correlation); FeCl transition-metal difficulty; NIST comparison and the size of the thermal correction.
2. [20] How to choose a method: decision tree (system size/cost, property, known failure modes, benchmark evidence for the reaction type), the course's evidence (Exps. 1–9); basis set (triple-ζ, ECPs for heavy elements); dispersion; grid; stability; computer-time budget (10-minute limit); reproducibility: report program/version, method, basis, ECP, grid, dispersion, convergence, geometry source.
3. [15] Exp. 10 briefing: Pd(PH₃)₂(C₆H₈) → Pd(PH₃)₂ + C₆H₈ (16.2 kcal/mol, PdBE2), you are the consultant: method card, cost check, report (~300 words) with references.

### Lecture 15 · Debrief Exp. 10 · What we learned

1. [20] Exp. 10 debrief: the spread of class choices and results; what worked; how close to 16.2.
2. [20] Synthesis: the two approximations revisited; error hierarchy (method > basis > grid > SCF convergence, but all can bite); the "black box" warning; where the field is going (machine-learned functionals, local correlation methods, double hybrids).
3. [10] Course feedback, muddiest points.

## Conventions every product must follow

- **Florida Institute of Technology** in formal places (title slides, footers), **Florida Tech** in everyday text (never "FIT"). Course: Advanced Physical Chemistry (CHM 5111). Software: **Q-Chem** run through **IQmol** on the free server (10-minute job limit).
- **-D4 everywhere** for empirical dispersion when talking about this course's methods (mention D2/D3 only as history), cited to `caldeweyher2017`/`caldeweyher2019` (check `references.bib` for the exact keys).
- Reaction energies: ΔE = Σ νᵢEᵢ, signed ν (> 0 products, < 0 reactants). Units: Eh for total energies, kcal/mol for reaction energies, 1 Eh = 627.5095 kcal/mol.
- Notation: Ψ many-electron wave function, φᵢ (or ψᵢ) orbitals, χ_μ basis functions, ρ(r) density, Ĥ, f̂ (Fock), E_xc, ε_i orbital energies, N electrons, K (or N_bf) basis functions. Bold vectors **r**. Atomic units in equations.
- Basis-set names exactly: def2-SVP, def2-TZVP, def2-QZVP, cc-pVDZ, cc-pVTZ, cc-pVQZ, aug-cc-pVTZ, 6-31G*, 6-311G**, pc-1. Functional names exactly: SPW92, BP86, BLYP, PBE, PBE-D4, SCAN, B97M-V, B3LYP, B3LYP-D4, B3PW91, PBE0, M06-2X, M11, MN15, ωB97M-V, M06-L, M11-L, MN15-L, B97M-V.
- Experiment references by number and with a link: `../experiments/ex01-basis-sets.qmd` … (from `lectures/`). Experiment file names: ex01-basis-sets, ex02-jacobs-ladder, ex03-organic-a, ex04-organic-b, ex05-difficult-cases, ex06-b3lyp-631gs, ex07-grids, ex08-stability, ex09-experiment-vs-theory, ex10-final-review. Guides: `../guides/iqmol-setup.qmd`, `first-job.qmd`, `reading-output.qmd`, `shared-machines.qmd`, `units-and-errors.qmd`.
- Never give away an experiment's answers *before* the experiment (predictions are locked by students). Debrief sections discuss the general trends expected, phrased as "what you probably saw".
- Citations: `[@key]` using keys from `lab-site/references.bib`. Before inventing a key, grep the file. New references go **only** in your own file `lectures/_refs/<your-agent-name>.bib` (never edit `references.bib` directly); the coordinator merges them. Use real, verifiable references only (authors, journal, year, volume, pages, DOI); if unsure, leave the citation out.
- Plain, direct English, short sentences, US spelling. No emoji (except none). Write for first-year graduate / senior undergraduate chemistry students.
