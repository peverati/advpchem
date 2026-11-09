# Computational Chemistry Lab website: notes for Claude

Course website for the ten DFT experiments of **Advanced Physical Chemistry (CHM 5111)** at **Florida Tech**, taught by Prof. Roberto Peverati. Students read each experiment, view molecules in 3D, run Q-Chem through **IQmol's free server** (10-minute job limit), enter results in self-checking forms, and submit a JSON file through a Microsoft Form. Read `README.md` (instructor workflow) and `CORRECTIONS.md` (every change to the original handouts) before making changes.

## Layout

- `_quarto.yml`: Quarto website config (cosmo/darkly themes, navbar, bibliography, `colab-base` → peverati/advpchem).
- `index.qmd`, `class-results.qmd`, `guides/*.qmd` (IQmol/Q-Chem how-tos), `experiments/exNN-*.qmd` (one page per experiment).
- `data/experiments/exNN.json`: **single source of truth** per experiment: species, reactions (stoichiometry `nu`, `ref` in kcal/mol, optional `group`), methods (Q-Chem `rem`), `bases` (also used for grids in Ex7 and stability runs in Ex8), optional `conditions` (explicit method/basis/species lists), `quiz`, `predictions` (with `check` rules), `questions`, `explore` (chart names), `auto_delta`, `import`.
- `data/course.json`: semester settings: Microsoft Form links, due dates, `release_class_results`.
- `data/geometries/exNN/*.xyz`: line 2 is always `charge multiplicity`. Regenerate with `tools/prepare_geometries.py` (reads the archive folders one level up).
- `components/*.js`: plain ES modules, no build step. `lab.js` renders the `<div data-lab="…">` placeholders. `core.js` holds the data model, `explore.js` the shared charts, `explorers/*.js` the per-experiment charts, plus special widgets (`grid-explorer`, `landscape`, `nist`, `methodcard`, `ladder`).
- `downloads/extract_ex07.py`: student-facing, Python 3.8+ standard library only, same file on macOS/Windows/Linux. Instructions are on the Ex7 page (`#sec-extract`).
- `lectures/`: student handouts, one per class (HTML + PDF, in the site's Lectures menu); `lectures/PLAN.md` is the lecture plan all three products follow. `slides/`: revealjs decks, excluded from the site render (`quarto render slides/<deck>.qmd`). `instructor/`: teaching notes in Markdown, committed but never rendered.
- `tools/aggregate.py`: reads uploaded submissions → private `gradebook/` (git-ignored) + anonymized `data/class/exNN.json`.
- `tools/build_notebooks.py` → `notebooks/*.ipynb` (Colab, PySCF). `tools/build_experiment_data.py` wrote the Ex4–10 quiz/prediction content once; **do not re-run it** (it would overwrite later JSON edits).
- `filters/print-handout.lua`: strips the interactive parts from the Word/PDF handouts.
- `includes/lab-logo.html` + `images/logo-light.png` / `logo-dark.png`: lab logo at the top right, switched with the theme (copies also in `../assets/`).

## Commands

- Build: `quarto render` (from this folder) → `_site/`. Don't run it while `quarto preview` is running: the two collide.
- Preview without re-rendering: `python3 -m http.server 4322 --directory _site` (`../.claude/launch.json` has this as `lab-site-static`).
- Syntax-check a module: copy it to a `.mjs` file and run `node --check`.

## Decisions already made (don't undo without asking)

- Q-Chem through IQmol is the main path; Colab/PySCF notebooks are optional extensions.
- Submissions go through Microsoft 365 Forms (file upload), not Google. Students identify with their **Florida Tech email** (`@my.fit.edu` / `@fit.edu`), not a username. Never write "FIT". Use "Florida Institute of Technology" in formal places (slide title pages and footers, the site footer and description) and "Florida Tech" in everyday text (e.g. "your Florida Tech email").
- **-D4 everywhere** (no -D3), cited to the Caldeweyher 2017/2019 papers.
- Reaction energies are written ΔE = Σ νᵢEᵢ with **signed** stoichiometric coefficients (ν > 0 products, ν < 0 reactants).
- Students type their numbers. The site checks consistency but **never reveals the correct value**. Ex7 computes reaction energies automatically (`auto_delta`). **Exception, Ex7 only (480 jobs):** students run `downloads/extract_ex07.py`, which reads their Q-Chem outputs locally and writes `ex07_results.csv`, then load it with the results form's **Import CSV** (enabled by `csv_import` in the experiment JSON). The script identifies jobs from the echoed `$rem`/`$molecule`, not file names, and gives no energy for failed jobs.
- def2-QZVP is too slow for the 10-minute limit: Ex6 compares with **def2-TZVP**, Ex9 uses def2-TZVP, and Ex7 (Ar₂) uses def2-TZVP too (Fall 2026: with def2-QZVP, SG-2 jobs took 5–7 min and SG-3 jobs often hit the limit).
- Ex6 uses three fixed reactions chosen from the answer key `../Lab_Notebook_DetailedKey.RP.xlsx` (its "Experiment 7" = our Ex6): 4a (6-31G* better), 4b (about the same), 5b CaO (much worse).
- Ex8 keeps only functional/atom pairs that converged with and without stability analysis in `../Matija_Savovic_CHM5111_Experiment_8_Results.xlsx`: PBE (Fe, Ru⁺), BP86 and PBE0 (Ru⁺), M06-2X and B97M-V (Fe).
- Ex1 subset NCCE30; Ex5 H₂SO₄ from SMAE3; Ex10 geometries renamed `*_PdBE2.xyz`.
- Numbering in the answer-key workbook differs from the site (it follows the original 14-experiment notebook).

## Still unverified

- The Q-Chem keywords the input generator writes (`DFT_D D4`, `SPW92`, `MN15-L`, `BASIS pc-1`, `ECP def2-ECP`, `XC_GRID 1/2/3`, `INTERNAL_STABILITY TRUE`) on the Q-Chem version behind the free IQmol server.
- Real job times against the 10-minute limit. Known from Fall 2026 student data (`../students_results/`): Ex3–5 at def2-TZVP take seconds to ~5 min (hexanes with hybrids); Ex7 Ar₂ at def2-QZVP took 10–40 s with SG-1, 5–7 min with SG-2, and SG-3 often timed out (hence def2-TZVP now). Still unknown: Ex7 at def2-TZVP with SG-3, Ex9 tert-butanol with the unpruned (99,590) grid + stability analysis (high risk), Ex10 Pd complex.
- IQmol menu names in `guides/` (no screenshots yet).
- `extract_ex07.py` against **real** outputs from the IQmol server (tested only on fake outputs): the `Total energy in the final basis set` / `Convergence criterion met` / `Total job time` lines, the echoed `$rem` (IQmol may write lowercase `key = value`, which is handled), and where IQmol saves the output files.
- Published at https://peverati.github.io/advpchem/ (repo peverati/advpchem; `quarto publish gh-pages` from `main`). The Microsoft Form links and due dates in `data/course.json` are still to do.

## Conventions

- Colors come from CSS variables in `styles.css`. Quarto's dark theme keeps Bootstrap's light `--bs-tertiary-bg` / `--bs-border-color`, so use `--lab-subtle-bg` and `--lab-border` instead.
- Every page must work at phone width (375 px) without horizontal scrolling. Wrap wide tables in `.table-responsive`.
- Student drafts live only in the student's browser `localStorage` (`advpchem:exNN`). Never add anything that sends data to a server.
- Commit messages end with the Co-Authored-By line given in the session's instructions. Only commit when asked.
