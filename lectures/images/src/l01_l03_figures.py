"""Figures for the handouts of Classes 1-3 (CHM 5111, Florida Tech).

Run from anywhere:  python3 lectures/images/src/l01_l03_figures.py
Writes PNG files into lectures/images/ with names starting l01-, l02-, l03-.

Everything plotted is either an analytic function (hydrogen orbitals, Slater
and Gaussian functions, a Morse model with experimental H2 constants), a count
of basis functions taken from the published shell compositions, or a curve
explicitly labeled as schematic.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from scipy.optimize import minimize_scalar  # noqa: E402

OUT = Path(__file__).resolve().parent.parent
plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.facecolor": "white",
    "font.size": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
})
C = ["#1f5fa8", "#d1495b", "#2a9d8f", "#e9a03b", "#6a4c93", "#555555"]


def save(fig, name):
    fig.tight_layout()
    fig.savefig(OUT / f"{name}.png", dpi=180)
    plt.close(fig)
    print("wrote", name)


# --------------------------------------------------------------------------
# l01-hydrogen-radial: hydrogen radial functions R_nl(r) and r^2 R_nl^2 (a.u.)
# --------------------------------------------------------------------------
def R(n, l, r):
    """Hydrogen radial functions, Z = 1, r in bohr."""
    if (n, l) == (1, 0):
        return 2 * np.exp(-r)
    if (n, l) == (2, 0):
        return (1 / (2 * np.sqrt(2))) * (2 - r) * np.exp(-r / 2)
    if (n, l) == (2, 1):
        return (1 / (2 * np.sqrt(6))) * r * np.exp(-r / 2)
    if (n, l) == (3, 0):
        return (2 / (81 * np.sqrt(3))) * (27 - 18 * r + 2 * r**2) * np.exp(-r / 3)
    if (n, l) == (3, 1):
        return (4 / (81 * np.sqrt(6))) * (6 * r - r**2) * np.exp(-r / 3)
    if (n, l) == (3, 2):
        return (4 / (81 * np.sqrt(30))) * r**2 * np.exp(-r / 3)
    raise ValueError


def fig_hydrogen():
    r = np.linspace(0, 25, 2000)
    # check normalization
    for nl in [(1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2)]:
        rr = np.linspace(0, 80, 40001)
        norm = np.trapz(rr**2 * R(*nl, rr) ** 2, rr)
        assert abs(norm - 1) < 1e-4, (nl, norm)
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    labels = {(1, 0): "1s", (2, 0): "2s", (2, 1): "2p", (3, 0): "3s", (3, 1): "3p", (3, 2): "3d"}
    for i, nl in enumerate(labels):
        ax[0].plot(r, R(*nl, r), color=C[i], lw=1.8, label=labels[nl])
        ax[1].plot(r, r**2 * R(*nl, r) ** 2, color=C[i], lw=1.8, label=labels[nl])
    ax[0].axhline(0, color="k", lw=0.6)
    ax[0].set_xlim(0, 20)
    ax[0].set_ylim(-0.15, 0.8)
    ax[0].annotate("1s continues up to\n$R_{10}(0)=2$ at r = 0", xy=(0.95, 0.78), xytext=(3.0, 0.62),
                   fontsize=9, arrowprops=dict(arrowstyle="->", lw=0.8))
    ax[0].set_xlabel("r (bohr)")
    ax[0].set_ylabel(r"$R_{n\ell}(r)$ (bohr$^{-3/2}$)")
    ax[0].set_title("(a) radial functions")
    ax[1].set_xlim(0, 25)
    ax[1].set_xlabel("r (bohr)")
    ax[1].set_ylabel(r"$r^2 R_{n\ell}^2(r)$ (bohr$^{-1}$)")
    ax[1].set_title("(b) radial probability density")
    ax[1].legend(frameon=False, ncol=2)
    save(fig, "l01-hydrogen-radial")


# --------------------------------------------------------------------------
# l01-h2-pes: Morse model of H2 with experimental constants, split into
# E_el(R) and V_nn(R) = 1/R (a.u.)
# --------------------------------------------------------------------------
def fig_h2_pes():
    hartree_cm = 219474.63
    bohr_A = 0.529177
    amu_me = 1822.888
    De = 38297.0 / hartree_cm          # Eh   (H2, D_e = 4.748 eV)
    re = 0.7414 / bohr_A               # bohr
    we = 4401.2 / hartree_cm           # Eh   (harmonic wavenumber)
    mu = 0.50391 * amu_me              # m_e  (reduced mass of H2)
    k = mu * we**2                     # Eh / bohr^2 (omega = we in a.u.)
    a = np.sqrt(k / (2 * De))          # 1/bohr
    Rg = np.linspace(0.45, 6.0, 800)
    U = -1.0 + De * ((1 - np.exp(-a * (Rg - re))) ** 2 - 1)  # total, -> -1 Eh (2 H atoms)
    Vnn = 1.0 / Rg
    Eel = U - Vnn
    fig, ax = plt.subplots(figsize=(7, 4.4))
    ax.plot(Rg, U, color=C[0], lw=2.2, label=r"$U(R)=E_\mathrm{el}(R)+V_{nn}(R)$ (total energy)")
    ax.plot(Rg, Eel, color=C[1], lw=1.6, ls="--", label=r"$E_\mathrm{el}(R)$ (electronic energy)")
    ax.plot(Rg, Vnn - 1.0, color=C[2], lw=1.6, ls=":", label=r"$V_{nn}(R)=1/R$ (shifted by $-1\,E_\mathrm{h}$)")
    ax.axhline(-1.0, color="k", lw=0.6)
    ax.annotate("two H atoms: $-1\\,E_\\mathrm{h}$", xy=(5.0, -1.0), xytext=(3.9, -0.86),
                arrowprops=dict(arrowstyle="->", lw=0.8))
    ax.annotate(r"$R_e = 1.40$ bohr" "\n" r"$U = -1.174\,E_\mathrm{h}$", xy=(re, -1 - De),
                xytext=(2.2, -1.32), arrowprops=dict(arrowstyle="->", lw=0.8))
    ax.set_xlim(0.4, 6.0)
    ax.set_ylim(-1.9, 0.2)
    ax.set_xlabel("H–H distance R (bohr)")
    ax.set_ylabel(r"energy ($E_\mathrm{h}$)")
    ax.set_title("H$_2$: Morse model with experimental constants")
    ax.legend(frameon=False, loc="lower right", fontsize=9.5)
    save(fig, "l01-h2-pes")


# --------------------------------------------------------------------------
# l02-sto-vs-gto: hydrogen 1s STO (zeta = 1.24) vs one Gaussian vs STO-3G
# --------------------------------------------------------------------------
STO3G_H = {  # Basis Set Exchange, STO-3G hydrogen (zeta = 1.24 already folded in)
    "alpha": [3.42525091, 0.62391373, 0.16885540],
    "d": [0.15432897, 0.53532814, 0.44463454],
}
ZETA = 1.24


def gto(alpha, r):
    return (2 * alpha / np.pi) ** 0.75 * np.exp(-alpha * r**2)


def sto(zeta, r):
    return np.sqrt(zeta**3 / np.pi) * np.exp(-zeta * r)


def contracted(r):
    return sum(d * gto(a, r) for a, d in zip(STO3G_H["alpha"], STO3G_H["d"]))


def overlap_with_sto(f):
    rr = np.linspace(0, 30, 60001)
    return 4 * np.pi * np.trapz(rr**2 * f(rr) * sto(ZETA, rr), rr)


def fig_sto_gto():
    # best single Gaussian = maximum overlap with the STO (this is STO-1G)
    res = minimize_scalar(lambda a: -overlap_with_sto(lambda r: gto(a, r)), bounds=(0.05, 3), method="bounded")
    a1 = res.x
    s1 = -res.fun
    s3 = overlap_with_sto(contracted)
    print(f"  STO-1G alpha = {a1:.5f} (overlap {s1:.5f}); STO-3G overlap {s3:.5f}")
    r = np.linspace(0, 4.5, 1000)
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    ax[0].plot(r, sto(ZETA, r), color="k", lw=2.2, label=r"Slater 1s, $\zeta=1.24$")
    ax[0].plot(r, gto(a1, r), color=C[1], lw=1.6, ls="--", label=f"one Gaussian, α = {a1:.3f}")
    ax[0].plot(r, contracted(r), color=C[0], lw=1.6, label="STO-3G (3 Gaussians)")
    for a, d, cc in zip(STO3G_H["alpha"], STO3G_H["d"], [C[2], C[3], C[4]]):
        ax[0].plot(r, d * gto(a, r), color=cc, lw=0.9, ls=":")
    ax[0].text(0.25, 0.12, "dotted: the three\nweighted primitives", fontsize=9, color="#444")
    ax[0].set_xlabel("r (bohr)")
    ax[0].set_ylabel(r"$\chi(r)$ (bohr$^{-3/2}$)")
    ax[0].set_title("(a) near the nucleus: the cusp")
    ax[0].set_xlim(0, 3)
    ax[0].legend(frameon=False, fontsize=9)
    rl = np.linspace(0, 8, 1000)
    ax[1].semilogy(rl, sto(ZETA, rl), color="k", lw=2.2, label="Slater 1s")
    ax[1].semilogy(rl, gto(a1, rl), color=C[1], lw=1.6, ls="--", label="one Gaussian")
    ax[1].semilogy(rl, contracted(rl), color=C[0], lw=1.6, label="STO-3G")
    ax[1].set_ylim(1e-8, 2)
    ax[1].set_xlabel("r (bohr)")
    ax[1].set_ylabel(r"$\chi(r)$, log scale")
    ax[1].set_title("(b) far from the nucleus: the tail")
    ax[1].legend(frameon=False, fontsize=9)
    save(fig, "l02-sto-vs-gto")


# --------------------------------------------------------------------------
# l02-gaussian-product: product of two 1D Gaussians on A and B is a Gaussian on P
# --------------------------------------------------------------------------
def fig_gpt():
    x = np.linspace(-3, 4, 1000)
    A, B, a, b = 0.0, 1.5, 1.0, 0.6
    p = a + b
    P = (a * A + b * B) / p
    K = np.exp(-a * b / p * (A - B) ** 2)
    gA = np.exp(-a * (x - A) ** 2)
    gB = np.exp(-b * (x - B) ** 2)
    prod = gA * gB
    assert np.allclose(prod, K * np.exp(-p * (x - P) ** 2))
    fig, ax = plt.subplots(figsize=(7, 3.6))
    ax.plot(x, gA, color=C[0], lw=1.6, label=r"$e^{-\alpha(x-A)^2}$, $\alpha=1.0$")
    ax.plot(x, gB, color=C[1], lw=1.6, label=r"$e^{-\beta(x-B)^2}$, $\beta=0.6$")
    ax.plot(x, prod, color="k", lw=2.2, label=r"product $= K\,e^{-(\alpha+\beta)(x-P)^2}$")
    for xx, lab in [(A, "A"), (B, "B"), (P, "P")]:
        ax.axvline(xx, color="#888", lw=0.7, ls=":")
        ax.text(xx, 1.04, lab, ha="center")
    ax.set_ylim(0, 1.12)
    ax.set_xlabel("x (bohr)")
    ax.set_ylabel("value")
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    save(fig, "l02-gaussian-product")


# --------------------------------------------------------------------------
# l02-convergence: (a) schematic E(n) = E_CBS + A exp(-alpha n);
#                  (b) real basis-function counts for H2O and relative N^4 cost
# --------------------------------------------------------------------------
# shells per atom (pure/spherical functions), from the published compositions
SHELLS = {
    "def2": {2: {"H": "2s1p", "O": "3s2p1d"}, 3: {"H": "3s1p", "O": "5s3p2d1f"}, 4: {"H": "4s3p2d1f", "O": "7s4p3d2f1g"}},
    "cc": {2: {"H": "2s1p", "O": "3s2p1d"}, 3: {"H": "3s2p1d", "O": "4s3p2d1f"}, 4: {"H": "4s3p2d1f", "O": "5s4p3d2f1g"}},
}
L = "spdfg"


def nbf(shells):
    import re
    return sum(int(n) * (2 * L.index(l) + 1) for n, l in re.findall(r"(\d+)([spdfg])", shells))


def fig_convergence():
    n = np.array([2, 3, 4, 5, 6])
    nn = np.linspace(2, 6, 200)
    Ecbs, A, al = 0.0, 1.0, 1.4
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    ax[0].plot(nn, Ecbs + A * np.exp(-al * (nn - 2)), color=C[0], lw=1.8)
    ax[0].plot(n, Ecbs + A * np.exp(-al * (n - 2)), "o", color=C[0])
    ax[0].axhline(Ecbs, color="k", lw=0.8, ls="--")
    ax[0].text(4.6, 0.05, r"CBS limit, $E_\mathrm{CBS}$")
    ax[0].set_xticks(n, ["D (2)", "T (3)", "Q (4)", "5", "6"])
    ax[0].set_yticks([])
    ax[0].set_xlabel("cardinal number n")
    ax[0].set_ylabel(r"$E(n)$ (arbitrary units)")
    ax[0].set_title("(a) SCHEMATIC: variational energy vs n")
    counts = {fam: [2 * nbf(SHELLS[fam][z]["H"]) + nbf(SHELLS[fam][z]["O"]) for z in (2, 3, 4)] for fam in SHELLS}
    print("  H2O counts:", counts)
    assert counts == {"def2": [24, 43, 117], "cc": [24, 58, 115]}
    x = np.arange(3)
    w = 0.38
    for i, (fam, lab) in enumerate([("def2", "def2-SVP / TZVP / QZVP"), ("cc", "cc-pVDZ / TZ / QZ")]):
        bars = ax[1].bar(x + (i - 0.5) * w, counts[fam], w, color=C[i], label=lab)
        for bx, c in zip(bars, counts[fam]):
            rel = (c / 24) ** 4
            ax[1].text(bx.get_x() + w / 2, c + 2, f"{c}\n×{rel:,.0f}", ha="center", fontsize=8.5)
    ax[1].set_xticks(x, ["double-ζ", "triple-ζ", "quadruple-ζ"])
    ax[1].set_ylim(0, 150)
    ax[1].set_ylabel("basis functions K for H$_2$O")
    ax[1].set_title(r"(b) H$_2$O: K and formal $K^4$ cost vs double-ζ")
    ax[1].legend(frameon=False, fontsize=9, loc="upper left")
    save(fig, "l02-convergence")


# --------------------------------------------------------------------------
# l03-workflow: from a geometry to a reaction-energy error
# --------------------------------------------------------------------------
def fig_workflow():
    steps = [
        ("geometry", ".xyz file\ncharge, multiplicity"),
        ("input", r"\$molecule + \$rem" "\n(IQmol setup)"),
        ("server", "Q-Chem runs\n(≤ 10 min)"),
        ("output", "total energy,\nSCF cycles, time, K"),
        ("ΔE", "Σ ν·E × 627.5095\nkcal/mol"),
        ("error", "ε = ΔE − ΔE(ref)"),
    ]
    fig, ax = plt.subplots(figsize=(11, 2.3))
    ax.set_xlim(0, 6 * 1.8)
    ax.set_ylim(0, 1.6)
    ax.axis("off")
    for i, (t, s) in enumerate(steps):
        x0 = i * 1.8 + 0.1
        ax.add_patch(plt.Rectangle((x0, 0.2), 1.45, 1.2, fc="#eef3fa", ec=C[0], lw=1.4))
        ax.text(x0 + 0.725, 1.12, t, ha="center", va="center", fontsize=12, weight="bold", color=C[0])
        ax.text(x0 + 0.725, 0.6, s, ha="center", va="center", fontsize=9)
        if i < len(steps) - 1:
            ax.annotate("", xy=(x0 + 1.75, 0.8), xytext=(x0 + 1.47, 0.8),
                        arrowprops=dict(arrowstyle="->", lw=1.4, color="#333"))
    save(fig, "l03-workflow")


if __name__ == "__main__":
    fig_hydrogen()
    fig_h2_pes()
    fig_sto_gto()
    fig_gpt()
    fig_convergence()
    fig_workflow()
