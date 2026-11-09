#!/bin/sh
# Render the lecture slide decks and copy them into _site/slides so the local
# server (python3 -m http.server 4322 --directory _site) shows them.
# The decks are not part of the website build yet (see _quarto.yml).
#
#   sh tools/render_slides.sh            # all decks
#   sh tools/render_slides.sh l02        # only decks whose name starts with l02
#
# Run from the lab-site folder. Run it AFTER `quarto render`, which empties _site.
set -e
cd "$(dirname "$0")/.."
pattern="${1:-l}"
for deck in slides/${pattern}*.qmd; do
  echo "Rendering $deck"
  quarto render "$deck" --quiet
done
mkdir -p _site/slides
cp -R slides/images _site/slides/
for html in slides/*.html; do
  name=$(basename "$html" .html)
  cp "$html" _site/slides/
  if [ -d "slides/${name}_files" ]; then
    rm -rf "_site/slides/${name}_files"
    cp -R "slides/${name}_files" _site/slides/
  fi
done
echo "Done: open http://localhost:4322/slides/l01-molecular-schrodinger.html"
