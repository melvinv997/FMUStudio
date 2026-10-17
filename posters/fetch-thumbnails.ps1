# Grabs YouTube's own thumbnail for each piece and saves it as a poster frame.
# Run from inside the posters folder:   .\fetch-thumbnails.ps1
#
# NOTE: YouTube only ever generates 16:9 thumbnails, even for Shorts. For the
# vertical pieces these will be cropped or letterboxed. They're fine as a
# stopgap, but a still exported from your source file will always look better.
# See README.txt for the ffmpeg command.

$videos = @{
  "work-01" = "n4WQdLF-TGY"   # Pacha - matcha advert (9:16)
  "work-02" = "c3KcLqelbtU"   # Founders Mindset - episode trailer (16:9)
  "work-03" = "ExuPSskaaoA"   # Startup Ladder - podcast promo (9:16)
  "work-04" = "Y5D_9g2uel4"   # Snickers - chocolate bar spot (9:16)
  "work-05" = "u0IuqaH_Yg4"   # Founders Mindset - full episode (16:9)
  "work-06" = "-a7W6K0oUEE"   # Founders Mindset - clip cutdowns (9:16)
}

foreach ($name in $videos.Keys) {
  $id = $videos[$name]
  $ok = $false
  foreach ($size in @("maxresdefault","hqdefault")) {
    $url = "https://img.youtube.com/vi/$id/$size.jpg"
    try {
      Invoke-WebRequest -Uri $url -OutFile "$name.jpg" -ErrorAction Stop
      Write-Host "$name.jpg  <-  $id ($size)"
      $ok = $true
      break
    } catch { }
  }
  if (-not $ok) { Write-Host "FAILED: $name ($id)" -ForegroundColor Red }
}
