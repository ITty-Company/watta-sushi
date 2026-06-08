#!/usr/bin/env bash
# Web-оптимізація hero mp4: 1080p30, CRF 22, faststart (менше лагів на мобільних).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
SRC="${1:-$PUBLIC/watta-sushi-2-hero.mp4}"
OUT="$PUBLIC/watta-sushi-2-hero.mp4"
TMP="$PUBLIC/watta-sushi-2-hero.compressed.tmp.mp4"
BAK="$PUBLIC/watta-sushi-2-hero.hq.bak"

if [[ ! -f "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

cp "$SRC" "$BAK"
ffmpeg -y -i "$SRC" \
  -c:v libx264 -profile:v high -level 4.1 \
  -crf 26 -preset medium \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,fps=30,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -an -movflags +faststart \
  "$TMP"
mv "$TMP" "$OUT"
ffmpeg -y -ss 1 -i "$OUT" -frames:v 1 -update 1 -q:v 2 "$PUBLIC/watta-home-hero-poster.jpg"
echo "Done: $OUT ($(ls -lh "$OUT" | awk '{print $5}'))"
