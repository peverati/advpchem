"""Figures for lecture decks 7-15. Run from anywhere: python3 l07_l15_slides.py
Only analytic models or clearly labeled schematics; no experimental or course data."""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NAVY, BLUE, ORANGE, GREY, RED, GREEN = "#00205b", "#0a5bb5", "#d9822b", "#6c757d", "#c0392b", "#2e8b57"
plt.rcParams.update({"font.size": 20, "axes.titlesize": 22, "axes.labelsize": 21,
                     "axes.spines.top": False, "axes.spines.right": False,
                     "axes.linewidth": 1.5, "figure.dpi": 100, "savefig.dpi": 150})

def save(fig, name):
    fig.savefig(os.path.join(OUT, name), bbox_inches="tight", facecolor="white")
    plt.close(fig)

# ---- l07: error statistics (schematic, illustrative numbers) ----
def l07():
    e = np.array([-3.0, 2.5, -1.0, 4.0, -2.5])
    fig, ax = plt.subplots(figsize=(8.5, 5))
    ax.bar(range(1, 6), e, color=[BLUE if v > 0 else ORANGE for v in e])
    ax.axhline(0, color="k", lw=1.5)
    ax.axhline(e.mean(), color=NAVY, ls="--", lw=2)
    ax.axhline(abs(e).mean(), color=RED, ls=":", lw=2.5)
    ax.text(5.55, e.mean() + 0.25, f"MSE = {e.mean():.1f}", color=NAVY, ha="right", va="bottom")
    ax.text(5.55, abs(e).mean() + 0.2, f"MAE = {abs(e).mean():.1f}", color=RED, ha="right", va="bottom")
    ax.set_xlabel("reaction (schematic)")
    ax.set_ylabel("signed error (kcal/mol)")
    ax.set_title("Illustrative numbers only")
    ax.set_xticks(range(1, 6))
    ax.set_ylim(-4.5, 5.5)
    save(fig, "l07-error-statistics.png")

# ---- l08: damped vs undamped dispersion (schematic model, arbitrary units) ----
def l08():
    R = np.linspace(0.7, 4.0, 400)
    C6 = 1.0
    und = -C6 / R**6
    a1, a2, R0 = 0.4, 0.5, 1.0   # rational (Becke-Johnson-type) damping, arbitrary parameters
    damp = -C6 / (R**6 + (a1 * R0 + a2) ** 6)
    fig, ax = plt.subplots(figsize=(8.5, 5.2))
    ax.plot(R, und, color=RED, lw=3, label=r"undamped $-C_6/R^6$")
    ax.plot(R, damp, color=BLUE, lw=3, label="damped (finite at small R)")
    ax.set_ylim(-1.6, 0.15)
    ax.set_xlim(0.7, 4.0)
    ax.axhline(0, color="k", lw=1)
    ax.set_xlabel("distance R (arbitrary units)")
    ax.set_ylabel("dispersion energy (arb. units)")
    ax.set_title("Schematic: why -D needs damping")
    ax.legend(frameon=False, loc="lower right", fontsize=19)
    save(fig, "l08-dispersion-damping.png")

# ---- l09: delocalization error and static correlation (schematic) ----
def l09():
    x = np.linspace(0, 2, 200)
    exact = np.where(x <= 1, -x, -1 - (x - 1) * 1.6)  # piecewise linear E(N)
    # approximate functional: curve bows below the straight lines at fractional N
    bump = 0.5 * np.sin(np.pi * (x % 1)) * (x > 0) * (x < 2)
    approx = exact - bump
    fig, axs = plt.subplots(1, 2, figsize=(13, 5.2))
    ax = axs[0]
    ax.plot(x, exact, color=NAVY, lw=3, label="exact: straight lines")
    ax.plot(x, approx, color=RED, lw=3, label="approximate functional")
    ax.set_xticks([0, 1, 2]); ax.set_xticklabels(["N-1", "N", "N+1"])
    ax.set_yticks([]); ax.set_ylabel("energy"); ax.set_xlabel("electron number")
    ax.set_title("Delocalization error")
    ax.legend(frameon=False, fontsize=17, loc="upper right")
    ax = axs[1]
    r = np.linspace(0.6, 5, 300)
    De, re, a = 1.0, 1.0, 1.3
    morse = De * (1 - np.exp(-a * (r - re))) ** 2 - De
    rhf = morse + 0.0
    # RHF-like: wrong dissociation limit rises to a high plateau (schematic)
    rhf = morse + 0.9 * (1 - np.exp(-0.9 * (r - re) ** 2)) * (r > re) * 1.0
    ax.plot(r, morse, color=NAVY, lw=3, label="exact (Morse model)")
    ax.plot(r, rhf, color=RED, lw=3, label="restricted, one determinant")
    ax.set_ylim(-1.2, 1.0); ax.set_yticks([]); ax.set_xticks([])
    ax.set_xlabel("bond length"); ax.set_ylabel("energy")
    ax.set_title("Static correlation")
    ax.legend(frameon=False, fontsize=17, loc="lower right")
    fig.suptitle("Schematics, not calculated data", fontsize=18, color=GREY, y=-0.02)
    fig.tight_layout()
    save(fig, "l09-failures-schematic.png")

# ---- l10: error cancellation (schematic) ----
def l10():
    labels = ["small basis\n(BSIE)", "functional\nerror", "net error"]
    vals = [-4.0, 4.5, 0.5]
    fig, ax = plt.subplots(figsize=(8.5, 5.2))
    ax.bar(labels, vals, color=[ORANGE, BLUE, GREEN], width=0.55)
    ax.axhline(0, color="k", lw=1.5)
    ax.set_ylabel("signed error (arb. units)")
    ax.set_title("Schematic: right for the wrong reason")
    ax.set_ylim(-6, 6)
    ax.set_yticks([])
    save(fig, "l10-error-cancellation.png")

# ---- l11: real Becke weights (3 iterations of the Becke polynomial) ----
def becke_s(mu):
    f = mu
    for _ in range(3):
        f = 1.5 * f - 0.5 * f**3
    return 0.5 * (1 - f)

def l11():
    fig, axs = plt.subplots(1, 2, figsize=(14, 5.6), gridspec_kw={"width_ratios": [1, 1.1]})
    ax = axs[0]
    z = np.linspace(-1.5, 2.5, 500)
    R = 1.0
    muAB = (np.abs(z - 0) - np.abs(z - R)) / R
    wA = becke_s(muAB)
    ax.plot(z, wA, color=BLUE, lw=3, label="weight of atom A")
    ax.plot(z, 1 - wA, color=ORANGE, lw=3, label="weight of atom B")
    ax.axvline(0, color=GREY, ls=":"); ax.axvline(R, color=GREY, ls=":")
    ax.text(0, 1.06, "A", ha="center", color=BLUE); ax.text(R, 1.06, "B", ha="center", color=ORANGE)
    ax.set_xlabel("position along the A-B axis"); ax.set_ylabel("cell weight")
    ax.set_ylim(-0.05, 1.2); ax.legend(frameon=False, fontsize=17, loc="center right")
    ax.set_title("Two atoms: weights sum to 1")
    ax = axs[1]
    atoms = np.array([[0.0, 0.0], [1.8, 0.0], [0.9, 1.4]])
    xs = np.linspace(-1.2, 3.0, 500); ys = np.linspace(-1.2, 2.6, 400)
    X, Y = np.meshgrid(xs, ys)
    P = []
    for i in range(3):
        p = np.ones_like(X)
        for j in range(3):
            if i == j: continue
            ri = np.hypot(X - atoms[i, 0], Y - atoms[i, 1]); rj = np.hypot(X - atoms[j, 0], Y - atoms[j, 1])
            Rij = np.hypot(*(atoms[i] - atoms[j]))
            p *= becke_s((ri - rj) / Rij)
        P.append(p)
    P = np.array(P); W = P / P.sum(0)
    cmap = matplotlib.colors.ListedColormap([BLUE, ORANGE, GREEN])
    ax.imshow(np.argmax(W, 0), origin="lower", extent=[xs[0], xs[-1], ys[0], ys[-1]], cmap=cmap, alpha=0.35)
    for i, c in enumerate([BLUE, ORANGE, GREEN]):
        ax.contour(X, Y, W[i], levels=[0.5], colors=[c], linewidths=2.5)
        ax.plot(*atoms[i], "o", color=c, ms=14, mec="k")
    ax.set_aspect("equal"); ax.set_xticks([]); ax.set_yticks([])
    ax.spines[:].set_visible(False)
    ax.set_title("Three atoms: cells overlap smoothly")
    fig.tight_layout()
    save(fig, "l11-becke-weights.png")

def l11b():
    fig, ax = plt.subplots(figsize=(6.2, 6.2))
    n = 7
    for r in np.linspace(0.18, 1, n):
        ax.add_patch(Circle((0, 0), r, fill=False, ec=GREY, lw=1.5))
    rng = np.random.default_rng(3)
    for r in np.linspace(0.18, 1, n):
        # angular points on a circle (2D cartoon of a Lebedev sphere), fewer near the nucleus (pruning)
        m = int(6 + 22 * (r - 0.18) / 0.82)
        t = np.linspace(0, 2 * np.pi, m, endpoint=False) + rng.uniform(0, 1)
        ax.plot(r * np.cos(t), r * np.sin(t), "o", color=BLUE, ms=7)
    ax.plot(0, 0, "o", color=NAVY, ms=15)
    ax.set_xlim(-1.15, 1.15); ax.set_ylim(-1.15, 1.15); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title("Cartoon: radial shells x angular points", fontsize=19)
    save(fig, "l11-radial-angular.png")

def l11c():
    # real arithmetic: unpruned (Nr, Nang) products
    names = ["(75,302)", "(99,590)", "(175,974)"]
    pts = [75 * 302, 99 * 590, 175 * 974]
    fig, ax = plt.subplots(figsize=(8.5, 5))
    ax.bar(names, pts, color=[BLUE, BLUE, BLUE], width=0.55)
    for i, p in enumerate(pts):
        ax.text(i, p + 3000, f"{p:,}", ha="center", fontsize=19)
    ax.set_ylabel("points per atom (unpruned)")
    ax.set_ylim(0, 200000)
    ax.set_title("Grid size = radial x angular")
    save(fig, "l11-grid-sizes.png")

# ---- l12: minimum vs saddle point (schematic) ----
def l12():
    fig = plt.figure(figsize=(13, 5.6))
    x = np.linspace(-1, 1, 60); X, Y = np.meshgrid(x, x)
    for k, (Z, t) in enumerate([(X**2 + Y**2, "Stable: a true minimum"), (X**2 - Y**2, "Unstable: a saddle point")]):
        ax = fig.add_subplot(1, 2, k + 1, projection="3d")
        ax.plot_surface(X, Y, Z, cmap="Blues" if k == 0 else "Oranges", alpha=0.85, linewidth=0, antialiased=True)
        ax.scatter([0], [0], [0], color=RED, s=140, depthshade=False)
        ax.set_xlabel("orbital rotation 1", labelpad=-6, fontsize=16); ax.set_ylabel("orbital rotation 2", labelpad=-6, fontsize=16)
        ax.set_zlabel("energy", labelpad=-6, fontsize=16)
        ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([])
        ax.set_title(t, fontsize=21, pad=-4)
        ax.view_init(elev=24, azim=-58)
    fig.text(0.5, 0.02, "Schematic: the red dot is a converged SCF solution", ha="center", color=GREY, fontsize=17)
    save(fig, "l12-landscape.png")

# ---- l13: ladder from electronic energy to enthalpy (schematic) + D_e vs D_0 ----
def l13():
    fig, axs = plt.subplots(1, 2, figsize=(14, 5.8))
    ax = axs[0]
    r = np.linspace(0.75, 3.2, 300)
    V = (1 - np.exp(-1.6 * (r - 1.0))) ** 2
    ax.plot(r, V, color=NAVY, lw=3)
    ax.hlines(0.12, 0.85, 1.55, color=BLUE, lw=3)  # zero-point level (schematic)
    ax.annotate("", xy=(2.9, 1.0), xytext=(2.9, 0.0), arrowprops=dict(arrowstyle="<->", color=RED, lw=2.5))
    ax.text(2.6, 0.5, r"$D_e$", color=RED, ha="right", va="center", fontsize=24)
    ax.annotate("", xy=(2.15, 1.0), xytext=(2.15, 0.12), arrowprops=dict(arrowstyle="<->", color=GREEN, lw=2.5))
    ax.text(1.95, 0.55, r"$D_0$", color=GREEN, ha="right", va="center", fontsize=24)
    ax.text(1.0, 0.27, "ZPE", color=BLUE, ha="center", fontsize=18)
    ax.set_ylim(-0.1, 1.15); ax.set_xticks([]); ax.set_yticks([])
    ax.set_xlabel("bond length"); ax.set_ylabel("energy")
    ax.set_title(r"$D_e$ vs $D_0$")
    ax = axs[1]
    labels = [r"$\Delta E_{el}$", r"$+\,\Delta ZPE$", r"$\Delta E_0$", r"$+\,$thermal", r"$\Delta H_{298}$"]
    heights = [1.0, 0.18, 1.18, 0.14, 1.32]
    bottoms = [0, 1.0, 0, 1.18, 0]
    cols = [BLUE, ORANGE, NAVY, ORANGE, GREEN]
    ax.bar(range(5), heights, bottom=bottoms, color=cols, width=0.62)
    ax.set_xticks(range(5)); ax.set_xticklabels(labels, fontsize=19)
    ax.set_yticks([]); ax.set_ylabel("reaction energy (schematic)")
    ax.set_title("The ladder to an experimental number")
    fig.tight_layout()
    save(fig, "l13-energy-ladder.png")

# ---- l14: decision flow (schematic) ----
def l14():
    fig, ax = plt.subplots(figsize=(13, 5.4))
    ax.axis("off"); ax.set_xlim(0, 13); ax.set_ylim(0, 5.4)
    boxes = ["1  Property and\nsystem size", "2  Known failure modes\n(open shell, metals,\nnoncovalent)", "3  Benchmark evidence\nfor this reaction type",
             "4  Basis, ECP,\ndispersion, grid,\nstability", "5  Cost check and\nreport everything"]
    w, h = 2.25, 2.3
    for i, b in enumerate(boxes):
        x = 0.15 + i * 2.57
        ax.add_patch(plt.Rectangle((x, 1.4), w, h, fc="#f2f5fa", ec=NAVY, lw=2.5))
        ax.text(x + w / 2, 1.4 + h / 2, b, ha="center", va="center", fontsize=17, color=NAVY)
        if i < 4:
            ax.annotate("", xy=(x + 2.55, 2.55), xytext=(x + w + 0.02, 2.55), arrowprops=dict(arrowstyle="->", color=NAVY, lw=2.5))
    ax.text(6.5, 0.6, "If a step fails, go back: choose a cheaper or more suitable level", ha="center", fontsize=18, color=GREY)
    save(fig, "l14-decision-flow.png")

# ---- l15: error hierarchy (schematic) ----
def l15():
    fig, ax = plt.subplots(figsize=(9, 5.2))
    labels = ["method\n(functional)", "basis set", "integration\ngrid", "SCF solution\nand convergence"]
    typ = [10, 4, 1.2, 0.5]
    ax.barh(labels[::-1], typ[::-1], color=[GREEN, ORANGE, BLUE, NAVY][::-1], height=0.6)
    ax.set_xticks([]); ax.set_xlabel("typical size of the error (schematic, arbitrary units)")
    ax.set_title("Usual ordering; any of them can bite")
    save(fig, "l15-error-hierarchy.png")

for f in (l07, l08, l09, l10, l11, l11b, l11c, l12, l13, l14, l15):
    f()
print("done")
