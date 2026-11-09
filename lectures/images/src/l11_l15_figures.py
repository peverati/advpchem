"""Figures for the handouts of Classes 11-15.

Run from anywhere:  python3 lectures/images/src/l11_l15_figures.py
Writes PNG files into lectures/images/ (names start with l11- ... l15-).

Every curve is either an exact analytic function (Becke's cell function,
Becke's radial mapping, the toy stability model used by the Exp. 8 widget) or
a level diagram built from literature values quoted in the handout text.
No computed results from the experiments are plotted.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parents[1]
plt.rcParams.update({"font.size": 11, "axes.spines.top": False, "axes.spines.right": False,
                     "savefig.dpi": 200, "savefig.bbox": "tight"})
BLUE, ORANGE, GREEN, GREY, RED = "#1f77b4", "#ff7f0e", "#2ca02c", "#7f7f7f", "#d62728"


# ---------------------------------------------------------------- Class 11
def becke_f(mu):
    return 1.5 * mu - 0.5 * mu ** 3


def becke_s(mu, k=3):
    p = mu
    for _ in range(k):
        p = becke_f(p)
    return 0.5 * (1 - p)


def fig_l11_becke_cells():
    """Becke cell weights along the axis of a homonuclear diatomic."""
    R = 1.0  # bond length (arbitrary units); atom A at 0, atom B at R
    z = np.linspace(-0.6, 1.6, 801)
    rA, rB = np.abs(z), np.abs(z - R)
    mu = (rA - rB) / R
    fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
    ax = axes[0]
    for k, c, ls in [(0, GREY, ":"), (1, ORANGE, "--"), (3, BLUE, "-")]:
        sA = becke_s(mu, k)
        ax.plot(z, sA, color=c, ls=ls, lw=2, label=f"$w_A$, $k={k}$" if k else "$w_A$, $k=0$ (linear)")
    ax.plot(z, 1 - becke_s(mu, 3), color=GREEN, lw=2, label="$w_B = 1 - w_A$, $k=3$")
    ax.axvline(0, color="k", lw=0.8)
    ax.axvline(R, color="k", lw=0.8)
    ax.text(0, 1.08, "A", ha="center")
    ax.text(R, 1.08, "B", ha="center")
    ax.set_xlabel("position along the A–B axis (units of $R_{AB}$)")
    ax.set_ylabel("cell weight")
    ax.set_ylim(-0.05, 1.15)
    ax.legend(frameon=False, fontsize=9, loc="center left")
    ax.set_title("(a) Becke's fuzzy cells for a diatomic")

    ax = axes[1]
    m = np.linspace(-1, 1, 401)
    for k, c, ls in [(1, ORANGE, "--"), (2, RED, "-."), (3, BLUE, "-")]:
        ax.plot(m, becke_s(m, k), color=c, ls=ls, lw=2, label=f"$k={k}$")
    ax.set_xlabel(r"elliptical coordinate $\mu_{AB}$")
    ax.set_ylabel(r"$s(\mu_{AB})$")
    ax.legend(frameon=False)
    ax.set_title("(b) the cell function $s_k(\\mu)$")
    fig.tight_layout()
    fig.savefig(OUT / "l11-becke-cells.png")
    plt.close(fig)


def fig_l11_radial_shells():
    """Radial shells from Becke's mapping r = r_m (1+x)/(1-x), x = Gauss-Chebyshev nodes."""
    rm = 1.0  # in units of the atom's Bragg-Slater radius (Becke uses half of it for most atoms)
    fig, ax = plt.subplots(figsize=(9, 2.8))
    for row, n in enumerate([23, 50, 75, 99]):
        i = np.arange(1, n + 1)
        x = np.cos(i * np.pi / (n + 1))
        r = rm * (1 + x) / (1 - x)
        r = r[r < 8]
        ax.plot(r, np.full_like(r, row), "|", ms=14, color=BLUE)
        ax.text(8.15, row, f"{n} shells", va="center", fontsize=10)
    ax.set_yticks([])
    ax.set_xlim(0, 8)
    ax.set_xlabel(r"distance from the nucleus, $r / r_m$ (shells beyond $8\,r_m$ not shown)")
    ax.set_title("Radial shells with Becke's mapping: dense near the nucleus, sparse far out")
    ax.spines["left"].set_visible(False)
    fig.tight_layout()
    fig.savefig(OUT / "l11-radial-shells.png")
    plt.close(fig)


# ---------------------------------------------------------------- Class 12
def fig_l12_stability():
    """Toy model of the Exp. 8 widget: E(theta) = Delta sin^2 theta - sin^2 2 theta."""
    t = np.linspace(-np.pi / 2, np.pi / 2, 601)
    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    for d, c, lab in [(6.0, BLUE, "large gap ($\\Delta = 6$): stable"),
                      (2.0, RED, "small gap ($\\Delta = 2$): unstable")]:
        E = d * np.sin(t) ** 2 - np.sin(2 * t) ** 2
        ax.plot(np.degrees(t), E, color=c, lw=2, label=lab)
    d = 2.0
    ts = np.arccos(d / 4) / 2
    Es = d * np.sin(ts) ** 2 - np.sin(2 * ts) ** 2
    ax.plot([0], [0], "ko", ms=7)
    ax.annotate("SCF converged here:\ngradient = 0", xy=(0, 0), xytext=(-75, 1.7),
                arrowprops=dict(arrowstyle="->"), fontsize=9)
    for s in (1, -1):
        ax.plot([s * np.degrees(ts)], [Es], "o", color=RED, ms=7)
    ax.annotate("lower, stable solutions\n(found by stability analysis)", xy=(np.degrees(ts), Es),
                xytext=(35, -1.6), arrowprops=dict(arrowstyle="->"), fontsize=9)
    ax.axhline(0, color=GREY, lw=0.6)
    ax.set_xlabel(r"orbital-mixing angle $\theta$ (degrees)")
    ax.set_ylabel("energy (arbitrary units)")
    ax.set_ylim(-1.9, 4.2)
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    ax.set_title(r"Schematic: $E(\theta) = \Delta\,\sin^2\theta - \sin^2 2\theta$")
    fig.tight_layout()
    fig.savefig(OUT / "l12-stability-toy.png")
    plt.close(fig)


# ---------------------------------------------------------------- Class 13
def fig_l13_levels():
    """Energy levels for H2 -> 2 H from literature values (kcal/mol).

    D_e = 109.5 (W4-11 reference), harmonic-plus-anharmonic ZPE of H2 = 2170 cm-1
    = 6.20 kcal/mol, D_0 = 103.27 kcal/mol (36118 cm-1), Delta H_298 = 2 x 52.10
    = 104.2 kcal/mol (Delta_f H of H(g) = 217.998 kJ/mol).
    """
    De, zpe, D0, H298 = 109.5, 6.20, 103.27, 104.20
    fig, ax = plt.subplots(figsize=(8, 4.6))
    w = 0.8

    def level(x, y, txt, c="k"):
        ax.plot([x - w / 2, x + w / 2], [y, y], color=c, lw=2.5)
        ax.text(x + w / 2 + 0.05, y, txt, va="center", fontsize=9)

    # Minimum of the H2 potential set to 0
    level(0, 0, "H$_2$ potential minimum")
    level(0, zpe, "H$_2$, $v=0$ (ZPE = 6.2)", BLUE)
    level(2.6, De, "2 H at rest")
    ax.annotate("", xy=(1.65, De), xytext=(1.65, 0), arrowprops=dict(arrowstyle="<->", color=RED, lw=1.5))
    ax.text(1.72, 45, f"$D_e$ = {De}\n(electronic:\nwhat DFT gives)", color=RED, fontsize=9, va="center")
    ax.annotate("", xy=(3.4, De), xytext=(3.4, zpe), arrowprops=dict(arrowstyle="<->", color=BLUE, lw=1.5))
    ax.text(3.47, 45, f"$D_0$ = {D0:.1f}\n= $D_e$ − ZPE\n(0 K)", color=BLUE, fontsize=9, va="center")
    ax.annotate("", xy=(5.0, H298), xytext=(5.0, 0), arrowprops=dict(arrowstyle="<->", color=GREEN, lw=1.5))
    ax.text(5.07, 45, f"$\\Delta H_{{298}}$ = {H298:.1f}\n= $D_0$ + 0.9\n(thermal, 298 K)", color=GREEN, fontsize=9, va="center")
    ax.plot([-0.4, 5.6], [De, De], color=GREY, lw=0.6, ls=":")
    ax.set_xlim(-0.6, 6.4)
    ax.set_ylim(-8, 122)
    ax.set_xticks([])
    ax.set_ylabel("kcal/mol")
    ax.set_title("H$_2$ → 2 H: three different \"bond energies\" (arrow lengths to scale)")
    ax.spines["bottom"].set_visible(False)
    fig.tight_layout()
    fig.savefig(OUT / "l13-h2-levels.png")
    plt.close(fig)


def fig_l13_vib_thermal():
    """Thermal vibrational energy and ZPE of one harmonic mode vs wavenumber at 298.15 K."""
    R = 1.987204e-3  # kcal/(mol K)
    T = 298.15
    c2 = 1.438777  # cm K (second radiation constant hc/k)
    nu = np.linspace(50, 4000, 800)
    theta = c2 * nu
    ethermal = R * theta / (np.exp(theta / T) - 1)
    zpe = 0.5 * R * theta
    fig, ax = plt.subplots(1, 2, figsize=(10, 3.4))
    ax[0].plot(nu, zpe, color=BLUE, lw=2)
    ax[0].set_xlabel(r"harmonic wavenumber $\tilde\nu$ (cm$^{-1}$)")
    ax[0].set_ylabel("kcal/mol")
    ax[0].set_title(r"(a) zero-point energy $\frac{1}{2}hc\tilde\nu N_A$")
    ax[1].plot(nu, ethermal, color=ORANGE, lw=2, label="vibrational thermal energy")
    ax[1].axhline(R * T, color=GREY, ls="--", lw=1, label=r"classical limit $RT$ = 0.59")
    ax[1].set_xlabel(r"harmonic wavenumber $\tilde\nu$ (cm$^{-1}$)")
    ax[1].set_title("(b) thermal energy of one mode at 298 K")
    ax[1].legend(frameon=False, fontsize=9)
    fig.tight_layout()
    fig.savefig(OUT / "l13-vib-energy.png")
    plt.close(fig)


if __name__ == "__main__":
    fig_l11_becke_cells()
    fig_l11_radial_shells()
    fig_l12_stability()
    fig_l13_levels()
    fig_l13_vib_thermal()
    print("figures written to", OUT)
