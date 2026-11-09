#!/usr/bin/env python3
"""
Experiment 7 (Integration Grids): collect the results of your Q-Chem jobs.

What it does
    Looks at every Q-Chem output file in a folder (and its subfolders), works
    out which job each one is from what Q-Chem itself echoed (the functional,
    the grid and the Ar-Ar distance, NOT the file name), and reads:
      * the total energy ("Total energy in the final basis set")
      * the number of SCF cycles ("Convergence criterion met")
      * the wall time ("Total job time ... s(wall)")
    It writes everything to  ex07_results.csv  in that folder and prints a
    report: missing jobs, jobs that crashed or did not converge, duplicates.

How to run it (the same file works on macOS, Windows and Linux)
    macOS:    python3 extract_ex07.py  "path/to/your/outputs folder"
    Windows:  py extract_ex07.py  "path\\to\\your\\outputs folder"
    Without a folder, the script asks for one (you can drag the folder into
    the window).  It only READS your output files; it never changes them.

Needs Python 3.8 or newer, nothing else.  Advanced Physical Chemistry,
Florida Tech.
"""

import csv
import math
import os
import re
import sys

VERSION = "1.0"
CSV_NAME = "ex07_results.csv"

# What Experiment 7 asks for: 5 functionals x 3 grids x (Ar atom + 31 Ar2).
METHODS = {  # normalized Q-Chem name -> name used on the website
    "b3lyp": "B3LYP",
    "m06l": "M06-L",
    "m11l": "M11-L",
    "m11": "M11",
    "wb97mv": "wB97M-V",
}
GRIDS = {"1": "SG-1", "2": "SG-2", "3": "SG-3"}
BASIS = "def2-tzvp"
DISTANCES = [round(3.0 + 0.1 * i, 1) for i in range(31)]  # 3.0 ... 6.0
SPECIES = ["ar"] + ["ar2_%.1f" % d for d in DISTANCES]

# Files that are certainly not Q-Chem outputs (inputs, geometries, IQmol
# checkpoint files, archives, pictures, this script and its CSV).
SKIP_EXT = {
    ".in", ".inp", ".qcin", ".xyz", ".csv", ".py", ".json", ".zip", ".gz",
    ".fchk", ".chk", ".png", ".jpg", ".jpeg", ".pdf", ".docx", ".xlsx",
    ".iqmol", ".cube", ".dat", ".bin", ".npy", ".plots",
}
MAX_BYTES = 200 * 1024 * 1024
QCHEM_MARKERS = ("Welcome to Q-Chem", "Q-Chem, Inc.", "Thank you very much for using Q-Chem")

FLOAT = r"[-+]?\d+\.\d+(?:[eE][-+]?\d+)?"
RE_TOTAL = re.compile(r"Total energy in the final basis set\s*=\s*(" + FLOAT + ")")
RE_TOTAL_ALT = re.compile(r"^\s*Total energy\s*=\s*(" + FLOAT + ")", re.M)
RE_CONV = re.compile(r"^\s*(\d+)\s+" + FLOAT + r".*Convergence criterion met", re.M)
RE_WALL = re.compile(r"Total job time:\s*(" + FLOAT + r"|\d+)\s*s\s*\(wall\)")
RE_REM = re.compile(r"\$rem\b(.*?)\$end", re.S | re.I)
RE_MOL = re.compile(r"\$molecule\b(.*?)\$end", re.S | re.I)
RE_ORIENT = re.compile(r"Standard Nuclear Orientation.*?\n\s*-+\n(.*?)\n\s*-+", re.S)
RE_FAIL = re.compile(r"SCF failed to converge|Convergence failure|MAXIMUM NUMBER OF CYCLES", re.I)


def say(text=""):
    """print() that never crashes on old Windows consoles."""
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("ascii", "replace").decode("ascii"))


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def read_rem(text):
    """Keywords of the first $rem block Q-Chem echoed: {KEY: value}."""
    m = RE_REM.search(text)
    rem = {}
    if not m:
        return rem
    for line in m.group(1).splitlines():
        line = line.split("!")[0].replace("=", " ").strip()
        parts = line.split()
        if len(parts) >= 2:
            rem[parts[0].upper()] = parts[1]
    return rem


def read_atoms(text):
    """[(element, x, y, z)] in Angstrom, from the echoed $molecule block or,
    failing that, from the first 'Standard Nuclear Orientation' table."""
    m = RE_MOL.search(text)
    atoms = []
    if m:
        lines = [l.split() for l in m.group(1).strip().splitlines() if l.strip()]
        for parts in lines[1:]:  # first line: charge and multiplicity
            if len(parts) >= 4:
                try:
                    atoms.append((parts[0], float(parts[1]), float(parts[2]), float(parts[3])))
                except ValueError:
                    pass
    if atoms:
        return atoms
    m = RE_ORIENT.search(text)
    if m:
        for line in m.group(1).splitlines():
            parts = line.split()
            if len(parts) >= 5:
                try:
                    atoms.append((parts[1], float(parts[2]), float(parts[3]), float(parts[4])))
                except ValueError:
                    pass
    return atoms


def element(sym):
    """'Ar', 'AR', 'ar' or the atomic number 18 -> 'Ar'."""
    sym = sym.strip()
    if sym.isdigit():
        return "Ar" if sym == "18" else "Z" + sym
    return re.sub(r"[^A-Za-z]", "", sym).capitalize()


def identify_species(atoms):
    """('ar' | 'ar2_3.7', distance or None, problem or None)."""
    els = [element(a[0]) for a in atoms]
    if els == ["Ar"]:
        return "ar", None, None
    if els == ["Ar", "Ar"]:
        (_, x1, y1, z1), (_, x2, y2, z2) = atoms
        r = math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)
        d = round(r, 1)
        if abs(r - d) > 0.005 or d not in DISTANCES:
            return None, r, "Ar-Ar distance %.4f A is not one of the 31 Ex7 distances" % r
        return "ar2_%.1f" % d, d, None
    if not els:
        return None, None, "could not find the geometry"
    return None, None, "molecule is %s, not Ar or Ar2" % "".join(els)


def parse_output(path, text):
    """Everything we need from one output file, as a dict."""
    row = {"file": path, "method": "", "grid": "", "species": "", "distance_A": "",
           "energy_Eh": "", "scf_cycles": "", "wall_time_s": "", "status": "ok", "problems": []}
    probs = row["problems"]

    rem = read_rem(text)
    meth = rem.get("METHOD") or rem.get("EXCHANGE") or ""
    row["method"] = METHODS.get(norm(meth), meth or "?")
    if not meth:
        probs.append("no METHOD in $rem")
    elif norm(meth) not in METHODS:
        probs.append("functional %s is not one of the five Ex7 functionals" % meth)

    grid = rem.get("XC_GRID", "")
    if grid in GRIDS:
        row["grid"] = GRIDS[grid]
    elif grid:
        row["grid"] = "XC_GRID " + grid
        probs.append("XC_GRID %s is not SG-1, SG-2 or SG-3" % grid)
    else:
        row["grid"] = "default"
        probs.append("XC_GRID is missing, so Q-Chem used its default grid; rerun with XC_GRID 1, 2 or 3")

    basis = rem.get("BASIS", "")
    if norm(basis) != norm(BASIS):
        probs.append("basis is %s, should be def2-TZVP" % (basis or "missing"))

    sp, dist, why = identify_species(read_atoms(text))
    row["species"] = sp or "?"
    row["distance_A"] = "" if dist is None else ("%.1f" % dist if sp else "%.4f" % dist)
    if why:
        probs.append(why)

    m = RE_TOTAL.findall(text) or RE_TOTAL_ALT.findall(text)
    if m:
        row["energy_Eh"] = m[-1]
    conv = RE_CONV.findall(text)
    if conv:
        row["scf_cycles"] = conv[-1]
    w = RE_WALL.findall(text)
    if w:
        row["wall_time_s"] = w[-1]

    finished = "Thank you very much for using Q-Chem" in text
    if RE_FAIL.search(text) or (not conv and finished):
        row["status"] = "SCF not converged"
    elif not finished:
        row["status"] = "did not finish (crashed or hit the time limit)"
    elif not row["energy_Eh"]:
        row["status"] = "no total energy found"
    elif probs:
        row["status"] = "check: " + probs[0]
    if row["status"] != "ok":
        row["energy_Eh"] = ""  # never pass on a number from a broken job
    return row


def is_qchem_output(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in SKIP_EXT or os.path.basename(path).startswith("."):
        return False
    try:
        if os.path.getsize(path) > MAX_BYTES:
            return False
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            head = f.read(200000)
    except OSError:
        return False
    return any(m in head for m in QCHEM_MARKERS)


def find_outputs(folder):
    found = []
    for root, dirs, files in os.walk(folder):
        dirs[:] = sorted(d for d in dirs if not d.startswith("."))
        for name in sorted(files):
            p = os.path.join(root, name)
            if is_qchem_output(p):
                found.append(p)
    return found


def clean_path(s):
    """Accept a path typed or dragged into the terminal (quotes, '\\ ' escapes)."""
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        s = s[1:-1]
    if os.sep == "/":
        s = re.sub(r"\\(.)", r"\1", s)
    return os.path.expanduser(s.strip())


def main(argv):
    interactive = len(argv) < 2
    say("Experiment 7 result collector, version %s" % VERSION)
    say("-" * 60)
    if interactive:
        here = os.path.dirname(os.path.abspath(__file__))
        say("Drag the folder with your Q-Chem output files into this window,")
        say("then press Enter. (Just Enter = the folder this script is in.)")
        try:
            answer = input("> ")
        except EOFError:
            answer = ""
        folder = clean_path(answer) or here
    else:
        # A folder name with spaces that was not put in quotes arrives in pieces.
        folder = clean_path(" ".join(argv[1:]))
    folder = os.path.abspath(folder)
    if not os.path.isdir(folder):
        say("ERROR: %s is not a folder." % folder)
        return 1

    say("Looking for Q-Chem outputs in: %s" % folder)
    paths = find_outputs(folder)
    if not paths:
        say("No Q-Chem output files found. Check the folder and try again.")
        return 1
    say("Found %d output files. Reading them..." % len(paths))

    rows = []
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
        except OSError as e:
            say("  could not read %s: %s" % (p, e))
            continue
        row = parse_output(os.path.relpath(p, folder), text)
        row["_mtime"] = os.path.getmtime(p)
        rows.append(row)

    # One row per job: if a job was run more than once, keep a good run,
    # preferring the most recent one, and report the others.
    by_job, others, notes = {}, [], []
    for r in rows:
        key = (r["method"], r["grid"], r["species"])
        if "?" in key or r["grid"] not in GRIDS.values() or r["method"] not in METHODS.values():
            others.append(r)
            continue
        old = by_job.get(key)
        if old is None:
            by_job[key] = r
            continue
        better = (r["status"] == "ok", r["_mtime"]) > (old["status"] == "ok", old["_mtime"])
        keep, drop = (r, old) if better else (old, r)
        by_job[key] = keep
        msg = "%s / %s / %s: %s and %s; using %s" % (key + (old["file"], r["file"], keep["file"]))
        if keep["status"] == "ok" and drop["status"] == "ok":
            diff = abs(float(keep["energy_Eh"]) - float(drop["energy_Eh"]))
            if diff > 1e-6:
                msg += "  <-- ENERGIES DIFFER by %.2e Eh, check which one is right!" % diff
        notes.append(msg)

    method_order = list(METHODS.values())
    grid_order = list(GRIDS.values())
    ordered = sorted(by_job.values(), key=lambda r: (
        grid_order.index(r["grid"]), method_order.index(r["method"]), SPECIES.index(r["species"])))

    cols = ["method", "grid", "species", "distance_A", "energy_Eh", "scf_cycles", "wall_time_s", "status", "file"]
    out = os.path.join(folder, CSV_NAME)
    try:
        f = open(out, "w", newline="", encoding="utf-8")
    except OSError:
        out = os.path.abspath(CSV_NAME)
        f = open(out, "w", newline="", encoding="utf-8")
    with f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in ordered + others:
            w.writerow([r[c] for c in cols])

    # ------------------------------------------------------------ report --
    good = [r for r in ordered if r["status"] == "ok"]
    bad = [r for r in ordered if r["status"] != "ok"]
    say("")
    say("RESULT: %d of %d Experiment 7 jobs are usable." % (len(good), len(METHODS) * len(GRIDS) * len(SPECIES)))
    say("Saved: %s" % out)

    say("")
    say("Jobs per functional and grid (32 each):")
    say("  %-9s %6s %6s %6s" % ("", *grid_order))
    for m in method_order:
        counts = [sum(1 for r in good if r["method"] == m and r["grid"] == g) for g in grid_order]
        say("  %-9s %6s %6s %6s" % (m, *[("%d" % c) + ("" if c == 32 else " !") for c in counts]))

    missing = []
    for g in grid_order:
        for m in method_order:
            have = {r["species"] for r in good if r["method"] == m and r["grid"] == g}
            if have and len(have) < len(SPECIES):
                lack = [s for s in SPECIES if s not in have]
                missing.append("  %s / %s: %s" % (m, g, ", ".join(lack)))
    if missing:
        say("")
        say("Missing or unusable jobs (for functional/grid sets you started):")
        for line in missing:
            say(line)
    if bad:
        say("")
        say("Problems (no energy taken from these files; fix and rerun):")
        for r in bad:
            say("  %s  ->  %s" % (r["file"], r["status"]))
    if others:
        say("")
        say("Not recognized as an Experiment 7 job (listed at the end of the CSV, ignored by the website):")
        for r in others:
            say("  %s  ->  %s" % (r["file"], "; ".join(r["problems"]) or r["status"]))
    if notes:
        say("")
        say("Jobs found more than once:")
        for n in notes:
            say("  " + n)
    say("")
    say("Next: on the Experiment 7 page, under 'Enter your results', click")
    say("'Import CSV' and choose %s." % CSV_NAME)
    say("Spot-check two or three energies against your output files before you submit.")
    return 0


if __name__ == "__main__":
    code = main(sys.argv)
    if len(sys.argv) < 2 and sys.stdin.isatty():
        try:
            input("\nPress Enter to close this window.")
        except EOFError:
            pass
    sys.exit(code)
