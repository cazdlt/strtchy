#!/bin/sh
# Full review set for one or more cast models: icons, videos, contact sheet,
# turnaround (turn.png), face close-ups (face.png), bind vs posed body (body.png).
#   ./cast.sh c1 c2 ...   (models/<id>.glb)
cd "$(dirname "$0")" || exit 1
for m in "$@"; do
  MODEL=$m node render.mjs all >/dev/null || exit 1
  MODEL=$m ./sheet.sh
  MODEL=$m node probe.mjs forward-fold stand angles '[[0,5],[40,8],[90,5],[180,5],[220,8]]' && mv out/angles.png "out/$m/turn.png"
  MODEL=$m node portrait.mjs && MODEL=$m node body.mjs
  echo "done $m"
done
