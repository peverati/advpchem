"""Pre-render step (see _quarto.yml): remove _site/slides before every site build.

tools/render_slides.sh copies the decks into _site/slides for local preview.
The slides are not published yet, so they must never reach `quarto publish`.
To preview them again after a build, rerun: sh tools/render_slides.sh
"""
import pathlib
import shutil

shutil.rmtree(pathlib.Path(__file__).resolve().parent.parent / "_site" / "slides", ignore_errors=True)
