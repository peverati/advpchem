# Corrections applied to the original handouts

Every change made while converting `Ex1.docx` … `Ex10.docx` into the website.
The four open questions were settled by the instructor in November 2026.

## Applied everywhere

- **-D3 → -D4.** The -D4 functionals are now cited to the D4 papers
  (Caldeweyher 2017, 2019) instead of the 2011 D3(BJ) paper. Ex4's last question
  and Ex5's practice comment said "-D3"; Ex6 asked for B3LYP-D3(BJ). All now use -D4.
- **Experiment numbering inherited from the review article.** Reactions and
  figures are now numbered per experiment: 3a–3d, 4a–4d, 5a–5d. The labels inside
  the three reaction figures were redrawn to match. Fixed cross-references:
  - Ex3 "In this first experiment", "Figure 1 … Experiment 1", and "after Experiment 3" (now Experiment 5).
  - Ex4 "In this second experiment", "Figure 2 … Experiment 2", "Similarly to Experiment 1".
  - Ex5 "Figure 3 … Experiment 3", "Overall Problems for Experiments 1–3" (now 3–5), "these first three experiments".
  - Ex6 tip: "Experiment 2 / Experiment 3" (now 4 / 5).
  - Ex9 "reaction 3c in Experiment 3" (now 5c in Experiment 5).
  - Ex1 "Scheme 1 The reaction studied in Experiments 1 and 2" (Ex2 has no calculations).
- **References.** One shared `references.bib` with per-page numbering, instead of global
  numbers that started at 4 and jumped to 166. Fixes in the reference list:
  Koch & Holthausen entry was truncated ("200" → 2001); Wheeler & Houk is 2010, not 2009;
  Manna & Martin is 2016, not 2015; *J. Mol. Catal. A: Chem.*; "J. Chem. Theory. Comput.,"
  typo; Becke 2014 page "18A301–19"; capitalization of Van Voorhis. Added the rVV10 paper for
  B97M-rV (Mardirossian et al. 2017), which was cited only with the B97M-V and VV10 papers. The
  Q-Chem 5.2 manual note (accessed 2020) now points to the current manual without quoting
  version-specific default grids.
- **Plain-text references that never appeared in a bibliography.** Ex2 "refs. 6, 14, 15 or 16"
  and Ex8 "ref. 145" / "refs. 145–147" are now real citations.
- **ω and ε characters.** These were stored in the Symbol font in Word. They are now real Unicode.

## Per experiment

**Ex1**
- Subset name **NCCE23 → NCCE30**, to match the geometry files and the Minnesota 2015B subset name (confirmed).
- "doubleζ" → "double-ζ"; "excel sheet" → the results table on the page.
- The (HCl)₂ geometry used atomic numbers (17, 1) instead of element symbols; normalized.

**Ex2**
- "this notebook" → "this lab". The blank classification table became a self-checking exercise.

**Ex3**
- Timing table header said "Total time" but the question asks for time per SCF cycle; the site now computes time per cycle.
- B97M-rV → **B97M-V** in Experiments 3–5 (decided after Fall 2026: students run B97M-V, which IQmol offers and Experiment 8 already uses).

**Ex4**
- Text said "isomerization of **neohexane to hexane**"; figure and data say **n-hexane → neohexane** (ΔE = –2.49, branched isomer more stable). Text fixed.
- Caption said "formation of the **ethene** dimer"; the files (ADIM6 AD2/AM2), the text and the figure are the **ethane** dimer. Caption fixed.
- Last question: "-D3 corrections" → "-D4".

**Ex5**
- "-D3 correction for B3LYP and PBE" → "-D4".
- "The B97M-V and ωB97M-V approximations include VV10" is kept as written: B97M-V is the method used in Ex3–5.
- "-D4 corrections for the Minnesota functionals have been proposed [Goerigk 2011, 2015, 2017]": those papers are D3-era, so the sentence now says "dispersion corrections" without a version.
- H₂SO₄ subset **DC9 → SMAE3**, to match the geometry files (confirmed: DC9 was a typo).
- Reaction 5d is written explicitly as 2 O₃ → 3 O₂ (matches the figure and the −67.60 kcal/mol value).

**Ex6**
- Said "compare with the def2-QZVP results of Experiments 3–5", but those experiments used **def2-TZVP**. The comparison is now with the def2-TZVP results (def2-QZVP would not fit in the free server's 10-minute limit).
- "Ahrlichs" → Ahlrichs; B3LYP-D3(BJ) → B3LYP-D4.
- Fixed set of reactions instead of all 30 molecules / a free choice: **4a** (Diels–Alder), **4b** (*n*-hexane → neohexane) and **5b** (CaO → Ca + O). In the answer key (`Lab_Notebook_DetailedKey.RP.xlsx`, sheet *Experiment_7*), B3LYP/6-31G* is much better than def2-QZVP for 4a (2.45 vs 11.41 kcal/mol), about the same for 4b (3.64 vs 3.77) and far worse for 5b (55.07 vs 7.30); the D3(BJ) rows show the same three behaviours. The key has no def2-TZVP column, so the comparison on the page (def2-TZVP) should be checked against real runs.
- The basis-function question now uses a fixed molecule (cyclohexene), and the "try another functional" question a fixed one (ωB97M-V/6-31G\*).

**Ex7**
- Reference table: the 5.9 Å and 6.0 Å rows were merged into one cell; split (5.9 → –0.03, 6.0 → –0.02).
- Title "Integration Grids 1" → "Integration Grids" (there is no part 2).
- No geometries were provided; generated the 31 Ar₂ structures (3.0–6.0 Å) plus the Ar atom.
- Missing period; added the explicit Q-Chem grid keywords.
- Basis set **def2-QZVP → def2-TZVP**. In Fall 2026 the SG-2 jobs took 5–7 minutes with def2-QZVP and the SG-3 jobs often hit the free server's 10-minute limit. The grid comparison, which is the point of the experiment, is unchanged; the interaction energies carry a little more basis-set superposition error.

**Ex8**
- "second derivatives of the wave function" → second derivatives of the **energy** with respect to orbital rotations (electronic Hessian).
- Noted that Ru needs `ECP = def2-ECP`.
- Only functional/atom pairs that converged both without and with stability analysis in a recent student report (Fall 2026, Experiment 8 results): PBE (Fe and Ru⁺), BP86 and PBE0 (Ru⁺), M06-2X and B97M-V (Fe), 24 jobs. SPW92, B3LYP, SCAN, ωB97M-V and HF were removed because they failed to converge.

**Ex9**
- "SRTMBE17" → SR-TM-BE17; "Nist Webbook" → NIST Chemistry WebBook (linked).
- Practice comment: listed the usual corrections (ZPE, thermal, spin–orbit) between experimental and electronic values.
- Basis set **def2-QZVP → def2-TZVP**, so the *tert*-butanol jobs fit within the free server's 10-minute limit (same reasoning as Ex6). Revert in `data/experiments/ex09.json` and the page text if you have more computer time.
- Reactions labelled 9a/9b in the text; the atomization reactions are listed explicitly (H₂ → 2 H, CH₄ → C + 4 H, …).

**Ex10**
- The structures come from **PdBE2**; the geometry files (named `*_SR-TM-BE17.xyz`) were renamed `Pd_PH3_2-C6H8_PdBE2.xyz`, `Pd_PH3_2_PdBE2.xyz` and `C6H8_PdBE2.xyz`.
- Noted that Pd needs an ECP with def2 basis sets.

## Files

- Removed `__MACOSX/` junk from the zips; one consistent folder per experiment in `data/geometries/exNN/`.
- SMAE3 files wrote charge/multiplicity as `0, 2`; normalized to `0 2` (Q-Chem format).

## Naming

- "FIT" → "Florida Tech" everywhere students see it.
