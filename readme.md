# FMU Studio — website

One-page site for FMU Studio: AI social adverts and long/short form editing.
Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies.

Video is hosted on **YouTube** and embedded — but styled so it doesn't look or
behave like a YouTube player. See "How the video works" below.

---

## Deploy to Netlify

**Git (how it's deployed now):** every push to `main` on GitHub redeploys the
site automatically. No need to drag and drop any more.

Set up once: push to GitHub, then Netlify → Add new site → Import an existing
project. Build command: *empty*. Publish directory: `.`

`netlify.toml` handles publish directory, caching and security headers.

---

## What's on the site now

All six slots are wired to your videos:

| Card | Piece | Category | Ratio | YouTube ID |
|---|---|---|---|---|
| 1 | Pacha — matcha brand advert | AI advert | 9:16 | `n4WQdLF-TGY` |
| 2 | Founders Mindset — episode trailer | Short form | 16:9 | `c3KcLqelbtU` |
| 3 | Startup Ladder — podcast promo | Short form | 9:16 | `ExuPSskaaoA` |
| 4 | Snickers — chocolate bar spot | AI advert | 9:16 | `Y5D_9g2uel4` |
| 5 | Founders Mindset — full episode | Long form | 16:9 | `u0IuqaH_Yg4` |
| 6 | Founders Mindset — clip cutdowns | Short form | 9:16 | `-a7W6K0oUEE` |

I ordered them so the two wide pieces sit apart in the masonry grid rather than
stacking. Titles are my guesses from your descriptions — change any `<h3>` in
`index.html` to whatever you'd actually call the piece.

**Check before you trust it:** every video must be **Public or Unlisted**, never
Private, and must have embedding allowed (YouTube Studio → video → Details →
Show more → "Allow embedding"). Private or embed-disabled videos show a black
box.

**Posters are still placeholders.** Run `posters/fetch-thumbnails.ps1` (Windows)
or `fetch-thumbnails.sh` (Mac/Linux) to pull YouTube's thumbnails, or export
proper stills — see `posters/README.txt`. Worth doing: the poster is the first
thing anyone sees, and on mobile most cards never autoplay at all.

---

## Adding or changing work

Each card looks like this:

```html
<li class="card reveal" data-cat="ai" data-ar="9-16" data-yt="n4WQdLF-TGY">
```

- `data-yt` — the YouTube video ID only, not the full link.
- `data-cat` — `ai`, `short` or `long`. Drives the filter buttons.
- `data-ar` — `9-16`, `1-1` or `16-9`. Must match the real shape or you get bars.

Getting the ID from a link:

| Link | ID |
|---|---|
| `youtube.com/watch?v=`**`c3KcLqelbtU`** | `c3KcLqelbtU` |
| `youtu.be/`**`u0IuqaH_Yg4`**`?si=...` | `u0IuqaH_Yg4` |
| `youtube.com/shorts/`**`n4WQdLF-TGY`** | `n4WQdLF-TGY` |

Always the 11-character code. Drop anything after `&` or `?`. Note that IDs can
start with a hyphen (`-a7W6K0oUEE`) — that character is part of the ID.

Optional, to trim the silent preview to the best few seconds:

```html
data-start="4" data-end="12"
```

Only affects the preview. Clicking always plays the full piece from the start.

To add a seventh piece, copy a whole `<li class="card">…</li>` block and change
the values. Delete a block to remove one. The grid reflows on its own.

---

## How the video works

YouTube embeds normally look unmistakably like YouTube. Two things stop that:

1. **The iframe is scaled up inside a cropping box** (`transform: scale(1.42)` in
   `.yt iframe`). YouTube's title bar and watermark end up outside the visible
   area and are never drawn.
2. **A transparent shield sits on top of the iframe** (`.yt-shield`). It absorbs
   every pointer event, so YouTube never sees a hover or a click — which means
   its overlays never appear and nothing can navigate off to youtube.com.

The lightbox then drives playback through YouTube's IFrame API with our own
control bar: play/pause, scrubber, mute, fullscreen. Keyboard shortcuts work too
(space, ←, →, `m`, `f`, `Esc`).

**Behaviour:** cards start a silent, looping preview as soon as they scroll into
view, and pause when they scroll off. Each card has its own pause button (top
left, appears on hover). Pausing is sticky — scrolling away and back won't
restart a card someone deliberately paused. Clicking a card opens the full piece
with sound in the lightbox.

**Only three previews run at once** on desktop, one on mobile — the most visible
cards get the slots. Six simultaneous YouTube players will heat up a laptop and
crawl on a phone. To change the limit, edit `MAX_PLAYING` near the top of
section 3 in `js/main.js`.

### What you can't change

- **Previews are always muted.** Browsers block autoplay with sound outright.
  There is no workaround — sound only starts when a visitor clicks into the
  full player, because that click is the permission the browser needs.
- **The crop trims roughly 15% off the frame edges** in the preview. Keep
  important detail away from the extreme edges of the first few seconds, or set
  `data-start` to a well-framed moment.
- If a visitor has an aggressive ad blocker, the YouTube API may not load. The
  poster image stays put and nothing breaks — they just don't get playback.

---

## The booking form

Uses **Netlify Forms** — no backend, no third-party service.

- Submissions appear under **Forms → book-a-call** in your Netlify dashboard.
- **Turn on email alerts:** Forms → Settings → Form notifications → Add
  notification → Email. Without this you won't know a lead has come in.
- Free tier: 100 submissions a month.
- Netlify only detects the form on a deployed site — it won't work locally.
- Prefer a real calendar? There's a commented-out Calendly block in `index.html`
  just above the form.

---

## Changing content

| What | Where |
|---|---|
| Headline, services, process, FAQ | `index.html` |
| Email address | search `hello@fmustudio.co.uk` (2 places) |
| Social links | footer, the three `href="#"` links |
| Colours | `css/styles.css`, the `:root` block at the top |
| Booking link for outreach (`/call`) | `netlify.toml`, the `/call` redirect |
| Preview crop amount | `css/styles.css`, `scale(1.42)` in `.yt iframe` |

Brand orange is `#FF841F`, sampled from your logo.

The site lives at **fmustudio.co.uk** (canonical tag, `robots.txt` and `sitemap.xml`
already use it). Netlify sends the old `fmustudio.netlify.app` address there too.

---

## What's in the folder

```
index.html          the site
success.html        thank-you page after the form
css/styles.css      all styling
js/main.js          player, scroll rail, reveals, filtering
assets/             logo variants, favicon, social share image
fonts/              Archivo, Instrument Sans, DM Mono (subset, ~200 KB)
posters/            still frames for the work grid
netlify.toml        publish dir, headers, redirects
robots.txt          search engine rules
sitemap.xml         update the URL when you get a domain
```

---

## Notes

- **Bandwidth is no longer a concern.** Video bytes come from Google, not your
  Netlify allowance.
- **Fonts are self-hosted**, not pulled from Google's CDN — faster, and it avoids
  the GDPR question about Google Fonts for a UK business.
- **Cookies:** embeds use `youtube-nocookie.com`, which holds off on cookies
  until playback starts. But hover previews *are* playback, so a visitor who
  scrolls to the work section does get contacted by Google. If you'd rather
  nothing loads until a deliberate click, set `MAX_PLAYING = 0` in `js/main.js`
  — previews stop, click-to-play stays. That's the strictest option if you ever
  add a privacy policy.
- The site works with JavaScript off — you lose the player, the rail and the
  filters, but the posters, copy and form all still work.
- Reduced-motion preferences are respected throughout.
