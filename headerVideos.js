/* headerVideos.js
   HLS-first, CDN-aware adaptive streaming loader with intelligent warm/probe and hls.js dynamic import.
   - Prefers HLS (.m3u8) served from CDN (Cloudflare/BunnyCDN)
   - Probes for HLS manifest, falls back to MP4 progressive with Range warming
   - Uses dynamic import of hls.js from esm.sh to avoid bundling
   - Sets CORS-friendly headers expectations and best-effort warm fetches
*/

document.addEventListener('DOMContentLoaded', () => {
  const CDN_BASE = 'https://cdn.robothousefzllc.com'; // update to your CDN origin
  const HLS_PROBE_TIMEOUT = 700;

  function shouldSkipWarm() {
    try {
      return navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
    } catch (e) {
      return false;
    }
  }

  async function probeHls(manifestUrl, timeout = HLS_PROBE_TIMEOUT) {
    if (shouldSkipWarm()) return false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(manifestUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache', signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) return false;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/vnd.apple.mpegurl') || manifestUrl.endsWith('.m3u8')) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  async function warmRange(url, bytes = 160000) {
    if (shouldSkipWarm()) return;
    try {
      await fetch(url, { method: 'GET', headers: { Range: `bytes=0-${bytes}` }, mode: 'cors', cache: 'no-store' }).catch(()=>null);
    } catch (e) {}
  }

  async function attachHls(videoEl, hlsUrl) {
    try {
      // dynamic import hls.js
      if (window.Hls === undefined) {
        const mod = await import('https://esm.sh/hls.js@1.4.0');
        window.Hls = mod.default || mod.Hls || mod;
      }
      if (window.Hls && window.Hls.isSupported()) {
        if (videoEl._hlsInstance) { try { videoEl._hlsInstance.destroy(); } catch(e){} videoEl._hlsInstance = null; }
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60
        });
        videoEl._hlsInstance = hls;
        hls.attachMedia(videoEl);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          videoEl.muted = true;
          videoEl.setAttribute('playsinline', '');
          videoEl.playsInline = true;
          videoEl.loop = true;
          videoEl.autoplay = true;
          videoEl.play().catch(()=>{});
        });
        hls.loadSource(hlsUrl);
        hls.on(window.Hls.Events.ERROR, (ev, data) => {
          if (data && data.fatal) {
            try { hls.destroy(); } catch (e) {}
            videoEl._hlsInstance = null;
            // no info -> fallback to progressive MP4
            fallbackToProgressive(videoEl, hlsUrl.replace(/\.m3u8.*/i, '.mp4'));
          }
        });
        return true;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // native HLS (Safari)
        videoEl.src = hlsUrl;
        videoEl.setAttribute('playsinline', '');
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.loop = true;
        await videoEl.play().catch(()=>{});
        return true;
      }
    } catch (e) {
      console.debug('attachHls failed', e);
    }
    return false;
  }

  async function fallbackToProgressive(videoEl, mp4Url) {
    try {
      // warm and then set src to let browser progressively download
      warmRange(mp4Url, 240000);
      videoEl.src = mp4Url;
      videoEl.setAttribute('playsinline', '');
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.autoplay = true;
      await videoEl.play().catch(()=>{});
    } catch (e) {
      console.warn('fallbackToProgressive failed', e);
    }
  }

  async function initOne(videoEl, originalUrl) {
    try {
      // construct plausible CDN HLS url (server-side pipeline should produce .m3u8 variants)
      const encoded = encodeURIComponent(originalUrl.split('/').pop() || 'video');
      const hlsUrl = `${CDN_BASE}/${encoded.replace(/%20/g,'_')}.m3u8`;
      // probe for HLS manifest (HEAD) quickly
      const hasHls = await probeHls(hlsUrl, 900);
      if (hasHls) {
        // warm a small range for the .m3u8 file (manifest-level)
        warmRange(hlsUrl, 12000);
        const attached = await attachHls(videoEl, hlsUrl);
        if (attached) return;
      }
      // fallback: try an m3u8 located next to mp4 by replacing .mp4 -> .m3u8
      const alt = originalUrl.replace(/\.mp4($|\?)/i, '.m3u8$1');
      if (alt !== originalUrl) {
        const altHas = await probeHls(alt, 900);
        if (altHas) {
          warmRange(alt, 12000);
          const attached2 = await attachHls(videoEl, alt);
          if (attached2) return;
        }
      }
      // final fallback to progressive MP4 served via CDN (warmed)
      const finalMp4 = originalUrl.replace(/^https?:\/\/[^\/]+/i, CDN_BASE);
      await fallbackToProgressive(videoEl, finalMp4);
    } catch (e) {
      console.warn('initOne error', e);
      // as last resort, set the original src
      try { videoEl.src = originalUrl; videoEl.play().catch(()=>{}); } catch (e) {}
    }
  }

  (function initHeaderAndTrain() {
    const headerVideoEl = document.querySelector('.header-video');
    const trainEl = document.getElementById('smartTrainVideo');

    // prefer CDN-hosted original mp4 as canonical source to derive CDN m3u8 above
    const headerSrc = headerVideoEl?.querySelector('source')?.src || headerVideoEl?.getAttribute('data-src') || headerVideoEl?.src;
    const trainSrc = trainEl?.querySelector('source')?.src || trainEl?.getAttribute('data-src') || trainEl?.src;

    // lazy-init when element is visible to the user (intersection observer)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        const src = el.querySelector('source')?.getAttribute('data-src') || el.querySelector('source')?.src || el.dataset.src || el.src;
        if (!src) return;
        initOne(el, src);
      });
    }, { root: null, rootMargin: '600px 0px 800px 0px', threshold: 0.02 });

    if (headerVideoEl) {
      // prepare for lazy HLS attach (stash dataset src and remove immediate source to avoid browser fetch)
      const s = headerVideoEl.querySelector('source')?.src;
      if (s) {
        headerVideoEl.dataset.src = s;
        headerVideoEl.querySelectorAll('source').forEach(snode => snode.remove());
        headerVideoEl.removeAttribute('src');
      }
      io.observe(headerVideoEl);
    }

    if (trainEl) {
      const s2 = trainEl.querySelector('source')?.src;
      if (s2) {
        trainEl.dataset.src = s2;
        trainEl.querySelectorAll('source').forEach(snode => snode.remove());
        trainEl.removeAttribute('src');
      }
      io.observe(trainEl);
    }
  })();
});