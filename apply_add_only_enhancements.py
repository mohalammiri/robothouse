from pathlib import Path

base = Path('/home/user/website')
styles = base / 'styles.css'
script = base / 'script.js'

css_marker = '/* === ADD-ONLY PREMIUM UI ENHANCEMENTS === */'
js_marker = '/* === ADD-ONLY PREMIUM INTERACTION ENHANCEMENTS === */'

css_block = r'''

/* === ADD-ONLY PREMIUM UI ENHANCEMENTS === */
:root {
  --premium-edge-1: rgba(255, 92, 156, 0.9);
  --premium-edge-2: rgba(94, 214, 255, 0.92);
  --premium-edge-3: rgba(143, 255, 110, 0.88);
  --premium-edge-4: rgba(177, 92, 255, 0.9);
  --premium-card-shadow: 0 18px 44px rgba(2, 8, 23, 0.34);
  --premium-card-shadow-hover: 0 24px 54px rgba(2, 8, 23, 0.42);
}

html, body {
  max-width: 100%;
  overflow-x: clip;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

img,
video,
canvas,
svg,
iframe {
  max-width: 100%;
}

section,
.glass-card,
.feature-card,
.info-card,
.product-window,
.card,
.stat,
.testimonial-card,
.faq-item,
.password-box,
.hologram-card,
.invest-box {
  scroll-margin-top: 120px;
}

.glass-card,
.feature-card,
.info-card,
.product-window,
.card,
.stat,
.testimonial-card,
.password-box,
.hologram-card,
.invest-box,
.faq-item {
  box-shadow: var(--premium-card-shadow);
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.34s ease, border-color 0.34s ease, background-color 0.34s ease;
  will-change: transform;
}

.glass-card:hover,
.feature-card:hover,
.info-card:hover,
.product-window:hover,
.card:hover,
.stat:hover,
.testimonial-card:hover,
.password-box:hover,
.hologram-card:hover,
.invest-box:hover {
  box-shadow: var(--premium-card-shadow-hover);
}

.container {
  width: min(100%, 1400px);
  padding-inline: clamp(16px, 2.5vw, 30px);
}

.video-rgb-host {
  position: relative !important;
  isolation: isolate;
  border-radius: var(--video-frame-radius, 18px);
  overflow: visible;
  transform: translateZ(0);
}

.video-rgb-host::before,
.video-rgb-host::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: calc(var(--video-frame-radius, 18px) + 2px);
}

.video-rgb-host::before {
  inset: -2px;
  padding: 2px;
  background: linear-gradient(135deg, var(--premium-edge-1), var(--premium-edge-2), var(--premium-edge-3), var(--premium-edge-4), var(--premium-edge-2), var(--premium-edge-1));
  background-size: 280% 280%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.55;
  filter: blur(8px) saturate(1.08);
  z-index: 0;
  will-change: background-position, opacity, filter;
  animation: rgbWaterfallFlow 8.5s linear infinite;
}

.video-rgb-host::after {
  inset: -12px;
  background: radial-gradient(circle at 50% 50%, rgba(94, 214, 255, 0.18), rgba(177, 92, 255, 0.1) 36%, rgba(255, 92, 156, 0.06) 60%, transparent 72%);
  opacity: 0.4;
  filter: blur(18px);
  z-index: -1;
  will-change: opacity, transform;
  animation: rgbWaterfallAura 8.5s linear infinite;
}

.video-rgb-host:hover::before,
.video-rgb-host:focus-within::before {
  opacity: 0.72;
  filter: blur(10px) saturate(1.12);
}

.video-rgb-host:hover::after,
.video-rgb-host:focus-within::after {
  opacity: 0.58;
}

.video-rgb-frame {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  max-width: 100%;
  transform: translateZ(0);
  backface-visibility: hidden;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.26);
}

.faq-item.premium-faq {
  margin-bottom: clamp(14px, 2vw, 18px);
  border: 1px solid rgba(123, 227, 255, 0.16);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(9, 16, 31, 0.82));
}

.faq-item.premium-faq:hover {
  transform: translateY(-2px) scale(1.008);
  box-shadow: 0 22px 44px rgba(2, 8, 23, 0.38), 0 0 20px rgba(94, 214, 255, 0.08);
  border-color: rgba(255, 140, 66, 0.22);
}

.faq-item.premium-faq .faq-question {
  min-height: 34px;
  line-height: 1.65;
  padding-inline: 2rem;
}

.faq-item.premium-faq .faq-question i {
  transition: transform 0.38s ease, opacity 0.28s ease;
}

.faq-item.premium-faq.active .faq-question i {
  transform: rotate(180deg) translateX(-6px);
}

.faq-item.premium-faq .faq-answer {
  line-height: 1.85;
  transition: max-height 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, padding-top 0.32s ease;
  will-change: max-height, opacity;
}

@keyframes rgbWaterfallFlow {
  0% {
    background-position: 0% 0%;
    transform: translateY(-1px);
  }
  25% {
    background-position: 100% 18%;
    transform: translateY(0px);
  }
  50% {
    background-position: 100% 100%;
    transform: translateY(1px);
  }
  75% {
    background-position: 0% 82%;
    transform: translateY(0px);
  }
  100% {
    background-position: 0% 0%;
    transform: translateY(-1px);
  }
}

@keyframes rgbWaterfallAura {
  0%, 100% {
    transform: scale(0.985);
  }
  50% {
    transform: scale(1.015);
  }
}

@media (max-width: 1200px) {
  .glass-card,
  .feature-card,
  .info-card,
  .product-window,
  .card,
  .stat,
  .testimonial-card,
  .password-box,
  .hologram-card,
  .invest-box,
  .faq-item {
    box-shadow: 0 16px 36px rgba(2, 8, 23, 0.3);
  }
}

@media (max-width: 992px) {
  .container {
    padding-inline: clamp(14px, 4vw, 22px);
  }

  .glass-card,
  .feature-card,
  .info-card,
  .product-window,
  .card,
  .stat,
  .testimonial-card,
  .password-box,
  .hologram-card,
  .invest-box,
  .faq-item {
    border-radius: clamp(16px, 2.8vw, 22px);
  }

  .video-rgb-host::before {
    opacity: 0.48;
    filter: blur(7px) saturate(1.04);
  }
}

@media (max-width: 768px) {
  .faq-item.premium-faq {
    padding: 0.95rem 1rem;
  }

  .faq-item.premium-faq .faq-question {
    font-size: 1rem;
    padding-inline: 1.9rem;
  }

  .faq-item.premium-faq .faq-answer {
    font-size: 0.96rem;
  }

  .video-rgb-host::after {
    inset: -8px;
    filter: blur(14px);
  }
}

@media (max-width: 640px) {
  .container {
    padding-inline: 14px;
  }

  .glass-card,
  .feature-card,
  .info-card,
  .product-window,
  .card,
  .stat,
  .testimonial-card,
  .password-box,
  .hologram-card,
  .invest-box,
  .faq-item {
    box-shadow: 0 14px 28px rgba(2, 8, 23, 0.26);
  }
}

@media (orientation: landscape) and (max-width: 1024px) {
  .main-header {
    min-height: calc(var(--vh, 1vh) * 68);
    height: auto;
  }

  .glass-card,
  .feature-card,
  .info-card,
  .product-window,
  .card,
  .stat,
  .testimonial-card,
  .password-box,
  .hologram-card,
  .invest-box,
  .faq-item {
    padding: clamp(14px, 2.4vw, 22px);
  }

  .video-rgb-frame,
  .about-video,
  .investor-video,
  #smartTrainVideo,
  #hexVideo {
    max-height: 56vh;
    object-fit: cover;
  }
}

@media (orientation: portrait) and (max-width: 1024px) {
  .main-header {
    min-height: calc(var(--vh, 1vh) * 52);
  }
}

@media (prefers-reduced-motion: reduce) {
  .video-rgb-host::before,
  .video-rgb-host::after,
  .faq-item.premium-faq,
  .faq-item.premium-faq .faq-answer,
  .faq-item.premium-faq .faq-question i,
  .glass-card,
  .feature-card,
  .info-card,
  .product-window,
  .card,
  .stat,
  .testimonial-card,
  .password-box,
  .hologram-card,
  .invest-box {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
'''

js_block = r'''

/* === ADD-ONLY PREMIUM INTERACTION ENHANCEMENTS === */
(function premiumAddOnlyEnhancements() {
  const HOST_SELECTOR = '.pw-media, .hexagon-shape, .invest-video-wrap, .mobile-only-video, .card, .hologram-card, .glass-card';
  let faqSyncTimer = null;
  let responsiveTimer = null;

  function updateViewportVars() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
    document.body.setAttribute('data-device-orientation', window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  }

  function enhanceVideoFrames(scope = document) {
    const videos = Array.from(scope.querySelectorAll('video')).filter(v => !v.classList.contains('header-video'));
    videos.forEach((video) => {
      video.classList.add('video-rgb-frame');
      const host = video.closest(HOST_SELECTOR);
      if (host && !host.querySelector('video.header-video')) {
        host.classList.add('video-rgb-host');
        const radius = getComputedStyle(video).borderRadius || getComputedStyle(host).borderRadius || '18px';
        host.style.setProperty('--video-frame-radius', radius && radius !== '0px' ? radius : '18px');
      }
    });
  }

  function syncFaqState() {
    const container = document.getElementById('faqContainer');
    if (!container) return;
    const items = Array.from(container.querySelectorAll('.faq-item'));
    items.forEach((item, index) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!question || !answer) return;

      item.classList.add('premium-faq');
      item.setAttribute('tabindex', item.getAttribute('tabindex') || '0');
      item.setAttribute('role', item.getAttribute('role') || 'button');
      item.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');
      answer.id = answer.id || `faq-answer-${index}`;
      question.setAttribute('aria-controls', answer.id);
      answer.setAttribute('aria-hidden', item.classList.contains('active') ? 'false' : 'true');

      if (item.classList.contains('active')) {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        answer.style.opacity = '1';
        answer.style.paddingTop = '1rem';
      } else {
        answer.style.maxHeight = '0px';
        answer.style.opacity = '0';
        answer.style.paddingTop = '0px';
      }
    });
  }

  function requestFaqSync(delay = 0) {
    window.clearTimeout(faqSyncTimer);
    faqSyncTimer = window.setTimeout(syncFaqState, delay);
  }

  function handleFaqToggle(item) {
    const container = document.getElementById('faqContainer');
    if (!container || !item) return;
    const items = Array.from(container.querySelectorAll('.faq-item'));
    const willOpen = !item.classList.contains('active');

    items.forEach((faqItem) => {
      if (faqItem !== item) faqItem.classList.remove('active');
    });

    item.classList.toggle('active', willOpen);
    requestFaqSync(0);
  }

  function bindFaqInteractions() {
    const container = document.getElementById('faqContainer');
    if (!container || container.dataset.premiumFaqBound === '1') return;

    container.dataset.premiumFaqBound = '1';

    container.addEventListener('click', (event) => {
      const item = event.target.closest('.faq-item');
      if (!item || !container.contains(item)) return;
      event.preventDefault();
      event.stopPropagation();
      handleFaqToggle(item);
    }, true);

    container.addEventListener('keydown', (event) => {
      const item = event.target.closest('.faq-item');
      if (!item) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        handleFaqToggle(item);
      }
    }, true);

    const observer = new MutationObserver(() => {
      requestFaqSync(10);
      enhanceVideoFrames(container);
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  function handleResponsiveRefresh(delay = 0) {
    window.clearTimeout(responsiveTimer);
    responsiveTimer = window.setTimeout(() => {
      updateViewportVars();
      enhanceVideoFrames(document);
      requestFaqSync(0);
    }, delay);
  }

  function initPremiumLayer() {
    updateViewportVars();
    enhanceVideoFrames(document);
    bindFaqInteractions();
    requestFaqSync(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumLayer, { once: true });
  } else {
    initPremiumLayer();
  }

  window.addEventListener('load', () => handleResponsiveRefresh(0), { passive: true });
  window.addEventListener('resize', () => handleResponsiveRefresh(80), { passive: true });
  window.addEventListener('orientationchange', () => handleResponsiveRefresh(180), { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => handleResponsiveRefresh(60), { passive: true });
  }

  const bodyObserver = new MutationObserver((mutations) => {
    const shouldRefresh = mutations.some((mutation) => mutation.addedNodes && mutation.addedNodes.length);
    if (shouldRefresh) handleResponsiveRefresh(30);
  });

  if (document.body) {
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  }
})();
'''

for path, marker, block in [(styles, css_marker, css_block), (script, js_marker, js_block)]:
    content = path.read_text(encoding='utf-8')
    if marker not in content:
        path.write_text(content + block, encoding='utf-8')

print('Enhancements appended successfully.')
