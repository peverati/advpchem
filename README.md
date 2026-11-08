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

1. **Publish the site** (GitHub Pages):
   ```bash
   gh repo create advpchem-lab --public --source . --push
   quarto publish gh-pages
   ```
   Then replace `OWNER/REPO` in `_quarto.yml` (`colab-base`) so the "Open in Colab"
   badges point at the notebooks in the repository.
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

## Pilot status

- **Fully interactive:** Experiments 1, 2 and 3.
- **Text, 3D molecules (and Q-Chem inputs for 4–6):** Experiments 4–10. Next step:
  write predictions/quiz/questions in their JSON and add the special widgets
  (D4 toggle, error-cancellation view, grid explorer, stability landscape, method-card builder).
- **To verify with a real IQmol job:** the Q-Chem keywords used by the input
  generator (`DFT_D D4`, `METHOD B97M-rV`, `METHOD SPW92`, `ECP def2-ECP`,
  `XC_GRID`, `INTERNAL_STABILITY`) on the version of Q-Chem behind the free server,
  and the IQmol menu names in `guides/` (then add screenshots).
