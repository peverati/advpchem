#!/usr/bin/env python3
"""Stitch the 15 lecture handouts into one PDF "textbook".

    python3 tools/build_textbook.py

Writes downloads/advpchem-lecture-notes.pdf (published with the site, linked from
the home page and the Lectures page). Rerun it, then commit the PDF, whenever a
handout in lectures/ changes.

How it works: the handouts are combined into one Quarto document in a temporary
folder (outside the project, so the site build is not touched) and compiled once
with Typst. That gives one cover, one table of contents, chapters numbered 1-15,
continuous page numbers and a single bibliography. Each handout's title becomes
its chapter heading; cross-reference labels get a per-chapter prefix so they stay
unique; links to other site pages become absolute web links.
"""
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://peverati.github.io/advpchem/"
OUT = ROOT / "downloads" / "advpchem-lecture-notes.pdf"

FRONT = """---
title: "Advanced Physical Chemistry"
subtitle: "Lecture notes for the computational chemistry lab (CHM 5111)"
author: "Roberto Peverati · Florida Institute of Technology"
format:
  typst:
    papersize: us-letter
    margin:
      x: 2.2cm
      y: 2.4cm
    toc: true
    toc-depth: 1
    toc-title: "Contents"
    section-numbering: "1.1"
number-sections: true
bibliography: references.bib
link-citations: true
---

```{=typst}
#pagebreak()
```

# Preface {.unnumbered}

These notes collect the fifteen lecture handouts of the computational lab of
Advanced Physical Chemistry at the Florida Institute of Technology, one chapter per
lecture. Chapters 1–3 approximate the **wave function** (basis sets) and come before
Experiment 1. Chapters 4–6 approximate the **Hamiltonian** (Hartree–Fock and density
functional theory) and come before Experiment 2. From Chapter 7 on, each chapter
first looks back at the experiment you just finished and then prepares the next one;
read those debrief sections only **after** you submit the experiment.

The experiments, the guides and the interactive tools are on the course website,
<{site}>. For the quantum mechanics behind Chapters 1–5, see also the
[Live Textbook of Physical Chemistry 2](https://peverati.github.io/pchem2/).

"""


def split_front_matter(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    meta = m.group(1) if m else ""
    title = re.search(r'^title:\s*"?(.*?)"?\s*$', meta, re.M).group(1)
    return title, text[m.end():] if m else text


def chapter(path):
    slug = path.stem                      # l04-hartree-fock
    tag = slug[:3]                        # l04
    title, body = split_front_matter(path.read_text(encoding="utf-8"))
    title = re.sub(r"^Lecture \d+\s*·\s*", "", title)

    # Unique cross-reference labels across the whole book.
    body = re.sub(r"(\{#|@|label:\s*)(fig|eq|tbl|sec)-", lambda m: f"{m.group(1)}{m.group(2)}-{tag}-", body)

    # Links to other handouts: keep the text, drop the link (they are chapters here).
    body = re.sub(r"\[([^\]]+)\]\(l\d\d-[a-z-]+\.qmd(#[^)]*)?\)", r"\1", body)
    # Links to other site pages become absolute web links.
    body = re.sub(r"\]\(\.\./([^)#\s]+?)\.qmd(#[^)\s]*)?\)", lambda m: f"]({SITE}{m.group(1)}.html{m.group(2) or ''})", body)
    body = re.sub(r"\]\(\.\./(downloads|data|notebooks)/", f"]({SITE}\\1/", body)
    body = body.replace("](../class-results.html)", f"]({SITE}class-results.html)")

    # Handouts that already use level-1 headings (Part 1, Part 2 ...) move down one level.
    if re.search(r"^# ", body, re.M):
        body = re.sub(r"^(#+) ", lambda m: "#" + m.group(1) + " ", body, flags=re.M)

    return f"\n```{{=typst}}\n#pagebreak(weak: true)\n```\n\n# {title} {{#sec-{tag}}}\n\n{body.strip()}\n"


def main():
    chapters = sorted((ROOT / "lectures").glob("l[0-9][0-9]-*.qmd"))
    if len(chapters) != 15:
        sys.exit(f"Expected 15 handouts, found {len(chapters)}")
    doc = FRONT.replace("{site}", SITE) + "".join(chapter(p) for p in chapters)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / "lectures").mkdir()
        shutil.copytree(ROOT / "lectures" / "images", tmp / "lectures" / "images")
        shutil.copytree(ROOT / "images", tmp / "images")
        shutil.copy(ROOT / "references.bib", tmp / "lectures" / "references.bib")
        (tmp / "_quarto.yml").write_text("project:\n  type: default\n")
        src = tmp / "lectures" / "advpchem-lecture-notes.qmd"
        src.write_text(doc, encoding="utf-8")
        run = subprocess.run(["quarto", "render", str(src), "--to", "typst"], cwd=tmp,
                             capture_output=True, text=True)
        if run.returncode != 0:
            sys.exit(run.stdout[-3000:] + run.stderr[-3000:])
        warnings = [l for l in (run.stdout + run.stderr).splitlines() if "WARN" in l.upper()]
        for w in warnings[:20]:
            print(w)
        OUT.parent.mkdir(exist_ok=True)
        shutil.copy(tmp / "lectures" / "advpchem-lecture-notes.pdf", OUT)
    print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
