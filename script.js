(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ============== Loader ==============
     Animation timing lives in CSS. We remove the node after it's done
     so it can't trap clicks or screen readers. */
  const loader = document.querySelector('.loader');
  if (loader) {
    const counter = loader.querySelector('.loader-counter');
    if (counter && !prefersReducedMotion) {
      let pct = 0;
      const tick = () => {
        pct = Math.min(100, pct + Math.random() * 18);
        counter.textContent = `${Math.floor(pct)}%`;
        if (pct < 100) requestAnimationFrame(() => setTimeout(tick, 90));
      };
      tick();
    } else if (counter) {
      counter.textContent = '100%';
    }
    const removeLoader = () => loader.parentNode && loader.parentNode.removeChild(loader);
    loader.addEventListener('animationend', (e) => {
      if (e.animationName === 'loader-out') removeLoader();
    });
    // Safety net
    setTimeout(removeLoader, 4000);
  }

  /* ============== Hero spotlight ============== */
  const hero = document.querySelector('.hero');
  if (hero && !prefersReducedMotion && !isTouch) {
    let rafId = null;
    let lastX = 50, lastY = 50;
    const update = () => {
      hero.style.setProperty('--mx', `${lastX}px`);
      hero.style.setProperty('--my', `${lastY}px`);
      rafId = null;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      lastX = e.clientX - r.left;
      lastY = e.clientY - r.top;
      if (rafId === null) rafId = requestAnimationFrame(update);
    });
    hero.addEventListener('pointerleave', () => {
      lastX = hero.offsetWidth / 2;
      lastY = hero.offsetHeight / 2;
      if (rafId === null) rafId = requestAnimationFrame(update);
    });
  }

  /* ============== Reveal on scroll ============== */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ============== Section-indicator dots ============== */
  const navDots = document.querySelectorAll('.section-nav a');
  const sections = document.querySelectorAll('.section');
  if (navDots.length && sections.length && 'IntersectionObserver' in window) {
    const sectionIO = new IntersectionObserver((entries) => {
      // Pick the entry with the largest intersection ratio to set active.
      let best = null;
      entries.forEach((e) => {
        if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
          best = e;
        }
      });
      if (best) {
        const id = best.target.id;
        navDots.forEach((d) => d.classList.toggle('active', d.dataset.section === id));
      }
    }, { threshold: [0.4, 0.55, 0.7] });
    sections.forEach((s) => sectionIO.observe(s));
  }

  /* ============== Anchor smooth scroll ============== */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });

  /* ============== Beyond cards — mouse-follow glow ============== */
  if (!prefersReducedMotion && !isTouch) {
    document.querySelectorAll('.beyond-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--cx', `${e.clientX - r.left}px`);
        card.style.setProperty('--cy', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ============== Portrait parallax ============== */
  const portrait = document.querySelector('.about-portrait');
  if (portrait && !prefersReducedMotion && !isTouch) {
    portrait.classList.add('parallax');
    let rafId = null;
    const update = () => {
      const r = portrait.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: -1 (below viewport) → 0 (centered) → 1 (above viewport)
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      const py = Math.max(-24, Math.min(24, -progress * 26));
      portrait.style.setProperty('--py', `${py}px`);
      rafId = null;
    };
    const onScroll = () => { if (rafId === null) rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* ============== Projects track — drag-to-scroll ============== */
  const track = document.querySelector('.projects-track');
  if (track && !isTouch) {
    let isDown = false, startX = 0, scrollLeft = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a')) return;
      isDown = true;
      track.setPointerCapture(e.pointerId);
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - track.offsetLeft - startX;
      track.scrollLeft = scrollLeft - dx;
    });
    const stop = () => { isDown = false; };
    track.addEventListener('pointerup', stop);
    track.addEventListener('pointercancel', stop);

    track.addEventListener('click', (e) => {
      const moved = Math.abs(track.scrollLeft - scrollLeft) > 5;
      if (moved) e.preventDefault();
    }, true);
  }

  /* ============== Dynamic document title on blur ============== */
  const baseTitle = document.title;
  window.addEventListener('blur', () => { document.title = '← Come back.'; });
  window.addEventListener('focus', () => { document.title = baseTitle; });

})();
