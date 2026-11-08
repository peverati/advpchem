# Computational Chemistry Lab website: notes for Claude

Course website for the ten DFT experiments of **Advanced Physical Chemistry (CHM 5111)** at **Florida Tech**, taught by Prof. Roberto Peverati. Students read each experiment, view molecules in 3D, run Q-Chem through **IQmol's free server** (10-minute job limit), enter results in self-checking forms, and submit a JSON file through a Microsoft Form. Read `README.md` (instructor workflow) and `CORRECTIONS.md` (every change to the original handouts) before making changes.

## Layout

- `_quarto.yml`: Quarto website config (cosmo/darkly themes, navbar, bibliography, `colab-base` placeholder `OWNER/REPO`).
- `index.qmd`, `class-results.qmd`, `guides/*.qmd` (IQmol/Q-Chem how-tos), `experiments/exNN-*.qmd` (one page per experiment).
- `data/experiments/exNN.json`: **single source of truth** per experiment: species, reactions (stoichiometry `nu`, `ref` in kcal/mol, optional `group`), methods (Q-Chem `rem`), `bases` (also used for grids in Ex7 and stability runs in Ex8), optional `conditions` (explicit method/basis/species lists), `quiz`, `predictions` (with `check` rules), `questions`, `explore` (chart names), `auto_delta`, `import`.
- `data/course.json`: semester settings: Microsoft Form links, due dates, `release_class_results`.
- `data/geometries/exNN/*.xyz`: line 2 is always `charge multiplicity`. Regenerate with `tools/prepare_geometries.py` (reads the archive folders one level up).
- `components/*.js`: plain ES modules, no build step. `lab.js` renders the `<div data-lab="…">` placeholders. `core.js` holds the data model, `explore.js` the shared charts, `explorers/*.js` the per-experiment charts, plus special widgets (`grid-explorer`, `landscape`, `nist`, `methodcard`, `ladder`).
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
- Submissions go through Microsoft 365 Forms (file upload), not Google. Students identify with their **Florida Tech email** (`@my.fit.edu` / `@fit.edu`), not a username. Always write "Florida Tech", never "FIT".
- **-D4 everywhere** (no -D3), cited to the Caldeweyher 2017/2019 papers.
- Reaction energies are written ΔE = Σ νᵢEᵢ with **signed** stoichiometric coefficients (ν > 0 products, ν < 0 reactants).
- Students type their numbers (no output-file parsing). The site checks consistency but **never reveals the correct value**. Ex7 computes reaction energies automatically (`auto_delta`).
- def2-QZVP is too slow for the 10-minute limit: Ex6 compares with **def2-TZVP**, and Ex9 uses def2-TZVP. Ex7 (Ar₂) keeps def2-QZVP.
- Ex6 uses three fixed reactions chosen from the answer key `../Lab_Notebook_DetailedKey.RP.xlsx` (its "Experiment 7" = our Ex6): 4a (6-31G* better), 4b (about the same), 5b CaO (much worse).
- Ex8 keeps only functional/atom pairs that converged with and without stability analysis in `../Matija_Savovic_CHM5111_Experiment_8_Results.xlsx`: PBE (Fe, Ru⁺), BP86 and PBE0 (Ru⁺), M06-2X and B97M-V (Fe).
- Ex1 subset NCCE30; Ex5 H₂SO₄ from SMAE3; Ex10 geometries renamed `*_PdBE2.xyz`.
- Numbering in the answer-key workbook differs from the site (it follows the original 14-experiment notebook).

## Still unverified

- The Q-Chem keywords the input generator writes (`DFT_D D4`, `METHOD B97M-rV`, `SPW92`, `MN15-L`, `BASIS pc-1`, `ECP def2-ECP`, `XC_GRID 1/2/3`, `INTERNAL_STABILITY TRUE`) on the Q-Chem version behind the free IQmol server.
- Real job times against the 10-minute limit (largest: Ex9 tert-butanol, Ex10 Pd complex).
- IQmol menu names in `guides/` (no screenshots yet).
- Not published yet: GitHub Pages, the `colab-base` URL, and the Microsoft Form links in `data/course.json` are all still to do.

## Conventions

- Colors come from CSS variables in `styles.css`. Quarto's dark theme keeps Bootstrap's light `--bs-tertiary-bg` / `--bs-border-color`, so use `--lab-subtle-bg` and `--lab-border` instead.
- Every page must work at phone width (375 px) without horizontal scrolling. Wrap wide tables in `.table-responsive`.
- Student drafts live only in the student's browser `localStorage` (`advpchem:exNN`). Never add anything that sends data to a server.
- Commit messages end with the Co-Authored-By line given in the session's instructions. Only commit when asked.
