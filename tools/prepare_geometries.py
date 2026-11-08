#!/usr/bin/env python3
"""Copy the original geometries into data/geometries/exNN/ in one clean format.

Run from lab-site/:  python3 tools/prepare_geometries.py
Reads the archive folders/zips one level up (../Ex4, ../Ex9_geometries.zip, ...).

Normalization: line 1 = atom count, line 2 = "charge multiplicity" (no commas or
trailing spaces), atoms as element symbols (some files used atomic numbers),
coordinates in Angstrom with 8 decimals. __MACOSX junk is skipped.
Also generates the Ar2 dissociation curve (3.0-6.0 A) for Experiment 7.
"""
import pathlib, zipfile, io, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = ROOT.parent
OUT = ROOT / "data" / "geometries"

SYMBOLS = ("X H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn "
           "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe").split()

# experiment -> (source folder or zip, list of files or None for all)
SOURCES = {
    "ex01": ("Ex1_Geometries", None),
    "ex03": ("Ex3", None),
    "ex04": ("Ex4", None),
    "ex05": ("ex5", None),
    "ex08": ("Ex8_geometries", None),
    "ex09": ("Ex9_geometries.zip", None),
    "ex10": ("Ex10_Geometries.zip", None),
}

# Files renamed to the database subset they actually come from.
RENAME = {
    "31_Pd_PH3_2-C6H8_SR-TM-BE17.xyz": "Pd_PH3_2-C6H8_PdBE2.xyz",
    "32_Pd_PH3_2_SR-TM-BE17.xyz": "Pd_PH3_2_PdBE2.xyz",
    "05_C6H8_SR-TM-BE17.xyz": "C6H8_PdBE2.xyz",
}


def normalize(text: str, name: str) -> str:
    lines = [l.rstrip() for l in text.replace("\r", "").split("\n")]
    n = int(lines[0].split()[0])
    cm = re.split(r"[,\s]+", lines[1].strip())
    charge, mult = int(cm[0]), int(cm[1])
    atoms = []
    for l in lines[2:2 + n]:
        el, x, y, z = l.split()[:4]
        if el.isdigit():
            el = SYMBOLS[int(el)]
        el = el.capitalize()
        atoms.append(f"{el:<2s} {float(x):14.8f} {float(y):14.8f} {float(z):14.8f}")
    if len(atoms) != n:
        raise ValueError(f"{name}: expected {n} atoms, found {len(atoms)}")
    return f"{n}\n{charge} {mult}\n" + "\n".join(atoms) + "\n"


def sources(src):
    p = ARCHIVE / src
    if p.suffix == ".zip":
        with zipfile.ZipFile(p) as z:
            for info in z.infolist():
                fn = info.filename
                if fn.startswith("__MACOSX") or not fn.endswith(".xyz"):
                    continue
                yield pathlib.Path(fn).name, z.read(fn).decode()
    else:
        for f in sorted(p.glob("*.xyz")):
            yield f.name, f.read_text()


def main():
    for exp, (src, only) in SOURCES.items():
        d = OUT / exp
        d.mkdir(parents=True, exist_ok=True)
        for name, text in sources(src):
            if only and name not in only:
                continue
            (d / RENAME.get(name, name)).write_text(normalize(text, name))
        print(exp, len(list(d.glob("*.xyz"))), "files")

    # Experiment 7: Ar2 curve + Ar atom (RG10 subset; distances in Angstrom)
    d = OUT / "ex07"
    d.mkdir(parents=True, exist_ok=True)
    (d / "Ar_atom.xyz").write_text(f"1\n0 1\nAr {0:14.8f} {0:14.8f} {0:14.8f}\n")
    for i in range(31):
        r = 3.0 + 0.1 * i
        (d / f"Ar2_{r:.1f}.xyz").write_text(
            f"2\n0 1\nAr {0:14.8f} {0:14.8f} {0:14.8f}\nAr {0:14.8f} {0:14.8f} {r:14.8f}\n")
    print("ex07", len(list(d.glob("*.xyz"))), "files")


if __name__ == "__main__":
    main()
