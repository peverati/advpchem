# Lecture 4 · Approximating the Hamiltonian I: Hartree–Fock and the SCF  (Before Exp. 2)

**Goal.** Students understand the mean-field idea, what an SCF iteration does (and why it can fail), and what "correlation energy" means.

**Before class**
- [ ] Slides `slides/l04-hartree-fock.qmd`; handout `lectures/l04-hartree-fock.qmd`.
- [ ] pchem2: [Molecules §11.3.1](https://peverati.github.io/pchem2/Molecules.html#the-hartree-fock-method), [Poly §13.2](https://peverati.github.io/pchem2/Poly.html#hartree-fock-calculation-for-water).
- [ ] An SCF table from a real output (e.g. your HCl job from class 3) ready to show: cycles, energy, DIIS error, "Convergence criterion met".
- [ ] IQmol with an MO viewer example for the Koopmans block (check live how orbitals are shown; menu names unverified).
- [ ] Skim student questions on Exp. 1 (any job problems?). Full debrief is class 7: do NOT show results.

## [0–5] Where we are; Exp. 1 check-in
- Ψ's flexibility fixed by basis; now Ĥ: what do we do about V_ee?
- Quick poll: who has run jobs? Who is stuck (server queue, multiplicity, naming)?
- **Ask:** "Any job problems so far?" (collect: server queue, wrong basis spelling, forgetting to save outputs)
- **Watch out:** students sharing numbers; remind that predictions must be locked before looking.

## [5–17] Hartree's idea; Hartree–Fock
- Mean field: each electron moves in the average field of the others, not instantaneous repulsion.
- HF: ONE Slater determinant + variational principle → Fock equations f̂φ_i = ε_i φ_i.
- Fock operator = core Hamiltonian + Coulomb Ĵ − exchange K̂. Exchange comes from antisymmetry (no classical analogue).
- **Self-interaction cancels exactly in HF** (Ĵ_ii = K̂_ii). Say "remember this" for DFT (class 5).
- [@hartree1928; @fock1930; @slater1930].
- **Board:** `f̂ = ĥ + Σ_j (Ĵ_j − K̂_j)`; `f̂ φ_i = ε_i φ_i`; `Ĵ_ii = K̂_ii → no self-interaction`.
- **Ask:** "Where does the −K̂ term come from?" (antisymmetry of Ψ; same-spin electrons avoid each other)
- **Watch out:** "HF has no electron-electron repulsion" (it has it, averaged); "exchange is a force" (it's a consequence of Pauli).

## [17–27] Roothaan–Hall and the SCF loop
- In a basis: **FC = SCε**; F depends on C → iterate.
- Loop: initial guess → build F → diagonalize → new density → check convergence (energy change, DIIS error; `SCF_CONVERGENCE 8` = 10⁻⁸) → repeat.
- Link to the table they see in every output (cycle, energy, DIIS error).
- Failure modes: oscillation, slow convergence, converging to a wrong (excited/unstable) solution (preview class 12).
- RHF vs UHF for open shells (radicals, atoms: needs the right multiplicity).
- **Board:** loop diagram (guess → F → diagonalize → ρ → converged? → F ...) and `FC = SCε`.
- **Ask:** "Why can't we solve FC = SCε in one step?" (F depends on C: the answer enters the question)
- **Watch out:** reading "Convergence criterion met" as "the answer is right" (only means the loop stopped); unconverged energies in submissions.

## [27–35] Orbital energies, Koopmans
- ε_i; occupied vs virtual; HOMO/LUMO labels.
- Koopmans: IP ≈ −ε_HOMO (frozen orbitals; error cancellation between relaxation and correlation).
- MO pictures in IQmol: signs/phases, nodal structure.
- **Board:** `IP ≈ −ε_HOMO`; orbital diagram HOMO/LUMO.
- **Ask:** "Does the LUMO energy give the electron affinity?" (not reliably in HF; virtual orbitals feel an N-electron field, are too high)
- **Watch out:** treating orbital energies as exact; over-interpreting orbital shapes.

## [35–45] What HF misses: electron correlation
- E_corr = E_exact − E_HF (same basis; ideally CBS). Always negative.
- Dynamic vs static (nondynamic): H₂ dissociation (RHF wrong at long R: forces 50% ionic character).
- Size: ~1% of total energy but comparable to reaction energies/bond energies.
- HF has no dispersion at all (no correlated fluctuations); previews class 8 and the (HCl)₂ puzzle in Exp. 1.
- **Board:** `E_corr = E_exact − E_HF`; H₂ curve: exact vs RHF diverging.
- **Ask:** "Is 1% of the total energy small?" (a few hundred kcal/mol for a small molecule, far above 1 kcal/mol accuracy)
- **Watch out:** "correlation = dispersion" (dispersion is one part of dynamic correlation); "HF is an exact method for small molecules".

## [45–50] Ways forward
- Wave-function methods: MP2 (N⁵), CCSD(T) "gold standard" (N⁷), used for the lab's reference values; DFT is cheaper: next class.
- **Ask:** "Why not use CCSD(T) for everything?" (cost scaling; 10-minute server limit)

**If running late:** cut Koopmans to one slide; give the Roothaan-Hall derivation as a statement only; keep SCF loop and correlation.
**If this becomes two classes:** not marked.
**Next class:** Lecture 5, density functional theory (HK theorems, Kohn–Sham, LSDA).
