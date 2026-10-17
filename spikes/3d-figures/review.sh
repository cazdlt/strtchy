#!/bin/sh
# Pull downloaded models from ../../thrixel_assets, render the full review set,
# and stack turn/face/body/sheet into out/_<id>.png for a one-glance review.
cd "$(dirname "$0")" || exit 1
for m in "$@"; do
  src=../../thrixel_assets/spikes/3d-figures/models/$m.glb
  [ -f "$src" ] && cp "$src" models/
  [ -f "${src%.glb}.head.glb" ] && cp "${src%.glb}.head.glb" models/
  ./cast.sh "$m" >/dev/null || exit 1
  ffmpeg -y -loglevel error -i out/$m/turn.png -i out/$m/face.png -i out/$m/body.png -i out/$m/sheet.png \
    -filter_complex "[0]scale=1200:-1[a];[1]scale=1200:-1[b];[2]scale=1200:-1[c];[3]scale=1200:-1[d];[a][b][c][d]vstack=inputs=4" out/_$m.png
  echo "reviewed $m"
done
