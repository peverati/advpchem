# Computational Chemistry Lab website — instructor notes

A Quarto website for the ten DFT experiments of Advanced Physical Chemistry.
Students read each experiment, view the molecules in 3D, get ready-made Q-Chem
inputs, run them on IQmol's free Q-Chem server, enter their results in a
self-checking form, and submit a file through a Microsoft Form.

The original Word handouts and geometry zips one folder up are untouched and are
no longer needed by the site. See `CORRECTIONS.md` for every fix applied to their
content.

## Everyday tasks

| Task | How |
|---|---|
| Preview locally | `quarto preview` (from this folder), then open the printed URL |
| Build the site | `quarto render` → `_site/` |
| Edit text of an experiment | `experiments/exNN-*.qmd` (Markdown + citations `[@key]`) |
| Change molecules / methods / reference values / questions / predictions / quiz | `data/experiments/exNN.json` (one file drives the form, inputs, checks and charts) |
| Add a reference | `references.bib`, then cite it as `[@key]` |
| Semester settings: form links, due dates, release of class results | `data/course.json` |
| Regenerate geometries from the archive | `python3 tools/prepare_geometries.py` |
| Regenerate Colab notebooks | `python3 tools/build_notebooks.py` (needs `nbformat`) |

## One-time setup each semester

1. **The site** lives at https://peverati.github.io/advpchem/ (repository `peverati/advpchem`,
   source on `main`, built pages on `gh-pages`). After any change:
   ```bash
   git add -A && git commit -m "Describe the change" && git push
   quarto publish gh-pages
   ```
2. **Create one Microsoft Form per experiment** (forms.office.com, signed in with your Florida Tech email):
   - Settings → *Only people in my organization can respond* and *Record name*.
   - Add a **File upload** question ("Upload your submission file (.json)"), max 1–2 files.
     Uploaded files land in your OneDrive under *Apps/Microsoft Forms/<form name>/*.
   - Optionally, a second file-upload question for the printable report (PDF).
   - Copy the form's share link into `data/course.json` → `experiments.exNN.form`.
3. Set the **due dates** in `data/course.json` (ISO format, e.g. `"2026-09-15"`).

## After each deadline

1. Make sure OneDrive has synced the uploads to your Mac.
2. Run
   ```bash
   python3 tools/aggregate.py ex03 "~/Library/CloudStorage/OneDrive-FloridaInstituteofTechnology/Apps/Microsoft Forms/Experiment 3"
   ```
   (adjust the path; add `--include-muddiest` to publish the anonymous "muddiest points").
   This writes:
   - `gradebook/ex03_gradebook.xlsx`: **private** (git-ignored): completeness, verified reaction energies, MAE, answers, predictions.
   - `data/class/ex03.json`: **public, anonymized** medians/quartiles per method and reaction, plus the functional-draft league.
3. Set `"release_class_results": true` for that experiment in `data/course.json`, render and publish.
   Students then see amber flags on entries far from the class median, and the heatmap on *Class results*.

## How it works

- `components/*.js`: plain ES modules, no build step. `lab.js` finds the
  `<div data-lab="…">` placeholders on an experiment page and renders each widget
  from `data/experiments/exNN.json`.
- Student work is stored only in the student's browser (`localStorage`) until they
  download the submission file. Nothing is sent anywhere by the site.
- The results form recomputes each reaction energy from the student's own total
  energies (1 Eh = 627.5095 kcal/mol) and flags inconsistencies without ever
  showing the correct value.
- `filters/print-handout.lua` removes the interactive parts from the Word/PDF
  versions of each experiment ("Other Formats" on each page).

## What each experiment has

All ten experiments are interactive. Every page with calculations has a warm-up
quiz, 3D molecules, locked predictions, a Q-Chem input generator with job
checklist, a self-checking results table, live charts, questions and a submission
file. Experiment-specific pieces:

| Exp | Special parts | Data options used |
|---|---|---|
| 1 | error vs ζ, cost-scaling fit, Colab CBS notebook | |
| 2 | Jacob's-ladder classification | `ladder` |
| 3 | rung-coloured errors, cost vs accuracy, functional draft, Colab torsion notebook | |
| 4 | D4 on/off pairs, dispersion-coloured dimer chart | method `disp` |
| 5 | relative errors, CaO training-set spotlight, easy→hard chart across Exps 3–5 | `spotlight` |
| 6 | three fixed reactions (4a, 4b, 5b), MAE by basis, "spot the anomaly", basis-size counter, import of def2-TZVP results from Exps 4–5 | `import`, reaction `group` |
| 7 | grid explorer, Ar₂ curves, wiggle report, timing by grid, output-extraction script + CSV import | grids as `bases` with `XC_GRID`, `auto_delta`, `csv_import` |
| 8 | stability landscape, energy lowering by stability analysis | runs as `bases` with `INTERNAL_STABILITY`; explicit `conditions` limit each functional to the atoms that converge |
| 9 | grouped errors, relative errors, NIST theory-vs-experiment panel | explicit `conditions` (B3LYP/6-31G* for tBuOH only) |
| 10 | method card with cost check and input generator, result card, report editor | `custom` method |

`tools/build_experiment_data.py` wrote the quiz/prediction/question content of
Experiments 4–10 once; edit the JSON files directly from now on (re-running the
script would overwrite your edits).

## Still to verify with a real IQmol job

The Q-Chem keywords used by the input generator (`DFT_D D4`, `METHOD SPW92`, `ECP def2-ECP`, `XC_GRID`, `INTERNAL_STABILITY`, `METHOD MN15-L`,
`BASIS pc-1`) on the version of Q-Chem behind the free server, the timing of the
largest jobs against the 10-minute limit (Ex6, Ex9, Ex10), and the IQmol menu names
in `guides/` (then add screenshots). Also run `downloads/extract_ex07.py` on a folder of real Ex7 outputs
from IQmol to confirm it finds and reads them (it was tested only on fake outputs).
