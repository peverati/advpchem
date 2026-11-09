# Lecture 5 · Approximating the Hamiltonian II: density functional theory  (Before Exp. 2)

**Goal.** Students understand why the density is enough in principle, what the Kohn–Sham scheme is, and that everything hard is in E_xc.

**Before class**
- [ ] Slides `slides/l05-density-functional-theory.qmd`; handout `lectures/l05-density-functional-theory.qmd`.
- [ ] A density isosurface or the H₂O density in IQmol (optional; check live how it's displayed).
- [ ] Have a SCF table from a DFT job next to an HF one to show "same output table".
- [ ] Reminder from class 4: self-interaction cancels exactly in HF.

## [0–5] Motivation
- Ψ(r₁…r_N, spins): 3N coordinates; ρ(r): 3 coordinates, always.
- Correlated wave-function methods too costly for big molecules.
- **Ask:** "How many coordinates does Ψ need for H₂O?" (30 spatial; ρ needs 3)
- **Watch out:** confusing the number of variables with the number of basis functions.

## [5–15] Density; Hohenberg–Kohn; Thomas–Fermi
- ρ(r) = N∫|Ψ|² dr₂…dr_N; integrates to N; observable (X-ray).
- HK 1964: ρ determines v_ext (up to a constant) hence N, Ĥ, everything; variational principle E[ρ] ≥ E₀ [@hohenberg1964].
- Thomas–Fermi: orbital-free kinetic energy fails (no molecular binding): why orbitals are needed.
- **Board:** `ρ(r) → v_ext → Ĥ → Ψ → everything`; `E[ρ] ≥ E₀ = E[ρ₀]`.
- **Ask:** "Why does ρ determine the nuclear positions?" (cusps at nuclei, integral = N: it carries all of v_ext)
- **Watch out:** "HK gives us the functional" (it proves existence only; the exact form is unknown).

## [15–30] Kohn–Sham
- Fictitious non-interacting electrons with the SAME density; orbitals return [@kohn1965].
- `E[ρ] = T_s + E_ne + J + E_xc`. E_xc collects exchange + correlation + kinetic-energy correction.
- KS equations look like Fock equations with E_xc potential instead of exact exchange; same SCF machinery, same output table.
- With exact E_xc KS would be exact: all approximations live in E_xc.
- **Board:** `E[ρ] = T_s[ρ] + E_ne[ρ] + J[ρ] + E_xc[ρ]`; `[−∇²/2 + v_eff] φ_i = ε_i φ_i`.
- **Ask:** "What is the difference between HF's K̂ and DFT's E_xc?" (K̂ is exact exchange of a determinant; E_xc is an approximate functional of ρ that also holds correlation)
- **Watch out:** KS orbitals are "not physical" yet used as if they were; E_xc is not just exchange; DFT is not an "approximate Ψ" theory.

## [30–40] LSDA
- Uniform electron gas: Slater/Dirac exchange ∝ ρ^{4/3}; correlation from QMC data (VWN, PW92) [@slater1951; @vosko1980; @perdew1992]. **SPW92** in this course.
- Good: geometries, surprisingly. Bad: overbinding, atomization energies far too large.
- **Board:** `E_x^LDA = −C_x ∫ ρ^{4/3} dr`.
- **Ask:** "Real densities are far from uniform. Why does LSDA still work for geometries?" (error cancellation; satisfies sum rules for the exchange-correlation hole)
- **Watch out:** treating LSDA as useless: it's the base of every rung and a reference point (SPW92 is among the worst in Exps. 3–5 though: don't give away why yet).

## [40–45] Numerical integration
- E_xc has no analytic integral: evaluated on a grid of points around each atom; one sentence now, full story class 11.
- Hybrids mix HF exchange: preview of class 6.
- **Watch out:** "the grid is a detail": it matters for meta-GGAs (Exp. 7).

## [45–50] Known errors to keep in mind
- Self-interaction/delocalization error (HF has none; pure DFT does), missing long-range dispersion, static correlation. Each returns in classes 8–9.
- **Ask:** "Which error did HF NOT have?" (self-interaction; HF's failure is missing correlation)

**If running late:** drop Thomas–Fermi to one sentence; show LSDA as a formula only. Keep KS (the core).
**If this becomes two classes:** not marked.
**Next class:** Lecture 6, Jacob's ladder and the Exp. 2 briefing.
