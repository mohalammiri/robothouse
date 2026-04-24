/*
  media_loader.js
  High-performance lazy media grid:
  - range warm HEAD/RANGE probing for faster CDN/TCP warm-up
  - IntersectionObserver based lazy init for images, videos, audio
  - createImageBitmap decoding for faster render when supported
  - small in-memory queue and backoff to avoid blocking main thread
  - posters set for videos (first image) and graceful fallbacks
*/

(function () {
  const HOST = "https://www.robothousefzllc.com";
  const containerId = 'mediaContainer';
  // If container not present, do nothing
  const container = document.getElementById(containerId);
  if (!container) return;

  // Helpers
  const supportImageBitmap = !!window.createImageBitmap;
  const connection = navigator.connection || {};
  function shouldAvoidWarm() {
    return connection.saveData || /2g/.test(connection.effectiveType || '');
  }

  async function warmProbe(url, rangeBytes = 120000) {
    if (shouldAvoidWarm()) return;
    try {
      // HEAD then a small range GET to warm TCP and caches
      await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache' }).catch(()=>null);
      await fetch(url, { method: 'GET', headers: { Range: `bytes=0-${rangeBytes}` }, mode: 'cors', cache: 'no-store' }).catch(()=>null);
    } catch (e) {
      // non-fatal
    }
  }

  // Efficient loader for images (uses createImageBitmap when available)
  async function loadImage(imgEl, src) {
    try {
      if (supportImageBitmap) {
        const resp = await fetch(src, { mode: 'cors', cache: 'force-cache' });
        if (!resp.ok) throw new Error('img fetch failed');
        const blob = await resp.blob();
        const bitmap = await createImageBitmap(blob);
        // draw to an offscreen canvas to ensure decoded pixels (optional)
        let url = src;
        // fallback to ObjectURL to attach quickly
        url = URL.createObjectURL(blob);
        imgEl.src = url;
        // revoke later on unload
        window.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
      } else {
        imgEl.src = src;
      }
    } catch (err) {
      // fallback to direct src
      imgEl.src = src;
    }
  }

  // Loader for video: set source, hint poster, try small-range probe, then set src and call play if allowed
  async function initVideo(vidEl, src) {
    try {
      // set poster if not present (use first.jpg as reasonable default)
      if (!vidEl.getAttribute('poster')) {
        vidEl.setAttribute('poster', `${HOST}/1.jpg`);
      }
      vidEl.preload = 'metadata';
      // prefer warming
      warmProbe(src, 180000);
      // attach source if element has <source data-src>
      const source = vidEl.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
      } else {
        // direct assignment
        vidEl.src = src;
      }
      // ensure playsinline/muted attributes for autoplay-friendly behavior
      vidEl.setAttribute('playsinline', '');
      vidEl.muted = vidEl.muted === undefined ? true : vidEl.muted;
      vidEl.loop = true;
      // attempt to play silently (non-critical)
      vidEl.play().catch(()=>{});
    } catch (e) {
      console.warn('initVideo error', e);
      try { vidEl.src = src; } catch {}
    }
  }

  // Loader for audio: prefer preload=metadata then set src
  async function initAudio(audEl, src) {
    try {
      audEl.preload = 'metadata';
      audEl.src = src;
      // do not auto-play audio to avoid autoplay policies; user can press play
    } catch (e) {
      console.warn('initAudio error', e);
    }
  }

  // Create cards: try to detect file type and build accessible controls
  function createCardElement(opts) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    const inner = document.createElement('div');
    inner.className = 'card-inner';
    // build content based on type
    if (opts.type === 'video') {
      inner.innerHTML = `<video controls preload="none" playsinline muted>
        <source data-src="${opts.src}" type="video/mp4">
        ${opts.fallback || ''}
      </video>`;
    } else if (opts.type === 'image') {
      inner.innerHTML = `<img data-src="${opts.src}" loading="lazy" alt="${opts.alt || ''}" />`;
    } else if (opts.type === 'audio') {
      inner.innerHTML = `<audio controls preload="none">
        <source src="${opts.src}" type="audio/mpeg">
      </audio>`;
    } else {
      inner.textContent = 'Unsupported media';
    }
    wrapper.appendChild(inner);
    return wrapper;
  }

  // Build lists (videos may come from global videosList if present)
  const videosList = (window.videosList && Array.isArray(window.videosList)) ? window.videosList.map(v=>v.src).filter(Boolean) : [];
  const videos = videosList.length ? videosList : [
    `${HOST}/ROBOT%20HOUSE%20Header%20Video.mp4`,
    `${HOST}/Smart%20Train%20Video.mp4`,
    `${HOST}/About%20Us%20Video.mp4`
  ];

  // Images 1..140
  const images = Array.from({length:140}, (_,i)=> `${HOST}/${i+1}.jpg`);

  // Audios (dedupe)
  const audios = Array.from(new Set([
    `${HOST}/jarvis_boot_sound.mp3`,
    `${HOST}/رسالة ترحيب عربي.m4a`,
    `${HOST}/رسالة ترحيب انجليزي.m4a`
  ]));

  // Populate container with lightweight placeholders (no heavy fetch)
  const fragment = document.createDocumentFragment();

  videos.forEach(src => {
    const el = createCardElement({ type: 'video', src });
    fragment.appendChild(el);
  });

  images.forEach(src => {
    const el = createCardElement({ type: 'image', src, alt: 'ROBOT HOUSE image' });
    fragment.appendChild(el);
  });

  audios.forEach(src => {
    const el = createCardElement({ type: 'audio', src });
    fragment.appendChild(el);
  });

  // attach to DOM
  container.appendChild(fragment);

  // IntersectionObserver: observe inner media elements, but observe their media element not wrapper
  const ioOptions = { root: null, rootMargin: '400px 0px 600px 0px', threshold: 0.01 };
  const io = new IntersectionObserver(onIntersect, ioOptions);

  // Observe images, videos, audio elements inside container
  container.querySelectorAll('img[data-src], video, audio').forEach((el) => {
    // don't observe images that already have src
    io.observe(el);
  });

  async function onIntersect(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      // image
      if (el.tagName === 'IMG') {
        const src = el.dataset.src;
        if (src) {
          // small warm and decode
          warmProbe(src, 60000);
          await loadImage(el, src);
        }
        io.unobserve(el);
        continue;
      }
      // video
      if (el.tagName === 'VIDEO') {
        // find data-src
        const source = el.querySelector('source[data-src]');
        const src = (source && source.dataset && source.dataset.src) ? source.dataset.src : (el.currentSrc || el.src);
        if (src) {
          await initVideo(el, src);
        }
        io.unobserve(el);
        continue;
      }
      // audio
      if (el.tagName === 'AUDIO') {
        const src = el.querySelector('source')?.src;
        if (src) await initAudio(el, src);
        io.unobserve(el);
        continue;
      }
    }
  }

  // Expose a forced loader to load visible items programmatically
  window.__mediaLoader = {
    loadVisibleNow: function() {
      container.querySelectorAll('img[data-src], video, audio').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.5) {
          io.unobserve(el);
          const ev = { target: el, isIntersecting: true };
          onIntersect([ev]);
        }
      });
    },
    warmAllHead: function() {
      // warm HEAD requests for first N media to prime CDN
      const first = Array.from(container.querySelectorAll('img[data-src], video source[data-src], audio source')).slice(0, 10);
      first.forEach(node => {
        const url = node.dataset?.src || node.src;
        if (url) warmProbe(url, 120000);
      });
    }
  };

  // Light pre-warm the first visible row after a moment to avoid blocking initial paint
  setTimeout(() => {
    try {
      window.__mediaLoader.warmAllHead();
    } catch (e) {}
  }, 900);

})();