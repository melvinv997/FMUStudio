POSTER FRAMES
=============

These show before each video loads. They are what a visitor sees first, so pick
a frame that sells the piece.

  Vertical (9:16): 720 x 1280
  Wide     (16:9): 1280 x 720

WHICH FILE IS WHICH
-------------------
  work-01.jpg   Pacha - matcha brand advert        9:16   n4WQdLF-TGY
  work-02.jpg   Founders Mindset - trailer         16:9   c3KcLqelbtU
  work-03.jpg   Startup Ladder - podcast promo     9:16   ExuPSskaaoA
  work-04.jpg   Snickers - chocolate bar spot      9:16   Y5D_9g2uel4
  work-05.jpg   Founders Mindset - full episode    16:9   u0IuqaH_Yg4
  work-06.jpg   Founders Mindset - clip cutdowns   9:16   -a7W6K0oUEE

QUICK OPTION - pull YouTube's thumbnails
----------------------------------------
Windows:  .\fetch-thumbnails.ps1
Mac/Linux: bash fetch-thumbnails.sh

Both scripts overwrite work-01 ... work-06 in this folder.

CATCH: YouTube only ever generates 16:9 thumbnails, even for Shorts. For the
four vertical pieces the result will be cropped or letterboxed, and the site
will then crop it again to fit a 9:16 frame. Usable in a pinch, not great.

BETTER OPTION - export a still from your source file
-----------------------------------------------------
  ffmpeg -i source.mp4 -ss 00:00:02 -vframes 1 -q:v 3 work-01.jpg

Pick a moment with the product or the face clearly in frame. Two seconds in is
usually past the fade and before the first cut.

hero-01/02/03.jpg are the three stacked frames at the top of the page. Swap
them for vertical stills of your own work when you have time.
