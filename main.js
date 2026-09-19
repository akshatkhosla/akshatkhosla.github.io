/* ============================================================
   Akshat Khosla — portfolio interactions
   No dependencies. Progressive: page is fully readable without JS.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky header state ---------- */
  var head = document.querySelector('.site-head');
  function onScroll() {
    if (head) head.classList.toggle('is-stuck', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.mobile-nav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('is-open', !open);
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('is-open');
      }
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          ro.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- metric count-up ---------- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function countUp(el) {
    var target = parseFloat(el.dataset.to);
    var dur = 1250;
    var dec = (el.dataset.to.indexOf('.') > -1) ? 1 : 0;
    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = (target * easeOut(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var nums = document.querySelectorAll('[data-to]');
  if (!('IntersectionObserver' in window) || reduce) {
    nums.forEach(function (el) { el.textContent = el.dataset.to; });
  } else {
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); mo.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { el.textContent = '0'; mo.observe(el); });
  }

  /* ---------- project disclosure ---------- */
  document.querySelectorAll('.disclose').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.proj');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      card.classList.toggle('is-open', !open);
      btn.querySelector('.disclose-label').textContent = !open ? 'Hide detail' : 'Architecture';
    });
  });

  /* ---------- scroll-spy: nav + trace rail ---------- */
  /* #contact is a <footer>, not a <section> — include it, or the last section
     stays highlighted forever once the user reaches the bottom of the page. */
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id], footer[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-spy]'));

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
  }

  /* Position-based, deliberately NOT IntersectionObserver ratios.
     intersectionRatio is the fraction of the TARGET's own area inside the
     root band, so it is not comparable between targets of different heights:
     a short block can score 1.0 while a tall section filling the whole screen
     scores 0.3. Sections here range from ~300px to well over 1500px, and the
     footer never wins because the page stops scrolling before it can fill the
     band. A single reading line is unambiguous at every scroll position. */
  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function updateSpy() {
    if (!sections.length) return;

    // At the very end of the document nothing sits below the last target.
    var doc = document.documentElement;
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    var line = window.scrollY + 110;           // just under the sticky header
    if (docTop(sections[0]) > line) {          // still up in the hero
      setActive(null);
      return;
    }
    var cur = sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      if (docTop(sections[i]) <= line) cur = sections[i].id;
    }
    setActive(cur);
  }

  /* rAF is the right throttle while the page is visible, but it never fires in
     a background tab — so a scroll landing there would latch spyTick true and
     freeze the nav permanently. Run inline whenever the page is hidden. */
  var spyTick = false;
  function scheduleSpy() {
    if (spyTick) return;
    spyTick = true;
    var run = function () { updateSpy(); spyTick = false; };
    if (document.hidden) run();
    else requestAnimationFrame(run);
  }
  window.addEventListener('scroll', scheduleSpy, { passive: true });
  window.addEventListener('resize', scheduleSpy, { passive: true });
  window.addEventListener('load', updateSpy);
  document.addEventListener('visibilitychange', function () {
    spyTick = false;   // clear anything stranded by a hidden-tab scroll
    updateSpy();
  });
  updateSpy();

  /* size the trace-rail spans proportionally to section height */
  function sizeRail() {
    var railLinks = document.querySelectorAll('.span-link');
    if (!railLinks.length) return;
    /* Size against the rail's own targets, not every spied element — the
       footer is spied but has no span, and counting it would shrink the rest. */
    var total = 0;
    railLinks.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) total += s.offsetHeight;
    });
    if (!total) return;
    var budget = Math.min(window.innerHeight * 0.52, 420);
    railLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (!sec) return;
      var h = Math.max(16, (sec.offsetHeight / total) * budget);
      a.style.height = h + 'px';
    });
  }
  sizeRail();
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(sizeRail, 180);
  });
  window.addEventListener('load', sizeRail);

  /* ---------- typed role line ---------- */
  var typeEl = document.querySelector('[data-type]');
  if (typeEl) {
    var roles = JSON.parse(typeEl.dataset.type);
    if (reduce) {
      typeEl.querySelector('.typed').textContent = roles.join(' · ');
    } else {
      var ri = 0, ci = 0, deleting = false;
      var out = typeEl.querySelector('.typed');
      (function tick() {
        var word = roles[ri];
        if (!deleting) {
          ci++;
          out.textContent = word.slice(0, ci);
          if (ci === word.length) { deleting = true; return setTimeout(tick, 1700); }
          return setTimeout(tick, 52);
        }
        ci--;
        out.textContent = word.slice(0, ci);
        if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; return setTimeout(tick, 320); }
        setTimeout(tick, 24);
      })();
    }
  }

  /* ---------- hero email button ----------
     mailto: opens a mail client only when the OS has one registered. On a
     machine with no default handler the click is silently inert, which reads
     as a broken button. So: always copy the address and confirm it, and let
     the mailto fire alongside for anyone who does have a client. */
  document.querySelectorAll('.js-mail').forEach(function (el) {
    var label = el.querySelector('.mail-label');
    var original = label ? label.textContent : '';
    var timer;
    el.addEventListener('click', function () {
      if (!label) return;
      var addr = el.dataset.mail;
      function confirmCopy() {
        label.textContent = 'Copied ✓';
        el.classList.add('copied');
        clearTimeout(timer);
        timer = setTimeout(function () {
          label.textContent = original;
          el.classList.remove('copied');
        }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(confirmCopy).catch(function () {});
      }
    });
  });

  /* ---------- copy email (footer) ---------- */
  var copyBtn = document.querySelector('.copy-mail');
  if (copyBtn) {
    var mail = copyBtn.dataset.mail;
    var stateEl = copyBtn.querySelector('.state');
    var reset;
    copyBtn.addEventListener('click', function () {
      function ok() {
        copyBtn.classList.add('done');
        stateEl.textContent = 'Copied';
        clearTimeout(reset);
        reset = setTimeout(function () {
          copyBtn.classList.remove('done');
          stateEl.textContent = 'Click to copy';
        }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(ok).catch(fallback);
      } else { fallback(); }

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = mail;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); ok(); }
        catch (e) { stateEl.textContent = 'Copy failed'; }
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- smooth anchor scroll with sticky-header offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- footer year ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
