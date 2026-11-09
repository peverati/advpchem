"""Figures for lecture decks 1-6 (slides/l01 ... l06).

Run:  python3 l01_l06_slides.py   (writes PNG files next to this script's parent folder)
Only real functions, analytic models, or small calculations done here are plotted.
Schematics are labeled as such in the figure itself.
"""
import os
from math import pi, sqrt, erf, exp
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
NAVY, RED, GRAY, TEAL, GOLD = "#00205b", "#c8102e", "#6c757d", "#0b7a75", "#d48a00"
plt.rcParams.update({
    "font.size": 20, "axes.labelsize": 22, "axes.titlesize": 22,
    "legend.fontsize": 18, "xtick.labelsize": 19, "ytick.labelsize": 19,
    "axes.spines.top": False, "axes.spines.right": False,
    "lines.linewidth": 3.2, "figure.dpi": 100, "savefig.dpi": 150,
    "font.family": "DejaVu Sans", "mathtext.fontset": "dejavusans",
})


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("wrote", name)


# ---------------------------------------------------------------- Class 1
def l01_h_radial():
    r = np.linspace(1e-4, 24, 4000)
    R = {
        "1s": 2 * np.exp(-r),
        "2s": (1 / (2 * sqrt(2))) * (2 - r) * np.exp(-r / 2),
        "2p": (1 / (2 * sqrt(6))) * r * np.exp(-r / 2),
        "3s": (2 / (81 * sqrt(3))) * (27 - 18 * r + 2 * r**2) * np.exp(-r / 3),
    }
    col = {"1s": NAVY, "2s": RED, "2p": TEAL, "3s": GOLD}
    fig, ax = plt.subplots(1, 2, figsize=(13, 5.2))
    for k, v in R.items():
        ax[0].plot(r, v, color=col[k], label=k)
        ax[1].plot(r, r**2 * v**2, color=col[k], label=k)
    ax[0].axhline(0, color=GRAY, lw=1)
    ax[0].set_xlim(0, 14); ax[0].set_ylim(-0.25, 2.1)
    ax[0].set_xlabel(r"$r\ (a_0)$"); ax[0].set_ylabel(r"$R_{nl}(r)$")
    ax[0].set_title("Radial function")
    ax[0].legend(frameon=False)
    ax[1].set_xlim(0, 24); ax[1].set_xlabel(r"$r\ (a_0)$")
    ax[1].set_ylabel(r"$r^2\,R_{nl}^2$"); ax[1].set_title("Radial distribution")
    ax[1].legend(frameon=False)
    fig.tight_layout()
    save(fig, "l01-h-radial.png")


def l01_pes():
    R = np.linspace(0.55, 4.0, 400)
    De, a, Re = 1.0, 1.6, 1.0
    E = De * (1 - np.exp(-a * (R - Re))) ** 2 - De
    fig, ax = plt.subplots(figsize=(8.5, 5.4))
    ax.plot(R, E, color=NAVY)
    ax.axhline(0, color=GRAY, lw=1.5, ls="--")
    ax.annotate("", xy=(Re, -De), xytext=(Re, 0), arrowprops=dict(arrowstyle="<->", color=RED, lw=2.5))
    ax.text(Re + 0.08, -0.55, r"$D_e$", color=RED, fontsize=24)
    ax.plot([Re], [-De], "o", color=RED, ms=11)
    ax.text(Re, -De - 0.2, r"$R_e$", color=RED, ha="center", fontsize=22)
    ax.text(2.6, 0.12, "separated atoms", color=GRAY, fontsize=18)
    ax.set_ylim(-1.35, 0.75); ax.set_xlim(0.5, 4.0)
    ax.set_xlabel("internuclear distance  R"); ax.set_ylabel(r"$E_\mathrm{el}(R)+V_{nn}(R)$")
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_title("Schematic (Morse model, not a calculation)", fontsize=18, color=GRAY)
    save(fig, "l01-pes-schematic.png")


# ---------------------------------------------------------------- Class 2
ZETA = 1.24
STO3G_A = np.array([3.42525091, 0.62391373, 0.16885540])   # H, STO-3G exponents
STO3G_C = np.array([0.15432897, 0.53532814, 0.44463454])   # contraction coefficients


def prim(a, r):
    return (2 * a / pi) ** 0.75 * np.exp(-a * r**2)


def l02_sto_gto():
    r = np.linspace(0, 7, 3000)
    sto = sqrt(ZETA**3 / pi) * np.exp(-ZETA * r)
    sto3g = sum(c * prim(a, r) for a, c in zip(STO3G_A, STO3G_C))
    # best single Gaussian: maximize overlap with the STO on a radial grid
    best, bo = None, -1
    w = 4 * pi * r**2
    for a in np.linspace(0.1, 1.2, 2200):
        g = prim(a, r)
        o = np.trapz(w * g * sto, r)
        if o > bo:
            best, bo = a, o
    g1 = prim(best, r)
    n3 = np.trapz(w * sto3g**2, r)
    print("STO-3G norm", round(n3, 4), " best 1-Gaussian alpha", round(best, 4), "overlap", round(bo, 4))
    fig, ax = plt.subplots(1, 2, figsize=(13.5, 5.4))
    for a_ in ax:
        a_.plot(r, sto, color=NAVY, label=r"STO ($\zeta=1.24$)")
        a_.plot(r, g1, color=RED, ls="--", label="1 Gaussian")
        a_.plot(r, sto3g, color=TEAL, ls="-.", label="STO-3G (3 Gaussians)")
    ax[0].set_xlim(0, 2.5); ax[0].set_xlabel(r"$r\ (a_0)$"); ax[0].set_ylabel(r"$\chi(r)$")
    ax[0].set_title("Near the nucleus: the cusp"); ax[0].legend(frameon=False, loc="upper right")
    ax[1].set_yscale("log"); ax[1].set_xlim(0, 7); ax[1].set_ylim(1e-6, 2)
    ax[1].set_xlabel(r"$r\ (a_0)$"); ax[1].set_title("Far away: the tail")
    fig.tight_layout()
    save(fig, "l02-h1s-sto-gto.png")


def l02_cost():
    labels = ["cc-pVDZ", "cc-pVTZ", "cc-pVQZ"]
    N = np.array([24, 58, 115])   # H2O, spherical functions
    rel = (N / N[0]) ** 4
    fig, ax = plt.subplots(figsize=(9.5, 5.4))
    bars = ax.bar(labels, rel, color=[NAVY, TEAL, RED], width=0.55)
    ax.set_yscale("log"); ax.set_ylim(0.7, 2000)
    ax.set_ylabel(r"relative cost, formal $N^4$")
    for b, n, v in zip(bars, N, rel):
        ax.text(b.get_x() + b.get_width() / 2, v * 1.25, f"N = {n}\n{v:.0f}x", ha="center", fontsize=18)
    ax.set_title(r"H$_2$O: formal $N^4$ scaling (not measured)", fontsize=18, color=GRAY)
    save(fig, "l02-cost-scaling.png")


# ---------------------------------------------------------------- Class 4
def _f0(t):
    return 1.0 if t < 1e-12 else 0.5 * sqrt(pi / t) * erf(sqrt(t))


def h2_curves(Rs):
    A, C = STO3G_A, STO3G_C
    n = 3
    Nrm = (2 * A / pi) ** 0.75
    out = []
    for R in Rs:
        cen = [0.0, R]
        # contracted basis functions: list of (exps, coefs*norm, center)
        bf = [(A, C * Nrm, cen[0]), (A, C * Nrm, cen[1])]
        K = 2
        S = np.zeros((K, K)); T = np.zeros((K, K)); V = np.zeros((K, K))
        for i in range(K):
            for j in range(K):
                for a, ca in zip(bf[i][0], bf[i][1]):
                    for b, cb in zip(bf[j][0], bf[j][1]):
                        p = a + b; q = a * b / p; d2 = (bf[i][2] - bf[j][2]) ** 2
                        pre = ca * cb * (pi / p) ** 1.5 * exp(-q * d2)
                        S[i, j] += pre
                        T[i, j] += pre * q * (3 - 2 * q * d2)
                        P = (a * bf[i][2] + b * bf[j][2]) / p
                        for c in cen:
                            V[i, j] += -ca * cb * 2 * pi / p * exp(-q * d2) * _f0(p * (P - c) ** 2)
        h = T + V
        ERI = np.zeros((K, K, K, K))
        for i in range(K):
            for j in range(K):
                for k in range(K):
                    for l in range(K):
                        s = 0.0
                        for a, ca in zip(bf[i][0], bf[i][1]):
                            for b, cb in zip(bf[j][0], bf[j][1]):
                                for c, cc in zip(bf[k][0], bf[k][1]):
                                    for d, cd in zip(bf[l][0], bf[l][1]):
                                        p = a + b; q = c + d
                                        P = (a * bf[i][2] + b * bf[j][2]) / p
                                        Q = (c * bf[k][2] + d * bf[l][2]) / q
                                        kab = exp(-a * b / p * (bf[i][2] - bf[j][2]) ** 2)
                                        kcd = exp(-c * d / q * (bf[k][2] - bf[l][2]) ** 2)
                                        s += ca * cb * cc * cd * 2 * pi**2.5 / (p * q * sqrt(p + q)) * kab * kcd * _f0(p * q / (p + q) * (P - Q) ** 2)
                        ERI[i, j, k, l] = s
        # symmetric orthogonalization; sigma_g and sigma_u by symmetry
        Cg = np.array([1, 1]) / sqrt(2 * (1 + S[0, 1]))
        Cu = np.array([1, -1]) / sqrt(2 * (1 - S[0, 1]))
        mo = [Cg, Cu]
        hm = lambda a, b: mo[a] @ h @ mo[b]
        g = lambda a, b, c, d: np.einsum("i,j,k,l,ijkl", mo[a], mo[b], mo[c], mo[d], ERI)
        Vnn = 1.0 / R
        e_rhf = 2 * hm(0, 0) + g(0, 0, 0, 0) + Vnn
        H = np.array([[2 * hm(0, 0) + g(0, 0, 0, 0), g(0, 1, 0, 1)],
                      [g(0, 1, 0, 1), 2 * hm(1, 1) + g(1, 1, 1, 1)]])
        e_fci = np.linalg.eigvalsh(H)[0] + Vnn
        out.append((R, e_rhf, e_fci))
    return np.array(out)


def l04_h2():
    Rs = np.concatenate([np.linspace(0.5, 3.0, 26), np.linspace(3.25, 8.0, 20)])
    d = h2_curves(Rs)
    chk = h2_curves([1.4])[0]
    print("H2 R=1.4 bohr  RHF %.4f  FCI %.4f  (literature STO-3G: -1.1167, -1.1373)" % (chk[1], chk[2]))
    # H atom STO-3G energy for the dissociation limit (exact in this basis: one-electron problem)
    e_h = h2_curves([60.0])[0][2]  # full CI at very large R = 2 E(H)
    print("2 E(H) STO-3G from large-R FCI:", round(e_h, 4))
    fig, ax = plt.subplots(figsize=(10, 5.8))
    ax.plot(d[:, 0], d[:, 1], color=RED, label="RHF")
    ax.plot(d[:, 0], d[:, 2], color=NAVY, label="exact in this basis (full CI)")
    ax.axhline(e_h, color=GRAY, ls="--", lw=2)
    ax.text(5.0, e_h - 0.045, r"$2\,E(\mathrm{H})$", color=GRAY, fontsize=20)
    ax.set_ylim(-1.2, -0.4); ax.set_xlim(0.5, 8)
    ax.set_xlabel(r"H–H distance (bohr)"); ax.set_ylabel(r"$E\ (E_\mathrm{h})$")
    ax.legend(frameon=False, loc="lower right")
    ax.set_title(r"H$_2$, minimal basis (STO-3G), computed here", fontsize=18, color=GRAY)
    save(fig, "l04-h2-dissociation.png")


# ---------------------------------------------------------------- Class 5
def l05_density():
    r = np.linspace(0, 6, 1200)
    rho = np.exp(-2 * r) / pi
    fig, ax = plt.subplots(figsize=(9.5, 5.4))
    ax.plot(r, rho, color=NAVY, label=r"$\rho(r)=e^{-2r}/\pi$")
    ax.plot(r, 4 * pi * r**2 * rho, color=RED, label=r"$4\pi r^2\rho(r)$ (integrates to 1)")
    ax.set_xlabel(r"$r\ (a_0)$"); ax.set_ylabel("density (atomic units)")
    ax.legend(frameon=False); ax.set_xlim(0, 6)
    ax.set_title("Hydrogen atom, exact ground state", fontsize=18, color=GRAY)
    save(fig, "l05-h-density.png")


def l05_lda():
    rs = np.linspace(0.5, 6, 300)
    ex = -(3 / 4) * (3 / (2 * pi)) ** (2 / 3) / rs   # exchange energy per electron, unpolarized gas
    fig, ax = plt.subplots(figsize=(9.5, 5.4))
    ax.plot(rs, ex, color=NAVY)
    ax.set_xlabel(r"Wigner–Seitz radius $r_s$ (bohr)")
    ax.set_ylabel(r"$\varepsilon_x\ (E_\mathrm{h})$ per electron")
    ax.set_title(r"Uniform electron gas: $\varepsilon_x=-0.458/r_s$", fontsize=18)
    ax.text(2.3, -0.7, r"$\propto \rho^{1/3}$", fontsize=24, color=RED)
    save(fig, "l05-lda-exchange.png")


# ---------------------------------------------------------------- Class 6
def l06_enhancement():
    s = np.linspace(0, 3, 400)
    kappa, mu = 0.804, 0.2195149727645171
    pbe = 1 + kappa - kappa / (1 + mu * s**2 / kappa)
    beta = 0.0042
    Cx = 1.5 * (3 / (4 * pi)) ** (1 / 3)
    x = 2 * (6 * pi**2) ** (1 / 3) * s
    b88 = 1 + (beta / Cx) * x**2 / (1 + 6 * beta * x * np.arcsinh(x))
    fig, ax = plt.subplots(figsize=(10, 5.8))
    ax.axhline(1, color=GRAY, lw=2, ls=":")
    ax.axhline(1 + kappa, color=GRAY, lw=2, ls=":")
    ax.text(0.05, 1 + kappa + 0.02, r"PBE limit $1+\kappa=1.804$", color=GRAY, fontsize=17)
    ax.text(0.05, 0.93, "LSDA ($F_x=1$)", color=GRAY, fontsize=17, va="top")
    ax.plot(s, b88, color=RED, label="B88")
    ax.plot(s, pbe, color=NAVY, label="PBE")
    ax.set_xlabel(r"reduced gradient  $s=|\nabla\rho|/(2k_F\rho)$")
    ax.set_ylabel(r"enhancement factor $F_x(s)$")
    ax.set_ylim(0.8, 2.6); ax.set_xlim(0, 3)
    ax.legend(frameon=False, loc="upper left", bbox_to_anchor=(0.0, 0.8))
    ax.set_title("Exchange enhancement over LSDA, from the published formulas", fontsize=17, color=GRAY)
    save(fig, "l06-gga-enhancement.png")


def l06_ladder():
    rungs = [
        ("Heaven: chemical accuracy", "exact functional", None),
        ("5", "virtual orbitals", "double hybrids, RPA"),
        ("4", "exact (HF) exchange", "hybrids"),
        ("3", r"KE density $\tau$", "meta-GGAs"),
        ("2", r"gradient $\nabla\rho$", "GGAs"),
        ("1", r"density $\rho$", "LSDA"),
        ("Earth: Hartree world", "no correlation, no exchange", None),
    ]
    fig, ax = plt.subplots(figsize=(11.5, 7.2))
    ax.set_xlim(0, 11.5); ax.set_ylim(0, 7.2); ax.axis("off")
    top, h = 6.55, 0.9
    for i, (a, b, c) in enumerate(rungs):
        y = top - i * h
        if c is None:
            ax.text(5.75, y - 0.05, a, ha="center", va="center", fontsize=22, color=GRAY, style="italic")
            continue
        shade = ["#dbe4f3", "#c3d2ea", "#a7bddf", "#86a3d1", "#5f82bf"][i - 1]
        box = FancyBboxPatch((0.4, y - 0.38), 10.7, 0.76, boxstyle="round,pad=0.02,rounding_size=0.1",
                             fc=shade, ec=NAVY, lw=2)
        ax.add_patch(box)
        ax.text(0.8, y, f"Rung {a}", va="center", fontsize=22, color=NAVY, weight="bold")
        ax.text(3.0, y, "adds  " + b, va="center", fontsize=21, color="black")
        ax.text(10.9, y, c, va="center", ha="right", fontsize=21, color=NAVY, style="italic")
    ax.text(5.75, 0.05, "Schematic after Perdew and Schmidt (2001)", ha="center", fontsize=16, color=GRAY)
    save(fig, "l06-jacobs-ladder.png")


def l06_range_sep():
    r = np.linspace(0.02, 8, 800)
    w = 0.3
    from math import erf as _erf
    ef = np.array([_erf(w * x) for x in r])
    fig, ax = plt.subplots(figsize=(10, 5.6))
    ax.plot(r, 1 / r, color=GRAY, lw=2.5, ls="--", label=r"$1/r$")
    ax.plot(r, ef / r, color=RED, label=r"long range: $\mathrm{erf}(\omega r)/r$  (HF exchange)")
    ax.plot(r, (1 - ef) / r, color=NAVY, label=r"short range: $\mathrm{erfc}(\omega r)/r$  (DFT exchange)")
    ax.set_ylim(0, 2.2); ax.set_xlim(0, 8)
    ax.set_xlabel(r"interelectronic distance $r_{12}$ (bohr)"); ax.set_ylabel("Coulomb operator (atomic units)")
    ax.legend(frameon=False, loc="upper right", fontsize=17)
    ax.set_title(r"Splitting $1/r$ in two; $\omega=0.3$ bohr$^{-1}$ (illustrative value)", fontsize=17, color=GRAY)
    save(fig, "l06-range-separation.png")


if __name__ == "__main__":
    l06_range_sep()
    l01_h_radial(); l01_pes()
    l02_sto_gto(); l02_cost()
    l04_h2()
    l05_density(); l05_lda()
    l06_enhancement(); l06_ladder()
