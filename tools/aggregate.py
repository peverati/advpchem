#!/usr/bin/env python3
"""Collect student submissions into a gradebook and an anonymized class summary.

Usage (from lab-site/):
    python3 tools/aggregate.py ex03 "~/OneDrive - Florida Institute of Technology/Apps/Microsoft Forms/Experiment 3/Question 1"
    python3 tools/aggregate.py ex03 path/to/folder --include-muddiest

Reads every *.json submission under the folder (recursively); if a student
uploaded several times, the latest file (by its 'generated_at') counts.

Writes:
  gradebook/exNN_gradebook.xlsx   private: names, completeness, answers, MAE
  data/class/exNN.json            anonymized: per method/reaction median and
                                   quartiles of the signed error, the
                                   functional-draft league, optional muddiest points
Then set "release_class_results": true for that experiment in data/course.json
and publish the site when you want students to see the comparison.

Reaction energies for the class statistics are recomputed from the students'
total energies (not their typed ΔE), so arithmetic slips don't skew the medians.
"""
import argparse
import json
import pathlib
import statistics
import sys
from collections import defaultdict
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parents[1]
HARTREE_TO_KCAL = 627.5095


def num(v):
    try:
        s = str(v).strip().replace("−", "-").replace("–", "-").replace(",", "")
        return float(s) if s else None
    except (TypeError, ValueError):
        return None


def load_exp(exp_id):
    return json.loads((ROOT / "data" / "experiments" / f"{exp_id}.json").read_text())


def conditions(exp):
    return [(f"{m['id']}|{b['id']}", m, b) for b in exp.get("bases", []) for m in exp.get("methods", [])]


def recomputed_delta(sub, cond, rxn):
    total = 0.0
    for sid, nu in rxn["nu"].items():
        e = num(sub.get("results", {}).get(cond, {}).get(sid, {}).get("energy"))
        if e is None:
            return None
        total += nu * e
    return total * HARTREE_TO_KCAL


def load_submissions(folder, exp_id):
    latest = {}
    for p in pathlib.Path(folder).expanduser().rglob("*.json"):
        try:
            d = json.loads(p.read_text())
        except Exception as e:  # noqa: BLE001
            print(f"  skip {p.name}: not valid JSON ({e})", file=sys.stderr)
            continue
        if d.get("experiment") != exp_id:
            continue
        st = d.get("student", {})
        sid = (st.get("email") or st.get("id") or st.get("name") or p.stem).strip().lower()
        d["_file"] = str(p)
        if sid not in latest or d.get("generated_at", "") > latest[sid].get("generated_at", ""):
            latest[sid] = d
    return latest


def quartiles(xs):
    xs = sorted(xs)
    if len(xs) < 2:
        return xs[0], xs[0]
    q = statistics.quantiles(xs, n=4, method="inclusive")
    return q[0], q[2]


def summarize(exp, subs):
    """Per student: completeness + MAE. Per cond/rxn: signed errors of everyone."""
    rows, errors = [], defaultdict(list)
    conds = conditions(exp)
    species = exp.get("species", [])
    reactions = exp.get("reactions", [])
    for sid, s in sorted(subs.items()):
        n_e = sum(1 for c, _, _ in conds for sp in species
                  if num(s.get("results", {}).get(c, {}).get(sp["id"], {}).get("energy")) is not None)
        verified, errs = 0, []
        for c, _, _ in conds:
            for r in reactions:
                comp = recomputed_delta(s, c, r)
                if comp is None:
                    continue
                errors[(c, r["id"])].append(comp - r["ref"])
                typed = num(s.get("deltas", {}).get(c, {}).get(r["id"]))
                if typed is not None and abs(typed - comp) <= max(0.06, abs(comp) * 0.002):
                    verified += 1
                    errs.append(abs(comp - r["ref"]))
        rows.append({
            "id": sid,
            "name": s.get("student", {}).get("name", ""),
            "submitted": s.get("generated_at", ""),
            "predictions_locked": s.get("predictions", {}).get("locked_at") or "",
            "energies": f"{n_e}/{len(conds) * len(species)}" if conds else "",
            "verified_deltas": f"{verified}/{len(conds) * len(reactions)}" if conds else "",
            "MAE (verified)": round(sum(errs) / len(errs), 3) if errs else None,
            "honor": bool(s.get("extra", {}).get("honor")),
            "answers": s.get("answers", {}),
            "predictions": s.get("predictions", {}).get("values", {}),
            "muddiest": s.get("muddiest", ""),
            "file": s["_file"],
        })
    return rows, errors


def write_gradebook(exp, rows, out):
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Alignment, Font
    except ImportError:
        out = out.with_suffix(".csv")
        import csv
        with out.open("w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["email", "name", "submitted", "energies", "verified_deltas", "MAE (verified)", "honor"])
            for r in rows:
                w.writerow([r["id"], r["name"], r["submitted"], r["energies"], r["verified_deltas"], r["MAE (verified)"], r["honor"]])
        return out
    wb = Workbook()
    ws = wb.active
    ws.title = "Summary"
    head = ["email", "name", "submitted", "predictions_locked", "energies", "verified_deltas", "MAE (verified)", "honor"]
    ws.append(head)
    for r in rows:
        ws.append([r["id"]] + [r[h] for h in head[1:]])
    qs = exp.get("questions", [])
    wa = wb.create_sheet("Answers")
    wa.append(["email", "name"] + [q["id"] for q in qs] + ["muddiest"])
    for r in rows:
        vals = []
        for q in qs:
            a = r["answers"].get(q["id"], "")
            vals.append("; ".join(f"{k}: {v}" for k, v in a.items()) if isinstance(a, dict) else a)
        wa.append([r["id"], r["name"]] + vals + [r["muddiest"]])
    if exp.get("predictions"):
        wp = wb.create_sheet("Predictions")
        wp.append(["email", "name"] + [p["id"] for p in exp["predictions"]])
        for r in rows:
            wp.append([r["id"], r["name"]] + [r["predictions"].get(p["id"], "") for p in exp["predictions"]])
    if exp.get("ladder"):
        wl = wb.create_sheet("Ladder")
        wl.append(["email", "name", "correct"] + [it["name"] for it in exp["ladder"]])
        for r in rows:
            picks = r["answers"].get("ladder", {})
            score = sum(picks.get(it["name"]) == it["answer"] for it in exp["ladder"])
            wl.append([r["id"], r["name"], score] + [picks.get(it["name"], "") for it in exp["ladder"]])
    for sheet in wb.worksheets:
        for c in sheet[1]:
            c.font = Font(bold=True)
        for col in sheet.columns:
            width = min(60, max(10, *(len(str(c.value or "")) for c in col)))
            sheet.column_dimensions[col[0].column_letter].width = width
            for c in col[1:]:
                c.alignment = Alignment(wrap_text=width >= 60, vertical="top")
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    return out


def class_summary(exp, rows, errors, include_muddiest):
    stats = defaultdict(dict)
    for (cond, rxn), es in errors.items():
        q1, q3 = quartiles(es)
        stats[cond][rxn] = {"n": len(es), "median": round(statistics.median(es), 3), "q1": round(q1, 3), "q3": round(q3, 3)}
    out = {"experiment": exp["id"], "n": len(rows), "generated_at": datetime.now().isoformat(timespec="seconds"), "stats": stats}
    # Functional draft (Experiment 3 prediction): picks + class-median MAE so far.
    if any(p["id"] == "draft" for p in exp.get("predictions", [])):
        picks = defaultdict(int)
        for r in rows:
            if r["predictions"].get("draft"):
                picks[r["predictions"]["draft"]] += 1
        label_to_id = {m["label"]: m["id"] for m in exp["methods"]}
        draft = {}
        for label in {m["label"] for m in exp["methods"]}:
            mid = label_to_id[label]
            meds = [s["median"] for c, by in stats.items() if c.split("|")[0] == mid for s in by.values()]
            draft[label] = {"picks": picks.get(label, 0), "mae": round(sum(abs(x) for x in meds) / len(meds), 3) if meds else None}
        out["draft"] = draft
    if include_muddiest:
        out["muddiest"] = [r["muddiest"].strip() for r in rows if r["muddiest"].strip()]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("experiment", help="e.g. ex03")
    ap.add_argument("folder", help="folder containing the uploaded .json files")
    ap.add_argument("--include-muddiest", action="store_true", help="publish the (anonymous) muddiest points on the class page")
    args = ap.parse_args()

    exp = load_exp(args.experiment)
    subs = load_submissions(args.folder, args.experiment)
    if not subs:
        sys.exit(f"No {args.experiment} submissions found under {args.folder}")
    rows, errors = summarize(exp, subs)
    gb = write_gradebook(exp, rows, ROOT / "gradebook" / f"{args.experiment}_gradebook.xlsx")
    summary = class_summary(exp, rows, errors, args.include_muddiest)
    out = ROOT / "data" / "class" / f"{args.experiment}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(summary, indent=1))
    print(f"{len(rows)} students → {gb.relative_to(ROOT)} (private) and {out.relative_to(ROOT)} (public, anonymized)")
    missing_honor = [r["id"] for r in rows if not r["honor"]]
    if missing_honor:
        print("  note: no honor statement from", ", ".join(missing_honor))


if __name__ == "__main__":
    main()
