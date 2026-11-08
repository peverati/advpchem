#!/usr/bin/env python3
"""Add the interactive content (quiz, predictions, questions, explorers) to the
data files of Experiments 4-10. Run once from lab-site/; afterwards edit the
JSON files directly. Species and reactions already in the files are kept."""
import json
import pathlib

D = pathlib.Path(__file__).resolve().parents[1] / "data" / "experiments"
load = lambda i: json.loads((D / f"{i}.json").read_text())
def save(e):
    (D / f"{e['id']}.json").write_text(json.dumps(e, indent=1, ensure_ascii=False) + "\n")

# How each Experiment 3-5 method treats dispersion (for the Ex4 dimer chart).
DISP = {"PBE-D4": "D4", "B3LYP-D4": "D4", "B97M-rV": "VV10 (nonlocal)", "wB97M-V": "VV10 (nonlocal)",
        "M06-2X": "fitted (Minnesota)", "M11": "fitted (Minnesota)", "MN15": "fitted (Minnesota)"}
ex3 = load("ex03")
METHODS = [dict(m, disp=DISP.get(m["id"], "none")) for m in ex3["methods"]]
ex3["methods"] = METHODS
save(ex3)
LABELS = [m["label"] for m in METHODS]
TZ = {"id": "def2-TZVP", "family": "Ahlrichs def2", "zeta": 3}

# ------------------------------------------------------------------ Ex4 ----
e = load("ex04")
e.update(methods=METHODS, bases=[TZ], fields=["energy", "scf", "time"], dimers=["4c", "4d"])
e["quiz"] = [
    {"q": "In the Diels–Alder reaction (4a) two π bonds become two new σ bonds. Why is error cancellation likely to be *worse* here than for the ethane rotation of Experiment 3?",
     "options": ["The bonding changes a lot between reactants and product, so errors in describing each bond type no longer cancel",
                 "The molecules are larger, so the basis set is incomplete", "Diels–Alder reactions are spin-forbidden", "The reference value is less accurate"],
     "answer": 0, "explain": "Error cancellation works best when reactants and products are chemically similar. Turning π bonds into σ bonds changes the electron density substantially, so each functional's systematic errors don't cancel."},
    {"q": "What holds the ethane dimer (4c) together?",
     "options": ["A hydrogen bond", "London dispersion", "A weak covalent bond", "Attraction between permanent charges"],
     "answer": 1, "explain": "Ethane has no dipole and no hydrogen-bond donors or acceptors. The ~1.3 kcal/mol of binding is almost entirely dispersion: correlated fluctuations of the electron clouds."},
    {"q": "Many older functionals (e.g. B3LYP, PBE) miss most of the dispersion energy. For a dispersion-bound dimer they typically predict binding that is…",
     "options": ["too weak, or even repulsive", "about right, because errors cancel", "too strong"],
     "answer": 0, "explain": "Semilocal and hybrid functionals depend on the density at (or near) each point, so they cannot describe the long-range correlation behind dispersion. Corrections such as D4 or nonlocal VV10 add it back."},
    {"q": "Branched alkanes are slightly more stable than their linear isomers. What sign do you expect for ΔE of *n*-hexane → neohexane (4b)?",
     "options": ["negative", "positive", "zero"], "answer": 0,
     "explain": "The product (neohexane) is lower in energy, so ΔE = Σ νᵢEᵢ < 0. Getting this small difference right is surprisingly hard for many functionals: it is partly a medium-range dispersion effect."},
]
e["predictions"] = [
    {"id": "b3lyp_dimer", "prompt": "For the ethane dimer (4c), **B3LYP without D4** will…",
     "options": ["bind too weakly (or not at all)", "bind about right", "bind too strongly"],
     "check": {"type": "errsign", "method": "B3LYP", "reaction": "4c", "tol": 0.3, "labels": ["bind too weakly (or not at all)", "bind about right", "bind too strongly"]}},
    {"id": "d4", "prompt": "Over all four reactions, adding **-D4** to B3LYP will make the mean absolute error…",
     "options": ["clearly smaller", "about the same", "clearly larger"], "check": {"type": "pair", "a": "B3LYP", "b": "B3LYP-D4"}},
    {"id": "isomer", "prompt": "Which method will be **most accurate for the alkane isomerization** (4b)?", "options": LABELS,
     "check": {"type": "best", "reaction": "4b"}},
    {"id": "worst", "prompt": "Which method will have the **largest mean absolute error** overall?", "options": LABELS, "check": {"type": "worst"}},
    {"id": "harder", "prompt": "Compared with Experiment 3, the typical error in this experiment will be…",
     "options": ["smaller", "similar", "much larger"],
     "check": {"type": "vs_previous", "exps": ["ex03"], "labels": ["smaller", "similar", "much larger"]},
     "pending": "Your data will answer this once this table is complete (it also needs your Experiment 3 results in this browser)."},
]
e["questions"] = [
    {"id": "q1", "text": "Which method has the most negative signed error? Which has the most positive?"},
    {"id": "q2", "text": "Which method is the best performer for each reaction? Which is the best overall?"},
    {"id": "q3", "text": "Are there methods that perform badly for these reactions? Compare with what you saw in Experiment 3: did the ranking change?"},
    {"id": "q4", "text": "Using the time per SCF cycle, compare B3LYP with the other hybrid functionals and with HF."},
    {"id": "q5", "text": "Do the functionals with **-D4** perform better than the uncorrected ones? Use the D4 chart: for which reactions does -D4 matter most, and why those?"},
    {"id": "q6", "text": "Look at the dimer chart. Which way of treating dispersion (none, D4, VV10, fitted) works best for the dispersion-bound ethane dimer? Is the same true for the hydrogen-bonded methanol dimer? Why might they differ?"},
    {"id": "q7", "text": "Compare your results with the predictions you locked in. Which one surprised you most?"},
]
e["explore"] = ["signed-errors", "d4-pairs", "dispersion-dimers", "cost-accuracy"]
save(e)

# ------------------------------------------------------------------ Ex5 ----
e = load("ex05")
e.update(methods=METHODS, bases=[TZ], fields=["energy", "scf", "time"], spotlight={"reaction": "5b", "method": "MN15"})
e["quiz"] = [
    {"q": "The atomization energy of H₂SO₄ is about 600 kcal/mol. An error of 6 kcal/mol is therefore about…",
     "options": ["0.01 %", "1 %", "10 %", "100 %"], "answer": 1,
     "explain": "6/600 = 1 %. Large reaction energies can carry large absolute errors even when the relative error looks small, and chemistry is decided by absolute energies."},
    {"q": "Which species in this experiment are **open-shell** (unpaired electrons)?",
     "options": ["Only the H atom", "The O and S atoms (triplets), the H atom (doublet) and O₂ (triplet)", "Ozone and the primary ozonide", "None of them"], "answer": 1,
     "explain": "Atoms with partly filled p shells are high-spin in their ground state, and O₂ is the classic triplet molecule. Running them as singlets gives a converged, perfectly wrong energy."},
    {"q": "Ozone (O₃) is notoriously difficult for DFT. Why?",
     "options": ["It is too large for def2-TZVP", "Its electronic structure has significant multireference (static-correlation) character",
                 "It contains a transition metal", "No reference value is available"], "answer": 1,
     "explain": "Ozone's ground state is not well described by a single Slater determinant (it has partial diradical character). Single-determinant Kohn–Sham DFT with approximate functionals struggles with such systems."},
    {"q": "CaO is part of the database MN15 was fitted to. What does that mean for MN15's result on reaction 5b?",
     "options": ["It is an independent test of MN15", "MN15's parameters were adjusted (among many other data) to reproduce this value, so good agreement is expected, not impressive",
                 "MN15 cannot be used for CaO", "The reference value was computed with MN15"], "answer": 1,
     "explain": "Training-set data are not a fair test. To judge a functional, look at systems it was not fitted to."},
]
e["predictions"] = [
    {"id": "harder", "prompt": "Compared with Experiments 3 and 4, the typical error here will be…", "options": ["smaller", "similar", "much larger"],
     "check": {"type": "vs_previous", "exps": ["ex03", "ex04"], "labels": ["smaller", "similar", "much larger"]},
     "pending": "Your data will answer this once this table is complete (it also needs your Experiment 3 and 4 results in this browser)."},
    {"id": "best", "prompt": "Which method will have the **smallest mean absolute error** here?", "options": LABELS, "check": {"type": "best"}},
    {"id": "worst", "prompt": "Which method will have the **largest mean absolute error**?", "options": LABELS, "check": {"type": "worst"}},
    {"id": "d4", "prompt": "For these reactions, -D4 (on B3LYP and PBE) will…", "options": ["help a lot", "barely matter", "make things worse"],
     "check": {"type": "pair", "a": "B3LYP", "b": "B3LYP-D4", "tol": 0.5, "labels": ["help a lot", "barely matter", "make things worse"]}},
]
e["questions"] = [
    {"id": "q1", "text": "Which method has the most negative signed error? Which has the most positive?"},
    {"id": "q2", "text": "Which method is the best performer for each reaction? Which is the best overall?"},
    {"id": "q3", "text": "Are there methods that perform badly for these reactions? Look at the relative-error chart: is a 10 kcal/mol error on reaction 5c “worse” than a 2 kcal/mol error on 5a?"},
    {"id": "q4", "text": "Using the time per SCF cycle, is B3LYP faster than the other functionals and methods?"},
    {"id": "q5", "text": "Do the -D4-corrected functionals perform better or worse than the uncorrected ones here? Why is D4 not a universal fix?"},
    {"id": "q6", "text": "Look at the CaO spotlight. Why should a functional's good result on a molecule from its own training set be treated with caution?"},
    {"id": "q7", "text": "**Looking back at Experiments 3–5** (use the “easy → hard” chart): which method is the best overall performer? Which is the worst? How did your functional-draft pick do?"},
    {"id": "q8", "text": "Overall, does adding -D4 help? For which reactions?"},
]
e["explore"] = ["signed-errors", "relative-errors", "cao-spotlight", "difficulty-ladder", "cost-accuracy"]
save(e)

# ------------------------------------------------------------------ Ex6 ----
e = load("ex06")
GROUP = {"3": "Exp. 3 · easy", "4": "Exp. 4 · medium", "5": "Exp. 5 · hard"}
for r in e["reactions"]:
    r["group"] = GROUP[r["id"][0]]
e["methods"] = [m for m in METHODS if m["id"] in ("B3LYP", "B3LYP-D4")]
e["bases"] = [{"id": "6-31G*", "family": "Pople", "zeta": 2}, {"id": "def2-SVP", "family": "Ahlrichs def2", "zeta": 2},
              {"id": "cc-pVDZ", "family": "Dunning cc", "zeta": 2}, {"id": "pc-1", "family": "Jensen pc", "zeta": 2}, TZ]
e.update(fields=["energy", "nbf"], auto_delta=True, condition_label="Method / basis", anomaly={"reference": "def2-TZVP"},
         **{"import": {"from": ["ex03", "ex04", "ex05"], "conditions": ["B3LYP|def2-TZVP", "B3LYP-D4|def2-TZVP"],
                       "label": "⬇ Import my def2-TZVP energies from Experiments 3–5"}})
e["quiz"] = [
    {"q": "What does the * in 6-31G* mean?", "options": ["Diffuse functions on all atoms", "d-type polarization functions on the non-hydrogen atoms", "An extra s function on hydrogen", "It is a triple-ζ basis"], "answer": 1,
     "explain": "6-31G* (also written 6-31G(d)) adds one set of d functions to every non-hydrogen atom, letting the electron density polarize in bonds."},
    {"q": "6-31G*, def2-SVP, cc-pVDZ and pc-1 are all…", "options": ["triple-ζ basis sets", "polarized double-ζ basis sets", "minimal basis sets", "basis sets with diffuse functions"], "answer": 1,
     "explain": "All four use two functions per valence orbital plus polarization functions, but they were optimized in different ways, so their sizes and behavior differ."},
    {"q": "If a small basis gives a *smaller* error than a large basis with the same functional, the most likely explanation is…",
     "options": ["the small basis is more accurate", "a fortuitous cancellation between the basis-set error and the functional's own error", "the large basis set is broken", "the reference values are wrong"], "answer": 1,
     "explain": "The basis-set error and the functional error have different origins. When they happen to have opposite signs they cancel, which is luck, not accuracy, and it won't transfer to other problems."},
]
e["predictions"] = [
    {"id": "best_dz", "prompt": "Which double-ζ basis will give **B3LYP** the smallest error over all 12 reactions?", "options": ["6-31G*", "def2-SVP", "cc-pVDZ", "pc-1"],
     "check": {"type": "best_basis", "method": "B3LYP", "bases": ["6-31G*", "def2-SVP", "cc-pVDZ", "pc-1"]}},
    {"id": "anomaly", "prompt": "Will **B3LYP/6-31G*** beat B3LYP/def2-TZVP for the reactions of at least one experiment (3, 4 or 5)?", "options": ["yes", "no"],
     "check": {"type": "anomaly_any", "method": "B3LYP", "small": "6-31G*", "large": "def2-TZVP", "labels": ["yes", "no"]}},
    {"id": "d4", "prompt": "With the double-ζ basis sets, adding -D4 to B3LYP will…", "options": ["help", "barely matter", "hurt"],
     "check": {"type": "pair", "a": "B3LYP", "b": "B3LYP-D4", "bases": ["6-31G*", "def2-SVP", "cc-pVDZ", "pc-1"], "tol": 0.2, "labels": ["help", "barely matter", "hurt"]}},
]
e["questions"] = [
    {"id": "q1", "text": "Choose one molecule (use the basis-size table). How many basis functions does it have with each basis set? Are all “double-ζ” sets the same size?"},
    {"id": "q2", "text": "Which basis set gives the smallest absolute errors for the reactions of Experiment 3? Of Experiment 4? Of Experiment 5? Overall?"},
    {"id": "q3", "text": "What happens with **B3LYP-D4** and the small basis sets? Do the results improve?"},
    {"id": "q4", "text": "Optional: try one other functional with 6-31G* on a few reactions. Do you see the same trends?"},
    {"id": "q5", "text": "Compare B3LYP/def2-TZVP with B3LYP/6-31G*, and B3LYP-D4/def2-TZVP with B3LYP-D4/6-31G*. Which cells did you flag in “Spot the anomaly”, which were real, and why should they worry you?"},
]
e["explore"] = ["basis-mae", "anomaly-spotter", "nbf-counter"]
save(e)

# ------------------------------------------------------------------ Ex7 ----
e = load("ex07")
REF = [2.24, 1.21, 0.57, 0.18, -0.06, -0.19, -0.26, -0.28, -0.28, -0.27, -0.25, -0.23, -0.21, -0.18, -0.16, -0.14, -0.13,
       -0.11, -0.10, -0.09, -0.08, -0.07, -0.06, -0.05, -0.05, -0.04, -0.04, -0.03, -0.03, -0.03, -0.02]
e["reactions"] = [{"id": f"{3.0 + 0.1 * i:.1f}", "label": f"r = {3.0 + 0.1 * i:.1f} Å", "nu": {f"ar2_{3.0 + 0.1 * i:.1f}": 1, "ar": -2}, "ref": REF[i]} for i in range(31)]
e["methods"] = [
    {"id": "B3LYP", "label": "B3LYP", "rung": "hybrid GGA", "rem": {"METHOD": "B3LYP"}},
    {"id": "M06-L", "label": "M06-L", "rung": "meta-GGA", "rem": {"METHOD": "M06-L"}},
    {"id": "M11-L", "label": "M11-L", "rung": "meta-GGA", "rem": {"METHOD": "M11-L"}},
    {"id": "M11", "label": "M11", "rung": "hybrid meta-GGA", "rem": {"METHOD": "M11"}},
    {"id": "wB97M-V", "label": "ωB97M-V", "rung": "hybrid meta-GGA", "rem": {"METHOD": "wB97M-V"}},
]
e["bases"] = [{"id": f"SG-{g}", "label": f"SG-{g}", "zeta": 4, "rem": {"BASIS": "def2-QZVP", "XC_GRID": str(g)}} for g in (1, 2, 3)]
e.update(fields=["energy", "scf", "time"], auto_delta=True, explore_table=False, condition_label="Functional / grid")
e["quiz"] = [
    {"q": "What is the integration grid used for in Kohn–Sham DFT?", "options": ["To place the basis functions", "To evaluate the exchange–correlation energy numerically, as a weighted sum over points in space", "To optimize the geometry", "To compute the Hartree–Fock exchange"], "answer": 1,
     "explain": "For almost every functional, the xc energy has no analytic integral over Gaussian basis functions, so it is computed numerically on a grid of points around each atom."},
    {"q": "A (99,590) grid has…", "options": ["99 atoms and 590 basis functions", "99 radial shells around each atom, each with 590 angular points", "590 radial shells with 99 points each", "99 × 590 basis functions"], "answer": 1,
     "explain": "So about 58,000 points per atom before pruning. Use the grid explorer below to see what that looks like."},
    {"q": "Why can a coarse grid put wiggles into a dissociation curve?", "options": ["The grid points move with the atoms, so the numerical integration error changes erratically as the distance changes", "The basis set is too small", "Argon is a transition metal", "The SCF did not converge"], "answer": 0,
     "explain": "The error of a numerical integration depends on how the density happens to fall on the points. When the atoms move, that changes from one geometry to the next, adding noise. A tiny binding energy (0.28 kcal/mol here) makes the noise obvious."},
    {"q": "Which kind of functional is usually the most sensitive to the grid?", "options": ["LSDA", "GGA", "meta-GGA (especially heavily parametrized ones)", "Hartree–Fock"], "answer": 2,
     "explain": "Meta-GGAs depend on the kinetic-energy density τ, which varies rapidly, and parametrized forms can amplify integration noise. HF needs no xc grid at all."},
]
e["predictions"] = [
    {"id": "sensitive", "prompt": "Which functional will be **most sensitive to the grid** (largest change from SG-1 to SG-3)?", "options": [m["label"] for m in e["methods"]],
     "check": {"type": "grid_sensitivity", "from": "SG-1", "to": "SG-3"}},
    {"id": "smooth", "prompt": "With **SG-3**, will every functional give a smooth curve with a single minimum?", "options": ["yes", "no"],
     "check": {"type": "smooth", "basis": "SG-3", "labels": ["yes", "no"]}},
    {"id": "cost", "prompt": "How much longer will an **SG-3** job take than the same job with **SG-1**?", "options": ["less than 1.5×", "1.5–3×", "more than 3×"],
     "check": {"type": "time_ratio", "from": "SG-1", "to": "SG-3", "labels": ["less than 1.5×", "1.5–3×", "more than 3×"]}},
    {"id": "hf", "prompt": "Would a Hartree–Fock curve depend on the grid?", "options": ["yes", "no"], "check": {"type": "none"},
     "note": "Not computed here. Answer it in question 7, after you've seen what the grid is used for."},
]
e["questions"] = [
    {"id": "q1", "text": "Can you find any problematic functionals? Use the wiggle report."},
    {"id": "q2", "text": "Why do you see several minima and maxima in some curves? Are they physical? (Think about what the grid explorer shows.)"},
    {"id": "q3", "text": "Compare the smallest and the largest grid. Which functionals are well converged with respect to the grid?"},
    {"id": "q4", "text": "What are the minimum grid requirements for each functional you tested?"},
    {"id": "q5", "text": "Use the timing chart: how noticeable is the time increase with the grid size? Is it worth it?"},
    {"id": "q6", "text": "Given your results, which grid(s) would you recommend, and for which kinds of functionals?"},
    {"id": "q7", "text": "Does the HF method suffer from this problem? Why or why not?"},
]
e["explore"] = ["ar2-curves", "grid-wiggles", "grid-timing"]
save(e)

# ------------------------------------------------------------------ Ex8 ----
e = load("ex08")
def m(id, label, rung):
    return {"id": id, "label": label, "rung": rung, "rem": {"METHOD": id}}
e["methods"] = [m("SPW92", "SPW92", "LSDA"), m("BP86", "BP86", "GGA"), m("PBE", "PBE", "GGA"), m("SCAN", "SCAN", "meta-GGA"),
                m("B97M-V", "B97M-V", "meta-GGA"), m("B3LYP", "B3LYP", "hybrid GGA"), m("PBE0", "PBE0", "hybrid GGA"),
                m("M06-2X", "M06-2X", "hybrid meta-GGA"), {"id": "wB97M-V", "label": "ωB97M-V", "rung": "hybrid meta-GGA", "rem": {"METHOD": "wB97M-V"}},
                m("HF", "HF", "Hartree–Fock")]
e["bases"] = [{"id": "plain", "label": "without stability analysis", "zeta": 3, "rem": {"BASIS": "def2-TZVP"}},
              {"id": "stab", "label": "with stability analysis", "zeta": 3, "rem": {"BASIS": "def2-TZVP", "INTERNAL_STABILITY": "TRUE"}}]
e["reactions"] = [{"id": "Fe", "label": "Fe: quintet → triplet", "nu": {"fe_gs": -1, "fe_es": 1}, "ref": 34.32},
                  {"id": "Ru+", "label": "Ru⁺: quartet → sextet", "nu": {"ru_gs": -1, "ru_es": 1}, "ref": 21.96}]
e.update(fields=["energy", "scf", "time"], condition_label="Method / run")
e["quiz"] = [
    {"q": "A converged SCF solution is guaranteed to be…", "options": ["the ground state", "a stationary point: a minimum, a saddle point or a maximum", "a minimum, but maybe not the lowest one", "an excited state"], "answer": 1,
     "explain": "Convergence only means the energy gradient with respect to orbital rotations is zero. Only the second derivatives tell you whether you are at a minimum."},
    {"q": "Which systems are most likely to end up on an unstable SCF solution?", "options": ["Closed-shell organic molecules", "Systems with nearly degenerate low-lying states, such as transition-metal atoms", "Noble-gas atoms", "Any molecule with a large basis set"], "answer": 1,
     "explain": "When several electronic configurations are close in energy, the SCF can easily converge to the wrong one. Fe and Ru⁺ have nearly degenerate 3d/4s (4d/5s) configurations."},
    {"q": "The excitation energy here is E(excited) − E(ground). If only the ground-state SCF lands on a higher, unstable solution, the computed excitation energy will be…", "options": ["too large", "too small", "unaffected"], "answer": 1,
     "explain": "A ground-state energy that is too high shrinks the gap. If both states are affected, the error can go either way, which is why you must check every state."},
    {"q": "What does Q-Chem's `INTERNAL_STABILITY` keyword do?", "options": ["Optimizes the geometry", "Checks the second derivatives of the energy with respect to orbital rotations to see whether a lower solution exists", "Adds a dispersion correction", "Makes the SCF converge faster"], "answer": 1,
     "explain": "A negative eigenvalue of this electronic Hessian means the solution is not a minimum: moving the orbitals along that direction lowers the energy."},
]
e["predictions"] = [
    {"id": "changes", "prompt": "Will stability analysis find a lower solution for **at least one** functional and state?", "options": ["yes", "no"],
     "check": {"type": "stability_changes", "plain": "plain", "stab": "stab", "labels": ["yes", "no"]}},
    {"id": "harder", "prompt": "Which excitation energy will be harder for DFT (larger errors, with stability analysis)?", "options": ["Fe", "Ru⁺", "about the same"],
     "check": {"type": "harder", "basis": "stab", "reactions": ["Fe", "Ru+"], "labels": ["Fe", "Ru⁺", "about the same"]}},
    {"id": "hf", "prompt": "Hartree–Fock favors high-spin states (it has exact exchange but no correlation). For Fe (high-spin ground state) HF will make the excitation energy…",
     "options": ["too large", "about right", "too small"],
     "check": {"type": "errsign", "method": "HF", "basis": "stab", "reaction": "Fe", "tol": 2, "labels": ["too large", "about right", "too small"]}},
]
e["questions"] = [
    {"id": "q1", "text": "Compare the errors with and without stability analysis. Do you need the stability analysis here? Use the energy-lowering table to say for which functionals and states it changed something, and by how much."},
    {"id": "q2", "text": "How does HF perform? Why do you think it performs this way?"},
    {"id": "q3", "text": "Use the stability landscape: explain in your own words what the stability analysis does, and why a *converged* SCF can still be wrong."},
    {"id": "q4", "text": "Which functional would you recommend for these atoms? Justify with your numbers."},
]
e["explore"] = ["stability-lowering", "signed-errors"]
save(e)

# ------------------------------------------------------------------ Ex9 ----
e = load("ex09")
e["rem_common"] = {"JOBTYPE": "SP", "SCF_CONVERGENCE": "8", "INTERNAL_STABILITY": "TRUE", "XC_GRID": "000099000590"}
e["methods"] = [{"id": "MN15-L", "label": "MN15-L", "rung": "meta-GGA", "rem": {"METHOD": "MN15-L"}},
                {"id": "MN15", "label": "MN15", "rung": "hybrid meta-GGA", "rem": {"METHOD": "MN15"}},
                {"id": "B3LYP", "label": "B3LYP", "rung": "hybrid GGA", "rem": {"METHOD": "B3LYP"}},
                {"id": "PBE", "label": "PBE", "rung": "GGA", "rem": {"METHOD": "PBE"}},
                {"id": "HF", "label": "HF", "rung": "Hartree–Fock", "rem": {"METHOD": "HF"}}]
e["bases"] = [TZ, {"id": "6-31G*", "family": "Pople", "zeta": 2}]
e["conditions"] = [{"method": mm["id"], "basis": "def2-TZVP"} for mm in e["methods"]] + [{"method": "B3LYP", "basis": "6-31G*", "species": ["tbuoh", "tbu", "oh"]}]
BD, AT = "bond dissociation", "atomization (W4-11)"
e["reactions"] = [
    {"id": "tBuOH", "label": "(CH₃)₃C–OH → (CH₃)₃C· + ·OH", "nu": {"tbuoh": -1, "tbu": 1, "oh": 1}, "ref": 115.02, "group": BD},
    {"id": "FeCl", "label": "FeCl → Fe + Cl", "nu": {"fecl": -1, "fe": 1, "cl": 1}, "ref": 78.5, "group": BD},
    {"id": "H2", "label": "H₂ → 2 H", "nu": {"h2": -1, "h": 2}, "ref": 109.5, "group": AT},
    {"id": "CH4", "label": "CH₄ → C + 4 H", "nu": {"ch4": -1, "c": 1, "h": 4}, "ref": 420.4, "group": AT},
    {"id": "NH3", "label": "NH₃ → N + 3 H", "nu": {"nh3": -1, "n": 1, "h": 3}, "ref": 298.0, "group": AT},
    {"id": "H2O", "label": "H₂O → O + 2 H", "nu": {"h2o": -1, "o": 1, "h": 2}, "ref": 233.0, "group": AT},
    {"id": "O3", "label": "O₃ → 3 O", "nu": {"o3": -1, "o": 3}, "ref": 147.4, "group": AT},
]
e.update(fields=["energy", "scf", "time"], condition_label="Method / basis", nist={"reference": 78.5})
e["quiz"] = [
    {"q": "A total atomization energy is the energy needed to…", "options": ["break one bond", "break a molecule into all of its separate ground-state atoms", "form the molecule from the elements in their standard states", "ionize the molecule"], "answer": 1,
     "explain": "For H₂ it is the same as the bond dissociation energy. For CH₄ it is the sum of all four C–H bond energies, so atomization energies are large numbers."},
    {"q": "Why is Hartree–Fock expected to do badly for atomization energies?", "options": ["It has no electron correlation, and correlation is larger in the molecule than in the separated atoms, so bonds come out too weak", "It is too expensive", "It cannot describe open-shell atoms at all", "It overestimates every bond"], "answer": 0,
     "explain": "Bringing electrons together into bonds increases the correlation energy, which HF leaves out entirely. The missing correlation is bigger for the molecule, so HF underbinds."},
    {"q": "The computed ΔE is an electronic energy at fixed nuclei. An experimental bond enthalpy at 298 K also includes…", "options": ["nothing else; they are the same", "zero-point vibrational energy and thermal energy, plus spin–orbit effects for atoms with orbital angular momentum", "only the basis-set error", "relativistic effects only"], "answer": 1,
     "explain": "Going from experiment to the purely electronic value needs several corrections, which is why direct comparisons need care."},
    {"q": "Which of these species is a radical?", "options": ["*tert*-butyl alcohol", "the OH fragment", "methane", "water"], "answer": 1,
     "explain": "Breaking the C–O bond homolytically leaves one unpaired electron on each fragment: two radicals (doublets)."},
]
LBL = [mm["label"] for mm in e["methods"]]
e["predictions"] = [
    {"id": "hf_at", "prompt": "Hartree–Fock will make the **atomization energies**…", "options": ["too small", "about right", "too large"],
     "check": {"type": "errsign", "method": "HF", "basis": "def2-TZVP", "group": AT, "tol": 5, "labels": ["too large", "about right", "too small"]}},
    {"id": "best_at", "prompt": "Which method will be **best for the atomization energies**?", "options": LBL, "check": {"type": "best", "basis": "def2-TZVP", "group": AT}},
    {"id": "best_bd", "prompt": "Which method will be **best for the two bond dissociations**?", "options": LBL, "check": {"type": "best", "basis": "def2-TZVP", "group": BD}},
    {"id": "pople", "prompt": "For the C–O bond of *tert*-butyl alcohol, which will be closer to the reference?", "options": ["B3LYP/6-31G*", "B3LYP/def2-TZVP", "about the same"],
     "check": {"type": "compare_abs", "reaction": "tBuOH", "a": "B3LYP|6-31G*", "b": "B3LYP|def2-TZVP", "labels": ["B3LYP/6-31G*", "B3LYP/def2-TZVP", "about the same"]}},
]
e["questions"] = [
    {"id": "q1", "text": "**tert-Butyl alcohol.** Which functional is the best? Which is the worst? How does HF perform? Are you surprised?"},
    {"id": "q2", "text": "Compare B3LYP/6-31G* with B3LYP/def2-TZVP for the C–O bond. Do you see an improvement? Where do you think it comes from? (Think back to Experiment 6.)"},
    {"id": "q3", "text": "**FeCl.** Which functional performs best? How does HF perform?"},
    {"id": "q4", "text": "Use the NIST panel: what experimental bond enthalpy did you get, how does it differ from the reference electronic energy, and which corrections explain the difference? Can you compare theory and experiment directly?"},
    {"id": "q5", "text": "**Atomization energies.** Which functional is the best? Which is the worst? What causes the failure of HF?"},
    {"id": "q6", "text": "Do you see the same trends for bond dissociation and atomization reactions?"},
    {"id": "q7", "text": "Can you compare an atomization energy directly with a substance's enthalpy of formation? Why or why not?"},
]
e["explore"] = ["signed-errors", "relative-errors"]
save(e)

# ----------------------------------------------------------------- Ex10 ----
e = load("ex10")
e["methods"] = [{"id": "custom", "label": "your method", "rung": "your choice", "rem": {}}]
e["bases"] = [{"id": "custom", "label": "your basis", "zeta": 3}]
e.update(fields=["energy", "scf", "time"])
e["quiz"] = [
    {"q": "With the def2 basis sets, how are palladium's inner (core) electrons described?", "options": ["Explicitly, with all 46 electrons", "By an effective core potential (ECP) that replaces 28 core electrons", "They are ignored", "By a minimal basis"], "answer": 1,
     "explain": "For elements beyond Kr, the def2 basis sets come with an ECP that replaces the core and includes scalar-relativistic effects. Q-Chem needs ECP = def2-ECP."},
    {"q": "This reaction breaks the bond between Pd and a large π ligand. Which effect from earlier experiments is likely to matter a lot?", "options": ["Dispersion (Experiment 4)", "Spin–orbit coupling", "Grid errors only", "None: it's a simple bond"], "answer": 0,
     "explain": "Large, polarizable ligands bound to a metal have substantial dispersion contributions. Uncorrected functionals typically underbind."},
    {"q": "Your job is killed at the 10-minute limit. The most sensible next step is…", "options": ["Give up on DFT", "Use a smaller basis or a cheaper setting, and say in your report how this limits the accuracy", "Submit the same job again", "Remove the hydrogen atoms"], "answer": 1,
     "explain": "Every real calculation is a compromise between accuracy and cost. State the compromise you made and its likely consequences: that's part of a good report."},
]
e["predictions"] = [
    {"id": "guess", "prompt": "Before you compute: what bond dissociation energy do you expect for your method?", "options": ["below 10 kcal/mol", "10–20 kcal/mol", "20–30 kcal/mol", "above 30 kcal/mol"],
     "check": {"type": "range", "reaction": "10", "bins": [10, 20, 30], "labels": ["below 10 kcal/mol", "10–20 kcal/mol", "20–30 kcal/mol", "above 30 kcal/mol"]}},
    {"id": "accuracy", "prompt": "Will your method land within chemical accuracy (±1 kcal/mol) of the reference?", "options": ["yes", "no"], "check": {"type": "none"},
     "note": "Check the result card in “Explore your data”."},
]
e["questions"] = [
    {"id": "report", "type": "report", "words": 300, "text": "Write your report (**about 300 words**): title, the method you chose and why (with references), the complete computational setup, your result compared with the reference value of 16.20 kcal/mol, and a short conclusion."},
    {"id": "q2", "text": "If you had ten times more computer time, what would you change in your calculation, and why?"},
]
e["explore"] = ["result-card"]
e["explore_table"] = False
save(e)
print("updated ex03 ex04 ex05 ex06 ex07 ex08 ex09 ex10")
