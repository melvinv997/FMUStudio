/* FMU Studio — interactions
   =========================================================================
   Video is hosted on YouTube but never looks like it. Two rules make that work:

   1. The iframe is scaled up inside a cropping box, so YouTube's title bar and
      watermark sit outside the visible area.
   2. A transparent shield sits on top of the iframe. It swallows every pointer
      event, so YouTube never sees a hover or a click — which means its own
      overlays never appear, and nothing can navigate away to youtube.com.

   Previews start when a card scrolls into view and stop when it leaves.
   Everything degrades: with JS off you still get posters, copy and the form.
   ========================================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* =======================================================================
     1. Page load sequence
     ======================================================================= */
  function ready() {
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
  }
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);
  setTimeout(ready, 1200);

  /* =======================================================================
     2. YouTube IFrame API — loaded lazily, on first interaction only
     ======================================================================= */
  var ytPromise = null;

  function loadYT() {
    if (ytPromise) return ytPromise;
    ytPromise = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) return resolve(window.YT);

      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };

      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = function () { reject(new Error('YouTube API blocked')); };
      document.head.appendChild(s);

      setTimeout(function () { reject(new Error('YouTube API timed out')); }, 8000);
    });
    return ytPromise;
  }

  // Shared player options. host = nocookie so nothing is set until playback.
  function vars(extra) {
    var v = {
      controls: 0,          // no native control bar
      disablekb: 1,         // no native keyboard shortcuts
      fs: 0,                // no native fullscreen button
      rel: 0,               // keep end screen to this channel
      modestbranding: 1,
      iv_load_policy: 3,    // no annotations
      playsinline: 1,       // don't hijack into iOS fullscreen
      cc_load_policy: 0
    };
    for (var k in extra) v[k] = extra[k];
    return v;
  }

  /* =======================================================================
     3. Auto previews
     Cards play a silent, looping preview whenever they're on screen, and
     pause the moment they scroll off. Muted is not a choice — browsers
     refuse to autoplay anything with sound.

     Each card has its own pause button. Pausing is sticky: once someone
     pauses a card, scrolling away and back won't restart it.
     ======================================================================= */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var previews = new WeakMap();

  // Cap how many iframes run at once. Six simultaneous YouTube players will
  // heat up a laptop and crawl on a phone.
  var MAX_PLAYING = window.matchMedia('(max-width:820px)').matches ? 1 : 3;

  function hasVideo(card) {
    var id = card.dataset.yt;
    return id && id.indexOf('REPLACE_ME') !== 0;
  }

  function buildPreview(card) {
    if (previews.has(card)) return previews.get(card);
    if (!hasVideo(card)) return null;

    var mount = card.querySelector('[data-yt-mount]');
    if (!mount) return null;

    var record = { player: null, ready: false };
    previews.set(card, record);

    loadYT().then(function (YT) {
      var holder = document.createElement('div');
      mount.appendChild(holder);

      var id = card.dataset.yt;
      var startAt = parseInt(card.dataset.start || '0', 10) || 0;
      var endAt = parseInt(card.dataset.end || '0', 10) || 0;

      record.player = new YT.Player(holder, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        playerVars: vars({
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: id,       // loop needs the id repeated here
          start: startAt
        }),
        events: {
          onReady: function (e) {
            record.ready = true;
            e.target.mute();
            if (card.dataset.paused === '1' || !card.dataset.inview) {
              e.target.pauseVideo();
            } else {
              e.target.playVideo();
              card.classList.add('is-playing');
            }
          },
          onStateChange: function (e) {
            var S = window.YT.PlayerState;
            if (e.data === S.PLAYING) card.classList.add('is-playing');
            if (e.data === S.ENDED) e.target.seekTo(startAt, true);
          }
        }
      });

      if (endAt > startAt) {
        setInterval(function () {
          var p = record.player;
          if (!p || !p.getCurrentTime) return;
          if (p.getCurrentTime() >= endAt) p.seekTo(startAt, true);
        }, 400);
      }
    }).catch(function () {
      card.classList.add('is-yt-blocked');   // poster stays, nothing breaks
    });

    return record;
  }

  function playCard(card) {
    if (reduced || card.dataset.paused === '1' || !hasVideo(card)) return;
    var rec = previews.get(card) || buildPreview(card);
    if (rec && rec.player && rec.player.playVideo) {
      rec.player.playVideo();
      card.classList.add('is-playing');
    }
  }

  function pauseCard(card) {
    var rec = previews.get(card);
    if (rec && rec.player && rec.player.pauseVideo) rec.player.pauseVideo();
    card.classList.remove('is-playing');
  }

  function pauseAllPreviews() { cards.forEach(pauseCard); }

  /* --- which cards are on screen, and how much of each --- */
  var visible = new Map();

  function refresh() {
    // Most-visible cards win the limited number of player slots.
    var ranked = Array.from(visible.entries())
      .filter(function (e) { return e[1] > 0.35 && !e[0].classList.contains('is-hidden'); })
      .sort(function (a, b) { return b[1] - a[1]; });

    var allowed = ranked.slice(0, MAX_PLAYING).map(function (e) { return e[0]; });

    cards.forEach(function (card) {
      var should = allowed.indexOf(card) !== -1;
      card.dataset.inview = should ? '1' : '';
      if (should) playCard(card);
      else pauseCard(card);
    });
  }

  if (!reduced && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible.set(en.target, en.intersectionRatio); });
      refresh();
    }, { threshold: [0, 0.35, 0.6, 0.9] });
    cards.forEach(function (card) { if (hasVideo(card)) vio.observe(card); });
  }

  // Don't run previews in a background tab.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAllPreviews();
    else if (!reduced) refresh();
  });

  /* --- per-card pause button --- */
  cards.forEach(function (card) {
    var toggle = card.querySelector('[data-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();          // must not open the lightbox
      var paused = card.dataset.paused === '1';
      if (paused) {
        card.dataset.paused = '';
        card.classList.remove('is-paused');
        toggle.setAttribute('aria-label', 'Pause preview');
        playCard(card);
      } else {
        card.dataset.paused = '1';
        card.classList.add('is-paused');
        toggle.setAttribute('aria-label', 'Play preview');
        pauseCard(card);
      }
    });
  });

  /* =======================================================================
     4. Lightbox player with our own controls
     ======================================================================= */
  var lb = document.querySelector('[data-lb]');
  var lbMount = lb && lb.querySelector('[data-lb-mount]');
  var lbFrame = lb && lb.querySelector('[data-lb-frame]');
  var lbCaption = lb && lb.querySelector('[data-lb-caption]');
  var lbSpinner = lb && lb.querySelector('[data-lb-spinner]');
  var btnPlay = lb && lb.querySelector('[data-lb-play]');
  var btnMute = lb && lb.querySelector('[data-lb-mute]');
  var btnFs = lb && lb.querySelector('[data-lb-fs]');
  var range = lb && lb.querySelector('[data-lb-range]');
  var fill = lb && lb.querySelector('[data-lb-fill]');
  var buffer = lb && lb.querySelector('[data-lb-buffer]');
  var elNow = lb && lb.querySelector('[data-lb-now]');
  var elDur = lb && lb.querySelector('[data-lb-dur]');

  var lbPlayer = null;
  var tick = null;
  var scrubbing = false;
  var lastFocus = null;

  function fmt(t) {
    t = Math.max(0, Math.floor(t || 0));
    var h = Math.floor(t / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = t % 60;
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
             : m + ':' + String(s).padStart(2, '0');
  }

  function sync() {
    if (!lbPlayer || !lbPlayer.getDuration || scrubbing) return;
    var d = lbPlayer.getDuration() || 0;
    var t = lbPlayer.getCurrentTime() || 0;
    if (d > 0) {
      var pct = (t / d) * 100;
      if (fill) fill.style.width = pct + '%';
      if (range) range.value = Math.round((t / d) * 1000);
      if (buffer && lbPlayer.getVideoLoadedFraction) {
        buffer.style.width = (lbPlayer.getVideoLoadedFraction() * 100) + '%';
      }
    }
    if (elNow) elNow.textContent = fmt(t);
    if (elDur) elDur.textContent = fmt(d);
  }

  function openLightbox(card) {
    var id = card.dataset.yt;
    if (!id || id.indexOf('REPLACE_ME') === 0) return;

    lastFocus = document.activeElement;
    pauseAllPreviews();

    var title = card.querySelector('h3');
    var label = card.querySelector('.card__meta p');
    if (lbCaption) {
      lbCaption.textContent = (title ? title.textContent : '') +
        (label ? '  ·  ' + label.textContent : '');
    }

    // Match the stage to the piece's shape so nothing is letterboxed.
    if (lbFrame) lbFrame.dataset.ar = card.dataset.ar || '16-9';

    lb.hidden = false;
    body.classList.add('lb-open');
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    if (lbSpinner) lbSpinner.hidden = false;

    loadYT().then(function (YT) {
      lbMount.innerHTML = '';
      var holder = document.createElement('div');
      lbMount.appendChild(holder);

      lbPlayer = new YT.Player(holder, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        playerVars: vars({ autoplay: 1 }),
        events: {
          onReady: function (e) {
            if (lbSpinner) lbSpinner.hidden = true;
            e.target.unMute();
            e.target.setVolume(100);
            e.target.playVideo();
            setMuteIcon(false);
            sync();
            clearInterval(tick);
            tick = setInterval(sync, 250);
          },
          onStateChange: function (e) {
            var S = window.YT.PlayerState;
            lb.classList.toggle('is-paused', e.data === S.PAUSED || e.data === S.ENDED);
            if (btnPlay) {
              var playing = e.data === S.PLAYING;
              btnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
              btnPlay.classList.toggle('is-playing', playing);
            }
            // Stop before YouTube's end screen can appear.
            if (e.data === S.ENDED) { e.target.seekTo(0, true); e.target.pauseVideo(); }
            if (lbSpinner) lbSpinner.hidden = e.data !== S.BUFFERING;
          },
          onError: function () {
            if (lbSpinner) lbSpinner.hidden = true;
            if (lbCaption) lbCaption.textContent = 'This video could not be loaded.';
          }
        }
      });
    }).catch(function () {
      if (lbSpinner) lbSpinner.hidden = true;
      if (lbCaption) lbCaption.textContent = 'Video could not be loaded — check your connection.';
    });

    setTimeout(function () {
      var c = lb.querySelector('[data-lb-close]');
      if (c && c.focus) c.focus();
    }, 60);
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open');
    clearInterval(tick);
    if (lbPlayer && lbPlayer.destroy) lbPlayer.destroy();
    lbPlayer = null;
    setTimeout(function () {
      lb.hidden = true;
      if (lbMount) lbMount.innerHTML = '';
    }, 260);
    body.classList.remove('lb-open');
    if (!reduced) refresh();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function setMuteIcon(muted) {
    if (!btnMute) return;
    btnMute.classList.toggle('is-muted', muted);
    btnMute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  cards.forEach(function (card) {
    var btn = card.querySelector('.card__btn') || card;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      openLightbox(card);
    });
  });

  if (lb) {
    lb.querySelectorAll('[data-lb-close]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });

    if (btnPlay) btnPlay.addEventListener('click', function () {
      if (!lbPlayer) return;
      var S = window.YT.PlayerState;
      if (lbPlayer.getPlayerState() === S.PLAYING) lbPlayer.pauseVideo();
      else lbPlayer.playVideo();
    });

    if (btnMute) btnMute.addEventListener('click', function () {
      if (!lbPlayer) return;
      if (lbPlayer.isMuted()) { lbPlayer.unMute(); setMuteIcon(false); }
      else { lbPlayer.mute(); setMuteIcon(true); }
    });

    if (btnFs) btnFs.addEventListener('click', function () {
      var target = lb.querySelector('.lb__dialog');
      if (!document.fullscreenElement) {
        (target.requestFullscreen || target.webkitRequestFullscreen || function () {}).call(target);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      }
    });

    if (range) {
      var seek = function () {
        if (!lbPlayer || !lbPlayer.getDuration) return;
        var d = lbPlayer.getDuration() || 0;
        var t = (range.value / 1000) * d;
        if (fill) fill.style.width = (range.value / 10) + '%';
        if (elNow) elNow.textContent = fmt(t);
        return t;
      };
      range.addEventListener('input', function () { scrubbing = true; seek(); });
      range.addEventListener('change', function () {
        var t = seek();
        if (lbPlayer && lbPlayer.seekTo) lbPlayer.seekTo(t, true);
        scrubbing = false;
      });
    }

    // Click the picture to toggle play — the shield sits above the iframe,
    // so this never reaches YouTube.
    var shield = lb.querySelector('[data-lb-shield]');
    if (shield) shield.addEventListener('click', function () {
      if (btnPlay) btnPlay.click();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (!lbPlayer) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); btnPlay && btnPlay.click(); }
      if (e.key === 'm') { btnMute && btnMute.click(); }
      if (e.key === 'f') { btnFs && btnFs.click(); }
      if (e.key === 'ArrowRight') lbPlayer.seekTo(lbPlayer.getCurrentTime() + 5, true);
      if (e.key === 'ArrowLeft') lbPlayer.seekTo(Math.max(0, lbPlayer.getCurrentTime() - 5), true);
    });
  }

  /* =======================================================================
     5. Playhead rail + nav state
     ======================================================================= */
  var rail = document.querySelector('.rail');
  var railFill = document.querySelector('[data-rail-fill]');
  var head = document.querySelector('[data-rail-head]');
  var nav = document.querySelector('[data-nav]');
  var marks = Array.prototype.slice.call(document.querySelectorAll('.rail__marks li'));
  var darkSections = Array.prototype.slice.call(document.querySelectorAll('.work, .book, .foot'));

  function placeMarks() {
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return;
    marks.forEach(function (li) {
      var target = document.getElementById(li.dataset.mark);
      if (!target) return;
      li.style.top = (Math.min(1, target.offsetTop / docH) * 100) + '%';
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var p = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;

      if (railFill) railFill.style.transform = 'scaleY(' + p + ')';
      if (head) head.style.top = 'calc(8vh + ' + (p * 84) + 'vh)';

      var activeId = null;
      document.querySelectorAll('[data-section]').forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.42 && r.bottom >= window.innerHeight * 0.42) {
          activeId = s.id;
        }
      });
      marks.forEach(function (li) {
        li.classList.toggle('is-active', li.dataset.mark === activeId);
      });

      if (nav) nav.classList.toggle('is-stuck', window.scrollY > 40);

      var navDark = false, railDark = false, mid = window.innerHeight / 2;
      darkSections.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= 46 && r.bottom >= 46) navDark = true;
        if (r.top <= mid && r.bottom >= mid) railDark = true;
      });
      if (nav) nav.classList.toggle('on-dark', navDark);
      if (rail) rail.classList.toggle('on-dark', railDark);

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { placeMarks(); onScroll(); });
  window.addEventListener('load', function () { placeMarks(); onScroll(); });
  placeMarks();
  onScroll();

  /* =======================================================================
     6. Reveal on scroll
     ======================================================================= */
  var revealables = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, i * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================================
     7. Work filter
     ======================================================================= */
  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        var show = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('is-hidden', !show);
      });
      refresh();
      placeMarks();
    });
  });

  /* =======================================================================
     8. Footer year
     ======================================================================= */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
