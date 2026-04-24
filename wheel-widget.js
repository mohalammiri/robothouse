// Lightweight interactive mouse wheel widget (module)
// Extended: accepts HTML control payloads via data-control-html (inline HTML) or data-control-src (URL) on the #interactive-mouse-wheel element.
// Requires a user gesture (click) to enable injection for security. Injected scripts are executed in-page; fetched HTML is sanitized minimally (strip <script type="module"> by default).
const ROOT_ID = 'interactive-mouse-wheel';

function createWidget() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // base container
  root.innerHTML = ''; // clear
  const frame = document.createElement('div');
  frame.id = 'wheel-frame';
  frame.setAttribute('aria-hidden','false');
  frame.tabIndex = 0;
  // give wheel-frame a persistent 3D class to match page styling
  frame.classList.add('deep-3d');

  // laser layer (sharp beam visual) + compass ring
  const laser = document.createElement('div');
  laser.id = 'wheel-laser';
  frame.appendChild(laser);

  const compass = document.createElement('div');
  compass.id = 'wheel-compass';
  frame.appendChild(compass);

  const glow = document.createElement('div');
  glow.id = 'wheel-glow';
  glow.setAttribute('aria-hidden','true');

  // build SVG element programmatically
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.id = 'wheel-svg';
  svg.setAttribute('viewBox','0 0 100 180');
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label','Scroll wheel');
  // position svg absolutely so it stays centered inside the laser oval;
  // we keep a base translate and later append rotate(angle) when animating.
  svg.style.position = 'absolute';
  svg.style.left = '50%';
  svg.style.top = '50%';
  svg.style.transformOrigin = '50% 50%';
  svg.dataset.baseTransform = 'translate(-50%,-50%)';
  // initialize transform so wheel sits centered
  svg.style.transform = svg.dataset.baseTransform + ' rotate(0deg)';

  // defs
  const defs = document.createElementNS(svgNS, 'defs');

  const rimGrad = document.createElementNS(svgNS, 'linearGradient');
  rimGrad.id = 'rimGrad';
  rimGrad.setAttribute('x1','0'); rimGrad.setAttribute('x2','0'); rimGrad.setAttribute('y1','0'); rimGrad.setAttribute('y2','1');
  const stop1 = document.createElementNS(svgNS,'stop'); stop1.setAttribute('offset','0'); stop1.setAttribute('stop-color','#e9faff'); stop1.setAttribute('stop-opacity','0.07');
  const stop2 = document.createElementNS(svgNS,'stop'); stop2.setAttribute('offset','0.5'); stop2.setAttribute('stop-color','#0e1b28'); stop2.setAttribute('stop-opacity','0.75');
  const stop3 = document.createElementNS(svgNS,'stop'); stop3.setAttribute('offset','1'); stop3.setAttribute('stop-color','#07121a'); stop3.setAttribute('stop-opacity','1');
  rimGrad.appendChild(stop1); rimGrad.appendChild(stop2); rimGrad.appendChild(stop3);

  const hubGrad = document.createElementNS(svgNS,'radialGradient');
  hubGrad.id = 'hubGrad';
  hubGrad.setAttribute('cx','50%'); hubGrad.setAttribute('cy','35%'); hubGrad.setAttribute('r','60%');
  const hstop1 = document.createElementNS(svgNS,'stop'); hstop1.setAttribute('offset','0'); hstop1.setAttribute('stop-color','#ffffff'); hstop1.setAttribute('stop-opacity','0.28');
  const hstop2 = document.createElementNS(svgNS,'stop'); hstop2.setAttribute('offset','1'); hstop2.setAttribute('stop-color','#00bfff'); hstop2.setAttribute('stop-opacity','0.06');
  hubGrad.appendChild(hstop1); hubGrad.appendChild(hstop2);

  defs.appendChild(rimGrad);
  defs.appendChild(hubGrad);
  svg.appendChild(defs);

  // outer rim rect
  const rimRect = document.createElementNS(svgNS,'rect');
  rimRect.setAttribute('x','12'); rimRect.setAttribute('y','10'); rimRect.setAttribute('rx','16'); rimRect.setAttribute('ry','16');
  rimRect.setAttribute('width','76'); rimRect.setAttribute('height','160');
  rimRect.setAttribute('fill','url(#rimGrad)');
  svg.appendChild(rimRect);

  // wheel body group
  const g = document.createElementNS(svgNS,'g');
  g.id = 'wheel-body';
  g.setAttribute('transform','translate(50,90)');

  const ellipse1 = document.createElementNS(svgNS,'ellipse');
  ellipse1.setAttribute('cx','0'); ellipse1.setAttribute('cy','0'); ellipse1.setAttribute('rx','20'); ellipse1.setAttribute('ry','48'); ellipse1.setAttribute('fill','#0b1220');
  g.appendChild(ellipse1);

  const ellipse2 = document.createElementNS(svgNS,'ellipse');
  ellipse2.setAttribute('cx','0'); ellipse2.setAttribute('cy','0'); ellipse2.setAttribute('rx','16'); ellipse2.setAttribute('ry','44');
  ellipse2.setAttribute('fill','url(#hubGrad)'); ellipse2.setAttribute('opacity','0.85');
  g.appendChild(ellipse2);

  // grooves as rects
  for (let i = 0; i < 10; i++) {
    const y = -40 + i * 8;
    const groove = document.createElementNS(svgNS,'rect');
    groove.setAttribute('x','-1.5');
    groove.setAttribute('y', String(y));
    groove.setAttribute('width','3');
    groove.setAttribute('height','4');
    groove.setAttribute('rx','1.5');
    groove.setAttribute('fill','rgba(255,255,255,0.04)');
    g.appendChild(groove);
  }

  // center highlight
  const centerHighlight = document.createElementNS(svgNS,'ellipse');
  centerHighlight.setAttribute('cx','0'); centerHighlight.setAttribute('cy','-6'); centerHighlight.setAttribute('rx','6'); centerHighlight.setAttribute('ry','14');
  centerHighlight.setAttribute('fill','rgba(255,255,255,0.06)');
  g.appendChild(centerHighlight);

  svg.appendChild(g);

  const counter = document.createElement('div');
  counter.id = 'wheel-counter';
  counter.setAttribute('aria-hidden','true');
  counter.textContent = '0';

  // --- NEW: reader-direction selector UI (up / middle label / down) ---
  const readerSelector = document.createElement('div');
  readerSelector.className = 'reader-selector';
  readerSelector.innerHTML = '<div class="rs-btn rs-up" title="قراءة للأعلى">▲</div><div class="rs-label">قراءة</div><div class="rs-btn rs-down" title="قراءة للأسفل">▼</div>';
  frame.appendChild(readerSelector);

  frame.appendChild(glow);
  frame.appendChild(svg);
  frame.appendChild(counter);
  root.appendChild(frame);

  // --- NEW: HTML control integration ---
  // Controls accepted from root dataset:
  // - data-control-html : inline HTML string to inject when user activates
  // - data-control-src  : URL to fetch HTML to inject
  // - data-control-target: CSS selector where to inject (defaults to #media-replace-placeholder)
  // Activation requires a click on the wheel (user gesture). After activation the wheel applies the HTML (and executes <script> tags).
  let controlEnabled = false;

  async function fetchHtml(url) {
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'no-cache' });
      if (!res.ok) throw new Error('Fetch failed');
      const text = await res.text();
      return text;
    } catch (e) {
      console.warn('Wheel fetchHtml error', e);
      return null;
    }
  }

  function executeInlineScripts(container) {
    // find scripts and re-insert them as new script nodes to execute
    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach(old => {
      const newScript = document.createElement('script');
      // copy attributes except type=module (avoid module execution in this context)
      for (let i = 0; i < old.attributes.length; i++) {
        const at = old.attributes[i];
        if (at.name === 'type' && at.value.trim().toLowerCase() === 'module') continue;
        newScript.setAttribute(at.name, at.value);
      }
      if (old.src) {
        newScript.src = old.src;
        newScript.async = false; // preserve order
      } else {
        newScript.textContent = old.textContent;
      }
      old.parentNode.replaceChild(newScript, old);
    });
  }

  async function applyControlPayload() {
    const targetSelector = root.dataset.controlTarget || root.getAttribute('data-control-target') || '#media-replace-placeholder';
    const target = document.querySelector(targetSelector) || document.getElementById('media-replace-placeholder') || document.body;
    let html = root.dataset.controlHtml || root.getAttribute('data-control-html') || null;
    const src = root.dataset.controlSrc || root.getAttribute('data-control-src') || null;

    if (!html && src) {
      html = await fetchHtml(src);
    }
    if (!html) {
      console.warn('Wheel: no control payload found.');
      return;
    }

    // Minimal sanitization: remove <script type="module"> blocks to avoid module injection without explicit opt-in
    let sanitized = html.replace(/<script\b[^>]*type\s*=\s*["']module["'][\s\S]*?<\/script>/gi, '');
    // Inject into a temporary container so we can process scripts safely
    const tmp = document.createElement('div');
    tmp.innerHTML = sanitized;

    // If payload contains an element with data-replace="true", replace target innerHTML, else append
    const replaceFlag = tmp.querySelector('[data-replace="true"]') ? true : false;
    if (replaceFlag) {
      target.innerHTML = '';
      // move children
      while (tmp.firstChild) target.appendChild(tmp.firstChild);
    } else {
      // append while preserving existing target content
      while (tmp.firstChild) target.appendChild(tmp.firstChild);
    }

    // Execute inline scripts now that nodes are in document
    executeInlineScripts(target);

    // Dispatch event to notify page of injection
    window.dispatchEvent(new CustomEvent('wheelControlApplied', { detail: { target: targetSelector } }));
  }

  // require a user gesture (click) to enable injection
  function enableControlsByGesture() {
    if (controlEnabled) return;
    controlEnabled = true;
    root.classList.add('controls-enabled');
    // attempt to apply immediately if payload present
    applyControlPayload().catch(e => console.warn('Wheel control apply error', e));
  }

  // user clicks wheel to enable controls (single click)
  frame.addEventListener('click', (e) => {
    // avoid reacting if click happened on other interactive controls (e.g., links)
    enableControlsByGesture();
    // show yellow laser briefly and scroll page to vertical middle on single click
    try {
      // force mid/yellow laser state
      frame.classList.remove('laser-up','laser-down','laser-reader');
      frame.classList.add('laser-mid');
      // ensure laser visible immediately
      const prevOpacity = laser.style.opacity;
      laser.style.opacity = '0.98';
      // smooth scroll to page middle
      const middle = Math.max(0, Math.round((document.documentElement.scrollHeight - window.innerHeight) / 2));
      window.scrollTo({ top: middle, behavior: 'smooth' });
      // revert laser visibility after short duration
      setTimeout(() => {
        if (!frame.classList.contains('reader-mode')) {
          laser.style.opacity = prevOpacity || '';
          frame.classList.remove('laser-mid');
        }
      }, 900);
    } catch (err) { console.warn('Wheel click behavior error', err); }
  });

  // state and behavior
  let angle = 0;
  let lastInteraction = Date.now();
  let idleTimeout = null;
  let dragging = false;
  let startY = 0;
  let startAngle = 0;
  let accumulated = 0;
  let baseSpeed = 0.35;
  let baseSpeedBackup = null;
  let readerInterval = null; // track the interval used in reader (double-click) mode

  function showCounterImmediate() {
    counter.classList.remove('idle');
    frame.classList.add('active');
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      counter.classList.add('idle');
      frame.classList.remove('active');
    }, 1400);
  }
  showCounterImmediate();

  function setAngle(a) {
    angle = a;
    // combine the centering translate with rotation so the SVG stays centered inside the laser
    const base = svg.dataset.baseTransform || 'translate(-50%,-50%)';
    svg.style.transform = `${base} rotate(${angle}deg)`;
  }

  // --- reader mode & double-click toggle ---
  let readerMode = false;
  const READER_SENSITIVITY = 0.02; // very slow sensitivity in reader mode
  const NORMAL_SENSITIVITY = baseSpeed; // existing baseSpeed variable used below

  // new state: explicit user-chosen reader direction (1 = up, -1 = down)
  let readerDirection = 1; // default: up

  // new helper to toggle reader selector active state (update visual)
  function setReaderDirection(dir) {
    readerDirection = dir > 0 ? 1 : -1;
    const upBtn = frame.querySelector('.rs-up');
    const downBtn = frame.querySelector('.rs-down');
    if (upBtn) upBtn.classList.toggle('active', readerDirection === 1);
    if (downBtn) downBtn.classList.toggle('active', readerDirection === -1);
    // announce for accessibility
    window.dispatchEvent(new CustomEvent('wheelReaderDirectionChanged', { detail: { direction: readerDirection === 1 ? 'up' : 'down' } }));
  }

  // new: attach click handlers on the selector buttons (delegated)
  frame.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('.rs-btn');
    if (!btn) return;
    if (btn.classList.contains('rs-up')) setReaderDirection(1);
    if (btn.classList.contains('rs-down')) setReaderDirection(-1);
    // prevent the click from also enabling controls if user tapped selector
    ev.stopPropagation();
  });

  frame.addEventListener('dblclick', (e) => {
    e.preventDefault();
    readerMode = !readerMode;
    if (readerMode) {
      // enter reader mode: apply reader visuals and extremely slow automated scroll
      frame.classList.add('reader-mode');
      frame.classList.remove('laser-up','laser-down','laser-mid');
      frame.classList.add('laser-reader');
      baseSpeedBackup = baseSpeed;
      baseSpeed = READER_SENSITIVITY; // reduce manual sensitivity
      laser.style.opacity = '1';

      // If user clicked directly on top/bottom halves while double-clicking, prefer that choice,
      // otherwise show selector (default readerDirection already set)
      try {
        const rect = frame.getBoundingClientRect();
        const clickY = (e.clientY !== undefined) ? e.clientY : (rect.top + rect.height/2);
        if (clickY < (rect.top + rect.height/2)) setReaderDirection(1); else setReaderDirection(-1);
      } catch (err) {
        setReaderDirection(1);
      }

      // start very-slow automated scroll (small step every 200ms), using readerDirection chosen by user
      if (readerInterval) clearInterval(readerInterval);
      readerInterval = setInterval(() => {
        const step = readerDirection * 1; // 1px per tick => extremely slow
        window.scrollBy({ top: -step, left: 0, behavior: 'auto' }); // negative because readerDirection 1 means scroll up
      }, 200);
    } else {
      // exit reader mode: restore
      frame.classList.remove('reader-mode','laser-reader');
      baseSpeed = baseSpeedBackup || NORMAL_SENSITIVITY;
      laser.style.opacity = '';
      if (readerInterval) { clearInterval(readerInterval); readerInterval = null; }
    }
    // dispatch event for accessibility
    window.dispatchEvent(new CustomEvent('wheelReaderMode', { detail: { enabled: readerMode } }));
  });

  // override pointer/drag/wheel handlers to respect readerMode sensitivity
  function deltaToAngle(dy) {
    const effective = readerMode ? READER_SENSITIVITY : baseSpeed;
    return dy * effective;
  }

  // dynamic laser color logic depending on last movement direction
  let lastDir = 0; // -1 down, 0 mid, 1 up
  function setLaserByDirection(dir) {
    frame.classList.remove('laser-up','laser-down','laser-mid','laser-reader');
    if (readerMode) {
      frame.classList.add('laser-reader');
    } else if (dir > 0) {
      frame.classList.add('laser-up');
    } else if (dir < 0) {
      frame.classList.add('laser-down');
    } else {
      frame.classList.add('laser-mid');
    }
    lastDir = dir;
    // make laser visible for brief moment then subtle
    laser.style.opacity = '1';
    clearTimeout(laser._timeout);
    laser._timeout = setTimeout(()=> { if (!frame.classList.contains('reader-mode')) laser.style.opacity = '0.55'; }, 220);
  }

  function updateCounter(delta) {
    accumulated += delta;
    counter.textContent = String(Math.round(accumulated));
  }

  function animateTo(target, dur=300) {
    const start = performance.now();
    const from = angle;
    function step(t) {
      const p = Math.min(1,(t - start)/dur);
      const eased = 1 - Math.pow(1-p,3);
      setAngle(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    dragging = true;
    svg.classList.add('dragging');
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    startAngle = angle;
    showCounterImmediate();
    lastInteraction = Date.now();
    if (e.cancelable) e.preventDefault();
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = startY - y;
    const newAngle = startAngle + deltaToAngle(dy);
    setAngle(newAngle);
    glow.style.opacity = Math.min(1, Math.abs(dy)/120);
    updateCounter(dy * 0.2);
    lastInteraction = Date.now();
  }
  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    svg.classList.remove('dragging');
    const settle = angle * 0.08;
    animateTo(angle - settle, 420);
    glow.style.opacity = 0;
    showCounterImmediate();
    // set mid laser after interaction ends (unless reader mode)
    if (!readerMode) setLaserByDirection(0);
  }

  function onWheel(e) {
    const dy = e.deltaY || 0;
    const sign = Math.sign(dy || 1);
    const deltaA = deltaToAngle((e.deltaY || 0));
    animateTo(angle + deltaA, 260);
    updateCounter(-sign * Math.abs(e.deltaY) * 0.02);
    glow.style.opacity = 0.85;
    showCounterImmediate();
    setTimeout(()=>{ if(!dragging) glow.style.opacity = 0; }, 350);
    lastInteraction = Date.now();

    // set laser color: upward scroll (negative deltaY) => up color; downward => down; small => mid
    if (Math.abs(dy) < 12) setLaserByDirection(0);
    else setLaserByDirection(dy < 0 ? 1 : -1);

    // If controls enabled, interpret large wheel gestures as commands:
    if (controlEnabled) {
      if (Math.abs(e.deltaY) > 120) {
        if (e.deltaY < 0) window.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    }
  }

  function onKey(e){
    if (e.key === 'ArrowUp') { animateTo(angle + 8, 160); updateCounter(-1); showCounterImmediate(); }
    if (e.key === 'ArrowDown') { animateTo(angle - 8, 160); updateCounter(1); showCounterImmediate(); }
  }

  frame.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  frame.addEventListener('wheel', onWheel, { passive: true });
  frame.addEventListener('keydown', onKey);

  frame.addEventListener('mouseenter', () => { showCounterImmediate(); });
  frame.addEventListener('focus', () => { showCounterImmediate(); });

  function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(()=> {
      counter.classList.add('idle');
      frame.classList.remove('active');
    }, 1400);
  }
  resetIdleTimer();

  // updatePosition sets left/right based on dir; ensure the oval overlay (pseudo) shifts with side changes
  function updatePosition() {
    const dir = (document.documentElement.dir || document.body.dir || 'rtl').toLowerCase();
    const rootEl = document.getElementById(ROOT_ID);
    if (!rootEl) return;
    if (dir === 'ltr') {
      rootEl.style.right = 'auto';
      rootEl.style.left = '12px';
      counter.classList.add('horiz');
      counter.style.right = 'auto';
      // ensure pseudo-element (oval) uses left placement
      rootEl.style.setProperty('--wheel-oval-side','left');
    } else {
      rootEl.style.left = 'auto';
      rootEl.style.right = '12px';
      counter.classList.remove('horiz');
      counter.style.left = 'auto';
      rootEl.style.setProperty('--wheel-oval-side','right');
    }
    // keep compass behind wheel (compass removed so nothing to do)
  }
  updatePosition();
  window.addEventListener('languageChanged', updatePosition);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      glow.style.opacity = 0;
      svg.style.transition = 'none';
    } else {
      svg.style.transition = '';
    }
  });

  setTimeout(()=> animateTo(3, 900), 800);
  setTimeout(()=> animateTo(-2, 900), 1600);

  // ensure compass is sized responsively and precise (high DPR friendly)
  function updateCompassScale() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    // keep compass crisp by scaling via transform
    compass.style.transform = `scale(${1 / dpr})`;
    compass.style.borderWidth = (2 * dpr) + 'px';
  }
  updateCompassScale();
  window.addEventListener('resize', updateCompassScale);
}

document.addEventListener('DOMContentLoaded', createWidget);