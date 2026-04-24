/* ui.js
   Handles UI: unlock/password, contact form, chat widget, faq, video autoplay enforcement and small helpers.
*/

/* Password unlock widget */
(function passwordWidgetInit() {
  const unlockBtn = document.getElementById('unlockBtn');
  const passMsg = document.getElementById('passMsg');
  const protectedFiles = document.getElementById('protectedFilesList');
  const file1 = document.getElementById('file1');
  const file2 = document.getElementById('file2');
  const file3 = document.getElementById('file3');

  if (!unlockBtn) return;
  unlockBtn.addEventListener('click', () => {
    const pwd = document.getElementById('docPassword')?.value?.trim();
    if (!pwd) {
      passMsg.style.color = "red";
      passMsg.textContent = "❌ الرجاء إدخال كلمة المرور.";
      return;
    }
    if (pwd === "123ALAMMIRI") {
      passMsg.style.color = "green";
      passMsg.textContent = "✔️ تم فتح الملفات مؤقتًا لمدة 30 ثانية.";
      protectedFiles.style.display = "block";
      file1.href = file1.href || "#";
      file2.href = file2.href || "#";
      file3.href = file3.href || "#";
      clearTimeout(unlockBtn._autoCloseTimeout);
      unlockBtn._autoCloseTimeout = setTimeout(() => {
        protectedFiles.style.display = "none";
        passMsg.style.color = "orange";
        passMsg.textContent = "⏳ انتهت المهلة. تم إغلاق الملفات تلقائيًا.";
      }, 30000);
    } else if (pwd === "MOHAMMED") {
      passMsg.style.color = "green";
      passMsg.textContent = "✔️ تم التحقق — روابط التنزيل مُمكّنة الآن.";
      protectedFiles.style.display = "block";
      file1.href = file1.href || "#";
      file2.href = file2.href || "#";
      file3.href = file3.href || "#";
      file1.setAttribute('download', '');
      file2.setAttribute('download', '');
      file3.setAttribute('download', '');
      clearTimeout(unlockBtn._autoCloseTimeout);
    } else {
      passMsg.style.color = "red";
      passMsg.textContent = "❌ كلمة مرور خاطئة. تواصل معنا لطلب كلمة المرور.";
    }
  });
})();

/* Contact form */
(function contactFormInit() {
  const contactForm = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  if (!contactForm) return;
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formMsg.style.color = "green";
    formMsg.innerHTML = "✅ تم إرسال رسالتك، سيتواصل معك فريق ROBOT HOUSE قريباً.";
    contactForm.reset();
  });
})();

/* Chat widget */
(function chatInit() {
  const chatBtn = document.getElementById('chatbotBtn');
  const chatWin = document.getElementById('chatWindow');
  const chatBody = document.getElementById('chatBody');
  const sendChat = document.getElementById('sendChat');
  const chatInput = document.getElementById('chatInput');

  if (chatBtn) chatBtn.addEventListener('click', () => chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex');

  function addMessage(sender, msg) {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.style.margin = '8px 0';
    div.innerHTML = `<strong>${sender}:</strong> ${msg}`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  sendChat?.addEventListener('click', () => {
    const userMsg = chatInput.value.trim();
    if(!userMsg) return;
    addMessage("أنت", userMsg);
    chatInput.value = "";
    setTimeout(() => {
      let reply = "يمكنك الاستفسار عن الاستثمار (عائد يصل إلى 94%)، المنتجات، أو طلب كلمة المرور لدراسة الجدوى.";
      if(userMsg.includes("سعر") || userMsg.includes("تكلفة")) reply = "أسعار الشقق تنافسية، وسعر السيارة البرمائية 50,000 دولار. تواصل مع المبيعات للحصول على عرض سعر مفصل.";
      else if(userMsg.includes("استثمار") || userMsg.includes("عائد")) reply = "العائد على الاستثمار يتراوح بين 43% و94% حسب السيناريو. يمكننا إرسال المستعرض المالي عبر البريد.";
      else if(userMsg.includes("كلمة المرور")) reply = "كلمة المرور لدراسة الجدوى: RoboFuture2025 (يمكنك تجربتها في قسم الاستثمار).";
      addMessage("روبوت HOUSE", reply);
    }, 500);
  });

  chatInput?.addEventListener("keypress", (e) => e.key === "Enter" && sendChat.click());
})();



/* Ensure all videos have muted autoplay attributes and try to play them */
document.addEventListener('DOMContentLoaded', () => {
  const allVideos = Array.from(document.querySelectorAll('video'));
  allVideos.forEach((vid) => {
    try {
      vid.setAttribute('playsinline', '');
      vid.setAttribute('muted', '');
      vid.muted = true;
      vid.loop = true;
      vid.autoplay = true;
      vid.setAttribute('preload', 'auto');
      const primarySource = vid.querySelector('source')?.src;
      if (primarySource && (!vid.src || vid.src === '')) {
        vid.querySelectorAll('source').forEach(s => s.remove());
        vid.src = primarySource;
      }
      vid.play().catch(()=>{});
    } catch (e) {
      console.warn('Video enforcement failed', e);
    }
  });

  // Initialize mini weather widget (reads existing elements if available, otherwise uses defaults)
  try {
    const miniTemp = document.getElementById('weatherTemp');
    const miniDesc = document.getElementById('weatherDesc');
    const miniIcon = document.getElementById('weatherIcon');
    const miniCity = document.getElementById('weatherCity');

    // prefer existing page fields if present
    const pageTempNode = document.getElementById('temperature');
    const pageDescNode = document.getElementById('weather-text');

    function applyMini(data) {
      if (miniTemp && data.tempC !== undefined) miniTemp.textContent = `${data.tempC}°`;
      if (miniDesc && data.text) miniDesc.textContent = data.text;
      if (miniCity && data.city) miniCity.textContent = data.city;
      if (miniIcon) {
        // simple icon mapping
        const t = (data.text || '').toLowerCase();
        if (/sun|clear|مشمس|صافي/.test(t)) miniIcon.textContent = '☀️';
        else if (/part|غيوم متفرقة|partly|cloudy|غائم/.test(t)) miniIcon.textContent = '⛅';
        else if (/rain|مطر|ممطر/.test(t)) miniIcon.textContent = '🌧️';
        else if (/storm|عاصف/.test(t)) miniIcon.textContent = '⛈️';
        else miniIcon.textContent = '☀️';
      }
    }

    // If the page already has temperature/weather-text use those values
    if (pageTempNode || pageDescNode) {
      const tRaw = pageTempNode?.textContent?.trim?.() || '';
      const tempMatch = tRaw.match(/(-?\d+)\s*°?/);
      const tempC = tempMatch ? parseInt(tempMatch[1], 10) : undefined;
      const text = pageDescNode?.textContent?.trim?.() || miniDesc?.textContent;
      const city = document.getElementById('weatherCity')?.textContent || 'رأس الخيمة';
      applyMini({ tempC, text, city });
    } else {
      // fallback: simple time-of-day mock (non-blocking)
      const hour = new Date().getHours();
      let mock;
      if (hour >= 6 && hour < 11) mock = { tempC: 26, text: 'مشمس جزئياً', city: 'رأس الخيمة' };
      else if (hour >= 11 && hour < 17) mock = { tempC: 30, text: 'مشمس', city: 'رأس الخيمة' };
      else if (hour >= 17 && hour < 21) mock = { tempC: 24, text: 'غيوم متفرقة', city: 'رأس الخيمة' };
      else mock = { tempC: 20, text: 'غائم جزئياً', city: 'رأس الخيمة' };
      applyMini(mock);
    }

    // expose a lightweight refresh that other scripts can call
    window.robotHouseMiniWeather = {
      update: applyMini
    };
  } catch (e) {
    console.warn('Mini weather init failed', e);
  }
});

/* Scroll-to-top and top-bar shrink handler */
(function scrollInit(){
  const scrollBtn = document.getElementById('scroll-to-top');
  const topBar = document.querySelector('.top-bar');
  window.onscroll = () => {
    try {
      if (scrollBtn) scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0';
      if (topBar) {
        if (window.scrollY > 12) topBar.classList.add('shrink'); else topBar.classList.remove('shrink');
      }
    } catch (e) {}
  };
  scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (topBar && window.scrollY > 12) topBar.classList.add('shrink');
  }
})();

/* Theme switcher */
document.getElementById('theme-switcher')?.addEventListener('click', () => document.body.classList.toggle('dark-theme'));

/* Video control overlays (mute, volume, zoom, expand) for all videos EXCEPT header video */
(function videoControlsInit() {
  // create a full-screen expand modal (one shared modal)
  let expandModal = null;
  function ensureExpandModal() {
    if (expandModal) return expandModal;
    expandModal = document.createElement('div');
    expandModal.id = 'videoExpandModal';
    Object.assign(expandModal.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.92)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '18px'
    });
    const inner = document.createElement('div');
    inner.id = 'videoExpandInner';
    Object.assign(inner.style, {
      width: '100%',
      maxWidth: '1400px',
      height: 'calc(100% - 120px)',
      borderRadius: '14px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(10,12,18,0.6), rgba(5,8,12,0.6))'
    });
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '12px', left: '12px', zIndex: '100', border: 'none', background: 'transparent', color: '#fff', fontSize: '22px', cursor: 'pointer'
    });
    closeBtn.addEventListener('click', hideExpand);
    // append
    inner.appendChild(closeBtn);
    expandModal.appendChild(inner);
    document.body.appendChild(expandModal);

    // close on ESC or click outside
    expandModal.addEventListener('click', (e) => {
      if (e.target === expandModal) hideExpand();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideExpand(); });
    return expandModal;
  }

  function showExpand(originalVideo) {
    const modal = ensureExpandModal();
    const inner = document.getElementById('videoExpandInner');
    if (!inner) return;
    // detach original video into modal (preserve playback state)
    const wasPaused = originalVideo.paused;
    const prevParent = originalVideo.parentElement;
    // create placeholder to remember where to restore
    const placeholder = document.createElement('div');
    placeholder.className = 'video-restore-placeholder';
    placeholder.style.width = originalVideo.offsetWidth + 'px';
    placeholder.style.height = originalVideo.offsetHeight + 'px';
    placeholder._origParent = prevParent;
    placeholder._nextSibling = originalVideo.nextSibling;
    prevParent.replaceChild(placeholder, originalVideo);

    // style video to fill modal area
    Object.assign(originalVideo.style, {
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      transform: '', // reset scale when expanded
      zIndex: '50',
      borderRadius: '8px'
    });
    originalVideo.dataset._expanded = '1';
    originalVideo._restorePlaceholder = placeholder;

    // move into modal inner
    inner.appendChild(originalVideo);
    modal.style.display = 'flex';
    // try to play if was playing
    if (!wasPaused) originalVideo.play().catch(()=>{});
    // make controls visible
    originalVideo._showVideoControls && originalVideo._showVideoControls();
  }

  function hideExpand() {
    const modal = ensureExpandModal();
    const inner = document.getElementById('videoExpandInner');
    if (!inner) return;
    // find expanded video inside inner
    const vid = inner.querySelector('video[data-_expanded="1"]');
    if (!vid) { modal.style.display = 'none'; return; }
    // remove flag and move back to placeholder location
    vid.dataset._expanded = '';
    const placeholder = vid._restorePlaceholder;
    if (placeholder && placeholder._origParent) {
      const parent = placeholder._origParent;
      if (placeholder._nextSibling) parent.insertBefore(vid, placeholder._nextSibling);
      else parent.appendChild(vid);
      parent.removeChild(placeholder);
    } else {
      // fallback: append to body
      document.body.appendChild(vid);
    }
    // restore sizing
    vid.style.width = '';
    vid.style.height = '';
    vid.style.objectFit = '';
    vid.style.transform = '';
    vid.style.zIndex = '';
    vid._hideVideoControls && vid._hideVideoControls();
    modal.style.display = 'none';
  }

  // Create control overlay for a given video element
  function createControlsForVideo(vid) {
    if (!vid || vid.classList.contains('header-video')) return;

    // wrapper for controls (hidden by default)
    const wrap = document.createElement('div');
    wrap.className = 'video-control-overlay';
    wrap.style.position = 'absolute';
    wrap.style.right = '12px';
    wrap.style.bottom = '12px';
    wrap.style.display = 'flex';
    wrap.style.gap = '8px';
    wrap.style.alignItems = 'center';
    wrap.style.zIndex = '30';
    wrap.style.background = 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.12))';
    wrap.style.padding = '8px';
    wrap.style.borderRadius = '12px';
    wrap.style.backdropFilter = 'blur(6px)';
    wrap.style.boxShadow = '0 10px 24px rgba(2,6,23,0.5)';
    // hidden by default
    wrap.style.opacity = '0';
    wrap.style.transition = 'opacity 180ms ease';
    wrap.style.pointerEvents = 'none';

    // mute/unmute button
    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.title = 'كتم / تشغيل الصوت';
    muteBtn.innerHTML = vid.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    muteBtn.style.border = 'none';
    muteBtn.style.background = 'transparent';
    muteBtn.style.color = 'white';
    muteBtn.style.fontSize = '1rem';
    muteBtn.style.cursor = 'pointer';
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      vid.muted = !vid.muted;
      muteBtn.innerHTML = vid.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    });
    wrap.appendChild(muteBtn);

    // volume slider
    const volWrap = document.createElement('div');
    volWrap.style.display = 'flex';
    volWrap.style.alignItems = 'center';
    volWrap.style.gap = '6px';

    const volIcon = document.createElement('i');
    volIcon.className = 'fas fa-sliders-h';
    volIcon.style.color = 'white';
    volIcon.style.fontSize = '0.9rem';
    volWrap.appendChild(volIcon);

    const volInput = document.createElement('input');
    volInput.type = 'range';
    volInput.min = '0';
    volInput.max = '1';
    volInput.step = '0.01';
    volInput.value = String(vid.volume ?? 1);
    volInput.style.width = '110px';
    volInput.title = 'مستوى الصوت';
    volInput.addEventListener('input', (e) => {
      e.stopPropagation();
      try {
        vid.volume = parseFloat(volInput.value);
        if (vid.volume === 0) { vid.muted = true; muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>'; } else { vid.muted = false; muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; }
      } catch (e) {}
    });
    volWrap.appendChild(volInput);
    wrap.appendChild(volWrap);

    // zoom controls
    const zoomOut = document.createElement('button');
    zoomOut.type = 'button';
    zoomOut.innerHTML = '<i class="fas fa-search-minus"></i>';
    zoomOut.title = 'تصغير الفيديو';
    zoomOut.style.border = 'none';
    zoomOut.style.background = 'transparent';
    zoomOut.style.color = 'white';
    zoomOut.style.cursor = 'pointer';
    zoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = parseFloat(vid.dataset.vscale || '1');
      const next = Math.max(0.5, Math.round((cur - 0.1) * 100) / 100);
      vid.style.transform = `scale(${next})`;
      vid.dataset.vscale = String(next);
    });
    wrap.appendChild(zoomOut);

    const zoomIn = document.createElement('button');
    zoomIn.type = 'button';
    zoomIn.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomIn.title = 'تكبير الفيديو';
    zoomIn.style.border = 'none';
    zoomIn.style.background = 'transparent';
    zoomIn.style.color = 'white';
    zoomIn.style.cursor = 'pointer';
    zoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = parseFloat(vid.dataset.vscale || '1');
      const next = Math.min(2, Math.round((cur + 0.1) * 100) / 100);
      vid.style.transform = `scale(${next})`;
      vid.dataset.vscale = String(next);
    });
    wrap.appendChild(zoomIn);

    // expand/maximize button (opens full-screen modal)
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
    expandBtn.title = 'تكبير النافذة';
    expandBtn.style.border = 'none';
    expandBtn.style.background = 'transparent';
    expandBtn.style.color = 'white';
    expandBtn.style.cursor = 'pointer';
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showExpand(vid);
    });
    wrap.appendChild(expandBtn);

    // fit/reset button (resets scale & volume)
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.title = 'إعادة الضبط';
    resetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    resetBtn.style.border = 'none';
    resetBtn.style.background = 'transparent';
    resetBtn.style.color = 'white';
    resetBtn.style.cursor = 'pointer';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      vid.style.transform = '';
      vid.dataset.vscale = '1';
      vid.volume = 1;
      volInput.value = '1';
      vid.muted = false;
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    });
    wrap.appendChild(resetBtn);

    // position overlay inside video's parent (relative)
    const parent = vid.parentElement;
    if (!parent) return;
    // ensure parent can contain absolute overlay
    const prevPosition = window.getComputedStyle(parent).position;
    if (prevPosition === 'static') parent.style.position = 'relative';
    parent.appendChild(wrap);

    // keyboard accessibility: focusable controls
    [muteBtn, volInput, zoomOut, zoomIn, expandBtn, resetBtn].forEach(el => { el.tabIndex = 0; });

    // Save overlay reference for potential future cleanup
    vid._controlOverlay = wrap;

    // show/hide helpers
    let hideTimer = null;
    function showControls() {
      clearTimeout(hideTimer);
      wrap.style.opacity = '1';
      wrap.style.pointerEvents = 'auto';
      // auto-hide after 6s of inactivity
      hideTimer = setTimeout(hideControls, 6000);
    }
    function hideControls() {
      clearTimeout(hideTimer);
      wrap.style.opacity = '0';
      wrap.style.pointerEvents = 'none';
    }

    // Toggle on click of the video element (not header)
    vid.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wrap.style.opacity === '1') hideControls(); else showControls();
    });

    // Show when video receives keyboard focus
    vid.addEventListener('focus', showControls);
    // Hide on escape key when overlay visible
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && wrap.style.opacity === '1') hideControls();
    });

    // Hide controls when clicking outside the video or overlay
    document.addEventListener('click', (ev) => {
      if (!wrap || wrap.style.opacity === '0') return;
      const target = ev.target;
      if (target === vid || parent.contains(target) || wrap.contains(target)) return;
      hideControls();
    });

    // expose show/hide for tests if needed
    vid._showVideoControls = showControls;
    vid._hideVideoControls = hideControls;
  }

  // Apply to all videos except header
  function initAll() {
    const vids = Array.from(document.querySelectorAll('video')).filter(v => !v.classList.contains('header-video'));
    vids.forEach(v => {
      // ensure initial attributes for consistent behavior
      v.setAttribute('playsinline', '');
      v.muted = v.muted === undefined ? true : v.muted;
      v.volume = v.volume ?? 1;
      v.dataset.vscale = v.dataset.vscale || '1';
      // create overlay controls if not existing
      if (!v._controlOverlay) createControlsForVideo(v);
      // add double-click to toggle play/pause
      v.addEventListener('dblclick', () => { if (v.paused) v.play().catch(()=>{}); else v.pause(); });
      // allow pinch-to-zoom for touch devices by mapping wheel events with ctrlKey fallback
      v.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.05 : -0.05;
          const cur = parseFloat(v.dataset.vscale || '1');
          const next = Math.min(2, Math.max(0.5, Math.round((cur + delta) * 100) / 100));
          v.style.transform = `scale(${next})`;
          v.dataset.vscale = String(next);
        }
      }, { passive: false });
    });
  }

  // Re-init on DOM changes (e.g., slides added by Swiper)
  const observer = new MutationObserver(() => { initAll(); });
  observer.observe(document.body, { childList: true, subtree: true });

  // Run once after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();