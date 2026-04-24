/* hologram_themes.js
   Injects 7 subtle holographic theme overlays and cycles them every 30s.
   Themes only add very-low-opacity gradient edges/overlays and use smooth transitions;
   respects prefers-reduced-motion by disabling automatic cycling when requested.
*/
(function () {
  // If user prefers reduced motion, do not auto-cycle (but still allow manual class if needed)
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // CSS definitions for 7 holographic themes — low opacity, readable foreground preserved
  const css = `
  /* holographic theme overlays (very subtle, non-intrusive) */
  .holo-theme { transition: --holo-opacity 900ms ease, background-color 900ms ease; --holo-opacity: 0.22; }

  /* apply to major containers to create gentle holographic tint/edge */
  .holo-theme .hologram-card::before,
  .holo-theme .glass-card::before,
  .holo-theme .product-window::before,
  .holo-theme .tech-holo-card::before,
  .holo-theme .testimonial-card::before,
  .holo-theme .pw-media::before,
  .holo-theme .hexagon-shape::before {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: inherit;
    pointer-events: none;
    z-index: 1;
    opacity: var(--holo-opacity);
    mix-blend-mode: screen;
    filter: blur(12px) saturate(1.06);
  }

  /* ensure content stays above overlays */
  .holo-theme .hologram-card > *,
  .holo-theme .glass-card > *,
  .holo-theme .product-window > *,
  .holo-theme .tech-holo-card > *,
  .holo-theme .testimonial-card > * { position: relative; z-index: 3; }

  /* Theme palettes — low alpha gradients; each theme uses different color stops */
  .holo-theme-1 .hologram-card::before,
  .holo-theme-1 .glass-card::before,
  .holo-theme-1 .product-window::before { background: linear-gradient(120deg, rgba(123,227,255,0.10), rgba(154,255,154,0.06)); }

  .holo-theme-2 .hologram-card::before,
  .holo-theme-2 .glass-card::before,
  .holo-theme-2 .product-window::before { background: linear-gradient(120deg, rgba(255,140,66,0.10), rgba(123,227,255,0.05)); }

  .holo-theme-3 .hologram-card::before,
  .holo-theme-3 .glass-card::before,
  .holo-theme-3 .product-window::before { background: linear-gradient(120deg, rgba(154,255,154,0.10), rgba(255,59,244,0.05)); }

  .holo-theme-4 .hologram-card::before,
  .holo-theme-4 .glass-card::before,
  .holo-theme-4 .product-window::before { background: linear-gradient(120deg, rgba(123,227,255,0.09), rgba(255,140,66,0.06)); }

  .holo-theme-5 .hologram-card::before,
  .holo-theme-5 .glass-card::before,
  .holo-theme-5 .product-window::before { background: linear-gradient(120deg, rgba(200,150,255,0.09), rgba(123,227,255,0.05)); }

  .holo-theme-6 .hologram-card::before,
  .holo-theme-6 .glass-card::before,
  .holo-theme-6 .product-window::before { background: linear-gradient(120deg, rgba(255,200,140,0.09), rgba(154,255,154,0.05)); }

  .holo-theme-7 .hologram-card::before,
  .holo-theme-7 .glass-card::before,
  .holo-theme-7 .product-window::before { background: linear-gradient(120deg, rgba(0,220,255,0.10), rgba(255,140,66,0.04)); }

  /* make sure overlay doesn't darken text: apply subtle inner mask to keep center clear */
  .holo-theme .hologram-card::before,
  .holo-theme .glass-card::before,
  .holo-theme .product-window::before {
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 2px;
  }

  /* gentle floating shimmer for edges, very low opacity */
  .holo-theme .hologram-card::after,
  .holo-theme .glass-card::after,
  .holo-theme .product-window::after {
    content: "";
    position: absolute;
    inset: -12px;
    border-radius: inherit;
    pointer-events: none;
    z-index: 0;
    opacity: 0.06;
    background: radial-gradient(circle at 20% 10%, rgba(255,255,255,0.06), transparent 10%);
    filter: blur(18px);
    transition: opacity 900ms ease;
  }
  `;

  // inject CSS once
  const style = document.createElement('style');
  style.setAttribute('data-hologram-themes', '1');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // apply base holo-theme class to body so themes only add overlays, not change text colors
  const body = document.body;
  body.classList.add('holo-theme');

  // function to set theme by index 1..7
  function setTheme(idx) {
    // remove previous theme classes
    for (let i = 1; i <= 7; i++) body.classList.remove('holo-theme-' + i);
    const cl = 'holo-theme-' + (idx || 1);
    body.classList.add(cl);
  }

  // initial theme (pick index based on time for variety on load)
  const seed = (new Date()).getSeconds();
  const initial = (seed % 7) + 1;
  setTheme(initial);

  // auto-cycle every 30s unless reduced motion preference is set
  if (!reduced) {
    let current = initial;
    setInterval(() => {
      current = (current % 7) + 1;
      // small fade: toggle a low-opacity variable to trigger CSS transitions smoothly
      setTheme(current);
    }, 30000);
  }

  // expose API for manual control if needed
  window.__robotHouseHologramThemes = {
    set: setTheme,
    current: () => {
      for (let i = 1; i <= 7; i++) if (body.classList.contains('holo-theme-' + i)) return i;
      return initial;
    }
  };
})();