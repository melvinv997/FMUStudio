#!/usr/bin/env bash
# Grabs YouTube's own thumbnail for each piece and saves it as a poster frame.
# Run from inside the posters folder:   bash fetch-thumbnails.sh
#
# NOTE: YouTube only ever generates 16:9 thumbnails, even for Shorts. For the
# vertical pieces these will be cropped or letterboxed. Fine as a stopgap, but a
# still exported from your source file will always look better. See README.txt.

set -u

fetch () {
  local name="$1" id="$2"
  for size in maxresdefault hqdefault; do
    if curl -fsSL "https://img.youtube.com/vi/${id}/${size}.jpg" -o "${name}.jpg"; then
      echo "${name}.jpg  <-  ${id} (${size})"
      return 0
    fi
  done
  echo "FAILED: ${name} (${id})" >&2
}

fetch work-01 "n4WQdLF-TGY"   # Pacha - matcha advert (9:16)
fetch work-02 "c3KcLqelbtU"   # Founders Mindset - episode trailer (16:9)
fetch work-03 "ExuPSskaaoA"   # Startup Ladder - podcast promo (9:16)
fetch work-04 "Y5D_9g2uel4"   # Snickers - chocolate bar spot (9:16)
fetch work-05 "u0IuqaH_Yg4"   # Founders Mindset - full episode (16:9)
fetch work-06 "-a7W6K0oUEE"   # Founders Mindset - clip cutdowns (9:16)
