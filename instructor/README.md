# Instructor notes (in the repository, not rendered on the website)

One file per class (50 min). Format: goal, before-class checklist, timed blocks (Board / Ask / Watch out), debrief "Look for" lists, if-running-late, next class.

| # | Title | Precedes | File |
|---|---|---|---|
| 1 | The molecular Schrödinger equation | Exp. 1 | [l01-molecular-schrodinger.md](l01-molecular-schrodinger.md) |
| 2 | Approximating the wave function: basis sets | Exp. 1 | [l02-basis-sets.md](l02-basis-sets.md) |
| 3 | From theory to a calculation: IQmol, Q-Chem and Exp. 1 | Exp. 1 | [l03-from-theory-to-a-calculation.md](l03-from-theory-to-a-calculation.md) |
| 4 | Hartree–Fock and the SCF | Exp. 2 | [l04-hartree-fock.md](l04-hartree-fock.md) |
| 5 | Density functional theory | Exp. 2 | [l05-density-functional-theory.md](l05-density-functional-theory.md) |
| 6 | Jacob's ladder | Exp. 2 | [l06-jacobs-ladder.md](l06-jacobs-ladder.md) |
| 7 | Debrief Exp. 1–2 · How we test a functional | Exp. 3 | [l07-benchmarking.md](l07-benchmarking.md) |
| 8 | Debrief Exp. 3 · Dispersion | Exp. 4 | [l08-dispersion.md](l08-dispersion.md) |
| 9 | Debrief Exp. 4 · Why some reactions are hard (may need two) | Exp. 5 | [l09-difficult-cases.md](l09-difficult-cases.md) |
| 10 | Debrief Exp. 5 · Basis-set vs functional error | Exp. 6 | [l10-error-cancellation.md](l10-error-cancellation.md) |
| 11 | Debrief Exp. 6 · Integration grids | Exp. 7 | [l11-integration-grids.md](l11-integration-grids.md) |
| 12 | Debrief Exp. 7 · SCF stability, transition metals (may need two) | Exp. 8 | [l12-scf-stability.md](l12-scf-stability.md) |
| 13 | Debrief Exp. 8 · Electronic energies to experiment (may need two) | Exp. 9 | [l13-theory-vs-experiment.md](l13-theory-vs-experiment.md) |
| 14 | Debrief Exp. 9 · Choosing, running, reporting a method | Exp. 10 | [l14-choosing-a-method.md](l14-choosing-a-method.md) |
| 15 | Debrief Exp. 10 · What we learned | — | [l15-wrap-up.md](l15-wrap-up.md) |

Debrief routine (classes 7–15): sync OneDrive → `python3 tools/aggregate.py exNN "<path>"` → check `gradebook/` → set `release_class_results` in `data/course.json` → render/publish.

Caveat: expected numbers come from the older answer key (def2-QZVP, -D3(BJ)) and one Fall 2026 report (Exp. 8); the course runs def2-TZVP and -D4. Compare with your class results.
