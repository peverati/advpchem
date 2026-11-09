"""Figures for the Class 4-6 handouts (Hartree-Fock, DFT, Jacob's ladder).

Run from anywhere:  python3 l04_l06_figures.py
Writes PNG files into lectures/images/ (one level up from this script).
Needs numpy, scipy and matplotlib only.

Every number in these figures is computed here from published formulas:
- H2 curves: STO-3G minimal basis (zeta = 1.24), RHF, UHF and full CI,
  with the textbook Gaussian integral formulas (Szabo and Ostlund, ch. 3).
- GGA enhancement factors: B88 (Becke 1988) and PBE (Perdew, Burke,
  Ernzerhof 1996) exchange, written as functions of the reduced gradient s.
- Range separation: erf(omega r)/r with the omega values of
  wB97M-V (0.3 bohr^-1) and M11 (0.25 bohr^-1).
- Hydrogen-atom numbers printed at the end (used in the text of Classes 5-6):
  exact density rho = exp(-2r)/pi, LSDA (Slater + PW92), B88 and PBE exchange.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from scipy.integrate import quad
from scipy.special import erf

OUT = Path(__file__).resolve().parent.parent
plt.rcParams.update({
    "font.size": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
    "figure.facecolor": "white",
})
BLUE, ORANGE, GREEN, RED, PURPLE, GRAY = "#1f5fa8", "#d9730d", "#2e8b57", "#c0392b", "#7b4fa0", "#666666"


# ---------------------------------------------------------------- H2 / STO-3G
ALPHA = np.array([3.42525091, 0.62391373, 0.16885540])  # zeta = 1.24
COEF = np.array([0.15432897, 0.53532814, 0.44463454])
NORM = (2 * ALPHA / np.pi) ** 0.75


def boys0(t):
    return 1.0 if t < 1e-12 else 0.5 * np.sqrt(np.pi / t) * erf(np.sqrt(t))


def h2_integrals(R):
    """AO integrals for two H 1s STO-3G functions at z = 0 and z = R (bohr)."""
    centers = [0.0, R]
    S = np.zeros((2, 2)); T = np.zeros((2, 2)); V = np.zeros((2, 2))
    eri = np.zeros((2, 2, 2, 2))
    prims = [(a, c * n) for a, c, n in zip(ALPHA, COEF, NORM)]
    for i in range(2):
        for j in range(2):
            A, B = centers[i], centers[j]
            for a, ca in prims:
                for b, cb in prims:
                    p = a + b; mu = a * b / p; P = (a * A + b * B) / p
                    s = (np.pi / p) ** 1.5 * np.exp(-mu * (A - B) ** 2)
                    S[i, j] += ca * cb * s
                    T[i, j] += ca * cb * mu * (3 - 2 * mu * (A - B) ** 2) * s
                    for C in centers:
                        V[i, j] += ca * cb * (-2 * np.pi / p) * np.exp(-mu * (A - B) ** 2) * boys0(p * (P - C) ** 2)
    for i in range(2):
        for j in range(2):
            for k in range(2):
                for l in range(2):
                    A, B, C, D = (centers[x] for x in (i, j, k, l))
                    val = 0.0
                    for a, ca in prims:
                        for b, cb in prims:
                            p = a + b; P = (a * A + b * B) / p
                            Kab = np.exp(-a * b / p * (A - B) ** 2)
                            for c, cc in prims:
                                for d, cd in prims:
                                    q = c + d; Q = (c * C + d * D) / q
                                    Kcd = np.exp(-c * d / q * (C - D) ** 2)
                                    val += ca * cb * cc * cd * 2 * np.pi ** 2.5 / (p * q * np.sqrt(p + q)) \
                                        * Kab * Kcd * boys0(p * q / (p + q) * (P - Q) ** 2)
                    eri[i, j, k, l] = val
    return S, T + V, eri


def h2_energies(R):
    S, h, eri = h2_integrals(R)
    s12 = S[0, 1]
    C = np.array([[1, 1], [1, -1]], float)
    C[:, 0] /= np.sqrt(2 * (1 + s12)); C[:, 1] /= np.sqrt(2 * (1 - s12))
    hmo = C.T @ h @ C
    g = np.einsum("pi,qj,rk,sl,pqrs->ijkl", C, C, C, C, eri)
    vnn = 1.0 / R
    e_g = 2 * hmo[0, 0] + g[0, 0, 0, 0]
    e_u = 2 * hmo[1, 1] + g[1, 1, 1, 1]
    k = g[0, 1, 0, 1]
    e_rhf = e_g + vnn
    e_fci = np.linalg.eigvalsh(np.array([[e_g, k], [k, e_u]]))[0] + vnn
    best = e_rhf
    for th in np.linspace(0, np.pi / 2, 721):  # UHF: alpha = cos g + sin u, beta = cos g - sin u
        ca = np.array([np.cos(th), np.sin(th)]); cb = np.array([np.cos(th), -np.sin(th)])
        e = ca @ hmo @ ca + cb @ hmo @ cb + np.einsum("i,j,k,l,ijkl->", ca, ca, cb, cb, g) + vnn
        best = min(best, e)
    return e_rhf, best, e_fci


def fig_h2():
    Rs = np.linspace(0.8, 8.0, 120)
    E = np.array([h2_energies(R) for R in Rs])
    # energy of one H atom in STO-3G: <1s|h|1s> for a single centre
    S, h, _ = h2_integrals(1e3)
    e_h = h[0, 0] + 0.0  # nuclear attraction to the far proton is ~ -1/1000
    e_h -= -1 / 1e3
    e_atom = 2 * e_h
    to_kcal = 627.5095
    fig, ax = plt.subplots(figsize=(6.4, 4.0))
    ax.plot(Rs * 0.529177, (E[:, 0] - e_atom) * to_kcal, color=RED, lw=2, label="RHF (one doubly occupied orbital)")
    ax.plot(Rs * 0.529177, (E[:, 1] - e_atom) * to_kcal, color=BLUE, lw=2, ls="--", label="UHF (α and β orbitals free)")
    ax.plot(Rs * 0.529177, (E[:, 2] - e_atom) * to_kcal, color="black", lw=2, label="Full CI (exact in this basis)")
    ax.axhline(0, color=GRAY, lw=0.8, ls=":")
    ax.text(4.2, 6, "two separated H atoms", color=GRAY, fontsize=9, ha="right")
    ax.set_xlabel("H–H distance (Å)")
    ax.set_ylabel("Energy relative to 2 H (kcal/mol)")
    ax.set_xlim(0.4, 4.25); ax.set_ylim(-150, 220)
    ax.legend(frameon=False, loc="upper right", fontsize=9)
    fig.savefig(OUT / "l04-h2-dissociation.png")
    plt.close(fig)
    i = np.argmin(E[:, 2])
    print(f"H2/STO-3G: atom energy {e_h:.5f} Eh; FCI min at {Rs[i]*0.529177:.3f} A;"
          f" Ecorr at min {E[i,2]-E[i,0]:.4f} Eh; RHF-2H at 8 bohr {(E[-1,0]-e_atom)*to_kcal:.1f} kcal/mol")


# --------------------------------------------------------------- SCF flowchart
def box(ax, x, y, w, h, text, fc="#eef3fb", ec=BLUE, fs=10):
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02,rounding_size=0.08",
                                fc=fc, ec=ec, lw=1.4))
    ax.text(x, y, text, ha="center", va="center", fontsize=fs)


def arrow(ax, p, q, text=None, side="right", color="black"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=14, lw=1.3, color=color,
                                 connectionstyle="arc3,rad=0"))
    if text:
        mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        ax.text(mx + (0.08 if side == "right" else -0.08), my, text, fontsize=9, color=color,
                ha="left" if side == "right" else "right", va="center")


def fig_scf():
    fig, ax = plt.subplots(figsize=(6.6, 6.4))
    ax.set_xlim(0, 6.6); ax.set_ylim(-0.1, 6.5); ax.axis("off")
    X = 2.6
    box(ax, X, 6.15, 4.2, 0.55, "Input: geometry, charge, multiplicity,\nbasis set $\\{\\chi_\\mu\\}$", fc="#f4f4f4", ec=GRAY)
    box(ax, X, 5.25, 4.2, 0.6, "Integrals: $\\mathbf{S}$, $\\mathbf{H}^{\\rm core}$, $(\\mu\\nu|\\lambda\\sigma)$\nInitial guess for the density $\\mathbf{P}$")
    box(ax, X, 4.2, 4.2, 0.6, "Build the Fock matrix\n$F_{\\mu\\nu} = H^{\\rm core}_{\\mu\\nu} + G_{\\mu\\nu}(\\mathbf{P})$")
    box(ax, X, 3.15, 4.2, 0.6, "Solve $\\mathbf{FC} = \\mathbf{SC}\\boldsymbol{\\varepsilon}$\n(orthogonalize, diagonalize)")
    box(ax, X, 2.1, 4.2, 0.6, "Occupy the lowest orbitals\nnew density $\\mathbf{P}$, energy $E$")
    ax.add_patch(plt.Polygon([[X, 1.45], [X + 1.5, 1.0], [X, 0.55], [X - 1.5, 1.0]], fc="#fff6e8", ec=ORANGE, lw=1.4))
    ax.text(X, 1.0, "Converged?\nDIIS error $< 10^{-8}$, small $\\Delta E$", ha="center", va="center", fontsize=9.5)
    box(ax, X, 0.15, 3.0, 0.32, "Done: energy, orbitals, $\\varepsilon_i$", fc="#eaf6ee", ec=GREEN)
    for y1, y2 in [(5.87, 5.56), (4.95, 4.51), (3.9, 3.46), (2.85, 2.41), (1.8, 1.46)]:
        arrow(ax, (X, y1), (X, y2))
    arrow(ax, (X, 0.55), (X, 0.32), "yes", color=GREEN)
    # loop back
    ax.plot([X + 1.5, 5.6, 5.6], [1.0, 1.0, 4.2], color=ORANGE, lw=1.3)
    arrow(ax, (5.6, 4.2), (X + 2.12, 4.2), color=ORANGE)
    ax.text(5.68, 2.6, "no: mix with\nearlier steps\n(DIIS) and\nrepeat", fontsize=9, color=ORANGE, va="center")
    fig.savefig(OUT / "l04-scf-loop.png")
    plt.close(fig)


# ---------------------------------------------------------- Kohn-Sham mapping
def fig_ks():
    fig, ax = plt.subplots(figsize=(7.0, 3.0))
    ax.set_xlim(0, 7); ax.set_ylim(0, 3); ax.axis("off")
    box(ax, 1.6, 1.7, 2.8, 1.7, "Real molecule\n$N$ interacting electrons\n$\\hat T + \\hat V_{ne} + \\hat V_{ee}$\nmany-electron $\\Psi$", fc="#fdeeee", ec=RED)
    box(ax, 5.4, 1.7, 2.8, 1.7, "Kohn–Sham system\n$N$ non-interacting electrons\nin an effective potential $v_s(\\mathbf{r})$\none determinant of $\\varphi_i$", fc="#eef3fb", ec=BLUE)
    ax.add_patch(FancyArrowPatch((3.05, 1.95), (3.95, 1.95), arrowstyle="<|-|>", mutation_scale=14, lw=1.4))
    ax.text(3.5, 2.2, "same", ha="center", fontsize=10)
    ax.text(3.5, 1.55, "$\\rho(\\mathbf{r})$", ha="center", fontsize=13)
    ax.text(3.5, 0.3, "Everything the KS system gets wrong is put into $E_{xc}[\\rho]$", ha="center", fontsize=10, color=GRAY)
    fig.savefig(OUT / "l05-kohn-sham-mapping.png")
    plt.close(fig)


# ------------------------------------------------------- GGA enhancement factor
KF = (3 * np.pi ** 2) ** (1 / 3)
CX_SPIN = 1.5 * (3 / (4 * np.pi)) ** (1 / 3)   # 0.9305: per-spin LSDA exchange constant
BETA_B88 = 0.0042
KAPPA, MU = 0.804, 0.2195149727645171


def fx_pbe(s):
    return 1 + KAPPA - KAPPA / (1 + MU * s ** 2 / KAPPA)


def fx_b88(s):
    x = 2 ** (4 / 3) * KF * s  # x_sigma = |grad rho_sigma| / rho_sigma^(4/3) for a spin-unpolarized density
    return 1 + BETA_B88 * x ** 2 / (CX_SPIN * (1 + 6 * BETA_B88 * x * np.arcsinh(x)))


def fig_fx():
    s = np.linspace(0, 3, 300)
    fig, ax = plt.subplots(figsize=(6.2, 3.9))
    ax.plot(s, np.ones_like(s), color=GRAY, lw=2, label="LSDA (no gradient): $F_x = 1$")
    ax.plot(s, fx_b88(s), color=BLUE, lw=2, label="B88 (Becke 1988)")
    ax.plot(s, fx_pbe(s), color=ORANGE, lw=2, ls="--", label="PBE (1996)")
    ax.axhline(1.804, color=RED, lw=1, ls=":")
    ax.text(1.05, 1.83, "local Lieb–Oxford bound used by PBE (1.804)", color=RED, fontsize=9)
    ax.axvspan(0, 1, color="#eef3fb", zorder=0)
    ax.text(0.5, 1.62, "valence and\nbonding regions", ha="center", fontsize=9, color=BLUE)
    ax.text(2.2, 1.9, "density tails", ha="center", fontsize=9, color=GRAY)
    ax.set_xlabel("reduced density gradient $s$")
    ax.set_ylabel("exchange enhancement factor $F_x(s)$")
    ax.set_xlim(0, 3); ax.set_ylim(0.95, 2.0)
    ax.legend(frameon=False, loc="lower right", bbox_to_anchor=(1.0, 0.08), fontsize=9)
    fig.savefig(OUT / "l06-enhancement-factors.png")
    plt.close(fig)


# ------------------------------------------------------------ range separation
def fig_range():
    r = np.linspace(0.01, 12, 600)
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9.2, 3.7))
    w = 0.3
    a1.plot(r, 1 / r, color="black", lw=2, label="$1/r$ (full Coulomb)")
    a1.plot(r, (1 - erf(w * r)) / r, color=BLUE, lw=2, ls="--", label="short range: erfc$(\\omega r)/r$")
    a1.plot(r, erf(w * r) / r, color=ORANGE, lw=2, label="long range: erf$(\\omega r)/r$")
    a1.set_ylim(0, 1.2); a1.set_xlim(0, 12)
    a1.set_xlabel("electron–electron distance $r$ (bohr)"); a1.set_ylabel("interaction (hartree)")
    a1.set_title("Splitting $1/r$ with $\\omega = 0.3$ bohr$^{-1}$", fontsize=10)
    a1.legend(frameon=False, fontsize=9)
    for name, csr, clr, om, col, ls in [("ωB97M-V", 0.15, 1.0, 0.3, BLUE, "-"), ("M11", 0.428, 1.0, 0.25, PURPLE, "-")]:
        a2.plot(r, csr + (clr - csr) * erf(om * r), color=col, lw=2, ls=ls, label=f"{name}: {csr*100:g}% → {clr*100:g}%")
    for name, c, col in [("M06-2X: 54%", 0.54, GREEN), ("PBE0: 25%", 0.25, ORANGE), ("B3LYP: 20%", 0.20, RED)]:
        a2.plot(r, np.full_like(r, c), color=col, lw=1.6, ls="--", label=name)
    a2.set_ylim(0, 1.5); a2.set_xlim(0, 12)
    a2.set_xlabel("electron–electron distance $r$ (bohr)"); a2.set_ylabel("fraction of HF exchange")
    a2.set_title("Global vs range-separated hybrids", fontsize=10)
    a2.legend(frameon=False, fontsize=8, loc="upper center", ncol=2)
    fig.tight_layout()
    fig.savefig(OUT / "l06-range-separation.png")
    plt.close(fig)


# --------------------------------------------------------------- Jacob's ladder
def fig_ladder():
    fig, ax = plt.subplots(figsize=(7.4, 6.2))
    ax.set_xlim(0, 10.2); ax.set_ylim(0, 10.4); ax.axis("off")
    # rails
    ax.plot([1.0, 1.0], [1.0, 9.4], color="#8a6d3b", lw=5)
    ax.plot([2.6, 2.6], [1.0, 9.4], color="#8a6d3b", lw=5)
    rungs = [
        ("1", "LSDA", "$\\rho$", "SVWN, SPW92"),
        ("2", "GGA", "+ $\\nabla\\rho$", "BLYP, PW91, PBE"),
        ("3", "meta-GGA", "+ $\\tau$ (or $\\nabla^2\\rho$)", "TPSS, SCAN, r²SCAN"),
        ("4", "hybrid", "+ occupied orbitals\n(HF exchange)", "B3LYP, PBE0, TPSSh"),
        ("5", "double hybrid / RPA", "+ virtual orbitals", "B2PLYP, RPA"),
    ]
    for i, (n, name, ing, ex) in enumerate(rungs):
        y = 1.6 + i * 1.75
        ax.plot([1.0, 2.6], [y, y], color="#8a6d3b", lw=5)
        ax.text(1.8, y + 0.28, n, ha="center", fontsize=11, weight="bold", color="#5a4520")
        ax.text(3.0, y + 0.2, name, fontsize=12, weight="bold", va="center")
        ax.text(3.0, y - 0.08, ing, fontsize=10, va="top", color=BLUE)
        ax.text(6.4, y, ex, fontsize=10, va="center", color=GRAY)
    ax.text(1.8, 0.3, "Hartree world\n(no exchange–correlation)", ha="center", fontsize=9, color=GRAY)
    ax.text(1.8, 9.95, "\"heaven of chemical accuracy\"", ha="center", fontsize=10, style="italic")
    ax.text(3.0, 9.4, "rung · ingredient added", fontsize=9, color=BLUE)
    ax.text(6.4, 9.4, "examples", fontsize=9, color=GRAY)
    ax.annotate("", xy=(9.85, 9.2), xytext=(9.85, 1.0), arrowprops=dict(arrowstyle="-|>", color=GRAY, lw=1.3))
    ax.text(10.0, 5.1, "more ingredients: usually more accurate, always more expensive", rotation=90,
            va="center", fontsize=9, color=GRAY)
    fig.savefig(OUT / "l06-jacobs-ladder.png")
    plt.close(fig)


# ------------------------------------------------------- hydrogen-atom numbers
def hydrogen_numbers():
    rho = lambda r: np.exp(-2 * r) / np.pi  # fully spin-polarized: rho_alpha = rho, rho_beta = 0
    shell = lambda f: quad(lambda r: 4 * np.pi * r ** 2 * f(r), 0, 40, limit=400)[0]
    J = 0.5 * 5 / 8  # (1/2) * self-repulsion of the 1s density = 5/16
    # LSDA exchange for a fully polarized density: E_x = -C_x(spin) * int rho_alpha^(4/3)
    ex_lsda = -CX_SPIN * shell(lambda r: rho(r) ** (4 / 3))
    # B88 / PBE exchange via spin scaling: E_x[rho_a, 0] = (1/2) E_x^unpol[2 rho_a]
    def ex_gga(fx):
        def integrand(r):
            n = 2 * rho(r); grad = 2 * n  # |d n/dr| = 2n for exp(-2r)
            s = grad / (2 * KF * n ** (4 / 3))
            return -0.75 * (3 / np.pi) ** (1 / 3) * n ** (4 / 3) * fx(s)
        return 0.5 * shell(integrand)
    # PW92 correlation, fully polarized (zeta = 1) uniform gas
    def g_pw(rs, A, a1, b1, b2, b3, b4):
        return -2 * A * (1 + a1 * rs) * np.log(1 + 1 / (2 * A * (b1 * rs ** 0.5 + b2 * rs + b3 * rs ** 1.5 + b4 * rs ** 2)))
    ferro = (0.015545, 0.20548, 14.1189, 6.1977, 3.3662, 0.62517)
    ec_lsda = shell(lambda r: rho(r) * g_pw((3 / (4 * np.pi * rho(r))) ** (1 / 3), *ferro))
    T = 0.5; Vne = -1.0
    print(f"H atom: J = {J:.4f}; exact Ex = {-J:.4f}; LSDA Ex = {ex_lsda:.4f}; B88 Ex = {ex_gga(fx_b88):.4f};"
          f" PBE Ex = {ex_gga(fx_pbe):.4f}; PW92 Ec = {ec_lsda:.4f}; LSDA total (exact rho) = {T+Vne+J+ex_lsda+ec_lsda:.4f}")


if __name__ == "__main__":
    fig_h2(); fig_scf(); fig_ks(); fig_fx(); fig_range(); fig_ladder(); hydrogen_numbers()
    print("figures written to", OUT)
