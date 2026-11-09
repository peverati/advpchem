# Class 1 · The molecular Schrödinger equation  (Before Exp. 1)

**Goal.** Everyone can write the electronic Hamiltonian, say why it can't be solved exactly, and say what "approximating Ψ" vs "approximating Ĥ" means.

**Before class**
- [ ] Slides `slides/l01-molecular-schrodinger.qmd`; handout `lectures/l01-molecular-schrodinger.qmd`.
- [ ] pchem2 tabs open: [Schrödinger](https://peverati.github.io/pchem2/Schrodinger.html), [Operators](https://peverati.github.io/pchem2/Operators.html), [Hydrogen](https://peverati.github.io/pchem2/Hydrogen.html), [Molecules §11.1–11.2](https://peverati.github.io/pchem2/Molecules.html), [Spin](https://peverati.github.io/pchem2/Spin.html), [Atoms §10.1–10.2](https://peverati.github.io/pchem2/Atoms.html).
- [ ] Course site open (index, experiments menu) for the roadmap. Check `data/course.json`: `form` and `due` for ex01 are still empty strings at the time of writing; fill them in before class 3 at the latest.
- [ ] Syllabus/logistics: Florida Tech email identifies each submission; Microsoft Form per experiment; JSON file upload.

## [0–5] Why compute? Roadmap
- Computational chemists predict: reaction energies, barriers, structures, spectra; cheaper and safer than the lab, but only if we know the error bar.
- Ten experiments = one question: how wrong is my calculation, and why?
- Two big approximations in every calculation: Ψ (basis set, classes 1–3) and Ĥ (method: HF, DFT, ladder; classes 4–6).
- Tools: Q-Chem run through IQmol (free server, 10-minute limit per job).
- Everything is judged against reference values (kcal/mol). Preview: 1 kcal/mol is "chemical accuracy".
- **Board:** `exact Ĥ, exact Ψ` (impossible) → `approximate Ψ (basis)` + `approximate Ĥ (method)`.
- **Ask:** "What would you want a computer to predict for a molecule you can't make yet?" (energies, geometries, barriers, spectra, reaction outcome)
- **Watch out:** students think "computed = true". Plant the idea that every number has a method/basis label.

## [5–15] Review: TISE and the hydrogen atom
- ĤΨ = EΨ: eigenvalue problem; operator, eigenfunction, eigenvalue (quick recall, don't derive).
- H atom is the only exactly solvable atom: E_n = −1/(2n²) Eh = −13.6/n² eV; orbitals ψ_nlm, quantum numbers n, l, m; radial nodes = n − l − 1; degeneracy n² (no spin).
- Orbitals = one-electron wave functions. Ψ for many electrons is NOT an orbital.
- **Board:** `Ĥψ = Eψ`; `E_n = −1/(2n²) Eh`; sketch 1s, 2s (one radial node), 2p.
- **Ask:** "How many radial nodes does 3p have?" (3 − 1 − 1 = 1)
- **Watch out:** orbital ≠ probability density; |ψ|² is the density. Sign/phase of lobes is not a charge.

## [15–25] The molecular Hamiltonian; atomic units
- Five terms: T_n, T_e, V_ne, V_ee, V_nn. Write them out with sums over A, B (nuclei) and i, j (electrons).
- V_ee = Σ_{i<j} 1/r_ij is the troublemaker: couples every pair.
- Atomic units: ħ = mₑ = e = 4πε₀ = 1. Energy in hartree (Eh), length in bohr.
- Constants to write once and leave on the board: **1 Eh = 627.5095 kcal/mol = 27.211 eV = 2625.5 kJ/mol; 1 a₀ = 0.529177 Å.**
- **Board:** `Ĥ = −Σ_A ∇²_A/2M_A − Σ_i ∇²_i/2 − Σ_iA Z_A/r_iA + Σ_i<j 1/r_ij + Σ_A<B Z_A Z_B/R_AB`
- **Ask:** "Which term makes He impossible to solve exactly?" (V_ee, 1/r₁₂: electrons can't be separated)
- **Watch out:** mixing units. Q-Chem prints total energies in Eh; reaction energies get converted to kcal/mol later. Say the 627.5095 now; it returns every week.

## [25–35] Born–Oppenheimer; potential energy surface
- Nuclei ≥ 1836× heavier: clamp them, solve for electrons at fixed R.
- Ĥ_el(R) Ψ_el = E_el(R) Ψ_el; add V_nn → potential energy surface U(R) = E_el(R) + V_nn(R).
- **What a Q-Chem "Total energy" is:** E_el + V_nn at ONE fixed geometry. No zero-point energy, no thermal terms (returns in class 13).
- Geometry is an input here: the xyz files give fixed structures; we never optimize in this course.
- **Board:** `U(R) = E_el(R) + V_nn(R)`; sketch a diatomic curve with D_e and R_e labeled.
- **Ask:** "A DFT job returns −460.1 Eh. Is that the energy of the molecule at 298 K?" (No: electronic + nuclear repulsion at the given geometry, no ZPE or thermal terms)
- **Watch out:** "total energy" = "enthalpy"; BO breakdown only matters for light nuclei/conical intersections (just mention).

## [35–45] Many electrons: antisymmetry, Slater determinants, variational principle
- N ≥ 2: no analytic solution. Spin: α, β; Pauli principle → Ψ antisymmetric under exchange of any two electrons.
- Simplest antisymmetric Ψ: a Slater determinant of orbitals (spin-orbitals).
- Variational principle: E[Ψ_trial] ≥ E₀. Lower energy = better wave function (for HF/DFT with a larger basis). This sets up classes 2 and 4.
- Orbitals are building blocks, not observables.
- **Board:** `Ψ = (1/√2) |φ_a(1)α(1)  φ_b(2)β(2)|` as a 2×2 determinant; `E[Ψ_trial] ≥ E₀`.
- **Ask:** "What happens to a determinant if two electrons occupy the same spin-orbital?" (two equal rows, determinant = 0: Pauli)
- **Watch out:** "lower energy = more accurate reaction energy". True for total energy of a fixed system (variational), NOT automatically for energy differences/errors (Exp. 1 makes this point: error vs basis size can go up).

## [45–50] Model chemistry; what's next
- Every number has a label: **method/basis**, e.g. B3LYP/def2-TZVP. Quote it with the number.
- Next class: how to build orbitals from basis functions.
- **Ask (exit ticket):** "Write one thing you would have to approximate to compute the energy of H₂O." (V_ee treatment = method; orbital expansion = basis)

**If running late:** cut the hydrogen-atom review to 5 min (give quantum numbers as recall); skip nodes; drop the Slater-determinant algebra and just state antisymmetry + variational principle.
**If this becomes two classes:** not marked "may need two".
**Next class:** Class 2, basis sets (LCAO, STO vs GTO, def2/cc-pVnZ families, cost vs accuracy).
