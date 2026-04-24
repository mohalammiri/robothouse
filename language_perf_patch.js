/*
  language_perf_patch.js
  - Ensures immediate, low-latency language switching.
  - On toggle or storage change: set site-lang, update direction, call existing translators,
    force lightweight media warm/load for visible items, update testimonial/ticker text,
    and schedule language-specific audio playback.
  Changes: removed deferred timers and made toggle/storage handlers call applyNow synchronously;
  added direct bindings to site-lang-toggle and immediate UI updates for badges and media warmers.
*/
(function () {
  function getLang() {
    try { return (localStorage.getItem('site-lang') || document.documentElement.lang || 'ar'); }
    catch (e) { return document.documentElement.lang || 'ar'; }
  }

  function safeSetLocal(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  async function applyNow(lang) {
    if (!lang) lang = getLang();
    // persist quickly and synchronously
    safeSetLocal('site-lang', lang);

    // update document chrome synchronously
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';
    document.body.dir = document.documentElement.dir;

    // Immediately call existing translators and UI updaters if present
    try { if (window.__robotHouseExactBilingualApply) window.__robotHouseExactBilingualApply(lang); } catch (e) {}
    try { if (window.__robotHouseHologramThemes) window.__robotHouseHologramThemes.set(window.__robotHouseHologramThemes.current()); } catch (e) {}

    // Update testimonial/ticker synchronously if helper functions exist
    try { if (typeof window.updateBottomTicker === 'function') window.updateBottomTicker(lang); } catch (e) {}
    try { if (typeof window.updateTestimonials === 'function') window.updateTestimonials(lang); } catch (e) {}

    // Force visible media loaders to process now (best-effort, non-blocking)
    try { if (window.__mediaLoader && typeof window.__mediaLoader.loadVisibleNow === 'function') window.__mediaLoader.loadVisibleNow(); } catch (e) {}
    try { if (typeof window.__robotHouseLoadVisibleVideos === 'function') window.__robotHouseLoadVisibleVideos(); } catch (e) {}

    // Warm hero media quickly (HEAD probe) to reduce TTFB when language toggles change sources
    try {
      const header = document.querySelector('.header-video');
      const train = document.getElementById('smartTrainVideo');
      const warm = (url) => { try { if (url) fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache' }).catch(()=>{}); } catch(e){} };
      if (header) { const s = header.dataset?.src || header.querySelector('source')?.src; warm(s); }
      if (train) { const s2 = train.dataset?.src || train.querySelector('source')?.src; warm(s2); }
    } catch (e) {}

    // update small UI badges immediately
    try {
      document.querySelectorAll('#site-lang-label, #site-lang-toggle .site-lang-label, .lang-badge').forEach(el => {
        if (el) el.textContent = (lang === 'en') ? 'EN' : 'ع';
      });
    } catch (e) {}

    // Dispatch a custom event for other listeners that want to react instantly
    try {
      window.dispatchEvent(new CustomEvent('site-lang-applied-immediate', { detail: { lang } }));
    } catch (e) {}
  }

  function init() {
    // Bind toggle button to apply language instantly (no debounce)
    const langBtn = document.getElementById('site-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        try {
          const current = getLang();
          const next = (current === 'en') ? 'ar' : 'en';
          applyNow(next);
        } catch (e) { console.warn('site-lang toggle error', e); }
      }, { passive: true });
    }

    // Respond to storage events from other tabs immediately
    window.addEventListener('storage', (ev) => {
      if (!ev.key || ev.key !== 'site-lang') return;
      const newLang = ev.newValue || getLang();
      applyNow(newLang);
    });

    // Ensure initial in-page application is immediate
    try { applyNow(getLang()); } catch (e) {}

    // Also listen for explicit programmatic calls
    window.__applySiteLanguageFast = applyNow;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();