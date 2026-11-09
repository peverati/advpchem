"""Figures for handouts l07-l10 (Advanced Physical Chemistry, CHM 5111).

Every curve is an analytic model or a clearly labeled schematic. No
computed "results" are plotted. Run from anywhere:

    python3 l07_l10_figures.py

Writes PNG files into lab-site/lectures/images/.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent.parent
plt.rcParams.update({"font.size": 11, "axes.spines.top": False, "axes.spines.right": False,
                     "savefig.dpi": 200, "savefig.bbox": "tight"})
BLUE, ORANGE, GREEN, RED, GREY = "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#7f7f7f"
EH = 627.5095          # kcal/mol per hartree
BOHR = 0.529177        # angstrom per bohr


def l07_cost_scaling():
    """Ideal power laws t = a N^n, and the same N^4 law with a fixed overhead."""
    n_bf = np.logspace(np.log10(30), np.log10(800), 200)
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for n, c in [(2, GREEN), (3, ORANGE), (4, BLUE)]:
        ax.plot(n_bf, 1.0 * (n_bf / 100) ** n, color=c, lw=2, label=f"t ∝ N$^{n}$")
    t0 = 3.0
    ax.plot(n_bf, t0 + (n_bf / 100) ** 4, color=RED, lw=2, ls="--",
            label="N$^4$ + fixed overhead (3 time units)")
    ax.set_xscale("log"); ax.set_yscale("log")
    ax.set_xlabel("number of basis functions N")
    ax.set_ylabel("wall time (arbitrary units)")
    ax.set_title("Model cost curves on a log–log plot")
    ax.legend(frameon=False, fontsize=9)
    ax.grid(True, which="major", alpha=0.3)
    fig.savefig(OUT / "l07-cost-scaling.png")
    plt.close(fig)


def l08_dispersion():
    """(a) Lennard-Jones model of Ar2 split into its two terms.
    (b) -C6/R^6 with no damping, rational (Becke-Johnson-type) damping and
    zero (Fermi-type) damping. C6(Ar-Ar) = 64.3 Eh bohr^6; damping radii are
    illustrative."""
    eps, sigma = 0.285, 3.35            # kcal/mol, angstrom (LJ model of Ar2)
    r = np.linspace(2.9, 7.0, 400)
    rep = 4 * eps * (sigma / r) ** 12
    att = -4 * eps * (sigma / r) ** 6
    c6 = 64.3 * EH * BOHR ** 6          # kcal/mol * angstrom^6
    rr = np.linspace(0.5, 7.0, 500)
    undamped = -c6 / rr ** 6
    r0 = 3.0
    bj = -c6 / (rr ** 6 + r0 ** 6)
    zero = -c6 / rr ** 6 / (1 + np.exp(-20 * (rr / (1.1 * r0) - 1)))

    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 4.0))
    a.axhline(0, color=GREY, lw=0.8)
    a.plot(r, rep, color=RED, lw=1.5, ls="--", label="repulsion  +4ε(σ/R)$^{12}$")
    a.plot(r, att, color=BLUE, lw=1.5, ls="--", label="dispersion  −4ε(σ/R)$^{6}$")
    a.plot(r, rep + att, color="k", lw=2.2, label="sum (Lennard-Jones)")
    a.set_ylim(-0.6, 0.6); a.set_xlim(2.9, 7.0)
    a.set_xlabel("Ar–Ar distance R (Å)"); a.set_ylabel("energy (kcal/mol)")
    a.set_title("(a) A model rare-gas dimer")
    a.legend(frameon=False, fontsize=9, loc="lower right")

    b.axhline(0, color=GREY, lw=0.8)
    b.plot(rr, undamped, color=GREY, lw=2, ls=":", label="undamped −C$_6$/R$^6$")
    b.plot(rr, bj, color=BLUE, lw=2, label="rational (BJ-type) damping")
    b.plot(rr, zero, color=ORANGE, lw=2, label="zero (Fermi-type) damping")
    b.set_ylim(-1.6, 0.1); b.set_xlim(0.5, 7.0)
    b.set_xlabel("R (Å)"); b.set_ylabel("dispersion energy (kcal/mol)")
    b.set_title("(b) Why −C$_6$/R$^6$ must be damped")
    b.legend(frameon=False, fontsize=9, loc="lower right")
    fig.tight_layout()
    fig.savefig(OUT / "l08-dispersion-models.png")
    plt.close(fig)


def l09_fractional_charge():
    """Schematic E(N) between N0-1 and N0+1 electrons."""
    ip, ea = 10.0, 2.0                  # arbitrary units: E(N0-1)=+IP, E(N0+1)=-EA
    x = np.linspace(-1, 1, 401)
    exact = np.where(x < 0, -ip * x, -ea * x)
    bow = np.where(x < 0, (x + 1) * (-x), x * (1 - x))   # zero at integers
    convex = exact - 4.4 * bow
    concave = exact + 3.2 * bow
    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    ax.plot(x, exact, "k", lw=2.4, label="exact: straight lines (piecewise linear)")
    ax.plot(x, convex, color=BLUE, lw=2, label="typical approximate functional: bows below")
    ax.plot(x, concave, color=RED, lw=2, ls="--", label="Hartree–Fock: bows above")
    ax.set_xticks([-1, -0.5, 0, 0.5, 1])
    ax.set_xticklabels(["N$_0$−1", "N$_0$−½", "N$_0$", "N$_0$+½", "N$_0$+1"])
    ax.set_xlabel("number of electrons N")
    ax.set_ylabel("E(N) − E(N$_0$)  (arbitrary units)")
    ax.set_title("Schematic: energy vs fractional electron number")
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    fig.savefig(OUT / "l09-fractional-charge.png")
    plt.close(fig)


def l10_error_budget():
    """Schematic error budget: illustrative numbers only."""
    cases = ["large basis\n(near CBS)", "small basis,\nerrors cancel", "small basis,\nerrors add up"]
    method = np.array([4.0, 4.0, 4.0])
    basis = np.array([0.3, -3.5, 3.5])
    total = method + basis
    xpos = np.arange(len(cases))
    w = 0.26
    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    ax.axhline(0, color=GREY, lw=0.8)
    ax.bar(xpos - w, method, w, color=BLUE, label="method (functional) error")
    ax.bar(xpos, basis, w, color=ORANGE, label="basis-set error")
    ax.bar(xpos + w, total, w, color="k", label="total error you observe")
    ax.set_xticks(xpos); ax.set_xticklabels(cases)
    ax.set_ylabel("signed error (kcal/mol, illustrative)")
    ax.set_title("Schematic: total error = method error + basis-set error")
    ax.legend(frameon=False, fontsize=9, loc="upper left")
    ax.set_ylim(-5, 9)
    fig.savefig(OUT / "l10-error-budget.png")
    plt.close(fig)


if __name__ == "__main__":
    l07_cost_scaling()
    l08_dispersion()
    l09_fractional_charge()
    l10_error_budget()
    print("figures written to", OUT)
