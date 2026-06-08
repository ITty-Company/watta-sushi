#!/usr/bin/env bash
# Web-оптимізація menu hero mp4: 720p24, CRF 28, faststart (~8–10 MB замість ~23 MB).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
SRC="${1:-$PUBLIC/menu-hero-keeping-safe-road-ready.mp4}"
OUT="$PUBLIC/menu-hero-keeping-safe-road-ready.mp4"
TMP="$PUBLIC/menu-hero-keeping-safe-road-ready.compressed.tmp.mp4"
BAK="$ROOT/../.media-backups/menu-hero-keeping-safe-road-ready.hq.bak"

if [[ ! -f "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

[[ -f "$BAK" ]] || { mkdir -p "$(dirname "$BAK")"; cp "$SRC" "$BAK"; }
ffmpeg -y -i "$SRC" \
  -c:v libx264 -profile:v main -level 4.0 \
  -crf 28 -preset slow \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos,fps=24,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -an -movflags +faststart \
  "$TMP"
mv "$TMP" "$OUT"
echo "Done: $OUT ($(ls -lh "$OUT" | awk '{print $5}'))"
