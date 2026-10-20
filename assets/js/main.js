(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Light / dark switch (dark is the default) ---------- */
  var toggle = document.querySelector('.theme-toggle');
  function syncToggleLabel() {
    var light = root.getAttribute('data-theme') === 'light';
    toggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }
  if (toggle) {
    syncToggleLabel();
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncToggleLabel();
    });
  }

  /* ---------- Header border once the page scrolls ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Fade-in on scroll ---------- */
  var revealTargets = document.querySelectorAll('.highlights, .updates, .company, .work-section, .paper, .org, .education-certs, .connect, .about-slider');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  /* ---------- Updates: show the newest 5, the rest under "See more" ---------- */
  var updates = document.querySelector('.updates');
  if (updates) {
    var items = updates.querySelectorAll('li');
    var more = updates.querySelector('.updates-more');
    if (items.length > 5 && more) {
      for (var i = 5; i < items.length; i++) items[i].hidden = true;
      more.hidden = false;
      more.addEventListener('click', function () {
        var expanded = more.getAttribute('aria-expanded') === 'true';
        for (var j = 5; j < items.length; j++) items[j].hidden = expanded;
        more.setAttribute('aria-expanded', String(!expanded));
        more.textContent = expanded ? 'See more' : 'See less';
      });
    }
  }

  /* ---------- Card carousels (projects, certificates) ---------- */
  document.querySelectorAll('.carousel').forEach(function (track) {
    var section = track.closest('section');
    var prev = section && section.querySelector('.carousel-btn[data-dir="-1"]');
    var next = section && section.querySelector('.carousel-btn[data-dir="1"]');

    function step() {
      var first = track.firstElementChild;
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function update() {
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = atEnd();
    }
    function go(dir) { track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' }); }

    if (prev) prev.addEventListener('click', function () { go(-1); stop(); });
    if (next) next.addEventListener('click', function () { go(1); stop(); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Gentle autoplay; stops for good once the visitor takes control
    var timer = null;
    var delay = parseInt(track.getAttribute('data-autoplay'), 10);
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    if (delay && !reduceMotion) {
      timer = setInterval(function () {
        if (atEnd()) track.scrollTo({ left: 0, behavior: 'smooth' }); else go(1);
      }, delay);
      ['pointerdown', 'wheel', 'touchstart', 'focusin'].forEach(function (ev) {
        track.addEventListener(ev, stop, { passive: true });
      });
    }
  });

  /* ---------- Photo sliders (Work + About) ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.slides');
    var slides = track.querySelectorAll('.slide');
    var prev = slider.querySelector('.slide-btn.prev');
    var next = slider.querySelector('.slide-btn.next');
    var dotsWrap = slider.querySelector('.slide-dots');
    var dots = [];

    if (slides.length < 2) {
      if (prev) prev.remove();
      if (next) next.remove();
      if (dotsWrap) dotsWrap.remove();
      return;
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Photo ' + (i + 1));
        b.addEventListener('click', function () { show(i); stop(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function show(i) { track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    function update() {
      var c = current();
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === c ? 'true' : 'false'); });
      if (prev) prev.disabled = c <= 0;
      if (next) next.disabled = c >= slides.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { show(current() - 1); stop(); });
    if (next) next.addEventListener('click', function () { show(current() + 1); stop(); });
    track.addEventListener('scroll', update, { passive: true });
    update();

    var timer = null;
    var delay = parseInt(slider.getAttribute('data-autoplay'), 10);
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    if (delay && !reduceMotion) {
      timer = setInterval(function () { show((current() + 1) % slides.length); }, delay);
      track.addEventListener('pointerdown', stop, { passive: true });
      track.addEventListener('touchstart', stop, { passive: true });
    }
  });

  /* ---------- Split-flap counter ---------- */
  document.querySelectorAll('.flapboard').forEach(function (board) {
    var target = String(board.getAttribute('data-value') || '0');
    var plus = board.getAttribute('data-plus') === 'true';
    board.textContent = '';
    board.setAttribute('aria-label', target + (plus ? '+' : ''));

    var cells = target.split('').map(function () {
      var flap = document.createElement('span');
      flap.className = 'flap';
      flap.setAttribute('aria-hidden', 'true');
      var digit = document.createElement('span');
      digit.className = 'digit';
      digit.textContent = '0';
      flap.appendChild(digit);
      board.appendChild(flap);
      return digit;
    });
    if (plus) {
      var p = document.createElement('span');
      p.className = 'flap';
      p.setAttribute('aria-hidden', 'true');
      p.innerHTML = '<span class="digit dot">+</span>';
      board.appendChild(p);
    }

    function setDigit(el, v) {
      el.textContent = v;
      var f = el.parentNode;
      f.classList.remove('tick');
      void f.offsetWidth;
      f.classList.add('tick');
    }

    function run() {
      if (reduceMotion) { cells.forEach(function (c, i) { c.textContent = target[i]; }); return; }
      cells.forEach(function (cell, i) {
        var end = parseInt(target[i], 10);
        var spins = 8 + i * 6 + end;
        var n = 0;
        var t = setInterval(function () {
          n++;
          setDigit(cell, String(n % 10));
          if (n >= spins && n % 10 === end) clearInterval(t);
        }, 70);
      });
    }

    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { run(); seen.disconnect(); }
      });
      seen.observe(board);
    } else {
      run();
    }
  });

  /* ---------- Copy email ---------- */
  document.querySelectorAll('.copy-email').forEach(function (btn) {
    var label = btn.querySelector('span');
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-email');
      function done(msg) {
        label.textContent = msg;
        setTimeout(function () { label.textContent = 'Copy email'; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { done('Copied'); }, function () { done(email); });
      } else {
        done(email);
      }
    });
  });

  /* ---------- Impact cards: count-up numbers, pipeline fill, cursor spotlight ---------- */
  var bento = document.querySelector('.bento');
  if (bento) {
    var counters = bento.querySelectorAll('[data-count]');
    var stages = bento.querySelectorAll('.pipeline span');
    var pipeline = bento.querySelector('.pipeline');

    function format(n) { return n.toLocaleString('en-US'); }

    function play() {
      if (reduceMotion) {
        stages.forEach(function (s) { s.classList.add('on'); });
        return;
      }
      counters.forEach(function (el) {
        var end = parseInt(el.getAttribute('data-count'), 10);
        var start = null;
        var duration = end > 100 ? 1600 : 900;
        function frame(t) {
          if (start === null) start = t;
          var p = Math.min((t - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = format(Math.round(end * eased));
          if (p < 1) requestAnimationFrame(frame);
        }
        el.textContent = '0';
        requestAnimationFrame(frame);
      });
      if (pipeline) {
        pipeline.style.setProperty('--progress', '1');
        stages.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('on'); }, 150 + i * 170);
        });
      }
    }

    if (!reduceMotion && pipeline) pipeline.style.setProperty('--progress', '0');

    if ('IntersectionObserver' in window) {
      var bentoSeen = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { play(); bentoSeen.disconnect(); }
      }, { threshold: 0.35 });
      bentoSeen.observe(bento);
    } else {
      play();
    }

    bento.querySelectorAll('.bento-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Hide a photo slider until at least one of its photos exists ---------- */
  window.addEventListener('load', function () {
    document.querySelectorAll('[data-slider]').forEach(function (slider) {
      var imgs = slider.querySelectorAll('img');
      var anyLoaded = Array.prototype.some.call(imgs, function (img) { return !img.classList.contains('missing'); });
      if (!anyLoaded) {
        slider.hidden = true;
        var company = slider.closest('.company');
        if (company) company.classList.add('no-photos');
      }
    });
  });

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
