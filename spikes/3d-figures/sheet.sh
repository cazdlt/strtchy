#!/bin/sh
# Contact sheet of all icons on the light theme background (for quick review).
cd "$(dirname "$0")/out/${MODEL:-v2}/icons" || exit 1
set -- *.png
inputs=""; filters=""; i=0
for f in "$@"; do inputs="$inputs -i $f"; filters="$filters[$i]scale=360:360[s$i];"; i=$((i+1)); done
stack=""; j=0; while [ $j -lt $i ]; do stack="$stack[s$j]"; j=$((j+1)); done
ffmpeg -y -loglevel error $inputs -f lavfi -i "color=c=0xf5f1ea:s=$((360*i))x360" \
  -filter_complex "${filters}${stack}hstack=inputs=$i[row];[$i][row]overlay" -frames:v 1 ../sheet.png
