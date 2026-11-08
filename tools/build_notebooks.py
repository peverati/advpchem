#!/usr/bin/env python3
"""Build the Colab "go further" notebooks in notebooks/ (run from lab-site/).

The notebooks are generated so the geometries embedded in them always match
data/geometries/. Requires nbformat:  python3 tools/build_notebooks.py
"""
import pathlib
import nbformat as nbf

ROOT = pathlib.Path(__file__).resolve().parents[1]
GEOM = ROOT / "data" / "geometries"
OUT = ROOT / "notebooks"


def xyz_body(path):
    lines = path.read_text().strip().split("\n")
    return "\n".join(lines[2:])


INSTALL = """# Install PySCF (takes ~30 s on Colab; skipped if already installed)
try:
    import pyscf
except ImportError:
    %pip install -q pyscf
    import pyscf
print("PySCF", pyscf.__version__)

# Optional: Grimme's D4 dispersion correction, needed only for methods ending in "-D4".
# The ">=1.3" pin matters: older builds of this package break PySCF.
WANT_D4 = True
if WANT_D4:
    %pip install -q "pyscf-dispersion>=1.3"
"""

HELPER = '''import numpy as np
from pyscf import gto, scf, dft

HARTREE_TO_KCAL = 627.5095

def energy(atoms, method, basis, charge=0, mult=1, grid=(99, 590), verbose=False):
    """Single-point energy (hartree) with PySCF.
    method: 'HF', or a functional name such as 'PBE', 'B3LYP', 'wB97M-V';
            add '-D4' for Grimme's D4 dispersion (e.g. 'B3LYP-D4')."""
    mol = gto.M(atom=atoms, basis=basis, charge=charge, spin=mult - 1, verbose=0)
    m = method.upper()
    disp = None
    if m.endswith("-D4"):
        m, disp = m[:-3], "d4"
    if m == "HF":
        mf = scf.RHF(mol) if mult == 1 else scf.UHF(mol)
    else:
        mf = dft.RKS(mol) if mult == 1 else dft.UKS(mol)
        mf.xc = m.replace("-", "_") if m in ("WB97M-V", "B97M-V") else m
        mf.grids.atom_grid = grid
    if disp:
        mf.disp = disp
    mf.conv_tol = 1e-9
    e = mf.kernel()
    if not mf.converged:
        print(f"  WARNING: SCF did not converge for {method}/{basis}")
    if verbose:
        print(f"{method}/{basis}: {e:.10f} Eh, {mol.nao} basis functions")
    return e
'''


def cbs_notebook():
    dimer = xyz_body(GEOM / "ex01" / "36_HCl-HCl_NCCE30.xyz")
    mono = xyz_body(GEOM / "ex01" / "37_HCl_NCCE30.xyz")
    nb = nbf.v4.new_notebook()
    c = []
    c.append(nbf.v4.new_markdown_cell(
        "# Experiment 1 · Go further: the complete-basis-set limit\n\n"
        "In Experiment 1 you saw the error change as the basis grows from double- to quadruple-ζ. "
        "But what would an **infinitely large** basis give? We can't compute that directly, but we can "
        "*extrapolate* from a systematic series of basis sets.\n\n"
        "In this notebook you will:\n"
        "1. compute the (HCl)₂ → 2 HCl dissociation energy with the Dunning cc-pV*X*Z series (X = 2, 3, 4) using **PySCF**, "
        "a free Python quantum-chemistry program that runs right here in your browser;\n"
        "2. extrapolate the series to the complete-basis-set (CBS) limit;\n"
        "3. do the same with **your own Q-Chem numbers**.\n\n"
        "> **How to use:** run each cell in order with ▶ (or Shift+Enter). The first cell installs PySCF."))
    c.append(nbf.v4.new_code_cell(INSTALL))
    c.append(nbf.v4.new_code_cell(HELPER))
    c.append(nbf.v4.new_markdown_cell("## The molecules\nSame geometries as on the Experiment 1 page (Å)."))
    c.append(nbf.v4.new_code_cell(f'DIMER = """\n{dimer}\n"""\n\nHCL = """\n{mono}\n"""\n\nREF = 2.01  # kcal/mol'))
    c.append(nbf.v4.new_markdown_cell(
        "## 1 · Run the basis-set series\n"
        "Pick a method. `PBE` is fastest (≈1 min in total on Colab), while `wB97M-V` and `B3LYP` take a few minutes. "
        "Then run the cell."))
    c.append(nbf.v4.new_code_cell(
        'METHOD = "PBE"   # try also "B3LYP", "wB97M-V" or "HF"\n'
        'BASES = {2: "cc-pVDZ", 3: "cc-pVTZ", 4: "cc-pVQZ"}\n\n'
        'dE = {}\n'
        'for X, basis in BASES.items():\n'
        '    e_dimer = energy(DIMER, METHOD, basis)\n'
        '    e_hcl = energy(HCL, METHOD, basis)\n'
        '    dE[X] = (2 * e_hcl - e_dimer) * HARTREE_TO_KCAL\n'
        '    print(f"{basis:8s}  ΔE = {dE[X]:7.3f} kcal/mol   error = {dE[X] - REF:+.3f}")'))
    c.append(nbf.v4.new_markdown_cell(
        "## 2 · Extrapolate\n"
        "For DFT and HF, energies converge roughly **exponentially** with the cardinal number *X*:\n\n"
        "$$E(X) = E_\\text{CBS} + A\\,e^{-\\alpha X}$$\n\n"
        "With three points (X = 2, 3, 4) the three unknowns are determined exactly, and\n\n"
        "$$E_\\text{CBS} = \\frac{E_2\\,E_4 - E_3^2}{E_2 + E_4 - 2E_3}.$$\n\n"
        "The formula only makes sense if the series converges *monotonically* (each step changes the energy less than the previous one, in the same direction). "
        "We apply it directly to the reaction energy."))
    c.append(nbf.v4.new_code_cell(
        'def cbs3(e2, e3, e4):\n'
        '    d1, d2 = e3 - e2, e4 - e3\n'
        '    if d1 * d2 <= 0 or abs(d2) >= abs(d1):\n'
        '        print("  ⚠ the series is not monotonically converging: the extrapolation is not meaningful")\n'
        '        return None\n'
        '    return (e2 * e4 - e3**2) / (e2 + e4 - 2 * e3)\n\n'
        'cbs = cbs3(dE[2], dE[3], dE[4])\n'
        'if cbs is not None:\n'
        '    print(f"{METHOD}/CBS  ΔE = {cbs:.3f} kcal/mol   error = {cbs - REF:+.3f}")'))
    c.append(nbf.v4.new_code_cell(
        'import matplotlib.pyplot as plt\n'
        'X = list(dE)\n'
        'plt.plot(X, [dE[x] for x in X], "o-", label=f"{METHOD} / cc-pVXZ")\n'
        'if cbs is not None:\n'
        '    plt.axhline(cbs, ls="--", label=f"{METHOD} CBS estimate")\n'
        'plt.axhline(REF, color="k", lw=1, label="reference")\n'
        'plt.xticks(X, ["DZ", "TZ", "QZ"]); plt.ylabel("ΔE (kcal/mol)"); plt.legend(); plt.title("(HCl)₂ → 2 HCl")\n'
        'plt.show()'))
    c.append(nbf.v4.new_markdown_cell(
        "## 3 · Now with your Q-Chem results\n"
        "Paste the reaction energies you entered on the Experiment 1 page (kcal/mol) and run the cell. "
        "Try both families: does the def2 series (SVP, TZVP, QZVP) extrapolate as nicely as the cc series?"))
    c.append(nbf.v4.new_code_cell(
        '# your Q-Chem ΔE values (kcal/mol); replace the None values\n'
        'mine = {\n'
        '    "wB97M-V cc":   {2: None, 3: None, 4: None},\n'
        '    "wB97M-V def2": {2: None, 3: None, 4: None},\n'
        '    "HF cc":        {2: None, 3: None, 4: None},\n'
        '}\n'
        'for name, s in mine.items():\n'
        '    if None in s.values():\n'
        '        continue\n'
        '    c = cbs3(s[2], s[3], s[4])\n'
        '    print(f"{name:14s} CBS ≈ {c:.3f}  error = {c - REF:+.3f}" if c is not None else f"{name:14s} (not extrapolable)")'))
    c.append(nbf.v4.new_markdown_cell(
        "## Questions to think about\n"
        "1. How far is your quadruple-ζ result from the CBS estimate? Is the QZ basis \"good enough\" for this reaction?\n"
        "2. After extrapolation, does the error of each method go to zero? What is left, and where does it come from?\n"
        "3. HF errors in Experiment 1 did not always decrease with the basis size. Using the CBS estimate, explain why a *bigger* basis can make HF *worse* compared with the reference.\n"
        "4. When would you *not* trust a three-point extrapolation?"))
    nb["cells"] = c
    nb["metadata"] = {"kernelspec": {"name": "python3", "display_name": "Python 3"}, "language_info": {"name": "python"}, "colab": {"provenance": []}}
    return nb


def torsion_notebook():
    st = xyz_body(GEOM / "ex03" / "BHROT27_ethane_st.xyz")
    ecl = xyz_body(GEOM / "ex03" / "BHROT27_ethane_ecl.xyz")
    nb = nbf.v4.new_notebook()
    c = []
    c.append(nbf.v4.new_markdown_cell(
        "# Experiment 3 · Go further: the full ethane torsion\n\n"
        "Reaction 3a compares only two points: staggered and eclipsed ethane. Here you will compute the **whole torsional profile** "
        "by rotating one methyl group from 0° to 120° in 10° steps, with **PySCF** running in your browser.\n\n"
        "> Run the cells in order with ▶ (Shift+Enter). The scan takes 2–5 minutes, depending on the method and basis."))
    c.append(nbf.v4.new_code_cell(INSTALL))
    c.append(nbf.v4.new_code_cell(HELPER))
    c.append(nbf.v4.new_code_cell(
        f'STAGGERED = """\n{st}\n"""\n\nECLIPSED = """\n{ecl}\n"""\n\nREF = 2.73  # kcal/mol, eclipsed − staggered (BHROT27)'))
    c.append(nbf.v4.new_markdown_cell(
        "## Rotating a methyl group\n"
        "We find the two carbons, pick the three hydrogens bonded to the second carbon, and rotate them rigidly around the C–C axis "
        "(Rodrigues' rotation formula). All bond lengths and angles stay fixed. This is a **rigid scan**."))
    c.append(nbf.v4.new_code_cell(
        'def parse(xyz):\n'
        '    rows = [l.split() for l in xyz.strip().split("\\n")]\n'
        '    return [r[0] for r in rows], np.array([[float(x) for x in r[1:4]] for r in rows])\n\n'
        'def rotate_methyl(xyz, angle_deg):\n'
        '    el, X = parse(xyz)\n'
        '    C = [i for i, e in enumerate(el) if e == "C"]\n'
        '    c1, c2 = X[C[0]], X[C[1]]\n'
        '    axis = (c2 - c1) / np.linalg.norm(c2 - c1)\n'
        '    H2 = [i for i, e in enumerate(el) if e == "H" and np.linalg.norm(X[i] - c2) < 1.3]\n'
        '    t = np.radians(angle_deg)\n'
        '    for i in H2:\n'
        '        v = X[i] - c2\n'
        '        X[i] = c2 + v*np.cos(t) + np.cross(axis, v)*np.sin(t) + axis*np.dot(axis, v)*(1 - np.cos(t))\n'
        '    return "\\n".join(f"{e} {x:.8f} {y:.8f} {z:.8f}" for e, (x, y, z) in zip(el, X))\n\n'
        'print(rotate_methyl(STAGGERED, 60))'))
    c.append(nbf.v4.new_markdown_cell("## Run the scan"))
    c.append(nbf.v4.new_code_cell(
        'METHOD, BASIS = "B3LYP-D4", "def2-SVP"   # try "def2-TZVP" (slower), or other methods\n'
        'angles = np.arange(0, 121, 10)\n'
        'E = np.array([energy(rotate_methyl(STAGGERED, a), METHOD, BASIS) for a in angles])\n'
        'rel = (E - E.min()) * HARTREE_TO_KCAL\n'
        'for a, r in zip(angles, rel):\n'
        '    print(f"{a:4d}°  {r:6.3f} kcal/mol")'))
    c.append(nbf.v4.new_markdown_cell(
        "## Fit and plot\n"
        "A methyl rotor has threefold symmetry, so the simplest model is\n\n"
        "$$V(\\varphi) = \\frac{V_3}{2}\\,\\big(1 - \\cos 3\\varphi\\big),$$\n\n"
        "with φ measured from the staggered conformation and $V_3$ the barrier height."))
    c.append(nbf.v4.new_code_cell(
        'import matplotlib.pyplot as plt\n'
        'phi = np.radians(angles)\n'
        'V3 = 2 * np.sum(rel * (1 - np.cos(3*phi))) / np.sum((1 - np.cos(3*phi))**2)   # least squares\n'
        'e_ecl = (energy(ECLIPSED, METHOD, BASIS) - energy(STAGGERED, METHOD, BASIS)) * HARTREE_TO_KCAL\n'
        'print(f"rigid-scan barrier (60°): {rel[angles == 60][0]:.3f} kcal/mol")\n'
        'print(f"fitted V3:                {V3:.3f} kcal/mol")\n'
        'print(f"database geometries:      {e_ecl:.3f} kcal/mol   (reference {REF})")\n'
        'f = np.linspace(0, 120, 200)\n'
        'plt.plot(angles, rel, "o", label=f"{METHOD}/{BASIS}")\n'
        'plt.plot(f, V3/2*(1 - np.cos(np.radians(3*f))), "-", label="V3 fit")\n'
        'plt.axhline(REF, color="k", lw=1, ls=":", label="reference barrier")\n'
        'plt.xlabel("H–C–C–H rotation from staggered (°)"); plt.ylabel("relative energy (kcal/mol)"); plt.legend(); plt.show()'))
    c.append(nbf.v4.new_markdown_cell(
        "## Questions to think about\n"
        "1. Is the profile well described by the simple $V_3$ cosine? Where are the maxima and minima?\n"
        "2. The rigid-scan barrier and the barrier from the two database geometries differ slightly. Why? (Hint: compare the C–C bond length in the two database structures.)\n"
        "3. Change the method (e.g. `HF`, `PBE`, `wB97M-V`) and the basis. Which affects the barrier more for this \"easy\" reaction?\n"
        "4. The ethane barrier is often explained by steric repulsion *or* by hyperconjugation. Can a total-energy scan alone tell you which is right?"))
    nb["cells"] = c
    nb["metadata"] = {"kernelspec": {"name": "python3", "display_name": "Python 3"}, "language_info": {"name": "python"}, "colab": {"provenance": []}}
    return nb


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    nbf.write(cbs_notebook(), OUT / "ex01_cbs_extrapolation.ipynb")
    nbf.write(torsion_notebook(), OUT / "ex03_ethane_torsion.ipynb")
    print("wrote", *sorted(p.name for p in OUT.glob("*.ipynb")))
