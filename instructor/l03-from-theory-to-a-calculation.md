# Class 3 · From theory to a calculation: IQmol, Q-Chem and Experiment 1  (Before Exp. 1)

**Goal.** Every student can set up, submit and read a Q-Chem job in IQmol and knows exactly what to do in Experiment 1.

**Before class**
- [ ] Slides `slides/l03-from-theory-to-a-calculation.qmd`; handout `lectures/l03-from-theory-to-a-calculation.qmd`.
- [ ] Open: Exp. 1 `experiments/ex01-basis-sets.qmd`; guides `guides/iqmol-setup.qmd`, `first-job.qmd`, `reading-output.qmd`, `shared-machines.qmd`, `units-and-errors.qmd`.
- [ ] **Run the HCl / HF / def2-SVP job beforehand** on the free server; save the `.out` as a backup (server may be slow or down in class). Energy should be about −460 Eh (guide 2); basis-function count: read it from your output, don't quote from memory.
- [ ] **IQmol menu names are NOT verified.** The guides say File → Open, Calculation → Q-Chem Setup, Server menu, Job Monitor, open/save the job's output. Check each live (or in a dry run) and correct the guides afterwards; take screenshots for them.
- [ ] `data/course.json`: ex01 `form` and `due` (empty at the time of writing): fill in, render and publish, so you can show the submission step.
- [ ] Download `37_HCl_NCCE30.xyz` ready on the desktop.
- [ ] Not verified yet: Q-Chem keywords of the generator (`DFT_D D4`, `XC_GRID`, ...) on the free server; for Exp. 1 only `METHOD`/`BASIS` matter (low risk).

## [0–5] Recap: the model-chemistry decoder
- Decode on the board: HF/cc-pVTZ, B3LYP/def2-SVP, ωB97M-V/def2-QZVP → method (Ĥ approximation) / basis (Ψ approximation).
- **Ask:** "In ωB97M-V/def2-QZVP, which part is the basis?" (def2-QZVP: quadruple-ζ Karlsruhe)
- **Watch out:** reporting "B3LYP" with no basis; a number without a label is meaningless.

## [5–15] Tools; anatomy of a Q-Chem input
- IQmol: builder/viewer, Q-Chem setup window, free server (**10-minute limit per job**), Job Monitor. Q-Chem is the engine; IQmol is the front end.
- Input: `$molecule` (charge, multiplicity, Cartesian coordinates in Å) and `$rem` (JOBTYPE SP, METHOD, BASIS, SCF_CONVERGENCE 8).
- **Line 2 of every .xyz in this lab is "charge multiplicity"** (not a comment).
- Website: input generator, job checklist, "download all inputs". Point to guides.
- **Board:** a 10-line `$molecule`/`$rem` skeleton with arrows to charge, multiplicity, METHOD, BASIS.
- **Ask:** "Which single keyword changes if I want cc-pVTZ instead of def2-SVP?" (BASIS)
- **Watch out:** misspelling basis/method (job dies instantly); pasting an input with the wrong block order; leaving IQmol's default multiplicity (1) for an open-shell atom.

## [15–23] Live demo: HCl, HF/def2-SVP
- Follow guide 2: File → Open xyz → Calculation → Q-Chem Setup → set Energy/HF/def2-SVP, charge 0, multiplicity 1 → choose the free server → name the job `ex01_hf_def2-svp_hcl` → Submit → Job Monitor (queued → running → finished).
- Then change ONLY `BASIS` (e.g. def2-TZVP), resubmit, compare energy and time.
- Show Option B: copy the input from the Exp. 1 page "Run the calculations" and paste into the input editor.
- Naming scheme; keep every output in one folder per experiment.
- Reminder to check menu names live and note discrepancies.
- **Ask:** "The energy dropped when we went to def2-TZVP. Why?" (more flexible Ψ, variational principle)
- **Watch out:** forgetting to pick the server (job never leaves); closing IQmol before the job returns; not saving the output file; job "stuck in queue" is normal near deadlines.

## [23–31] Reading the output (guide 3)
- Four numbers: total energy (`Total energy in the final basis set`), SCF cycles (`Convergence criterion met`), wall time (`Total job time`, use wall, not CPU), basis functions (`... basis functions`).
- Finished = "Thank you very much for using Q-Chem". Check echoed `$molecule` and `$rem`.
- Total energy vs SCF energy: take TOTAL (differ with -D4).
- **Board:** `E_total (Eh)`, `cycles`, `t_wall (s)`, `N_bf`.
- **Ask:** "Output ends abruptly with no 'Thank you...'. What do you do?" (job crashed or hit 10 min: read last lines, don't just resubmit)
- **Watch out:** wall vs CPU time; taking the energy from the first SCF cycle; ignoring "failed to converge"; a converged calculation with the wrong multiplicity looks fine.

## [31–36] From total energies to a reaction energy
- ΔE = Σ νᵢEᵢ, **signed ν** (> 0 products, < 0 reactants). Convert: × 627.5095 kcal/mol per Eh.
- Keep ALL digits: totals ~10² Eh, reaction energies ~10⁻³ Eh; 4 decimals can cost up to ~0.03 kcal/mol.
- Signed error ε = ΔE_comp − ΔE_ref; absolute error |ε|. Chemical accuracy ≈ 1 kcal/mol.
- **Board:** `ΔE = Σ νᵢEᵢ`; example 2 O3 → 3 O2 `ΔE = 3E(O2) − 2E(O3)`; `ε = ΔE_comp − ΔE_ref`.
- **Ask:** "For (HCl)₂ → 2 HCl, what are ν(dimer) and ν(HCl)?" (−1 and +2)
- **Watch out:** "products − reactants" and ν both applied (double sign flip); forgetting the 2; Eh vs kcal/mol; rounding.

## [36–48] Experiment 1 briefing
- Reaction: (HCl)₂ → 2 HCl (NCCE30 subset), reference 2.01 kcal/mol. 4 methods (HF, PBE, B3LYP, ωB97M-V) × 6 bases (def2-SVP/TZVP/QZVP, cc-pVDZ/TZ/QZ) × 2 molecules = **48 jobs**, all closed-shell singlets.
- Students will see: error vs ζ, the two families, timing vs N and a fitted exponent.
- **Do first:** (1) read the page; (2) **lock the 4 predictions** (ωB97M-V trend, HF trend, which family, best method at def2-QZVP) BEFORE any result; (3) run one test job and check it; (4) batch by method (or by basis), small bases first, def2-QZVP/cc-pVQZ last; all jobs are well under the 10-minute limit.
- Record per job: total energy (all digits), SCF cycles, wall time, number of basis functions; enter reaction energy last (page checks your own arithmetic, never reveals the answer).
- **Submission:** download the JSON from the Submit section; upload it to the Exp. 1 Microsoft Form signed in with the **Florida Tech email**; resubmitting before the deadline is fine (latest counts). Drafts live only in the browser: use the same browser/computer.
- Optional: Colab CBS notebook.
- **Ask:** "Before running: do you think the error of HF shrinks steadily as ζ grows?" (Don't answer; they commit in the predictions. If pushed: HF lacks dispersion, so there is more going on.)
- **Watch out:** running predictions after seeing results; mixing up cc-pVTZ with def2-TZVP; copying numbers into the wrong cell; not saving outputs.

## [48–50] Before next class
- Run the first jobs. Preview class 4: the Hamiltonian approximation, Hartree–Fock and the SCF table they now see in outputs.

**If running late:** shorten the tools talk; cut Option B copy-paste demo; do the units block as a one-slide recap and make the briefing the priority (never cut predictions-first).
**If this becomes two classes:** not marked; if the demo fails (server down), use the saved backup output and move the live part to the next class start.
**Next class:** Class 4, Hartree–Fock and the SCF.
