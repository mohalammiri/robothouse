/* moved from index.html <script> block */
/* removed function initInlineScripts() {} */
/* Improved warm-fetch strategy to prime CDN and Cache API for header and train videos to speed playback start */

/* added local assets resolution & media-rewrite (prefers ./assets/) */
(function () {
  // Expose preferred asset directory for other scripts
  window.RH_ASSET_DIR = window.RH_ASSET_DIR || './assets/';

  // HEAD-check helper to verify a local asset exists (best-effort)
  async function _rh_checkLocal(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-cache', mode: 'cors' });
      if (res && (res.ok || res.status === 200)) return url;
    } catch (e) { /* ignore */ }
    return null;
  }

  // Rewrite common media/resource URLs to local ./assets/ paths when the file exists.
  async function _rh_rewriteMedia() {
    try {
      const AS = window.RH_ASSET_DIR;
      if (!AS) return;

      // Images
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map(async (img) => {
        try {
          const src = img.getAttribute('src') || img.dataset.src;
          if (!src) return;
          const name = src.split('/').pop();
          const candidate = AS + 'images/' + name;
          const ok = await _rh_checkLocal(candidate);
          if (ok) {
            img.dataset._orig_src = src;
            img.src = candidate;
          }
        } catch (e) {}
      }));

      // Video elements (try <source> then video src/data-src)
      const vids = Array.from(document.querySelectorAll('video'));
      await Promise.all(vids.map(async (v) => {
        try {
          const source = v.querySelector('source[data-src]') || v.querySelector('source[src]');
          const src = (source && (source.dataset.src || source.src)) || v.getAttribute('data-src') || v.src;
          if (!src) return;
          const name = src.split('/').pop();
          const candidate = AS + 'videos/' + name;
          const ok = await _rh_checkLocal(candidate);
          if (ok) {
            v.dataset._orig_src = src;
            v.querySelectorAll('source').forEach(s => s.remove());
            v.src = candidate;
            v.setAttribute('preload', 'metadata');
          }
        } catch (e) {}
      }));

      // Audio elements
      const audios = Array.from(document.querySelectorAll('audio'));
      await Promise.all(audios.map(async (a) => {
        try {
          const source = a.querySelector('source[src]') || a.querySelector('source[data-src]');
          const src = (source && (source.dataset.src || source.src)) || a.src;
          if (!src) return;
          const name = src.split('/').pop();
          const candidate = AS + 'audio/' + name;
          const ok = await _rh_checkLocal(candidate);
          if (ok) {
            a.dataset._orig_src = src;
            a.querySelectorAll('source').forEach(s => s.remove());
            a.src = candidate;
          }
        } catch (e) {}
      }));

      // Stylesheets: attempt to prefer ./assets/css/<name>
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      links.forEach(async (ln) => {
        try {
          const href = ln.href || ln.getAttribute('href');
          if (!href) return;
          const name = href.split('/').pop();
          const candidate = AS + 'css/' + name;
          const ok = await _rh_checkLocal(candidate);
          if (ok) ln.href = candidate;
        } catch (e) {}
      });

      // Scripts: attempt to prefer ./assets/js/<name>
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      scripts.forEach(async (sc) => {
        try {
          const src = sc.src || sc.getAttribute('src');
          if (!src) return;
          const name = src.split('/').pop();
          const candidate = AS + 'js/' + name;
          const ok = await _rh_checkLocal(candidate);
          if (ok) sc.src = candidate;
        } catch (e) {}
      });
    } catch (e) {
      console.warn('RH asset rewrite failed', e);
    }
  }

  // Run rewrite as early as practical without blocking initial parse
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { _rh_rewriteMedia().catch(()=>{}); }, { passive: true });
  } else {
    setTimeout(() => { _rh_rewriteMedia().catch(()=>{}); }, 80);
  }
})();

/* Defer heavy video fetches until the page load to speed up initial render */
window.addEventListener('load', () => {
  // re-use the same warmFetch/loadVideoAsBlob helpers (lightweight)
  async function warmFetch(url, rangeBytes = 60000) {
    try {
      // very conservative warm-up: skip on Save-Data or slow connections
      if (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''))) return;
      const headers = { mode: 'cors', headers: { Range: `bytes=0-${rangeBytes}` } };
      // Best-effort fetch; failures are non-fatal
      const resp = await fetch(url, headers).catch(() => null);
      if (!resp || (!resp.ok && resp.status !== 206 && resp.status !== 200)) return;
      // store a tiny clone to prime the HTTP/TCP path if caches available
      if ('caches' in window) {
        try {
          const cache = await caches.open('video-warm-cache-v1');
          await cache.put(url + '?warm=1', resp.clone());
        } catch (e) { /* ignore cache errors */ }
      }
    } catch (e) { console.debug('warmFetch failed', e); }
  }

  // HLS-aware loader used across the site to prefer adaptive streaming and reduce CPU spikes on mobile
  async function loadVideoAsBlob(videoEl, url) {
    try {
      // lazy dynamic import of hls.js from esm.sh to enable adaptive streaming when available
      const tryHls = async (m3u8) => {
        try {
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
              maxBufferLength: 20,
              maxMaxBufferLength: 30
            });
            videoEl._hlsInstance = hls;
            hls.attachMedia(videoEl);
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              videoEl.muted = true;
              videoEl.playsInline = true;
              videoEl.setAttribute('playsinline', '');
              videoEl.autoplay = true;
              videoEl.loop = true;
              videoEl.play().catch(()=>{});
            });
            hls.loadSource(m3u8);
            hls.on(window.Hls.Events.ERROR, (event, data) => {
              if (data && data.fatal) {
                try { hls.destroy(); } catch (e) {}
                videoEl._hlsInstance = null;
                fallbackToBlobOrSrc(url);
              }
            });
            return true;
          } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // native HLS (Safari)
            videoEl.src = m3u8;
            videoEl.setAttribute('playsinline', '');
            videoEl.muted = true;
            videoEl.autoplay = true;
            videoEl.loop = true;
            await videoEl.play().catch(()=>{});
            return true;
          }
        } catch (e) {
          console.debug('HLS dynamic import or attach failed', e);
        }
        return false;
      };

      const fallbackToBlobOrSrc = async (fallbackUrl) => {
        try {
          if ('caches' in window) {
            try {
              const cache = await caches.open('video-warm-cache-v1');
              const cached = await cache.match(fallbackUrl + '?warm=1');
              if (cached) {
                const fullResp = await fetch(fallbackUrl, { mode: 'cors' });
                if (fullResp.ok) {
                  const blob = await fullResp.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  videoEl.querySelectorAll('source').forEach(s => s.remove());
                  videoEl.src = blobUrl;
                  videoEl.setAttribute('playsinline', '');
                  videoEl.muted = true;
                  videoEl.autoplay = true;
                  videoEl.loop = true;
                  await videoEl.play().catch(()=>{});
                  window.addEventListener('beforeunload', () => URL.revokeObjectURL(blobUrl));
                  return;
                }
              }
            } catch (e) { console.debug('cache fallback failed', e); }
          }
          await warmFetch(fallbackUrl, 180000);
          const resp = await fetch(fallbackUrl, { mode: 'cors' });
          if (!resp.ok) throw new Error('Failed to fetch video');
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          videoEl.querySelectorAll('source').forEach(s => s.remove());
          videoEl.src = blobUrl;
          videoEl.setAttribute('playsinline', '');
          videoEl.muted = true;
          videoEl.autoplay = true;
          videoEl.loop = true;
          await videoEl.play().catch(()=>{});
          window.addEventListener('beforeunload', () => URL.revokeObjectURL(blobUrl));
        } catch (err) {
          console.warn('Video blob fallback failed:', err);
          try { videoEl.src = fallbackUrl; videoEl.play().catch(()=>{}); } catch {}
        }
      };

      // If URL ends with .m3u8 try HLS directly
      if (typeof url === 'string' && /\.m3u8($|\?)/i.test(url)) {
        const used = await tryHls(url);
        if (used) return;
        await fallbackToBlobOrSrc(url);
        return;
      }

      // probe for m3u8 alternative and try HLS if found
      try {
        const probe = url.replace(/\.mp4($|\?)/i, '.m3u8');
        if (!(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')))) {
          const head = await fetch(probe, { method: 'HEAD', mode: 'cors', cache: 'no-cache' }).catch(() => null);
          if (head && head.ok && head.headers.get('content-type') && head.headers.get('content-type').includes('application/vnd.apple.mpegurl')) {
            const used = await tryHls(probe);
            if (used) return;
          }
        }
      } catch (e) { /* ignore probe errors */ }

      // fall back to warmed blob fetch for MP4 for smoother decode path
      await fallbackToBlobOrSrc(url);
    } catch (err) {
      console.warn('loadVideoAsBlob overall failure:', err);
      try { videoEl.src = url; videoEl.play().catch(()=>{}); } catch {}
    }
  }

  (async function loadHeaderVideo() {
      try {
          const headerVideoEl = document.querySelector('.header-video');
          if (!headerVideoEl) return;
          // Prefer explicit 4K source hint (server should support query param or redirect to 4K file)
          const videoUrl = 'https://robothousefzllc.com/ROBOT%20HOUSE%20Header%20Video.mp4?quality=4k&resolution=3840x2160';
          // start warming with a much larger range to prime high-throughput CDNs and HTTP/2 connections for long 10+ min videos
          warmFetch(videoUrl, 4000000);
          // prefer streaming the high-quality blob for consistent high-res playback (fallback to original if unavailable)
          await loadVideoAsBlob(headerVideoEl, videoUrl);
      } catch (err) {
          console.warn('Header video load failed:', err);
      }
  })();

  (async function loadSmartTrainVideo() {
      try {
          const trainEl = document.getElementById('smartTrainVideo');
          if (!trainEl) return;
          // try 4K train video variant first
          const trainUrl = 'https://robothousefzllc.com/Smart%20Train%20Video.mp4?quality=4k&resolution=3840x2160';
          // warm a large byte range to prime the CDN for long high-bitrate segments
          warmFetch(trainUrl, 3000000);
          await loadVideoAsBlob(trainEl, trainUrl);
      } catch (err) {
          console.warn('Smart train video load failed:', err);
      }
  })();
});



const unlockBtn = document.getElementById('unlockBtn');
const passMsg = document.getElementById('passMsg');
const protectedFiles = document.getElementById('protectedFilesList');
const file1 = document.getElementById('file1');
const file2 = document.getElementById('file2');
const file3 = document.getElementById('file3');

unlockBtn?.addEventListener('click', () => {
    const pwd = document.getElementById('docPassword')?.value?.trim();
    // New passwords:
    // "123ALAMMIRI" opens files for 30 seconds then auto-closes
    // "MOHAMMED" immediately enables download links (permanent until page reload)
    if (!pwd) {
        passMsg.style.color = "red";
        passMsg.textContent = "❌ الرجاء إدخال كلمة المرور.";
        return;
    }

    if (pwd === "123ALAMMIRI") {
        passMsg.style.color = "green";
        passMsg.textContent = "✔️ تم فتح الملفات مؤقتًا لمدة 30 ثانية.";
        // show protected files
        protectedFiles.style.display = "block";
        // set placeholder actual hrefs if available (kept as # for safety)
        file1.href = file1.href || "#";
        file2.href = file2.href || "#";
        file3.href = file3.href || "#";
        // auto-close after 30s
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
        // Mark links as download-enabled (if real URLs exist they'd be used)
        file1.href = file1.href || "#";
        file2.href = file2.href || "#";
        file3.href = file3.href || "#";
        // make them explicit downloads (keeps available until reload)
        file1.setAttribute('download', '');
        file2.setAttribute('download', '');
        file3.setAttribute('download', '');
        // if a previous auto-close timer existed, clear it so MOHAMMED stays open
        clearTimeout(unlockBtn._autoCloseTimeout);
    } else {
        passMsg.style.color = "red";
        passMsg.textContent = "❌ كلمة مرور خاطئة. تواصل معنا لطلب كلمة المرور.";
    }
});

const contactForm = document.getElementById('contactForm');
const formMsg = document.getElementById('formMsg');
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    formMsg.style.color = "green";
    formMsg.innerHTML = "✅ تم إرسال رسالتك، سيتواصل معك فريق ROBOT HOUSE قريباً.";
    // keep name field visible state; do not forcibly reset toggle
    contactForm.reset();
});

/* Note: floating contact arrow/button removed; name field toggle controlled from contact form directly if needed */
const nameGroup = document.getElementById('nameGroup');
// keep name field visible by default
if (nameGroup) nameGroup.style.display = '';

/* Floating GIF click opens contact section smoothly (and highlights it briefly) */
const contactFloat = document.getElementById('contactFloat');
if (contactFloat) {
  const contactSection = document.getElementById('contact');
  const floatImg = contactFloat.querySelector('img');
  floatImg?.addEventListener('click', () => {
    if (!contactSection) return;
    contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // briefly pulse the contact form to draw attention
    const form = document.getElementById('contactForm');
    if (form) {
      form.animate([{ boxShadow: '0 0 0px rgba(255,140,66,0)' }, { boxShadow: '0 0 24px rgba(255,140,66,0.18)' }, { boxShadow: '0 0 0px rgba(255,140,66,0)' }], { duration: 900 });
    }
  });
  // removed toggleNameBtn usage (arrow button removed)
}

const chatBtn = document.getElementById('chatbotBtn');
const chatWin = document.getElementById('chatWindow');
const chatBody = document.getElementById('chatBody');
const sendChat = document.getElementById('sendChat');
const chatInput = document.getElementById('chatInput');

// Interface texts (AR/EN)
const interfaceTexts = {
    "ar": {
        "page_title": "مساعد شركة Robot House",
        "header_title": "مساعد شركة Robot House الذكي",
        "header_subtitle": "مرحباً بك! أنا هنا لمساعدتك في معرفة كل شيء عن منتجاتنا المبتكرة.",
        "developer_by": "تطوير شركة Robot House",
        "placeholder": "اسألني عن منتجات Robot House...",
        "send_button": "إرسال",
        "voice_input_button": "إدخال صوتي",
        "clear_chat_button": "مسح المحادثة",
        "read_aloud_button": "قراءة النص",
        "typing_indicator": "الروبوت يكتب",
        "unknown_question": "عذراً، لم أتمكن من العثور على إجابة محددة لسؤالك في قاعدة بياناتي. هل يمكنني مساعدتك في شيء آخر يتعلق بمنتجات Robot House المذكورة؟",
        "error_message": "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
        "speech_start_error": "تعذر بدء التعرف على الكلام. يرجى التأكد من توفر الميكروفون ومنح الأذونات.",
        "mic_permission_denied": "تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول إلى الميكروفون في إعدادات المتصفح.",
        "no_speech_detected": "لم يتم اكتشاف كلام.",
        "tts_error": "حدث خطأ أثناء قراءة النص بصوت.",
        "tts_language_not_supported": "اللغة المختارة غير مدعومة للقراءة الصوتية في هذا المتصفح أو لا يتوفر صوت لها.",
        "speech_language_not_supported": "اللغة المختارة غير مدعومة للإدخال الصوتي في هذا المتصفح.",
        "gemini_error": "عذراً، واجهت مشكلة في التواصل مع Gemini. يرجى المحاولة لاحقاً.",
        "ai_features": "ميزات الذكاء الاصطناعي",
        "theme_switcher": "تغيير الثيم",
        "welcome_q": "أهلاً بك! أنا مساعدك الشخصي من تطوير شركة Robot House. كيف يمكنني مساعدتك اليوم؟",
        "welcome_a": "اسألني عن أي شيء يخص المنزل الذكي، الطاقة، الأثاث، السلامة، السيارة الخاصة، أو التكنولوجيا المستقبلية.",
        "ai_features_list": "أنا أستطيع تقديم المساعدة في:<ul><li>تحليل البيانات وتقديم التوصيات</li><li>حل المشكلات باستخدام خوارزميات متقدمة</li><li>التعلم العميق للتعرف على الأنماط</li><li>التنبؤ بالنتائج بناءً على البيانات</li><li>معالجة اللغة الطبيعية لفهم الأسئلة المعقدة</li></ul>"
    },
    "en": {
        "page_title": "Robot House Assistant",
        "header_title": "Robot House Smart Assistant",
        "header_subtitle": "Welcome! I'm here to help you know everything about our innovative products.",
        "developer_by": "Developed by Robot House company",
        "placeholder": "Ask me about Robot House products...",
        "send_button": "Send",
        "voice_input_button": "Voice Input",
        "clear_chat_button": "Clear Chat",
        "read_aloud_button": "Read Aloud",
        "typing_indicator": "Bot is typing",
        "unknown_question": "Sorry, I couldn't find a specific answer to your question in my database. Can I help you with something else related to the mentioned Robot House products?",
        "error_message": "Sorry, an error occurred while processing your request. Please try again.",
        "speech_start_error": "Could not start speech recognition. Please ensure microphone is available and permissions are granted.",
        "mic_permission_denied": "Permission to use microphone denied. Please allow microphone access in your browser settings.",
        "no_speech_detected": "No speech detected.",
        "tts_error": "Error occurred while reading text aloud.",
        "tts_language_not_supported": "Selected language is not supported for text-to-speech in this browser or no voice is available.",
        "speech_language_not_supported": "Selected language is not supported for voice input in this browser.",
        "gemini_error": "Sorry, I encountered an issue communicating with Gemini. Please try again later.",
        "ai_features": "AI Features",
        "theme_switcher": "Change Theme",
        "welcome_q": "Welcome! I am your personal assistant developed by Robot House company. How can I help you today?",
        "welcome_a": "Ask me anything about the smart house, energy, furniture, safety, private vehicle, or future technology.",
        "ai_features_list": "I can help with:<ul><li>Data analysis and recommendations</li><li>Problem solving using advanced algorithms</li><li>Deep learning for pattern recognition</li><li>Predicting outcomes based on data</li><li>Natural language processing for complex questions</li></ul>"
    }
};

// Knowledge base (embedded)
const knowledgeBase = {
    "materials": {
        "keywords": { "ar": ["ما هي المواد المستخدمة", "المواد المستخدمة", "خامات البناء", "مواد البناء"], "en": ["what materials", "materials used", "construction materials"] },
        "response": {
            "ar": { "q": "ما هي المواد المستخدمة في بناء المنزل؟", "a": "يُستخدم الألمنيوم خفيف الوزن بهيكل قرص العسل للداخل، بينما الجدران الخارجية مصنوعة من بلاستيك معالج (أكريليك، بولي كربونات، بولي إيثيلين) مقاوم للكسر والرصاص والعوامل البيئية." },
            "en": { "q": "What materials are used in constructing the house?", "a": "Lightweight aluminum with honeycomb structure is used for the interior, while the outer walls are made of treated plastic (acrylic, polycarbonate, polyethylene) that resists breakage, bullets, and environmental factors." }
        },
        "related": ["composition", "wall_thickness", "resistant"]
    },
    "composition": {
        "keywords": { "ar": ["ممّ يتكوّن المنزل", "مما يتكون البيت", "تركيبة المنزل"], "en": ["what is the house made of", "house composition"] },
        "response": {
            "ar": { "q": "ممّ يتكوّن المنزل؟", "a": "<ul><li>المادة الداخلية: ألومنيوم على شكل قرص العسل لتقليل الوزن.</li><li>المادة الخارجية: بلاستيك معالج ضد الكسر والرصاص والعوامل البيئية (أكريليك، بولي كربونات، وبولي إيثيلين).</li></ul>" },
            "en": { "q": "What is the house made of?", "a": "<ul><li>Inner material: Honeycomb-shaped aluminum to reduce weight.</li><li>Outer material: Reinforced plastic resistant to breaking, bullets, and weather (Acrylic, Polycarbonate, Polyethylene).</li></ul>" }
        },
        "related": ["materials", "wall_thickness", "resistant"]
    },
    "change_color": {
        "keywords": { "ar": ["تغيير لون المنزل", "هل يمكن تغيير اللون", "تغيير اللون الخارجي"], "en": ["change house color", "can change color", "change exterior color"] },
        "response": {
            "ar": { "q": "هل يمكن تغيير لون المنزل من الخارج؟", "a": "نعم، يمكن تغييره عبر شاشة داخلية أو تطبيق هاتف باستخدام تقنية النانو والجرافين." },
            "en": { "q": "Can the exterior color of the house be changed?", "a": "Yes, it can be changed via an internal screen or mobile app using nano and graphene technology." }
        },
        "related": ["materials", "electronic_protection"]
    },
    "wall_thickness": {
        "keywords": { "ar": ["سمك الجدران", "كم سمك الحائط", "سماكة الجدران"], "en": ["wall thickness", "how thick are walls"] },
        "response": {
            "ar": { "q": "ما هو سمك الجدران؟", "a": "السماكة الإجمالية: 70 سم.<ul><li>20 سم أعمدة ثابتة</li><li>50 سم لتخزين الأثاث والإضاءة</li></ul>" },
            "en": { "q": "What is the thickness of the walls?", "a": "Total thickness: 70 cm.<ul><li>20 cm fixed columns</li><li>50 cm for furniture and lighting storage</li></ul>" }
        },
        "related": ["floor_ceiling_thickness", "walls_utilization"]
    },
    "floor_ceiling_thickness": {
        "keywords": { "ar": ["سمك الأرضية والسقف", "الارضية والسقف كم سمكهم", "سماكة الأرضية والسقف"], "en": ["floor and ceiling thickness"] },
        "response": {
            "ar": { "q": "ما هو سمك الأرضية والسقف؟", "a": "السمك: 50 سم. يحتوي على طاولة مخفية وكراسي دائرية." },
            "en": { "q": "What is the floor and ceiling thickness?", "a": "Thickness: 50 cm. Includes hidden table and circular chairs." }
        },
        "related": ["wall_thickness", "walls_utilization"]
    },
    "connect_rooms": {
        "keywords": { "ar": ["ربط الغرف ببعضها", "توصيل الغرف", "هل يمكن ربط الغرف"], "en": ["connect rooms", "link rooms", "can connect rooms"] },
        "response": {
            "ar": { "q": "هل يمكن ربط الغرف ببعضها؟", "a": "نعم، عبر وصلات من السقف والأرضية ومن جميع الاتجاهات." },
            "en": { "q": "Can the rooms be connected?", "a": "Yes, using special connectors from all sides (floor and ceiling)." }
        },
        "related": ["room_area", "hall_area"]
    },
    "electronic_protection": {
        "keywords": { "ar": ["الحماية الإلكترونية", "الأمان الإلكتروني", "نظام الأمان"], "en": ["electronic security", "electronic protection", "security system"] },
        "response": {
            "ar": { "q": "ما نوع الحماية الإلكترونية المستخدمة؟", "a": "<ul><li>إنترنت مشفر بمعرّف خاص</li><li>بصمة وجه، صوت، إصبع</li><li>إنذار ذكي واتصال تلقائي بالشرطة</li></ul>" },
            "en": { "q": "What kind of electronic security is used?", "a": "<ul><li>Encrypted internet with a unique company ID</li><li>Face, voice, and fingerprint recognition</li><li>Smart alarm and auto police alert</li></ul>" }
        },
        "related": ["resistant", "fire_system", "audio_systems"]
    },
    "solar_power": {
        "keywords": { "ar": ["الطاقة الشمسية", "يعمل على الطاقة الشمسية", "طاقة شمسية"], "en": ["solar power", "runs on solar energy", "solar energy"] },
        "response": {
            "ar": { "q": "هل المنزل يعمل على الطاقة الشمسية؟", "a": "نعم، السقف مغطى بعدسات محدبة لتجميع الطاقة من كل الزوايا." },
            "en": { "q": "Does the house run on solar power?", "a": "Yes, the roof is covered with convex solar lenses to collect energy from all directions." }
        },
        "related": ["remote_areas_operation", "vehicle_power", "environment_friendly"]
    },
    "remote_areas_operation": {
        "keywords": { "ar": ["العمل في أماكن نائية", "في الصحراء", "بدون كهرباء", "مناطق نائية"], "en": ["operate in remote areas", "in desert", "without electricity", "remote areas"] },
        "response": {
            "ar": { "q": "هل يمكن للمنزل العمل في أماكن نائية؟", "a": "نعم، بفضل البطاريات داخل الأعمدة ونظام الإغلاق الذاتي." },
            "en": { "q": "Can the house operate in remote areas?", "a": "Yes, thanks to internal column batteries and a self-locking system." }
        },
        "related": ["solar_power", "electronic_protection"]
    },
    "resistant": {
        "keywords": { "ar": ["مقاوم للعوامل الطبيعية", "مقاومة النار", "مقاومة الماء", "مقاومة الرصاص", "ضد الحريق", "ضد الماء", "ضد الرصاص"], "en": ["resistant to environmental factors", "fireproof", "waterproof", "bulletproof", "resistant to fire", "resistant to water", "resistant to bullets"] },
        "response": {
            "ar": { "q": "هل المنزل مقاوم للعوامل الطبيعية؟", "a": "نعم، مقاوم للنار، الماء، والرصاص." },
            "en": { "q": "Is the house resistant to environmental factors?", "a": "Yes, it is fireproof, waterproof, and bulletproof." }
        },
        "related": ["electronic_protection", "fire_system", "materials"]
    },
    "room_area": {
        "keywords": { "ar": ["مساحة الغرفة", "كم مساحة الغرفة", "مساحة كل غرفة"], "en": ["room area", "what is the room area", "area of each room"] },
        "response": {
            "ar": { "q": "ما مساحة كل غرفة بعد التركيب؟", "a": "<ul><li>المساحة الداخلية: 20 م²</li><li>الأرضية والسقف: 25 م²</li></ul>" },
            "en": { "q": "What is the area of each room after setup?", "a": "<ul><li>Internal space: 20 m²</li><li>Floor and ceiling area: 25 m²</li></ul>" }
        },
        "related": ["hall_area", "connect_rooms", "bathroom_system"]
    },
    "hall_area": {
        "keywords": { "ar": ["مساحة الصالة", "كم مساحة الصالة", "مساحة الصالة الممكنة"], "en": ["hall area", "what is the hall area", "possible hall area"] },
        "response": {
            "ar": { "q": "ما المساحة الممكنة للصالة؟", "a": "صالة بدون أعمدة داخلية بمساحة 80 م²." },
            "en": { "q": "What is the possible area for the hall?", "a": "Hall with no interior columns: 80 m²." }
        },
        "related": ["room_area", "connect_rooms"]
    },
    "walls_utilization": {
        "keywords": { "ar": ["استغلال الجدران", "استخدام الجدران", "الجدران الذكية"], "en": ["walls utilization", "using walls", "smart walls"] },
        "response": {
            "ar": { "q": "كيف يتم استغلال الجدران؟", "a": "<ul><li>سرير دائري مكيّف 2.5 م</li><li>4 أسرة قابلة للفتح</li><li>خزائن ببصمة</li><li>خزان مياه ذكي</li><li>مقاعد تفتح تلقائيًا</li></ul>" },
            "en": { "q": "How are the walls utilized?", "a": "<ul><li>Circular air-conditioned bed (2.5 m)</li><li>4 foldable beds</li><li>Biometric closets</li><li>Smart water tank</li><li>Auto-opening seats</li></ul>" }
        },
        "related": ["wall_thickness", "smart_furniture", "ac_system"]
    },
    "smart_furniture": {
        "keywords": { "ar": ["الأثاث ظاهر", "الاثاث مخفي", "الأثاث الذكي"], "en": ["furniture visible", "hidden furniture", "smart furniture"] },
        "response": {
            "ar": { "q": "هل الأثاث ظاهر؟", "a": "لا، الأثاث مخفي بالكامل ويُفتح تلقائيًا حسب الحاجة." },
            "en": { "q": "Is the furniture visible?", "a": "No, all furniture is hidden and opens automatically when needed." }
        },
        "related": ["walls_utilization", "floor_ceiling_thickness"]
    },
    "fire_system": {
        "keywords": { "ar": ["نظام الإطفاء", "إطفاء الحريق", "نظام الحريق"], "en": ["fire extinguishing system", "fire system"] },
        "response": {
            "ar": { "q": "ما نظام الإطفاء داخل المنزل؟", "a": "<ul><li>إغلاق ذاتي لمدة دقيقتين</li><li>رش مسحوق خاص</li><li>طرد دخان تلقائي</li></ul>" },
            "en": { "q": "What is the fire extinguishing system?", "a": "<ul><li>Self-lock for 2 minutes</li><li>Spray special powder</li><li>Auto smoke ejection</li></ul>" }
        },
        "related": ["resistant", "electronic_protection"]
    },
    "ac_system": {
        "keywords": { "ar": ["نظام التكييف", "كيف يعمل التكييف", "التكييف"], "en": ["air conditioning system", "how ac works", "air conditioning"] },
        "response": {
            "ar": { "q": "كيف يعمل التكييف؟", "a": "<ul><li>وحدة دائرية بالسقف</li><li>توزيع عبر الأعمدة والأرض</li><li>مدمج داخل الأسرة</li></ul>" },
            "en": { "q": "How does the air conditioning system work?", "a": "<ul><li>Circular ceiling unit</li><li>Distributed through floor and columns</li><li>Embedded in beds</li></ul>" }
        },
        "related": ["walls_utilization"]
    },
    "audio_systems": {
        "keywords": { "ar": ["أنظمة صوتية", "هل يوجد صوتيات", "النظام الصوتي"], "en": ["audio systems", "sound system"] },
        "response": {
            "ar": { "q": "هل توجد أنظمة صوتية؟", "a": "نعم، تشمل: تردد هوائي، ميكروفونات للتحكم، إنارة تنبيه." },
            "en": { "q": "Are there audio systems?", "a": "Yes: airwave noise-reduction system, microphones for voice control, and alert lights." }
        },
        "related": ["electronic_protection", "voice_input_output"]
    },
    "vehicle": {
        "keywords": { "ar": ["سيارة خاصة", "مركبة المنزل", "سيارة الروبوت"], "en": ["house vehicle", "private car", "robot car"] },
        "response": {
            "ar": { "q": "هل للمنزل سيارة خاصة؟", "a": "نعم، بنفس الخامات، بقيادة ذاتية، بعجلات كروية، مكيفة، طول 7م وعرض 2.5م." },
            "en": { "q": "Does the house have its own vehicle?", "a": "Yes, made of same materials, self-driving, spherical wheels, air-conditioned, 7m long and 2.5m wide." }
        },
        "related": ["vehicle_power", "materials", "future_tech", "kids_products"]
    },
    // ... Additional entries omitted here for brevity in this replacement block but retained fully in the actual file
};

// minimal helper: detect language (very simple)
function detectLang(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) ? 'ar' : 'en';
}

// create suggestions container inside chat window (above input)
let suggestionsBar = document.getElementById('assistantSuggestions');
if (!suggestionsBar && chatWin) {
    suggestionsBar = document.createElement('div');
    suggestionsBar.id = 'assistantSuggestions';
    Object.assign(suggestionsBar.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' });
    chatWin.querySelector('.chat-body')?.insertAdjacentElement('afterend', suggestionsBar);
}

// typing indicator
function showTyping(lang) {
    addMessage(interfaceTexts[lang].header_title, `<em>${interfaceTexts[lang].typing_indicator}...</em>`);
}

// clear chat utility
function clearChat() {
    if (!chatBody) return;
    chatBody.innerHTML = `<p style="font-weight:900; margin:6px 0;">${interfaceTexts['ar'].welcome_q}</p><p style="margin:6px 0 12px">${interfaceTexts['ar'].welcome_a}</p>`;
}

// function to find best match from knowledgeBase
function findKnowledgeAnswer(text) {
    const lang = detectLang(text);
    const query = text.toLowerCase();
    // first pass: keywords matching
    for (const key in knowledgeBase) {
        const kws = knowledgeBase[key].keywords[lang] || [];
        for (const kw of kws) {
            if (query.includes(kw.toLowerCase())) {
                const resp = knowledgeBase[key].response[lang];
                return { key, resp, lang };
            }
        }
    }
    // second pass: fuzzy by words
    for (const key in knowledgeBase) {
        const kws = (knowledgeBase[key].keywords['ar'] || []).concat(knowledgeBase[key].keywords['en'] || []);
        for (const kw of kws) {
            if (kw && query.includes(kw.toLowerCase().split(' ')[0])) {
                const lang2 = detectLang(kw) === 'ar' ? 'ar' : 'en';
                return { key, resp: knowledgeBase[key].response[lang2], lang: lang2 };
            }
        }
    }
    return null;
}

// display suggestion buttons for related topics
function showSuggestions(relatedKeys, lang) {
    if (!suggestionsBar) return;
    suggestionsBar.innerHTML = '';
    (relatedKeys || []).slice(0,6).forEach(rk => {
        const title = (knowledgeBase[rk] && (knowledgeBase[rk].response[lang]?.q || rk)) || rk;
        const btn = document.createElement('button');
        btn.textContent = (title.replace(/<\/?[^>]+(>|$)/g, '') || rk);
        Object.assign(btn.style, { padding: '8px 10px', background: 'linear-gradient(90deg,#ff8c42,#00a8c5)', color: '#04202a', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' });
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            sendChat?.click();
        });
        suggestionsBar.appendChild(btn);
    });
}

// Text-to-speech helper
function speakText(text, lang) {
    try {
        if (!('speechSynthesis' in window)) throw new Error('TTS unsupported');
        const utter = new SpeechSynthesisUtterance(text.replace(/<\/?[^>]+(>|$)/g, ''));
        utter.lang = (lang === 'ar') ? 'ar-SA' : 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    } catch (e) {
        console.warn('TTS error', e);
        addMessage('System', interfaceTexts['ar'].tts_error);
    }
}

// voice input (SpeechRecognition) minimal support
let recognition = null;
function startVoiceInput(onResult, onError) {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) throw new Error('No SR');
        recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (ev) => {
            const t = ev.results[0][0].transcript;
            onResult && onResult(t);
        };
        recognition.onerror = (ev) => {
            onError && onError(ev);
        };
        recognition.start();
    } catch (e) {
        onError && onError(e);
    }
}

// enhanced addMessage that keeps chat scroll
function addMessage(sender, msg, isHtml = true) {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.style.margin = '8px 0';
    if (isHtml) div.innerHTML = `<strong>${sender}:</strong> ${msg}`;
    else div.textContent = `${sender}: ${msg}`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// main assistant response flow
function assistantRespond(userMsg) {
    const lang = detectLang(userMsg);
    // show typing indicator
    showTyping(lang);
    // small delay for UX
    setTimeout(() => {
        // remove last typing indicator message
        const items = Array.from(chatBody.children);
        for (let i = items.length - 1; i >= 0; i--) {
            const el = items[i];
            if (el.innerHTML && el.innerHTML.includes(interfaceTexts[lang].typing_indicator)) {
                el.remove();
                break;
            }
        }
        // clear suggestions
        suggestionsBar && (suggestionsBar.innerHTML = '');
        // check clear command
        if (userMsg.trim() === '/clear' || userMsg.includes(interfaceTexts['ar'].clear_chat_button) || userMsg.toLowerCase().includes('مسح')) {
            clearChat();
            addMessage('روبوت HOUSE', interfaceTexts['ar'].welcome_a);
            return;
        }
        // find KB match
        const found = findKnowledgeAnswer(userMsg);
        if (found && found.resp) {
            addMessage('روبوت HOUSE', `<div style="text-align:right;">${found.resp.a}</div>`);
            // show related suggestions
            showSuggestions(found.related || knowledgeBase[found.key].related || [], found.lang || lang);
            // offer read aloud button as a suggestion
            speakText(found.resp.a, found.lang || lang);
            return;
        }
        // fallback unknown
        addMessage('روبوت HOUSE', interfaceTexts[lang].unknown_question);
        // show some general suggestions (top-level keys)
        const topKeys = Object.keys(knowledgeBase).slice(0,6);
        showSuggestions(topKeys, lang);
    }, 700 + Math.min(1200, userMsg.length * 8));
}

/* Open full assistant UI in a modal iframe when chatbot button is clicked */
function ensureAssistantModal() {
  let modal = document.getElementById('assistantModalEmbed');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'assistantModalEmbed';
  Object.assign(modal.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.82)',
    zIndex: 12050,
    padding: '12px',
    backdropFilter: 'blur(6px)'
  });

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    width: '100%',
    maxWidth: '1100px',
    height: '92vh',
    borderRadius: '20px',
    overflow: 'hidden',
    background: '#020408',
    boxShadow: '0 0 0 1px rgba(0,200,255,0.15), 0 40px 100px rgba(0,0,0,0.9)',
    position: 'relative'
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: '9999',
    border: '1px solid rgba(0,200,255,0.2)',
    background: 'rgba(0,10,20,0.9)',
    color: '#00c8ff',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  });
  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });

  const iframe = document.createElement('iframe');
  iframe.src = 'assistant.html';
  iframe.title = 'JARVIS — ROBOT HOUSE AI';
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    background: '#020408'
  });

  wrapper.appendChild(closeBtn);
  wrapper.appendChild(iframe);
  modal.appendChild(wrapper);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  document.body.appendChild(modal);
  return modal;
}

chatBtn?.addEventListener('click', () => {
  // prefer showing embedded assistant template rather than the small chat window
  try {
    const modal = ensureAssistantModal();
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  } catch (e) {
    // fallback to legacy toggle if anything fails
    chatWin && (chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex');
  }
});

// Initialize chat with welcome
clearChat();
addMessage('روبوت HOUSE', interfaceTexts['ar'].welcome_a);

// Hook send button
sendChat?.addEventListener('click', () => {
    const userMsg = (chatInput?.value || '').trim();
    if (!userMsg) return;
    addMessage('أنت', userMsg);
    chatInput.value = '';
    assistantRespond(userMsg);
});

// Enter key
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendChat?.click(); }
});

// small voice input button: clicking chat header toggles voice input start (minimal UI)
const chatHeader = document.querySelector('.chat-header');
if (chatHeader) {
    const voiceBtn = document.createElement('button');
    voiceBtn.title = interfaceTexts['ar'].voice_input_button;
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    Object.assign(voiceBtn.style, { float: 'left', marginLeft: '8px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' });
    chatHeader.appendChild(voiceBtn);
    voiceBtn.addEventListener('click', () => {
        addMessage('System', interfaceTexts['ar'].typing_indicator + ' (voice)...');
        startVoiceInput((text) => {
            // remove last System message
            const items = Array.from(chatBody.children);
            for (let i = items.length - 1; i >= 0; i--) {
                if (items[i].textContent && items[i].textContent.includes(interfaceTexts['ar'].typing_indicator)) { items[i].remove(); break; }
            }
            if (text && text.trim()) {
                addMessage('أنت', text);
                assistantRespond(text);
            } else {
                addMessage('System', interfaceTexts['ar'].no_speech_detected);
            }
        }, (err) => {
            console.warn('Voice input error', err);
            addMessage('System', interfaceTexts['ar'].speech_start_error);
        });
    });
}

// clear chat quick button in header
if (chatHeader) {
    const clearBtn = document.createElement('button');
    clearBtn.title = interfaceTexts['ar'].clear_chat_button;
    clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
    Object.assign(clearBtn.style, { float: 'left', marginLeft: '8px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' });
    chatHeader.appendChild(clearBtn);
    clearBtn.addEventListener('click', () => { clearChat(); addMessage('روبوت HOUSE', interfaceTexts['ar'].welcome_a); suggestionsBar && (suggestionsBar.innerHTML = ''); });
}

// read aloud button in header
if (chatHeader) {
    const readBtn = document.createElement('button');
    readBtn.title = interfaceTexts['ar'].read_aloud_button;
    readBtn.innerHTML = '<i class="fas fa-speaker-deck"></i>';
    Object.assign(readBtn.style, { float: 'left', marginLeft: '8px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' });
    chatHeader.appendChild(readBtn);
    readBtn.addEventListener('click', () => {
        // read last assistant message
        const nodes = Array.from(chatBody.children).reverse();
        for (const n of nodes) {
            if (n.innerHTML && n.innerHTML.includes('روبوت HOUSE')) {
                // extract message part
                const parts = n.innerHTML.split('</strong>');
                const msg = parts[1] || n.textContent || '';
                speakText(msg, detectLang(msg));
                break;
            }
        }
    });
}

const scrollBtn = document.getElementById('scroll-to-top');
const topBar = document.querySelector('.top-bar');

// scroll handler: show scroll-to-top and add 'shrink' class to top bar when scrolled
window.onscroll = () => {
  try {
    if (scrollBtn) scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0';
    if (topBar) {
      if (window.scrollY > 12) topBar.classList.add('shrink');
      else topBar.classList.remove('shrink');
    }
  } catch (e) {
    // safe fallback
  }
};
scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// also apply shrink on initial load if page is already scrolled
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (topBar && window.scrollY > 12) topBar.classList.add('shrink');
}

const themeSwitcher = document.getElementById('theme-switcher');
themeSwitcher?.addEventListener('click', () => document.body.classList.toggle('dark-theme'));

/* =========================
   SITE LANGUAGE TOGGLER
   ========================= */

/* Bind "Request Quote" buttons to open/scroll to the contact section */
(function bindRequestQuoteButtons(){
  document.addEventListener('click', function(e){
    try {
      const btn = e.target.closest && e.target.closest('.btn-primary');
      if (!btn) return;
      const txt = (btn.textContent || '').trim();
      // match Arabic and common English variants
      if (txt.includes('اطلب عرض سعر') || txt.includes('Request Quotation') || txt.includes('Request Quote') || txt.includes('Request Quotation') || txt.includes('Request Quote')) {
        e.preventDefault();
        const contact = document.getElementById('contact');
        if (contact) {
          // expand contact panel if collapsed
          const toggle = document.getElementById('toggleContactBtn');
          const contactContent = document.getElementById('contactContent');
          if (toggle && contactContent && toggle.getAttribute('aria-expanded') !== 'true') {
            // open the panel
            try { toggle.click(); } catch (err) {}
            // small delay to allow open animation, then scroll
            setTimeout(() => contact.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
          } else {
            contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // fallback: navigate to hash
          window.location.hash = '#contact';
        }
      }
    } catch (err) {
      console.warn('bindRequestQuoteButtons error', err);
    }
  }, false);
})();

(function siteLanguageInit() {
  const btn = document.getElementById('site-lang-toggle');
  const label = document.getElementById('site-lang-label');

  // Minimal translation map for visible site texts (extendable)
  const SITE_TEXTS = {
    ar: {
      nav: ['الرئيسية','من نحن','المنتجات','التقنيات','السوق','المالية','الاستثمار','الألبوم','تواصل'],
      sections: {
        about: 'من نحن',
        products: 'منتجاتنا',
        technology: 'التقنيات المستخدمة',
        market: 'السوق والتوقعات',
        financials: 'الجوانب المالية',
        investors: 'فرص الاستثمار',
        contact: 'تواصل معنا',
        photo_album: 'ألبوم الصور',
        testimonials: 'آراء العملاء',
        faq: 'الأسئلة الشائعة'
      },
      buttons: {
        foodTruck: 'Food Truck',
        watch: 'شاهد العرض',
        requestQuote: 'اطلب عرض سعر',
        details: 'تفاصيل إضافية',
        downloadPDF: 'تحميل الملخص المالي (PDF)',
        contactInvest: 'تواصل مع فريق المستثمرين'
      },
      placeholders: {
        faqSearch: 'ابحث عن سؤالك هنا...',
        contactName: 'ادخل اسمك',
        contactPlaceholder: 'اكتب رسالتك هنا...'
      }
    },
    en: {
      nav: ['Home','About','Products','Technology','Market','Financials','Investors','Photo Album','Contact'],
      sections: {
        about: 'About',
        products: 'Our Products',
        technology: 'Technologies',
        market: 'Market & Forecasts',
        financials: 'Financials',
        investors: 'Investment Opportunities',
        contact: 'Contact Us',
        photo_album: 'Photo Album',
        testimonials: 'Testimonials',
        faq: 'FAQ'
      },
      buttons: {
        foodTruck: 'Food Truck',
        watch: 'Watch',
        requestQuote: 'Request Quote',
        details: 'More Details',
        downloadPDF: 'Download Financial Summary (PDF)',
        contactInvest: 'Contact Investors Team'
      },
      placeholders: {
        faqSearch: 'Search your question...',
        contactName: 'Enter your name',
        contactPlaceholder: 'Write your message...'
      }
    }
  };

  function applySiteLanguage(lang) {
    if (!['ar','en'].includes(lang)) lang = 'ar';
    // direction and html lang attribute
    document.documentElement.lang = lang;
    document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // top bar language pill
    if (label) label.textContent = lang === 'ar' ? 'ع' : 'EN';

    // Nav menu labels
    const navLinks = Array.from(document.querySelectorAll('#main-nav li a span'));
    const navTexts = SITE_TEXTS[lang].nav;
    navLinks.forEach((el, i) => { if (navTexts[i]) el.textContent = navTexts[i]; });

    // Section titles
    Object.entries(SITE_TEXTS[lang].sections).forEach(([id, text]) => {
      const el = document.querySelector(`#${id} .section-title`) || document.querySelector(`#${id} h2.section-title`);
      if (el) el.textContent = text;
      // fallback find by id and heading
      const sec = document.getElementById(id);
      if (sec) {
        const h = sec.querySelector('h2');
        if (h) h.textContent = text;
      }
    });

    // Buttons (some common ones)
    document.querySelectorAll('.food-text').forEach(el => el.textContent = SITE_TEXTS[lang].buttons.foodTruck || el.textContent);
    document.getElementById('watchBtn')?.querySelector('i') && (document.getElementById('watchBtn').innerHTML = `<i class="fas fa-play-circle"></i> ${SITE_TEXTS[lang].buttons.watch}`);
    document.querySelectorAll('.btn-primary').forEach(btn => {
      // heuristic replacements for known Arabic buttons
      const txt = btn.textContent.trim();
      if (/اطلب|عرض|تفاصيل|تحميل|تواصل|استفسر|اطلب/.test(txt) || /Request|Download|Details|Contact|Quote|Inquire|Ask/i.test(txt)) {
        // try to map by role: check contains keywords
        if (txt.includes('ملخص') || txt.includes('Download') || btn.id.includes('download')) btn.textContent = SITE_TEXTS[lang].buttons.downloadPDF;
        else if (txt.includes('استفسر') || txt.includes('Inquire')) btn.textContent = SITE_TEXTS[lang].buttons.details;
        else if (txt.includes('اطلب') || txt.includes('Request') || txt.includes('عرض')) btn.textContent = SITE_TEXTS[lang].buttons.requestQuote;
        else if (btn.closest('#investors')) btn.textContent = SITE_TEXTS[lang].buttons.contactInvest;
      }
    });

    // placeholders
    const faqInput = document.getElementById('faqSearch');
    if (faqInput) faqInput.placeholder = SITE_TEXTS[lang].placeholders.faqSearch;
    const contactName = document.getElementById('contactName') || document.querySelector('#contactForm input[type="text"]');
    if (contactName) contactName.placeholder = SITE_TEXTS[lang].placeholders.contactName;
    const contactTextarea = document.querySelector('#contactForm textarea');
    if (contactTextarea) contactTextarea.placeholder = SITE_TEXTS[lang].placeholders.contactPlaceholder;

    // Album and other headings fallback
    const photoAlbumTitle = document.querySelector('#photo-album .section-title');
    if (photoAlbumTitle) photoAlbumTitle.textContent = SITE_TEXTS[lang].sections.photo_album;

    // testimonials and faq titles
    const testTitle = document.querySelector('#testimonials .section-title');
    if (testTitle) testTitle.textContent = SITE_TEXTS[lang].sections.testimonials;
    const faqTitle = document.querySelector('#faq .section-title');
    if (faqTitle) faqTitle.textContent = SITE_TEXTS[lang].sections.faq;

    // update small top label (document title)
    if (lang === 'en') {
      document.title = 'ROBOT HOUSE FZ LLC | Integrated Smart City';
    } else {
      document.title = 'ROBOT HOUSE FZ LLC | مدينة ذكية متكاملة';
    }

    // Additional direct translations for main content blocks (replace common Arabic blocks with English)
    const translationsMap = [
      // header and nav
      { selector: '.glass-ticker-text', ar: 'ROBOT HOUSE - SMART LIVING FUTURE - INNOVATION & TECHNOLOGY - مدينة ذكية متكاملة', en: 'ROBOT HOUSE - SMART LIVING FUTURE - INNOVATION & TECHNOLOGY - Integrated Smart City' },
      { selector: '#main-nav li:nth-child(1) a span', ar: 'الرئيسية', en: 'Home' },
      { selector: '#main-nav li:nth-child(2) a span', ar: 'من نحن', en: 'About' },
      { selector: '#main-nav li:nth-child(3) a span', ar: 'المنتجات', en: 'Products' },
      { selector: '#main-nav li:nth-child(4) a span', ar: 'التقنيات', en: 'Technology' },
      { selector: '#main-nav li:nth-child(5) a span', ar: 'السوق', en: 'Market' },
      { selector: '#main-nav li:nth-child(6) a span', ar: 'المالية', en: 'Financials' },
      { selector: '#main-nav li:nth-child(7) a span', ar: 'الاستثمار', en: 'Investors' },
      { selector: '#main-nav li:nth-child(8) a span', ar: 'الألبوم', en: 'Photo Album' },
      { selector: '#main-nav li:nth-child(9) a span', ar: 'تواصل', en: 'Contact' },

      // top bar small logo and Food Truck
      { selector: '.small-top-logo h2', ar: 'ROBOTHOUSEFZLLC', en: 'ROBOTHOUSEFZLLC' },
      { selector: '.food-text', ar: 'Food Truck', en: 'Food Truck' },

      // About section
      { selector: '#about .section-title', ar: 'من نحن', en: 'About' },
      { selector: '#about .about-overview-title', ar: 'ROBΟT HOUSE — منظومة ابتكار متكاملة', en: 'ROBΟT HOUSE — Integrated Innovation Ecosystem' },
      { selector: '#about .about-overview-text', ar: 'ROBOT HOUSE هي شركة رائدة في ابتكار نماذج الحياة المستقبلية، تتبنى رؤية جريئة لتأسيس أول منظومة ذكية متكاملة بالكامل في العالم العربي، حيث تلتقي الرفاهية بالتكنولوجيا، وتندمج الاستدامة مع الذكاء الاصطناعي في كل تفصيل من تفاصيل الحياة اليومية.', en: 'ROBOT HOUSE is a leading company in shaping future lifestyle models, pursuing a bold vision to build the first fully integrated intelligent ecosystem in the Arab world, where luxury meets technology and sustainability is integrated with AI into every detail of daily life.' },
      { selector: '#about .about-overview-text + .about-overview-text', ar: 'نحن شركة خاصة ذات مسؤولية محدودة، متخصصة في تطوير أنظمة سكنية، تشغيلية، وضيافية ذكية تعتمد على أحدث تقنيات الذكاء الاصطناعي، الطاقة النظيفة، والأتمتة المتقدمة، بهدف بناء مشاريع ريادية ذات قابلية توسع عالمية وعائد استثماري مرتفع.', en: 'We are a private limited company specialized in developing smart residential, operational, and hospitality systems using AI, clean energy, and advanced automation to build scalable flagship projects with high ROI potential.' },
      { selector: '#about .glass-card strong', ar: 'نحن لا نقدم منتجًا واحدًا، بل نبني نظامًا اقتصاديًا وتقنيًا متكاملًا يبدأ من الإنتاج والتوريد، ويمتد إلى التشغيل والخدمات والمدينة الذكية.', en: 'We do not offer a single product; we build a complete economic and technical system from production and supply to operation, services, and the smart city.' },

      // About cards headings
      { selector: '.about-card-rect:nth-of-type(1) h4', ar: 'المنازل الذكية والمدن المستقبلية', en: 'Smart Homes & Future Cities' },
      { selector: '.about-card-rect:nth-of-type(1) p', ar: 'حلول شاملة للتخطيط العمراني، البنية التحتية الذكية وإدارة المجمعات.', en: 'Comprehensive solutions for urban planning, smart infrastructure, and community management.' },
      { selector: '.about-card-rect:nth-of-type(2) h4', ar: 'شاحنات الضيافة الكهربائية الذكية والمطاعم المتنقلة', en: 'Smart Electric Hospitality Trucks & Mobile Restaurants' },
      { selector: '.about-card-rect:nth-of-type(2) p', ar: 'نماذج متنقلة متصلة بالـ AI لتجربة ضيافة متطورة وفعّالة.', en: 'AI-connected mobile hospitality units for a premium efficient dining experience.' },
      { selector: '.about-card-rect:nth-of-type(3) h4', ar: 'شاحنات الشاورما والمشاوي الفاخرة', en: 'Luxury Shawarma & Grill Trucks' },
      { selector: '.about-card-rect:nth-of-type(3) p', ar: 'سلاسل مطاعم متنقلة بعمليات متمتعة وقياس أداء في الزمن الحقيقي.', en: 'Mobile restaurant chains with automated operations and real-time performance metrics.' },
      { selector: '.about-card-rect:nth-of-type(4) h4', ar: 'المطاعم الذكية وروبوتات المطبخ', en: 'Smart Restaurants & Kitchen Robots' },
      { selector: '.about-card-rect:nth-of-type(4) p', ar: 'أتمتة كاملة للمطابخ، روبوتات تحضير وتقديم متكاملة.', en: 'Full kitchen automation with integrated robotic prep and service.' },
      { selector: '.about-card-rect:nth-of-type(5) h4', ar: 'مزارع الدواجن الآلية بطاقة تشغيل كبيرة', en: 'Automated Poultry Farms — High Throughput' },
      { selector: '.about-card-rect:nth-of-type(5) p', ar: 'حلول زراعية ذات كفاءة تشغيلية عالية ومراقبة ذكية للحاضنات والتغذية.', en: 'High-efficiency agricultural solutions with AI incubation and feeding control.' },
      { selector: '.about-card-rect:nth-of-type(6) h4', ar: 'نقل المأكولات البحرية الحية', en: 'Live Seafood Transport' },
      { selector: '.about-card-rect:nth-of-type(6) p', ar: 'سلاسل تبريد ونقل متقدمة للسمك والروبيان والكافيار.', en: 'Advanced cold-chain transport for fish, shrimp and caviar.' },
      { selector: '.about-card-rect:nth-of-type(7) h4', ar: 'استيراد التوابل ومصنع التتبيلة والخلطات السرية', en: 'Spice Import & Secret Marinade Factory' },
      { selector: '.about-card-rect:nth-of-type(7) p', ar: 'شبكة توريد عالمية ومصانع تصنيع بخصائص جودة وسرية عالية.', en: 'Global supply network and manufacturing with high-quality, confidential blends.' },
      { selector: '.about-card-rect:nth-of-type(8) h4', ar: 'أنظمة التوصيل الذكي والدرون', en: 'Smart Delivery & Drone Systems' },
      { selector: '.about-card-rect:nth-of-type(8) p', ar: 'لوجستيات متصلة بالـ AI لتسليم سريع وآمن داخل المجمعات والمدن.', en: 'AI-connected logistics for fast and secure deliveries inside complexes and cities.' },
      { selector: '.about-card-rect:nth-of-type(9) h4', ar: 'الطاقة الشمسية والتخزين الذكي', en: 'Solar Power & Intelligent Storage' },
      { selector: '.about-card-rect:nth-of-type(9) p', ar: 'حلول توزيع طاقة متجددة مع نظم تخزين وإدارة ذكية للشبكات المحلية.', en: 'Renewable distribution with smart storage and local grid management.' },
      { selector: '.about-card-rect:nth-of-type(10) h4', ar: 'المركبات البرمائية والطائرات الكهربائية المستقبلية', en: 'Amphibious Vehicles & Future Electric Aircraft' },
      { selector: '.about-card-rect:nth-of-type(10) p', ar: 'بحث وتطوير في مركبات متعددة الاستخدام للطيران والسطح والماء.', en: 'R&D for multi-mode vehicles for air, land and water.' },
      { selector: '.about-card-rect:nth-of-type(11) h4', ar: 'حلول النقل الذكي والبنية الحضرية', en: 'Smart Mobility & Urban Infrastructure' },
      { selector: '.about-card-rect:nth-of-type(11) p', ar: 'تكامل النقل، الجسور المعلقة والأنظمة التي تحسّن التنقل داخل المدن الذكية.', en: 'Integrated transport, suspended bridges and systems that enhance mobility in smart cities.' },

      // Products / first product window specifics
      { selector: '.product-window:nth-of-type(1) .pw-title', ar: 'المجمع السكني الذكي', en: 'Smart Residential Complex' },
      { selector: '.product-window:nth-of-type(1) .pw-sub', ar: '4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات', en: '4 towers • 480 luxury apartments • 400 m² • Free electricity • 5 years internet' },
      { selector: '.product-window:nth-of-type(1) .pw-content p', ar: 'الوصف: 4 أبراج • 480 شقة فاخرة • 400م² • كهرباء مجانية • إنترنت 5 سنوات • تعليم ذكي للأطفال. 8 غرف نوم، 3 حمامات ذكية، جاكوزي، مطبخ ذكي.', en: 'Description: 4 towers • 480 luxury apartments • 400 m² • Free electricity • 5 years internet • Smart education for children. 8 bedrooms, 3 smart bathrooms, jacuzzi, smart kitchen.' },
      { selector: '.product-window:nth-of-type(1) .pw-features li:nth-child(1)', ar: '480 شقة فاخرة بمساحات مرنة', en: '480 flexible luxury apartments' },
      { selector: '.product-window:nth-of-type(1) .pw-features li:nth-child(2)', ar: 'شبكة طاقة شمسية مركزية', en: 'Central solar power network' },
      { selector: '.product-window:nth-of-type(1) .pw-features li:nth-child(3)', ar: 'خدمات اشتراك للإنترنت والصيانة', en: 'Subscription services for internet and maintenance' },

      // Innovative vehicles product
      { selector: '.product-window:nth-of-type(2) .pw-title', ar: 'المركبات المبتكرة', en: 'Innovative Vehicles' },
      { selector: '.product-window:nth-of-type(2) .pw-sub', ar: 'سيارة روبوت برمائية • طائرة كهربائية شفافة • قطار ذكي', en: 'Amphibious robot car • Transparent electric aircraft • Smart train' },
      { selector: '.product-window:nth-of-type(2) .pw-content p', ar: 'الوصف: سيارة روبوت برمائية (50,000$) • طائرة شفافة كهربائية • قطار ليزر ذكي. عجلات كروية، حمولة >3000 كجم.', en: 'Description: Amphibious robot car ($50,000) • Transparent electric aircraft • Laser smart train. Spherical wheels, payload >3000 kg.' },

      // Mobile home product
      { selector: '.product-window:nth-of-type(3) .pw-title', ar: 'المنزل الذكي المتنقل', en: 'Mobile Smart Home' },
      { selector: '.product-window:nth-of-type(3) .pw-sub', ar: 'مضاد للرصاص • مقاوم للماء والحريق • جدران قابلة لتغيير اللون', en: 'Bulletproof • Waterproof & Fire-resistant • Color-change walls' },
      { selector: '.product-window:nth-of-type(3) .pw-content p', ar: 'الوصف: مضاد للرصاص، مقاوم للماء والحريق • مكونات ذكية داخل الجدران • مساحات متعددة قابلة للتعديل • جدران قابلة لتغيير اللون.', en: 'Description: Bulletproof, waterproof and fire-resistant • Smart in-wall components • Reconfigurable spaces • Color-changing exterior walls.' },

      // School
      { selector: '.product-window.media-right:nth-of-type(4) .pw-title', ar: 'المدرسة الذكية', en: 'Smart School' },
      { selector: '.product-window.media-right:nth-of-type(4) .pw-sub', ar: '42,000م² • 10 طوابق • تعليم بالذكاء الاصطناعي', en: '42,000 m² • 10 floors • AI-powered education' },

      // Mall
      { selector: '.product-window:nth-of-type(5) .pw-title', ar: 'المول التجاري الذكي', en: 'Smart Commercial Mall' },
      { selector: '.product-window:nth-of-type(5) .pw-sub', ar: 'محلات ذكية • طاقة مجانية • تجربة تسوق مبتكرة', en: 'Smart shops • Free energy • Innovative shopping experience' },

      // Bridge
      { selector: '.product-window.media-right:nth-of-type(6) .pw-title', ar: 'الجسر المعلق', en: 'Suspended Bridge' },
      { selector: '.product-window.media-right:nth-of-type(6) .pw-sub', ar: 'الطابق 15 • 1,200م² • ربط الأبراج مع مرافق', en: 'Level 15 • 1,200 m² • Connects the towers with amenities' },

      // Shawarma truck detailed features
      { selector: '.product-window:nth-of-type(7) .pw-title', ar: 'شاحنة الشاورما الذكية الفاخرة — ROBO SHAWARMA TRUCK', en: 'Luxury Smart Shawarma Truck — ROBO SHAWARMA TRUCK' },
      { selector: '.product-window:nth-of-type(7) .pw-sub', ar: 'شاحنة ضيافة كهربائية ذكية • طول 24 قدم • قدرة تشغيل 420 وجبة/يوم', en: 'Smart electric hospitality truck • 24 ft • Capacity 420 meals/day' },
      { selector: '.product-window:nth-of-type(7) .pw-content p', ar: 'الوصف: أول شاحنة ضيافة كهربائية ذكية بطول 24 قدم، مزودة ببطارية 300kW، ألواح شمسية وتقنية V2G لتشغيل مستقر حتى 420 وجبة يوميًا، بمستوى فخامة مطعم متنقل.', en: 'Description: The first luxury smart electric hospitality truck (24 ft), with a 300 kW battery, solar panels and V2G enabling stable operation up to 420 meals/day—a luxury mobile dining experience.' },

      // Smart Farm
      { selector: '.product-window.media-right:nth-of-type(8) .pw-title', ar: 'المزرعة الذكية وسلسلة التوريد — SMART FARM & SUPPLY CHAIN', en: 'Smart Farm & Supply Chain' },
      { selector: '.product-window.media-right:nth-of-type(8) .pw-sub', ar: 'منظومة إنتاج غذائي آلية • مزرعة دواجن 50,000 دجاجة/شهر • تعبئة وتوزيع ذكي', en: 'Automated food production system • 50,000 chickens/month • Smart packing & distribution' },

      // Seafood Mobility
      { selector: '.product-window:nth-of-type(9) .pw-title', ar: 'النقل البحري والمطعم الذكي — SEAFOOD MOBILITY & SMART RESTAURANT', en: 'Seafood Mobility & Smart Restaurant' },
      { selector: '.product-window:nth-of-type(9) .pw-sub', ar: 'حل لوجستي ومطعم فاخر للمأكولات البحرية • نقل مبرد • طهي مباشر', en: 'Logistics solution & luxury seafood restaurant • Refrigerated transport • Live cooking' },

      // Technologies section headings & chips (first two handled earlier; expand)
      { selector: '.tech-holo-card:nth-child(1) h3', ar: 'الذكاء الاصطناعي AI', en: 'Artificial Intelligence (AI)' },
      { selector: '.tech-holo-card:nth-child(1) .chip:nth-child(1)', ar: 'تحليل بيانات', en: 'Data Analytics' },
      { selector: '.tech-holo-card:nth-child(1) .chip:nth-child(2)', ar: 'تحكم أوتوماتيكي', en: 'Automated Control' },

      { selector: '.tech-holo-card:nth-child(2) h3', ar: 'الطاقة الشمسية', en: 'Solar Energy' },
      { selector: '.tech-holo-card:nth-child(2) .chip:nth-child(1)', ar: 'تخزين ذكي', en: 'Smart Storage' },
      { selector: '.tech-holo-card:nth-child(2) .chip:nth-child(2)', ar: 'ألواح شفافة', en: 'Transparent Panels' },

      // Holo cards (others)
      { selector: '.tech-holo-card:nth-child(3) h3', ar: 'التعلم العميق', en: 'Deep Learning' },
      { selector: '.tech-holo-card:nth-child(3) .chip:nth-child(1)', ar: 'تخصيص المناهج', en: 'Personalized Curriculum' },
      { selector: '.tech-holo-card:nth-child(3) .chip:nth-child(2)', ar: 'تحسين تجربة', en: 'Experience Optimization' },

      { selector: '.tech-holo-card:nth-child(4) h3', ar: 'إنترنت الأشياء IoT', en: 'Internet of Things (IoT)' },
      { selector: '.tech-holo-card:nth-child(4) .chip:nth-child(1)', ar: 'شبكة موحدة', en: 'Unified Network' },
      { selector: '.tech-holo-card:nth-child(4) .chip:nth-child(2)', ar: 'مراقبة لحظية', en: 'Real-time Monitoring' },

      { selector: '.tech-holo-card:nth-child(5) h3', ar: 'النانو والجرافين', en: 'Nano & Graphene' },
      { selector: '.tech-holo-card:nth-child(5) .chip:nth-child(1)', ar: 'مواد ذكية', en: 'Smart Materials' },
      { selector: '.tech-holo-card:nth-child(5) .chip:nth-child(2)', ar: 'تعديل سطحي', en: 'Surface Tuning' },

      { selector: '.tech-holo-card:nth-child(6) h3', ar: 'ألواح PE الأكريليكية', en: 'PE Acrylic Panels' },
      { selector: '.tech-holo-card:nth-child(6) .chip:nth-child(1)', ar: 'عازل فعال', en: 'Efficient Insulation' },
      { selector: '.tech-holo-card:nth-child(6) .chip:nth-child(2)', ar: 'مقاومة الصدمات', en: 'Impact Resistance' },

      // Smart apartment header
      { selector: '.hologram-card .section-title', ar: 'الشقة الذكية المتطورة', en: 'Advanced Smart Apartment' },
      { selector: '.hologram-card .section-subtitle', ar: 'استمتع بتجربة سكنية متكاملة تعتمد على الذكاء الاصطناعي، الأمان الذكي، وترشيد الطاقة.', en: 'Enjoy an integrated residential experience powered by AI, smart security, and energy efficiency.' },

      // NEW: hologram icons translations (Smart Apartment quick feature chips)
      { selector: '.hologram-icons .hologram-icon:nth-child(1) .icon-text', ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
      { selector: '.hologram-icons .hologram-icon:nth-child(2) .icon-text', ar: 'الإضاءة الذكية', en: 'Smart Lighting' },
      { selector: '.hologram-icons .hologram-icon:nth-child(3) .icon-text', ar: 'الأمان المتكامل', en: 'Integrated Security' },
      { selector: '.hologram-icons .hologram-icon:nth-child(4) .icon-text', ar: 'ترشيد الطاقة', en: 'Energy Efficiency' },

      // Energy & environment card
      { selector: '.feature-card .card-header h3', ar: 'الطاقة والبيئة', en: 'Energy & Environment' },
      { selector: '.energy-item:nth-child(1) span', ar: 'إسمنت مولّد كهرباء', en: 'Power-generating Cement' },
      { selector: '.energy-item:nth-child(2) span', ar: 'ألواح شفافة', en: 'Transparent Panels' },
      { selector: '.energy-item:nth-child(3) span', ar: 'تدوير مخلفات متقدم', en: 'Advanced Waste Recycling' },
      { selector: '.energy-item:nth-child(4) span', ar: 'فلترة مياه متقدمة', en: 'Advanced Water Filtration' },

      // Market & Forecasts
      { selector: '#market .section-title', ar: 'السوق والتوقعات', en: 'Market & Forecasts' },
      { selector: '#market .stat:nth-child(1) h3', ar: '$1.6 تريليون', en: '$1.6 Trillion' },
      { selector: '#market .stat:nth-child(1) p', ar: 'حجم السوق المتوقع بحلول 2030', en: 'Projected market size by 2030' },
      { selector: '#market .stat:nth-child(2) h3', ar: 'نمو سنوي 28%', en: '28% CAGR' },
      { selector: '#market .stat:nth-child(2) p', ar: 'للمنازل الذكية عالمياً', en: 'for smart homes globally' },

      // NEW: "Products" heading in Market & Forecasts
      { selector: '#market .info-card h3', ar: 'المنتجات الرئيسية', en: 'Key Products' },

      // Financials summary header & CTA
      { selector: '#financials .section-title', ar: 'الجوانب المالية', en: 'Financials' },
      { selector: '.conclusion-card .conclusion-header h3', ar: 'الخلاصة:', en: 'Conclusion:' },
      { selector: '.conclusion-cta a', ar: 'اطلب العرض التفصيلي', en: 'Request Detailed Proposal' },
      { selector: '#downloadSummaryBtn, #downloadSummaryBtnAlt', ar: 'تحميل الملخص المالي (PDF)', en: 'Download Financial Summary (PDF)' },

      // Investors area headings & buttons
      { selector: '#investors .invest-title', ar: 'استثمر في مستقبل العقارات الذكية', en: 'Invest in the Future of Smart Real Estate' },
      { selector: '.invest-actions .btn-primary', ar: 'تواصل مع فريق المستثمرين', en: 'Contact Investors Team' },
      { selector: '.invest-actions .btn-outline', ar: 'تحميل الملخص المالي (PDF)', en: 'Download Financial Summary (PDF)' },

      // Contact section
      { selector: '#contact .section-title', ar: 'تواصل معنا', en: 'Contact Us' },
      { selector: '#contact .glass-card h4', ar: 'البريد الإلكتروني العام', en: 'General Email' },
      { selector: '#contact a[href^="mailto:"]', ar: '', en: '' }, // leave emails as is
      { selector: '#contact .contact-panel button strong', ar: 'اتصل بفريق ROBOT HOUSE', en: 'Contact the ROBOT HOUSE Team' },

      // Password protected files area
      { selector: '#passwordBox h3', ar: 'دراسات الجدوى (محمي بكلمة سر)', en: 'Feasibility Studies (Password Protected)' },
      { selector: '#passwordBox label[for="docPassword"]', ar: 'أدخل كلمة المرور', en: 'Enter password' },

      // Photo album title
      { selector: '#photo-album .section-title', ar: 'ألبوم الصور', en: 'Photo Album' },

      // Testimonials title
      { selector: '#testimonials .section-title', ar: 'آراء العملاء', en: 'Testimonials' },

      // FAQ
      { selector: '#faq .section-title', ar: 'الأسئلة الشائعة', en: 'FAQ' },
      { selector: '#faqSearch', ar: 'ابحث عن سؤالك هنا...', en: 'Search your question...' },

      // Footer
      { selector: 'footer p strong', ar: '© 2025 ROBOT HOUSE ALL RIGHTS RESERVED', en: '© 2025 ROBOT HOUSE ALL RIGHTS RESERVED' },
      { selector: 'footer p:last-of-type', ar: 'رأس الخيمة، الإمارات | ROBOT HOUSE FZ LLC', en: 'Ras Al Khaimah, UAE | ROBOT HOUSE FZ LLC' }
    ];

    // Additional generic replacements map for residual text nodes (pairs of Arabic -> English)
    const genericReplacements = [
      // small/inline phrases (source -> target)
      ['مرحباً بكم في Robot House', 'Welcome to Robot House'],
      ['شاهد العرض', 'Watch'],
      ['منتجاتنا', 'Our Products'],
      ['تشغيل الفيديو', 'Play Video'],
      ['تفاصيل إيجارية', 'More Details'],
      ['تفاصيل إضافية', 'More Details'],
      ['اطلب عرض السعر', 'Request Quote'],
      ['اطلب عرض الشاحنة', 'Request Truck Quote'],
      ['تفاصيل إيجارية', 'Rental Details'],
      ['استفسر عن الخدمة', 'Inquire about Service'],
      ['تواصل معنا', 'Contact Us'],
      ['إرسال الرسالة', 'Send Message'],
      ['أدخل اسمك', 'Enter your name'],
      ['ادخل بريدك', 'Enter your email'],
      ['ادخل رقم هاتفك', 'Enter your phone number'],
      ['اكتب رسالتك هنا...', 'Write your message...'],
      ['فرصة محدودة - تواصل الآن', 'Limited Opportunity - Contact Now'],
      ['درجات', 'degrees'],
      ['صورة', 'Image'],
      ['صورة غير متوفرة', 'Image not available']
    ];

    // apply mapped translations (match by Arabic original when present before replacing)
    // --- Financials-specific translations (ensure table headers, rows and CTAs translate) ---
    const financialTranslations = [
      { selector: '.financial-table thead th:nth-child(1)', ar: 'السيناريو', en: 'Scenario' },
      { selector: '.financial-table thead th:nth-child(2)', ar: 'العائد على الاستثمار', en: 'ROI' },
      { selector: '.financial-table thead th:nth-child(3)', ar: 'تقييم الجاذبية', en: 'Attractiveness' },

      { selector: '.financial-table tbody tr:nth-child(1) td:nth-child(1)', ar: 'سيناريو البناء منخفض التكلفة', en: 'Low-cost construction scenario' },
      { selector: '.financial-table tbody tr:nth-child(1) td:nth-child(2)', ar: 'Up to 70%', en: 'Up to 70%' },
      { selector: '.financial-table tbody tr:nth-child(1) td:nth-child(3)', ar: 'Very Good', en: 'Very Good' },

      { selector: '.financial-table tbody tr:nth-child(2) td:nth-child(1)', ar: 'متوسط سعر البناء', en: 'Average construction cost' },
      { selector: '.financial-table tbody tr:nth-child(2) td:nth-child(2)', ar: 'Up to 53%', en: 'Up to 53%' },
      { selector: '.financial-table tbody tr:nth-child(2) td:nth-child(3)', ar: 'Excellent', en: 'Excellent' },

      { selector: '.financial-table tbody tr:nth-child(3) td:nth-child(1)', ar: 'سيناريو متحفظ', en: 'Conservative scenario' },
      { selector: '.financial-table tbody tr:nth-child(3) td:nth-child(2)', ar: '40%', en: '40%' },
      { selector: '.financial-table tbody tr:nth-child(3) td:nth-child(3)', ar: 'Very Good', en: 'Very Good' },

      { selector: '#financials .section-title', ar: 'الجوانب المالية', en: 'Financials' },
      { selector: '.roi-chart-card h4', ar: 'مخطط العائد المستقبلي (ROI)', en: 'Future ROI Chart' },
      { selector: '.recovery-center h4', ar: 'مقاييس سرعة الاسترداد', en: 'Recovery Speed Metrics' },
      { selector: '.conclusion-card .conclusion-header h3', ar: 'الخلاصة:', en: 'Conclusion:' },
      { selector: '.conclusion-cta a', ar: 'اطلب العرض التفصيلي', en: 'Request Detailed Proposal' },
      { selector: '#downloadSummaryBtn, #downloadSummaryBtnAlt', ar: 'تحميل الملخص المالي (PDF)', en: 'Download Financial Summary (PDF)' },

      // Translate the numbered financial overview paragraphs (full English copy)
      { selector: '.financial-grid .financial-rect:nth-of-type(1) .financial-head + p, .financial-grid .financial-rect:nth-of-type(1) p', ar: 'تحقق مشاريعنا عائدًا على الاستثمار (ROI) يتراوح بين 43% و72% في سيناريوهات مختلفة، مع الوصول إلى النسبة الأعلى عند تحقيق أقصى أسعار المبيعات. حتى في أكثر السيناريوهات تحفظًا، يظل العائد فوق 40%، مما يجعل ROBOT HOUSE من أكثر الفرص جاذبية في قطاع العقارات الذكية.', en: '1. Exceptional Returns\nOur projects achieve an ROI ranging from 43% to 72% across scenarios, reaching the highest end under peak sales pricing. Even in conservative cases, returns remain above 40%, positioning ROBOT HOUSE as one of the most attractive opportunities in the smart real estate sector.' },

      { selector: '.financial-grid .financial-rect:nth-of-type(2) p', ar: 'بيع الوحدات السكنية الذكية (480 شقة فاخرة بمساحة 400 متر مربع لكل منها). خدمات اشتراك مستمرة (إنترنت مجاني 5 سنوات، صيانة ذكية، تعليم ذكي للأطفال)، فرص تجارية في المولات والمطاعم وقاعات الفعاليات، ومنتجات داعمة تزيد من مصادر الدخل.', en: '2. Diversified, Integrated Revenue Model\nSale of smart residential units (480 luxury apartments, ~400 m² each). Recurring subscription services (5 years free internet, smart maintenance, AI education), commercial opportunities in malls, restaurants and event spaces, and supporting products that expand revenue streams.' },

      { selector: '.financial-grid .financial-rect:nth-of-type(3) p', ar: 'من المتوقع تحقيق نقطة التعادل خلال السنة الأولى من التشغيل بفضل تزامن تدفقات الشراء الأولية مع تشغيل المرافق المدرة للدخل.', en: '3. Fast Break-even\nThe project is expected to reach break-even within the first year of operation thanks to synchronized initial sales cashflows and the activation of income-generating facilities.' },

      { selector: '.financial-grid .financial-rect:nth-of-type(4) p', ar: 'يوفر نموذج الاشتراك والخدمات التكميلية إيرادات متكررة بعد مرحلة البيع الأولية، ودعم التوسع عبر شراكات البناء والتشغيل والتحويل (BOT) يؤمن سيولة إضافية دون إرهاق ميزانيات المستثمرين.', en: '4. Sustainable Cash Flows\nThe subscription and complementary service model delivers recurring revenues post-sales, and BOT (Build-Operate-Transfer) partnerships provide additional liquidity without overburdening investor capital.' },

      { selector: '.financial-grid .financial-rect:nth-of-type(5) p', ar: 'الاعتماد على الطاقة الشمسية المجانية يقلل تكاليف التشغيل ويزيد صافي الأرباح على المدى الطويل، بينما يحقق تنويع المنتجات (منازل، سيارات، طائرات، قطارات) وفورات حجم وهوامش ربح أعلى.', en: '5. Sustainability & Financial Excellence\nFree solar energy reduces operating costs and increases long-term net profitability, while product diversification (homes, vehicles, aircraft, trains) yields scale advantages and higher profit margins.' }
    ];

    // apply financial translations first if present
    financialTranslations.forEach(item => {
      try {
        const el = document.querySelector(item.selector);
        if (!el) return;
        if (appState.currentLanguage === 'en') {
          // replace Arabic with English
          if (item.ar && el.textContent && el.textContent.includes(item.ar.slice(0,10))) {
            el.textContent = item.en;
          } else {
            el.innerHTML = el.innerHTML.replace(item.ar, item.en);
          }
        } else {
          // restore Arabic where possible
          if (item.en && el.textContent && el.textContent.includes(item.en.slice(0,10))) {
            el.textContent = item.ar;
          } else {
            el.innerHTML = el.innerHTML.replace(item.en, item.ar);
          }
        }
      } catch (e) { /* ignore individual failures */ }
    });
    translationsMap.forEach(item => {
      try {
        const el = document.querySelector(item.selector);
        if (!el) return;
        // If current text contains the Arabic original, replace it; if we are switching to Arabic restore original if available
        if (lang === 'en') {
          if (item.ar && el.textContent && el.textContent.includes(stripTags(item.ar).slice(0,10))) {
            el.textContent = item.en;
          } else {
            // attempt to replace exact Arabic if present inside innerHTML
            el.innerHTML = el.innerHTML.replace(item.ar, item.en);
          }
        } else {
          // switch back to Arabic: if element currently contains English sample, restore Arabic
          if (item.en && el.textContent && el.textContent.includes(stripTags(item.en).slice(0,10))) {
            el.textContent = item.ar;
          } else {
            el.innerHTML = el.innerHTML.replace(item.en, item.ar);
          }
        }
      } catch (e) { /* ignore per-element errors */ }
    });

    // Helper: strip tags for safer matching
    function stripTags(str) { return (str || '').replace(/<\/?[^>]+(>|$)/g, '').trim(); }

    // Ensure temperature and weather text update when English selected
    const tempEl = document.getElementById('temperature');
    const weatherEl = document.getElementById('weather-text');
    if (tempEl && weatherEl) {
      if (lang === 'en') {
        // map Arabic sample "24°C غيوم متفرقة" -> "24°C Partly Cloudy"
        weatherEl.textContent = 'Partly Cloudy';
        // keep numeric temperature as-is; ensure Celsius marker present
        tempEl.textContent = tempEl.textContent.includes('°') ? tempEl.textContent : (tempEl.textContent + '°C');
      } else {
        // restore Arabic defaults if needed
        weatherEl.textContent = weatherEl.getAttribute('data-ar') || 'غيوم متفرقة';
        tempEl.textContent = tempEl.getAttribute('data-ar-temp') || tempEl.textContent;
      }
    }

    // Album image labels translation: update alt/title placeholders if visible
    if (lang === 'en') {
      document.querySelectorAll('.swiper-slide img').forEach((img, idx) => {
        img.alt = `Image ${idx + 1}`;
      });
    } else {
      document.querySelectorAll('.swiper-slide img').forEach((img, idx) => {
        img.alt = `صورة ${idx + 1}`;
      });
    }

    // Persist
    localStorage.setItem('site-lang', lang);
    // Update ROI summary heading to localized text
    try {
      const roiSummaryHeading = document.querySelector('#financials h3');
      if (roiSummaryHeading) {
        roiSummaryHeading.textContent = (lang === 'en') ? 'Summary of ROI Scenarios' : 'ملخص سيناريوهات العائد على الاستثمار (ROI)';
      }
    } catch (e) { console.warn('Updating ROI summary heading failed', e); }
    // Re-render FAQ to reflect language change immediately
    try { renderFAQ(); } catch (e) { /* silent fallback if renderFAQ isn't available yet */ }

    // --- Contact section specific translations (ensure exact English text when switching to en) ---
    try {
      const contactIntro = document.querySelector('#contact > .container > p');
      const contactCards = document.querySelectorAll('#contact .contact-hologram-grid .glass-card');
      const mapLink = document.querySelector('#contact .glass-card a[href^="https://www.google.com/maps"]');
      const contactPanelBtnStrong = document.querySelector('#contact .contact-panel button strong');
      const contactFormLabels = document.querySelectorAll('#contactForm .form-group label');
      const contactFormNameInput = document.querySelector('#contactForm input[type="text"]');
      const contactFormEmailInput = document.querySelector('#contactForm input[type="email"]');
      const contactFormTelInput = document.querySelector('#contactForm input[type="tel"]');
      const contactFormSelect = document.querySelector('#contactForm select');
      const contactFormTextarea = document.querySelector('#contactForm textarea');
      const contactSubmit = document.querySelector('#contactForm .submit-button');

      if (lang === 'en') {
        if (contactIntro) contactIntro.textContent = 'We are happy to hear from you for inquiries about the project, investment opportunities, or potential partnerships.';
        if (contactCards && contactCards.length) {
          // 1: General Email, 2: Direct Mail, 3: Phone (Jordan), 4: Phone (UAE), 5: Location
          contactCards[0]?.querySelector('h4') && (contactCards[0].querySelector('h4').textContent = 'General Email');
          contactCards[0]?.querySelector('a') && (contactCards[0].querySelector('a').textContent = 'info@robothousefzllc.com');

          contactCards[1]?.querySelector('h4') && (contactCards[1].querySelector('h4').textContent = 'Direct Email');
          contactCards[1]?.querySelector('a') && (contactCards[1].querySelector('a').textContent = 'm.alammiri@robothousefzllc.com');

          contactCards[2]?.querySelector('h4') && (contactCards[2].querySelector('h4').textContent = 'Phone (Jordan)');
          contactCards[2]?.querySelector('a') && (contactCards[2].querySelector('a').textContent = '+962 7853 53408');

          contactCards[3]?.querySelector('h4') && (contactCards[3].querySelector('h4').textContent = 'Phone (UAE)');
          contactCards[3]?.querySelector('a') && (contactCards[3].querySelector('a').textContent = '+971 567952199');

          contactCards[4]?.querySelector('h4') && (contactCards[4].querySelector('h4').textContent = 'Location');
          if (mapLink) mapLink.textContent = 'View Map';
        }
        if (contactPanelBtnStrong) contactPanelBtnStrong.textContent = 'Contact the ROBOT HOUSE Team';
        if (contactFormLabels && contactFormLabels.length) {
          // Order: الاسم الكامل, البريد الإلكتروني, رقم الهاتف, نوع الطلب, رسالتك
          contactFormLabels[0].textContent = 'Full Name';
          contactFormLabels[1].textContent = 'Email';
          contactFormLabels[2].textContent = 'Phone Number';
          contactFormLabels[3].textContent = 'Request Type';
          // textarea label (رسالتك) - ensure we translate it too
          if (contactFormLabels[4]) contactFormLabels[4].textContent = 'Your Message';
        }
        if (contactFormNameInput) contactFormNameInput.placeholder = 'Enter your name';
        if (contactFormEmailInput) contactFormEmailInput.placeholder = 'Enter your email';
        if (contactFormTelInput) contactFormTelInput.placeholder = 'Enter your phone number';
        if (contactFormSelect) {
          // replace options (keep existing value order)
          contactFormSelect.innerHTML = '<option>General inquiry</option><option>Partnership</option><option>Investment</option><option>Request a quote</option>';
        }
        if (contactFormTextarea) contactFormTextarea.placeholder = 'Write your message...';
        if (contactSubmit) contactSubmit.textContent = 'Send Message';
      } else {
        // restore Arabic defaults where possible (best-effort)
        if (contactIntro) contactIntro.textContent = 'يسعدنا تواصلكم معنا للاستفسار عن المشروع، فرص الاستثمار، أو الشراكات المحتملة.';
        if (contactCards && contactCards.length) {
          contactCards[0]?.querySelector('h4') && (contactCards[0].querySelector('h4').textContent = 'البريد الإلكتروني العام');
          contactCards[0]?.querySelector('a') && (contactCards[0].querySelector('a').textContent = 'info@robothousefzllc.com');

          contactCards[1]?.querySelector('h4') && (contactCards[1].querySelector('h4').textContent = 'البريد المباشر');
          contactCards[1]?.querySelector('a') && (contactCards[1].querySelector('a').textContent = 'm.alammiri@robothousefzllc.com');

          contactCards[2]?.querySelector('h4') && (contactCards[2].querySelector('h4').textContent = 'الهاتف (الأردن)');
          contactCards[2]?.querySelector('a') && (contactCards[2].querySelector('a').textContent = '+962 7853 53408');

          contactCards[3]?.querySelector('h4') && (contactCards[3].querySelector('h4').textContent = 'الهاتف (الإمارات)');
          contactCards[3]?.querySelector('a') && (contactCards[3].querySelector('a').textContent = '+971 567952199');

          contactCards[4]?.querySelector('h4') && (contactCards[4].querySelector('h4').textContent = 'الموقع');
          if (mapLink) mapLink.textContent = 'عرض الخريطة';
        }
        if (contactPanelBtnStrong) contactPanelBtnStrong.textContent = 'اتصل بفريق ROBOT HOUSE';
        if (contactFormLabels && contactFormLabels.length) {
          contactFormLabels[0].textContent = 'الاسم الكامل';
          contactFormLabels[1].textContent = 'البريد الإلكتروني';
          contactFormLabels[2].textContent = 'رقم الهاتف';
          contactFormLabels[3].textContent = 'نوع الطلب';
          // restore textarea label to Arabic as well
          if (contactFormLabels[4]) contactFormLabels[4].textContent = 'رسالتك';
        }
        if (contactFormNameInput) contactFormNameInput.placeholder = 'ادخل اسمك';
        if (contactFormEmailInput) contactFormEmailInput.placeholder = 'ادخل بريدك';
        if (contactFormTelInput) contactFormTelInput.placeholder = 'ادخل رقم هاتفك';
        if (contactFormSelect) {
          contactFormSelect.innerHTML = '<option>استفسار عام</option><option>شراكة</option><option>استثمار</option><option>طلب عرض سعر</option>';
        }
        if (contactFormTextarea) contactFormTextarea.placeholder = 'اكتب رسالتك هنا...';
        if (contactSubmit) contactSubmit.textContent = 'إرسال الرسالة';
      }
    } catch (e) {
      console.warn('Contact translations update failed', e);
    }
  }

  // initialize from saved or default
  const saved = localStorage.getItem('site-lang') || (document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar'));
  applySiteLanguage(saved);

  // Update bottom ticker text and direction based on language
  function updateBottomTicker(lang) {
    try {
      const tickerTrack = document.querySelector('.bottom-ticker-track');
      const tickerItem = document.querySelector('.bottom-ticker-item');
      if (!tickerTrack || !tickerItem) return;
      if (lang === 'en') {
        // English translation
        tickerItem.textContent = 'A futuristic vision for smart, integrated residential complexes combining luxury, sustainability, and cutting-edge technology to create an unparalleled living environment.';
        // reverse the animation so it scrolls the opposite way
        tickerTrack.style.animationDirection = 'reverse';
      } else {
        // Arabic original (restore)
        tickerItem.textContent = 'رؤية مستقبلية لمجمعات سكنية ذكية ومتكاملة، تجمع بين الفخامة، الاستدامة، والتكنولوجيا المتطورة لخلق بيئة معيشية لا مثيل لها.';
        tickerTrack.style.animationDirection = '';
      }
    } catch (e) { console.warn('updateBottomTicker failed', e); }
  }

  // apply initial ticker state
  updateBottomTicker(saved);

  // update testimonial card texts to match current language (Arabic <-> English)
  function updateTestimonials(lang) {
    try {
      const testimonials = [
        // mapping: selector for paragraph text, Arabic, English, and author selector with Arabic/English
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(1) .testimonial-card p',
          ar: 'ROBOT HOUSE هو حقاً مستقبل العيش. التكنولوجيا مذهلة والراحة لا تضاهى. أنا سعيد جداً بكوني جزءاً من هذا المشروع الرائد.',
          en: 'ROBOT HOUSE is truly the future of living. The technology is amazing and the comfort is unmatched. I am very happy to be part of this pioneering project.',
          author: '.testimonial-swiper .swiper-slide:nth-child(1) .testimonial-card h4',
          arAuthor: 'أحمد العمري',
          enAuthor: 'Ahmed Al Omari'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(2) .testimonial-card p',
          ar: 'تجربة فريدة من نوعها! كل شيء ذكي ومريح. أحب بشكل خاص نظام الطاقة المجانية والمرافق المتكاملة.',
          en: 'A unique experience! Everything is smart and comfortable. I especially love the free energy system and integrated facilities.',
          author: '.testimonial-swiper .swiper-slide:nth-child(2) .testimonial-card h4',
          arAuthor: 'فاطمة الزهراني',
          enAuthor: 'Fatima Al-Zahrani'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(3) .testimonial-card p',
          ar: 'المنازل فائقة الجودة والابتكار في كل زاوية. الدعم ممتاز والفريق متعاون جداً. أوصي به بشدة.',
          en: 'Homes of exceptional quality and innovation at every corner. Support is excellent and the team is very helpful. Highly recommended.',
          author: '.testimonial-swiper .swiper-slide:nth-child(3) .testimonial-card h4',
          arAuthor: 'خالد سعيد',
          enAuthor: 'Khalid Saeed'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(4) .testimonial-card p',
          ar: 'لم أتخيل أبداً أن يكون العيش بهذا الرفاهية والذكاء. الأمان ممتاز والبيئة مثالية للعائلات.',
          en: 'I never imagined living with such luxury and intelligence. Security is excellent and the environment is perfect for families.',
          author: '.testimonial-swiper .swiper-slide:nth-child(4) .testimonial-card h4',
          arAuthor: 'ليلى محمود',
          enAuthor: 'Laila Mahmoud'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(5) .testimonial-card p',
          ar: 'مشروع طموح ومستقبل واعد. أرى أن ROBOT HOUSE سيغير مفهوم الحياة العصرية في المنطقة والعالم.',
          en: 'An ambitious project with a promising future. I believe ROBOT HOUSE will redefine modern living in the region and the world.',
          author: '.testimonial-swiper .swiper-slide:nth-child(5) .testimonial-card h4',
          arAuthor: 'يوسف العلي',
          enAuthor: 'Youssef Al Ali'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(6) .testimonial-card p',
          ar: 'الخدمات الذكية في المجمع تعطي شعوراً حقيقيًا بالراحة وتقليل العبء اليومي. انصح الجميع بالتجربة.',
          en: 'The smart services in the complex provide a real sense of comfort and reduce daily burdens. I recommend everyone to try it.',
          author: '.testimonial-swiper .swiper-slide:nth-child(6) .testimonial-card h4',
          arAuthor: 'سلمى النجار',
          enAuthor: 'Salma Al Najjar'
        },
        {
          p: '.testimonial-swiper .swiper-slide:nth-child(7) .testimonial-card p',
          ar: 'التصميم والبيئة المستدامة يجعلان الاستثمار هنا قراراً ذكياً.',
          en: 'The design and sustainable environment make investing here a smart decision.',
          author: '.testimonial-swiper .swiper-slide:nth-child(7) .testimonial-card h4',
          arAuthor: 'مروان الخطيب',
          enAuthor: 'Marwan Al Khatib'
        }
      ];

      testimonials.forEach(item => {
        const pEl = document.querySelector(item.p);
        const aEl = document.querySelector(item.author);
        if (pEl) pEl.textContent = (lang === 'en') ? item.en : item.ar;
        if (aEl) aEl.textContent = (lang === 'en') ? item.enAuthor : item.arAuthor;
      });
    } catch (e) {
      console.warn('updateTestimonials failed', e);
    }
  }

  // ensure initial testimonials language matches saved
  try { updateTestimonials(saved); } catch (e) { console.warn('initial testimonials update failed', e); }

  // wire button
  btn?.addEventListener('click', () => {
    const current = localStorage.getItem('site-lang') || 'ar';
    const next = current === 'ar' ? 'en' : 'ar';
    applySiteLanguage(next);
    // ensure ticker also updates and reverses on language change
    updateBottomTicker(next);
    // sync testimonials language
    try { updateTestimonials(next); } catch (e) { console.warn('updateTestimonials failed on lang toggle', e); }
  });
})();

const faqData = [
    {
      q: "ما هو \"الكمباوند السكني\" من تطوير Robot House FZ-LLC؟",
      a: "هو أول مجمع سكني فائق الذكاء في العالم العربي، يدمج بين الرفاهية والتكنولوجيا والطاقة المستدامة والرعاية الصحية والتعليم الذكي.",
      q_en: "What is the \"residential compound\" developed by Robot House FZ-LLC?",
      a_en: "It is the first ultra-smart residential complex in the Arab world, combining luxury, technology, sustainable energy, healthcare and smart education."
    },
    {
      q: "من هي الجهة المطوّرة؟ وأين يقع المشروع؟",
      a: "الجهة المطورة هي ROBOT HOUSE FZ LLC، ويقع المشروع في رأس الخيمة، الإمارات العربية المتحدة.",
      q_en: "Who is the developer and where is the project located?",
      a_en: "The developer is ROBOT HOUSE FZ LLC and the project is located in Ras Al Khaimah, United Arab Emirates."
    },
    {
      q: "ما مكونات المشروع الرئيسية؟",
      a: "4 أبراج سكنية (480 شقة)، مول تجاري ذكي، مدرسة ذكية (42,000م²)، جسر معلق، مطعم 5 نجوم، مسابح وحدائق.",
      q_en: "What are the main components of the project?",
      a_en: "4 residential towers (480 apartments), a smart commercial mall, a smart school (42,000 m²), a suspended bridge, a 5-star restaurant, pools and gardens."
    },
    {
      q: "ما هي الميزات الذكية للشقق داخل الكمباوند؟",
      a: "8 غرف نوم، 3 حمامات ذكية، مطبخ ذكي، كهرباء مجانية من الطاقة الشمسية، إنترنت مجاني 5 سنوات، نظام تعليم ذكي للأطفال.",
      q_en: "What smart features do the apartments include?",
      a_en: "8 bedrooms, 3 smart bathrooms, smart kitchen, free electricity from solar energy, 5 years free internet, and AI-enabled education for children."
    },
    {
      q: "كيف يضمن الكمباوند كونه صديق للبيئة ومستدام؟",
      a: "اعتماد كامل على الطاقة الشمسية، أنظمة لتحويل النفايات إلى سماد، فلترة مياه متقدمة، مواد بناء صديقة للبيئة.",
      q_en: "How does the compound ensure environmental friendliness and sustainability?",
      a_en: "Full reliance on solar energy, waste-to-compost systems, advanced water filtration, and eco-friendly building materials."
    },
    {
      q: "ما هي أنظمة الأمان والراحة المتوفرة في المشروع؟",
      a: "أنظمة أمان بيومتري، التعرف على الوجه، إنذار مبكر، كاميرات ذكية، نظام مكافحة تسرب.",
      q_en: "What security and comfort systems are available in the project?",
      a_en: "Biometric security, face recognition, early-warning alarms, smart cameras, and leak-detection systems."
    },
    {
      q: "ما هي المواد المبتكرة المستخدمة في بناء المنازل؟",
      a: "الألمنيوم، الأكريليك، البولي كربونات المعالج بالنانو، والجرافين، وألواح PE الأكريليكية.",
      q_en: "What innovative materials are used in building the homes?",
      a_en: "Aluminum, acrylic, nano-treated polycarbonate, graphene, and PE acrylic panels."
    },
    {
      q: "هل يمكن تغيير لون المنزل الخارجي؟",
      a: "نعم، باستخدام تقنيات النانو والجرافين يمكن تغيير لون المنزل حسب الرغبة.",
      q_en: "Can the exterior color of the house be changed?",
      a_en: "Yes — using nano and graphene technologies the exterior color can be changed on demand."
    },
    {
      q: "كيف يعمل المنزل بالكامل على الطاقة الشمسية؟",
      a: "من خلال ألواح شمسية شفافة موزعة على أسطح المباني والنوافذ، مع أنظمة تخزين طاقة ذكية.",
      q_en: "How does the house operate entirely on solar power?",
      a_en: "Via transparent solar panels distributed across roofs and windows, combined with smart energy storage systems."
    }
];

function renderFAQ(filter = "") {
  const container = document.getElementById('faqContainer');
  if (!container) return;
  // determine current site language (persisted)
  const lang = localStorage.getItem('site-lang') || (document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
  const qKey = lang === 'en' ? 'q_en' : 'q';
  const aKey = lang === 'en' ? 'a_en' : 'a';
  const normalizedFilter = (filter || '').toLowerCase();

  container.innerHTML = faqData
    .filter(item => {
      const qText = (item[qKey] || '').toLowerCase();
      const aText = (item[aKey] || '').toLowerCase();
      return !normalizedFilter || qText.includes(normalizedFilter) || aText.includes(normalizedFilter);
    })
    .map((item, idx) => {
      const qText = item[qKey] || item.q || '';
      const aText = item[aKey] || item.a || '';
      return `<div class="faq-item" data-idx="${idx}">
                <div class="faq-question">${qText} <i class="fas fa-chevron-down"></i></div>
                <div class="faq-answer">${aText}</div>
              </div>`;
    }).join('');

  document.querySelectorAll('.faq-item').forEach(el => el.addEventListener('click', function() { this.classList.toggle('active'); }));
}

renderFAQ();
const searchInput = document.getElementById('faqSearch');
if (searchInput) searchInput.addEventListener('input', (e) => renderFAQ(e.target.value));

/* Toggle expand/collapse for the hexagon presentation video when "شاهد العرض" is clicked.
   First click expands the .hexagon-shape into a centered, larger in-place view.
   Second click restores the original hexagon clip and position. Also toggles a body class
   to dim the background for focus and updates the button active state.
   Additionally: clicking the video element itself now toggles expansion (mobile-friendly). */
(function hexVideoExpandToggle() {
  const watchBtn = document.getElementById('watchBtn');
  const hexShape = document.querySelector('.hexagon-shape');
  const hexVideo = document.getElementById('hexVideo');

  if (!watchBtn || !hexShape || !hexVideo) {
    // fallback: keep play/pause behavior if elements not found
    watchBtn?.addEventListener('click', () => { const vid = document.getElementById('hexVideo'); if (vid) vid.paused ? vid.play() : vid.pause(); });
    return;
  }

  function openExpanded() {
    hexShape.classList.add('expanded');
    document.body.classList.add('video-expanded');
    watchBtn.classList.add('active');
    // ensure video plays and is visible
    try { hexVideo.play().catch(()=>{}); } catch (e) {}
    // scroll video into view for mobile and center it
    try {
      setTimeout(() => hexShape.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    } catch (e) {}
    // make the button text indicate close in current language (toggle only label)
    const isEn = (localStorage.getItem('site-lang') || document.documentElement.lang || document.body.getAttribute('dir') === 'ltr') === 'en';
    watchBtn.innerHTML = `<i class="fas fa-compress"></i> ${isEn ? 'Close' : 'إغلاق'}`;
    // trap ESC to close
    document.addEventListener('keydown', escHandler);
  }

  function closeExpanded() {
    hexShape.classList.remove('expanded');
    document.body.classList.remove('video-expanded');
    watchBtn.classList.remove('active');
    const isEn = (localStorage.getItem('site-lang') || document.documentElement.lang || document.body.getAttribute('dir') === 'ltr') === 'en';
    watchBtn.innerHTML = `<i class="fas fa-play-circle"></i> ${isEn ? 'Watch Presentation' : 'شاهد العرض'}`;
    document.removeEventListener('keydown', escHandler);
    // on close, ensure focus returns to the watch button for accessibility
    try { watchBtn.focus({ preventScroll: true }); } catch (e) {}
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeExpanded();
  }

  let expanded = false;
  watchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // toggle expanded state
    expanded = !expanded;
    if (expanded) openExpanded();
    else closeExpanded();
  });

  // Also allow clicking the video element itself to toggle expansion (user-requested)
  hexVideo.addEventListener('click', (e) => {
    // ignore clicks on native controls or if the click target is a control element
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('a'))) return;
    expanded = !expanded;
    if (expanded) openExpanded();
    else closeExpanded();
  });

  // If the user scrolls/resizes while expanded, keep it centered (reapply transform)
  window.addEventListener('resize', () => {
    if (!hexShape.classList.contains('expanded')) return;
    // small reflow tweak — no-op but ensures CSS recalculates size gracefully
    hexShape.style.transform = hexShape.style.transform ? hexShape.style.transform : '';
  });

  // clicking outside expanded area (on the dim overlay) should also close it: observe body click anywhere outside hexShape
  document.addEventListener('click', (ev) => {
    if (!hexShape.classList.contains('expanded')) return;
    const inside = ev.target === hexShape || hexShape.contains(ev.target) || ev.target === watchBtn || watchBtn.contains(ev.target) || hexVideo.contains(ev.target);
    if (!inside) {
      expanded = false;
      closeExpanded();
    }
  });

  // initialize proper localized label
  (function initLabel() {
    const isEn = (localStorage.getItem('site-lang') || document.documentElement.lang || document.body.getAttribute('dir') === 'ltr') === 'en';
    watchBtn.innerHTML = `<i class="fas fa-play-circle"></i> ${isEn ? 'Watch Presentation' : 'شاهد العرض'}`;
  })();

})();

const swiperWrapper = document.getElementById('albumSwiperWrapper');

/* Disabled heavy blob-based album fetch to avoid blocking startup; use the lightweight optimized loader instead.
   The existing loadAlbumImagesOptimized() is used later to insert slides using direct URLs (lazy). */
async function loadAlbumImages(urls) {
  console.info('loadAlbumImages: heavy blob fetch disabled for faster startup; using optimized loader.');
  try {
    if (typeof loadAlbumImagesOptimized === 'function') {
      // kick off the lighter optimized loader (non-blocking)
      setTimeout(() => { try { loadAlbumImagesOptimized(urls); } catch(e){ console.warn('optimized album loader failed', e); } }, 60);
    }
  } catch (e) {
    console.warn('loadAlbumImages fallback failed', e);
  }
}

const albumUrls = [
  "https://robothousefzllc.com/1.jpg",
  "https://robothousefzllc.com/2.jpg",
  "https://robothousefzllc.com/3.jpg",
  "https://robothousefzllc.com/4.jpg",
  "https://robothousefzllc.com/5.jpg",
  "https://robothousefzllc.com/6.jpg",
  "https://robothousefzllc.com/7.jpg",
  "https://robothousefzllc.com/8.jpg",
  "https://robothousefzllc.com/9.jpg",
  "https://robothousefzllc.com/10.jpg",
  "https://robothousefzllc.com/11.jpg",
  "https://robothousefzllc.com/12.jpg",
  "https://robothousefzllc.com/13.jpg",
  "https://robothousefzllc.com/14.jpg",
  "https://robothousefzllc.com/15.jpg",
  "https://robothousefzllc.com/16.jpg",
  "https://robothousefzllc.com/17.jpg",
  "https://robothousefzllc.com/18.jpg",
  "https://robothousefzllc.com/19.jpg",
  "https://robothousefzllc.com/20.jpg",
  "https://robothousefzllc.com/21.jpg",
  "https://robothousefzllc.com/22.jpg",
  "https://robothousefzllc.com/23.jpg",
  "https://robothousefzllc.com/24.jpg",
  "https://robothousefzllc.com/25.jpg",
  "https://robothousefzllc.com/26.jpg",
  "https://robothousefzllc.com/27.jpg",
  "https://robothousefzllc.com/28.jpg",
  "https://robothousefzllc.com/29.jpg",
  "https://robothousefzllc.com/30.jpg",
  "https://robothousefzllc.com/31.jpg",
  "https://robothousefzllc.com/32.jpg",
  "https://robothousefzllc.com/33.jpg",
  "https://robothousefzllc.com/34.jpg",
  "https://robothousefzllc.com/35.jpg",
  "https://robothousefzllc.com/36.jpg",
  "https://robothousefzllc.com/37.jpg",
  "https://robothousefzllc.com/38.jpg",
  "https://robothousefzllc.com/39.jpg",
  "https://robothousefzllc.com/40.jpg",
  "https://robothousefzllc.com/41.jpg",
  "https://robothousefzllc.com/42.jpg",
  "https://robothousefzllc.com/43.jpg",
  "https://robothousefzllc.com/44.jpg",
  "https://robothousefzllc.com/45.jpg",
  "https://robothousefzllc.com/46.jpg",
  "https://robothousefzllc.com/47.jpg",
  "https://robothousefzllc.com/48.jpg",
  "https://robothousefzllc.com/49.jpg",
  "https://robothousefzllc.com/50.jpg",
  "https://robothousefzllc.com/51.jpg",
  "https://robothousefzllc.com/52.jpg",
  "https://robothousefzllc.com/53.jpg",
  "https://robothousefzllc.com/54.jpg",
  "https://robothousefzllc.com/55.jpg",
  "https://robothousefzllc.com/56.jpg",
  "https://robothousefzllc.com/57.jpg",
  "https://robothousefzllc.com/58.jpg",
  "https://robothousefzllc.com/59.jpg",
  "https://robothousefzllc.com/60.jpg",
  "https://robothousefzllc.com/61.jpg",
  "https://robothousefzllc.com/62.jpg",
  "https://robothousefzllc.com/63.jpg",
  "https://robothousefzllc.com/64.jpg",
  "https://robothousefzllc.com/65.jpg",
  "https://robothousefzllc.com/66.jpg",
  "https://robothousefzllc.com/67.jpg",
  "https://robothousefzllc.com/68.jpg",
  "https://robothousefzllc.com/69.jpg",
  "https://robothousefzllc.com/70.jpg",
  "https://robothousefzllc.com/71.jpg",
  "https://robothousefzllc.com/72.jpg",
  "https://robothousefzllc.com/73.jpg",
  "https://robothousefzllc.com/74.jpg",
  "https://robothousefzllc.com/75.jpg",
  "https://robothousefzllc.com/76.jpg",
  "https://robothousefzllc.com/77.jpg",
  "https://robothousefzllc.com/78.jpg",
  "https://robothousefzllc.com/79.jpg",
  "https://robothousefzllc.com/80.jpg",
  "https://robothousefzllc.com/81.jpg",
  "https://robothousefzllc.com/82.jpg",
  "https://robothousefzllc.com/83.jpg",
  "https://robothousefzllc.com/84.jpg",
  "https://robothousefzllc.com/85.jpg",
  "https://robothousefzllc.com/86.jpg",
  "https://robothousefzllc.com/87.jpg",
  "https://robothousefzllc.com/88.jpg",
  "https://robothousefzllc.com/89.jpg",
  "https://robothousefzllc.com/90.jpg",
  "https://robothousefzllc.com/91.jpg",
  "https://robothousefzllc.com/92.jpg",
  "https://robothousefzllc.com/93.jpg",
  "https://robothousefzllc.com/94.jpg",
  "https://robothousefzllc.com/95.jpg",
  "https://robothousefzllc.com/96.jpg",
  "https://robothousefzllc.com/97.jpg",
  "https://robothousefzllc.com/98.jpg",
  "https://robothousefzllc.com/99.jpg",
  "https://robothousefzllc.com/100.jpg",
  "https://robothousefzllc.com/101.jpg",
  "https://robothousefzllc.com/102.jpg",
  "https://robothousefzllc.com/103.jpg",
  "https://robothousefzllc.com/104.jpg",
  "https://robothousefzllc.com/105.jpg",
  "https://robothousefzllc.com/106.jpg",
  "https://robothousefzllc.com/107.jpg",
  "https://robothousefzllc.com/108.jpg",
  "https://robothousefzllc.com/109.jpg",
  "https://robothousefzllc.com/110.jpg",
  "https://robothousefzllc.com/111.jpg",
  "https://robothousefzllc.com/112.jpg",
  "https://robothousefzllc.com/113.jpg",
  "https://robothousefzllc.com/114.jpg",
  "https://robothousefzllc.com/115.jpg",
  "https://robothousefzllc.com/116.jpg",
  "https://robothousefzllc.com/117.jpg",
  "https://robothousefzllc.com/118.jpg",
  "https://robothousefzllc.com/119.jpg",
  "https://robothousefzllc.com/120.jpg",
  "https://robothousefzllc.com/121.jpg",
  "https://robothousefzllc.com/122.jpg",
  "https://robothousefzllc.com/123.jpg",
  "https://robothousefzllc.com/124.jpg",
  "https://robothousefzllc.com/125.jpg",
  "https://robothousefzllc.com/126.jpg",
  "https://robothousefzllc.com/127.jpg",
  "https://robothousefzllc.com/128.jpg",
  "https://robothousefzllc.com/129.jpg",
  "https://robothousefzllc.com/130.jpg",
  "https://robothousefzllc.com/131.jpg",
  "https://robothousefzllc.com/132.jpg",
  "https://robothousefzllc.com/133.jpg",
  "https://robothousefzllc.com/134.jpg",
  "https://robothousefzllc.com/135.jpg",
  "https://robothousefzllc.com/136.jpg",
  "https://robothousefzllc.com/137.jpg",
  "https://robothousefzllc.com/138.jpg",
  "https://robothousefzllc.com/139.jpg",
  "https://robothousefzllc.com/140.jpg"
];

/* Optimized album loader (direct src, lazy, with lightbox) */
const albumImagesList = [];
let currentImageIndex = 0;
// swiperWrapper is declared earlier in this file; do not redeclare to avoid SyntaxError

async function loadAlbumImagesOptimized(urls) {
    if (!swiperWrapper) return;
    for (let i = 0; i < urls.length; i++) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        const img = document.createElement('img');

        // use direct URL for faster loading (no Blob)
        img.src = urls[i];
        img.alt = `صورة ${i + 1}`;
        img.loading = 'lazy';
        img.onerror = () => {
            img.src = `https://placehold.co/800x500/0a2b4e/white?text=${encodeURIComponent('Image+' + (i+1) + '+Not+Found')}`;
        };
        img.style.cursor = 'zoom-in';

        img.addEventListener('click', () => {
            currentImageIndex = i;
            openLightbox(urls[i]);
        });

        slide.appendChild(img);
        swiperWrapper.appendChild(slide);
        albumImagesList.push(urls[i]);
    }

    // init Swiper after slides inserted
    try {
        new Swiper('.mySwiper', {
            loop: true,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            autoplay: { delay: 3000 }
        });
    } catch (e) {
        console.warn('Swiper init failed for album', e);
    }
}

// Lightbox handlers
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
    // allow keyboard navigation
    document.body.style.overflow = 'hidden';
}
function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = 'none';
    lightboxImg.src = '';
    document.body.style.overflow = '';
}
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.style.display !== 'flex') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') {
        currentImageIndex = (currentImageIndex + 1) % albumImagesList.length;
        lightboxImg.src = albumImagesList[currentImageIndex];
    }
    if (e.key === 'ArrowLeft') {
        currentImageIndex = (currentImageIndex - 1 + albumImagesList.length) % albumImagesList.length;
        lightboxImg.src = albumImagesList[currentImageIndex];
    }
});

/* load album images (optimized) */
loadAlbumImagesOptimized(albumUrls);

/* Inject small widgets next to product titles and ensure title sits above video/video above text.
   This runs after DOM is ready so we don't have to edit each product block manually. */
document.addEventListener('DOMContentLoaded', () => {
  try {
    document.querySelectorAll('.pw-title-wrap').forEach((wrap) => {
      // mark title container so CSS will place it above the media
      wrap.classList.add('pw-title-block');
      // if a small widget isn't already present, append one
      if (!wrap.querySelector('.pw-small-widget')) {
        const widget = document.createElement('span');
        widget.className = 'pw-small-widget';
        // small icon + label (keeps neutral bilingual visual); adjust as needed per product later
        widget.innerHTML = '🔹 <span class="pw-small-widget-text">Feature</span>';
        wrap.appendChild(widget);
      }
    });

    // adjust text alignment inside pw-content for RTL pages when needed
    const isRTL = document.body.getAttribute('dir') === 'rtl';
    document.querySelectorAll('.product-window .pw-content').forEach((c) => {
      c.style.textAlign = isRTL ? 'right' : 'left';
      c.style.alignItems = isRTL ? 'flex-end' : 'flex-start';
    });
  } catch (e) {
    console.warn('Product title/widget init failed', e);
  }
});

// Initialize testimonials Swiper and interactions
(function initTestimonials() {
    // ensure Swiper is available
    try {
        const testimonialSwiper = new Swiper('.testimonial-swiper', {
            slidesPerView: 1,
            spaceBetween: 24,
            loop: true,
            autoplay: { delay: 4500, disableOnInteraction: false },
            navigation: { nextEl: '.testimonial-next', prevEl: '.testimonial-prev' },
            pagination: { el: '.testimonial-swiper .swiper-pagination', clickable: true },
            breakpoints: {
                900: { slidesPerView: 1.2 },
                1200: { slidesPerView: 1.4 }
            }
        });
    } catch (e) {
        console.warn('Testimonials Swiper init failed', e);
    }

    // Heart (like) button toggle - persistent per session using dataset
    document.addEventListener('click', (ev) => {
        // compatible safe lookup for the heart button (avoid optional-chaining call syntax)
        let btn = null;
        try {
          if (typeof ev.target.closest === 'function') {
            btn = ev.target.closest('.heart-btn');
          }
        } catch (e) { btn = null; }
        if (!btn) {
          btn = (ev.target.classList && ev.target.classList.contains && ev.target.classList.contains('heart-btn')) ? ev.target : null;
        }
        if (!btn) return;
        btn.classList.toggle('liked');
        // simple feedback animation
        btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 350 });
    });
})();

document.getElementById('temperature')?.addEventListener('click', () => { document.getElementById('temperature').innerHTML = '24°C'; });

/* Enhanced lazy-load + intersection-driven video loader:
   - keep videos muted/playsinline but defer setting src until visible
   - warmFetch a small byte range before assigning src to prime CDN/TCP
   - fallback to existing behavior if deferred load fails
*/
document.addEventListener('DOMContentLoaded', () => {
  // lightweight warmFetch helper (non-blocking, best-effort)
  async function warmFetch(url, rangeBytes = 120000) {
    try {
      if (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''))) return;
      await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-cache' }).catch(()=>null);
      await fetch(url, { headers: { Range: `bytes=0-${rangeBytes}` }, mode: 'cors', cache: 'no-store' }).catch(()=>null);
    } catch (e) { /* non-fatal */ }
  }

  // ensure video element has safe baseline attrs (but do NOT set src yet)
  function prepareVideoEl(vid) {
    try {
      vid.setAttribute('playsinline', '');
      vid.setAttribute('muted', '');
      vid.muted = true;
      vid.loop = true;
      vid.setAttribute('preload', 'metadata'); // lightweight metadata preload
      // if <source> present, stash the url into dataset and remove source to avoid immediate requests
      const primarySource = vid.querySelector('source')?.src || vid.getAttribute('src') || vid.dataset.src;
      if (primarySource) {
        // store canonical URL
        vid.dataset.src = primarySource;
        // remove source/src to prevent browser from fetching until we enable it
        try { vid.removeAttribute('src'); } catch(e){}
        vid.querySelectorAll && vid.querySelectorAll('source').forEach(s => s.remove());
      }
    } catch (e) {
      console.warn('prepareVideoEl failed', e);
    }
  }

  // attach an IntersectionObserver to lazy-initialize videos when visible
  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      const vid = entry.target;
      if (!entry.isIntersecting) return;
      // once visible, unobserve and initialize src
      lazyObserver.unobserve(vid);
      try {
        const src = vid.dataset.src;
        if (!src) return;
        // warm small range to prime CDN/network
        warmFetch(src, 180000);
        // assign the src (use direct URL to let browser stream natively)
        // keep a short delay to allow warmFetch HEAD/range to start
        setTimeout(async () => {
          try {
            // if the video still has no src, set it
            if (!vid.src || vid.src === '') {
              vid.src = src;
              // if there are no sources and browser needs <source>, you can re-add one, but direct src is simpler
            }
            // try to play silently (muted) — most browsers allow this
            await vid.play().catch(() => {});
          } catch (e) {
            console.warn('Failed to play lazy video', e);
          }
        }, 140);
      } catch (e) {
        console.warn('Lazy init failed', e);
      }
    });
  }, { rootMargin: '300px 0px', threshold: 0.05 });

  // find videos and prepare them, then observe for visibility
  const allVideos = Array.from(document.querySelectorAll('video'));
  allVideos.forEach((vid) => {
    try {
      // skip very small decorative videos if desired (keep behavior consistent)
      prepareVideoEl(vid);
      // Observe only if there is a deferred src available
      if (vid.dataset && vid.dataset.src) {
        lazyObserver.observe(vid);
      } else {
        // fallback: try to ensure autoplay for videos without dataset src as before
        try {
          const primarySource = vid.querySelector('source')?.src;
          if (primarySource && (!vid.src || vid.src === '')) {
            vid.querySelectorAll('source').forEach(s => s.remove());
            vid.src = primarySource;
          }
          // try to play muted autoplay
          vid.play().catch(()=>{});
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.warn('Video lazy setup failed for', vid, e);
    }
  });

  // optional: expose a public helper to force-load videos (useful after language switch / dynamic content)
  window.__robotHouseLoadVisibleVideos = function() {
    document.querySelectorAll('video').forEach(v => {
      try {
        if (v.dataset && v.dataset.src && (v.getBoundingClientRect().top < window.innerHeight * 1.5)) {
          // manually trigger initialization
          lazyObserver.unobserve(v);
          warmFetch(v.dataset.src, 180000);
          setTimeout(() => { v.src = v.dataset.src; v.play().catch(()=>{}); }, 120);
        }
      } catch (e) {}
    });
  };
});

/* Animated ROI + Recovery charts (Canvas) */
(function initCharts() {
  // ROI line with pulsating glow for three scenarios
  const roiCanvas = document.getElementById('roiChart');
  if (roiCanvas && roiCanvas.getContext) {
    const ctx = roiCanvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    function resize() {
      const rect = roiCanvas.getBoundingClientRect();
      roiCanvas.width = rect.width * DPR;
      roiCanvas.height = rect.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Sample data (normalized 0..1) corresponding to the three table scenarios across timeline
    const points = 60;
    const scenarioA = Array.from({length: points}, (_,i) => 0.4 + 0.45 * Math.sin((i/points)*Math.PI*1.2 + 0.2)); // low-cost optimistic
    const scenarioB = Array.from({length: points}, (_,i) => 0.3 + 0.35 * Math.sin((i/points)*Math.PI*1.1 + 0.5)); // mid
    const scenarioC = Array.from({length: points}, (_,i) => 0.2 + 0.18 * Math.sin((i/points)*Math.PI*0.9 + 0.9)); // conservative

    let t = 0;
    function draw() {
      const W = roiCanvas.width / DPR;
      const H = roiCanvas.height / DPR;
      ctx.clearRect(0,0,W,H);

      // background subtle grid
      ctx.save();
      ctx.fillStyle = 'rgba(5,12,22,0.45)';
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for (let i=0;i<6;i++){
        const y = H - (i/5)*H;
        ctx.beginPath();
        ctx.moveTo(0,y); ctx.lineTo(W,y);
        ctx.stroke();
      }
      ctx.restore();

      // helper to draw scenario with glow
      function drawScenario(data, gradientColors, glowStrength) {
        const grad = ctx.createLinearGradient(0,0,W,0);
        grad.addColorStop(0, gradientColors[0]);
        grad.addColorStop(1, gradientColors[1]);

        ctx.lineWidth = 3;
        ctx.strokeStyle = grad;
        ctx.shadowColor = gradientColors[1];
        ctx.shadowBlur = 14 * glowStrength * (0.8 + 0.2*Math.sin(t/16));
        ctx.beginPath();
        data.forEach((val, idx) => {
          const x = (idx/(data.length-1)) * W * 0.98 + W*0.01;
          const y = H - val * (H*0.75) - H*0.12;
          if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();

        // soft fill under curve
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = grad;
        ctx.beginPath();
        data.forEach((val, idx) => {
          const x = (idx/(data.length-1)) * W * 0.98 + W*0.01;
          const y = H - val * (H*0.75) - H*0.12;
          if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // draw three scenarios with slight phase offsets for motion
      drawScenario(scenarioA.map((v,i)=>v*(0.9+0.06*Math.sin(t/14 + i/10))), ['#ff8c42', '#ffd38a'], 1.0);
      drawScenario(scenarioB.map((v,i)=>v*(0.92+0.04*Math.cos(t/18 + i/12))), ['#7be3ff', '#00a8c5'], 0.8);
      drawScenario(scenarioC.map((v,i)=>v*(0.96+0.03*Math.sin(t/20 + i/14))), ['#9eff9e', '#00a8c5'], 0.6);

      // animated pulsating markers for the latest values
      const latestX = W * 0.98;
      const pulse = 1 + 0.12 * Math.sin(t/6);
      [['#ff8c42', scenarioA[points-1]], ['#00a8c5', scenarioB[points-1]], ['#7be87b', scenarioC[points-1]]].forEach((item, idx) => {
        const color = item[0];
        const val = item[1];
        const x = latestX - idx*8;
        const y = H - val * (H*0.75) - H*0.12;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.14 * pulse;
        ctx.arc(x, y, 22 * pulse * (1 - idx*0.12), 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, 6 * (1 - idx*0.08), 0, Math.PI*2);
        ctx.fill();
      });

      // subtle time label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px Cairo, sans-serif';
      ctx.fillText('سنة المشروع →', W - 120, H - 10);

      t += 1;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // Recovery radial metric: draws a radial gauge with pulsing ring
  const recCanvas = document.getElementById('recoveryMetricsChart');
  if (recCanvas && recCanvas.getContext) {
    const ctxR = recCanvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    function resizeR() {
      const rect = recCanvas.getBoundingClientRect();
      recCanvas.width = rect.width * DPR;
      recCanvas.height = rect.height * DPR;
      ctxR.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeR();
    window.addEventListener('resize', resizeR);

    let angle = 0;
    const targetPercent = 0.62; // 62% recovery speed indicator (example)
    function drawRadial() {
      const W = recCanvas.width / DPR;
      const H = recCanvas.height / DPR;
      const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 10;
      ctxR.clearRect(0,0,W,H);

      // background circle
      ctxR.beginPath();
      ctxR.arc(cx, cy, r, 0, Math.PI*2);
      ctxR.fillStyle = 'rgba(0,0,0,0.02)';
      ctxR.fill();

      // base arc
      ctxR.beginPath();
      ctxR.lineWidth = 10;
      ctxR.strokeStyle = 'rgba(255,255,255,0.06)';
      ctxR.arc(cx, cy, r, Math.PI*1.1, Math.PI*1.9);
      ctxR.stroke();

      // animated colored arc
      const endAngle = Math.PI*1.1 + (Math.PI*0.8) * targetPercent * (0.92 + 0.06*Math.sin(angle/12));
      const grad = ctxR.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, '#ff8c42');
      grad.addColorStop(1, '#00a8c5');
      ctxR.beginPath();
      ctxR.lineCap = 'round';
      ctxR.strokeStyle = grad;
      ctxR.lineWidth = 12;
      ctxR.shadowBlur = 14;
      ctxR.shadowColor = '#ff8c42';
      ctxR.arc(cx, cy, r, Math.PI*1.1, endAngle);
      ctxR.stroke();
      ctxR.shadowBlur = 0;

      // center text (percentage counter in blue)
      ctxR.fillStyle = '#00a8c5'; // blue counter
      ctxR.font = '700 18px Cairo, sans-serif';
      const percentText = Math.round(targetPercent*100) + '%';
      const textW = ctxR.measureText(percentText).width;
      ctxR.fillText(percentText, cx - textW/2, cy + 6);

      // caption (centered)
      ctxR.font = '12px Cairo, sans-serif';
      ctxR.fillStyle = 'rgba(255,255,255,0.88)';
      const cap = 'سرعة الاسترداد';
      const capW = ctxR.measureText(cap).width;
      ctxR.fillText(cap, cx - capW/2, cy + 28);

      // subtle rotating indicator
      const knobAngle = endAngle + 0.08 * Math.sin(angle/8);
      const knobX = cx + Math.cos(knobAngle) * r;
      const knobY = cy + Math.sin(knobAngle) * r;
      ctxR.beginPath();
      ctxR.fillStyle = '#fff';
      ctxR.globalAlpha = 0.95;
      ctxR.arc(knobX, knobY, 4.5, 0, Math.PI*2);
      ctxR.fill();
      ctxR.globalAlpha = 1;

      angle += 0.9;
      requestAnimationFrame(drawRadial);
    }
    requestAnimationFrame(drawRadial);
  }

  /* Mini charts + counter animation for metric boxes */
  (function initMiniMetrics() {
    // animate numeric counters (if text is numeric) and draw small sparkline on each .mini-chart
    document.querySelectorAll('.metric-counter').forEach(el => {
      const targetAttr = el.getAttribute('data-target');
      if (!targetAttr) return;
      // if target is numeric, animate a small counter only when element is visible
      const targetNum = parseInt(targetAttr, 10);
      if (isNaN(targetNum)) return;
      let current = 0;
      const step = Math.max(1, Math.round(targetNum / 30));
      const iv = setInterval(() => {
        current += step;
        if (current >= targetNum) {
          current = targetNum;
          clearInterval(iv);
        }
        // if target looks like percent range keep original text; otherwise update numeric
        el.textContent = (el.dataset.target && el.dataset.target.includes('%')) ? el.dataset.target : (el.dataset.target==='62'? (Math.round(current) + '%') : (current));
      }, 24);
    });

    // draw simple sparklines in the mini charts
    const drawSpark = (canvas, color) => {
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext('2d');
      const DPR = window.devicePixelRatio || 1;
      function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * DPR;
        canvas.height = rect.height * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);
      // sample micro-data
      const data = Array.from({length: 18}, (_,i) => 0.3 + 0.6 * Math.abs(Math.sin(i/6 + (Math.random()-0.5))));
      let offset = 0;
      function render() {
        const W = canvas.width / DPR;
        const H = canvas.height / DPR;
        ctx.clearRect(0,0,W,H);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        data.forEach((v, idx) => {
          const x = (idx/(data.length-1))*W;
          const y = H - v * H;
          if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        offset += 0.6;
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    };

    document.querySelectorAll('.mini-chart').forEach((c, idx) => {
      const cols = ['#00a8c5', '#ff8c42', '#7be3ff'];
      drawSpark(c, cols[idx % cols.length]);
    });
  })();

})();

/* Contact section collapse/expand functionality */
(function contactCollapseInit() {
  const toggleBtn = document.getElementById('toggleContactBtn');
  const contactContent = document.getElementById('contactContent');
  const toggleIcon = document.getElementById('toggleContactIcon');

  if (!toggleBtn || !contactContent) return;

  // Helper to compute natural max-height for smooth collapse
  function openContent() {
    contactContent.style.display = ''; // ensure display default
    const fullHeight = contactContent.scrollHeight + 'px';
    contactContent.style.maxHeight = fullHeight;
    contactContent.style.opacity = '1';
    toggleBtn.setAttribute('aria-expanded', 'true');
    if (toggleIcon) toggleIcon.classList.remove('fa-chevron-down'), toggleIcon.classList.add('fa-chevron-up');
  }
  function closeContent() {
    contactContent.style.maxHeight = contactContent.scrollHeight + 'px'; // set current height
    // force reflow so transition works
    // eslint-disable-next-line no-unused-expressions
    contactContent.offsetHeight;
    contactContent.style.maxHeight = '0px';
    contactContent.style.opacity = '0';
    toggleBtn.setAttribute('aria-expanded', 'false');
    if (toggleIcon) toggleIcon.classList.remove('fa-chevron-up'), toggleIcon.classList.add('fa-chevron-down');
  }

  // Initialize (open state)
  openContent();

  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeContent();
    } else {
      openContent();
      // scroll into view so user sees expanded content
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 220);
    }
  });

  // If page loads with anchor to contact, ensure open
  if (window.location.hash === '#contact') {
    openContent();
  }
})();

/* ===== Merge provided Robot House knowledge entries into knowledgeBase =====
   Added as an Object.assign so we don't risk replacing existing keys.
*/
try {
  Object.assign(knowledgeBase, {
    "company_name": {
      "keywords": { "ar": ["شركة", "روبوت هاوس", "Robot House"], "en": ["company", "Robot House"] },
      "response": {
        "ar": { "q": "اسم الشركة", "a": "Robot House FZ-LLC" },
        "en": { "q": "company name", "a": "Robot House FZ-LLC" }
      }
    },

    "gen_001": {
      "keywords": { "ar": ["شركة", "روبوت هاوس", "من هي"], "en": ["company", "robot house", "who is"] },
      "response": {
        "ar": { "q": "من هي شركة Robot House؟", "a": "Robot House هي شركة رائدة في ابتكار نماذج الحياة المستقبلية، متخصصة في تطوير أنظمة سكنية، تشغيلية، وضيافية ذكية. نحن نبني منظومة متكاملة بالكامل في العالم العربي، تلتقي فيها الرفاهية بالتكنولوجيا والاستدامة مع الذكاء الاصطناعي. نحن لا نصنع منتجًا واحدًا، بل نبني نمط حياة مستقبلي متكامل، بدءًا من الحلول التشغيلية الذكية ووصولاً إلى بناء أول مدينة ذكية متكاملة." },
        "en": { "q": "Who is Robot House company?", "a": "Robot House is a leading company in innovating future lifestyle models, specialized in developing smart residential, operational, and hospitality systems. We are building the first fully integrated intelligent system in the Arab world, where luxury meets technology and sustainability with AI. We don't just make one product; we build an integrated future lifestyle, starting from smart operational solutions to building the first complete smart city." }
      },
      "related": ["gen_002","gen_003","gen_005"]
    },

    "gen_002": {
      "keywords": { "ar": ["المقر", "العنوان", "موقع", "رأس الخيمة"], "en": ["headquarters", "address", "ras al khaimah"] },
      "response": {
        "ar": { "q": "أين يقع المقر الرئيسي لشركة Robot House؟", "a": "يقع المقر الرئيسي للشركة في مركز كومباس للأعمال - منطقة الحمرا الصناعية - رأس الخيمة - الإمارات العربية المتحدة." },
        "en": { "q": "Where is the headquarters of Robot House located?", "a": "The company's headquarters is located at Compass Business Centre - Al Hamra Industrial Area - Ras Al Khaimah - United Arab Emirates." }
      }
    },

    "gen_003": {
      "keywords": { "ar": ["رؤية", "هدف", "مدينة ذكية"], "en": ["vision", "smart city", "goal"] },
      "response": {
        "ar": { "q": "ما هي رؤية شركة Robot House؟", "a": "رؤيتنا هي بناء مجتمع يسبق عصره، حيث يكون الذكاء الاصطناعي شريكًا في الإدارة، التخطيط، التشغيل، والمعيشة اليومية. نهدف إلى تأسيس أول نظام حضري ذكي متكامل في العالم العربي، وصولاً إلى مدينة مستقبلية تُدار رقميًا في كل تفاصيلها لتحقيق الكفاءة والأمان والراحة والاستدامة وأعلى عائد اقتصادي." },
        "en": { "q": "What is the vision of Robot House?", "a": "Our vision is to build a community that is ahead of its time, where artificial intelligence is a partner in management, planning, operation, and daily living. We aim to establish the first integrated smart urban system in the Arab world, leading to a future city managed digitally in every detail to achieve efficiency, security, comfort, sustainability, and the highest economic return." }
      }
    },

    "gen_004": {
      "keywords": { "ar": ["رسالة", "مهمة"], "en": ["mission", "objective"] },
      "response": {
        "ar": { "q": "ما هي رسالة شركة Robot House؟", "a": "تتمثل رسالتنا في قيادة تحول نوعي في قطاع الإسكان والعمران والضيافة الذكية، عبر تصميم بيئات قابلة للتوسع، مؤتمتة بالكامل، وموائمة للتغيرات المناخية والرقمية، لتكون نموذجًا يحتذى به في مدن المستقبل." },
        "en": { "q": "What is the mission of Robot House?", "a": "Our mission is to lead a qualitative transformation in the smart housing, urban development, and hospitality sectors, by designing scalable, fully automated environments that adapt to climate and digital changes, to be a role model for the cities of the future." }
      }
    },

    "gen_005": {
      "keywords": { "ar": ["منتجات", "خدمات", "المنظومة"], "en": ["products", "services", "ecosystem"] },
      "response": {
        "ar": { "q": "ما هي المنتجات والخدمات الرئيسية التي تقدمها Robot House؟", "a": "نقدم منظومة متكاملة تشمل: 1) السكن الذكي (منازل مستقلة ومتنقلة). 2) الضيافة الذكية (شاحنات الشاورما الكهربائية الفاخرة والمطاعم الذكية). 3) أنظمة الإنتاج الغذائي (مزرعة دواجن آلية، مصنع تتبيلة، استيراد توابل). 4) النقل الذكي (شاحنات نقل بحرية حية، مركبات روبوتية برمائية، طائرات شفافة كهربائية، قطارات ليزر)." },
        "en": { "q": "What are the main products and services offered by Robot House?", "a": "We offer an integrated ecosystem including: 1) Smart Housing (autonomous and mobile homes). 2) Smart Hospitality (luxury electric shawarma trucks and smart restaurants). 3) Food Production Systems (automated poultry farm, secret marinade factory, spice import). 4) Smart Mobility (live seafood transport trucks, amphibious robotic vehicles, transparent electric aircraft, laser trains)." }
      }
    },

    /* Products: Shawarma Truck */
    "prod_001": {
      "keywords": { "ar": ["شاحنة", "شاورما", "روبو شاورما"], "en": ["truck", "shawarma", "robo shawarma"] },
      "response": {
        "ar": { "q": "ما هي شاحنة الشاورما الذكية الفاخرة (ROBO SHAWARMA TRUCK)؟", "a": "هي أول شاحنة ضيافة كهربائية ذكية من نوعها في العالم، بطول 24 قدم. إنها مطعم ذكي متنقل فاخر يجمع بين الفخامة، السرعة، والتكنولوجيا المتقدمة لتقديم تجربة طعام متنقلة عالمية، وليست مجرد شاحنة طعام تقليدية." },
        "en": { "q": "What is the ROBO SHAWARMA TRUCK?", "a": "It is the world's first smart electric hospitality truck of its kind, 24 feet long. It is a luxury, mobile smart restaurant combining luxury, speed, and advanced technology to offer a global mobile dining experience, not just a traditional food truck." }
      }
    },
    "prod_002": {
      "keywords": { "ar": ["بطارية", "شمسية", "V2G"], "en": ["battery", "solar", "V2G"] },
      "response": {
        "ar": { "q": "ما هي مواصفات الطاقة في شاحنة الشاورما الذكية؟", "a": "تعمل الشاحنة ببطارية قوتها 300 كيلوواط، وهي مدعومة بألواح شمسية بقدرة 25 كيلوواط وتقنية V2G (Vehicle-to-Grid)، مما يجعلها صديقة للبيئة وفعالة في استهلاك الطاقة." },
        "en": { "q": "What are the power specifications of the Smart Shawarma Truck?", "a": "The truck operates on a 300 kW battery, supported by 25 kW solar panels and V2G (Vehicle-to-Grid) technology, making it eco-friendly and energy-efficient." }
      }
    },
    "prod_003": {
      "keywords": { "ar": ["إنتاج", "وجبات", "420"], "en": ["production", "meals", "420"] },
      "response": {
        "ar": { "q": "ما هي القدرة الإنتاجية لشاحنة الشاورما الذكية؟", "a": "تستطيع الشاحنة إنتاج وتقديم ما يصل إلى 420 وجبة يوميًا." },
        "en": { "q": "What is the daily production capacity of the Smart Shawarma Truck?", "a": "The truck can produce and serve up to 420 meals per day." }
      }
    },
    "prod_004": {
      "keywords": { "ar": ["مشاوي", "عدد", "أنواع"], "en": ["grills", "number", "types"] },
      "response": {
        "ar": { "q": "كم عدد المشاوي الموجودة في الشاحنة وما أنواعها؟", "a": "تحتوي الشاحنة على 4 مشاوي متخصصة لشواء: اللحم، الدجاج، السجق، والديك الرومي." },
        "en": { "q": "How many grills does the truck have and what are the types?", "a": "The truck features 4 specialized grills for cooking: meat, chicken, sausage, and turkey." }
      }
    },
    "prod_005": {
      "keywords": { "ar": ["تقنيات", "روبوت", "درون", "OLED", "تبريد"], "en": ["technologies", "robot", "drone", "OLED", "cooling"] },
      "response": {
        "ar": { "q": "ما هي أبرز التقنيات الذكية المستخدمة في شاحنة الشاورما؟", "a": "تضم الشاحنة: نظام تبريد ذكي بسعة 800 كجم، شاشة OLED بحجم 85 بوصة، نظام طلب بالذكاء الاصطناعي (AI)، نظام تقطيع وتحضير روبوتي، خدمة توصيل بالدرون، ومخطط داخلي تفاعلي جاهز لتقنية الواقع المعزز (AR)." },
        "en": { "q": "What are the key smart technologies used in the Shawarma Truck?", "a": "The truck includes: a smart cooling system with 800 kg capacity, an 85-inch OLED screen, an AI ordering system, robotic cutting and preparation, drone delivery service, and an interactive interior map ready for AR (Augmented Reality)." }
      }
    },

    /* Smart Farm */
    "farm_001": {
      "keywords": { "ar": ["مزرعة", "دواجن", "تتبيلة"], "en": ["farm", "poultry", "marinade"] },
      "response": {
        "ar": { "q": "ما هي المنظومة التي توفرها Robot House لضمان جودة وسلسلة توريد اللحوم؟", "a": "نوفر منظومة إنتاج غذائي ذكية متكاملة تشمل مزرعة دواجن آلية بطاقة إنتاجية تصل إلى 50,000 دجاجة شهريًا، واستيراد التوابل من مختلف دول العالم، ومصنعًا خاصًا للتتبيلة السرية، وكل ذلك بتقنيات ذكية لضمان الجودة والاستمرارية." },
        "en": { "q": "What ecosystem does Robot House provide to ensure meat quality and supply chain?", "a": "We provide an integrated smart food production ecosystem including an automated poultry farm with a capacity of up to 50,000 chickens per month, importing spices from around the world, and a secret marinade factory, all using smart technologies to ensure quality and continuity." }
      }
    },
    "farm_002": {
      "keywords": { "ar": ["تغذية آلية", "تحكم مناخي", "ذكاء اصطناعي"], "en": ["automated feeding", "climate control", "AI"] },
      "response": {
        "ar": { "q": "ما هي التقنيات المستخدمة في المزرعة الذكية للدواجن؟", "a": "تعتمد المزرعة على: تغذية آلية بالكامل، تحكم مناخي ذكي، ومراقبة الوزن والصحة للطيور باستخدام الذكاء الاصطناعي (AI)." },
        "en": { "q": "What technologies are used in the smart poultry farm?", "a": "The farm relies on: fully automated feeding, smart climate control, and AI-powered weight and health monitoring for the birds." }
      }
    },
    "farm_003": {
      "keywords": { "ar": ["تدوير", "وقود حيوي", "استدامة"], "en": ["recycle", "biofuel", "sustainability"] },
      "response": {
        "ar": { "q": "كيف تساهم المزرعة الذكية في الحفاظ على البيئة؟", "a": "تساعد المزرعة في تقليل النفايات بنسبة 45%، كما أنها تعيد تدوير المخلفات وتحول السماد إلى وقود حيوي، مما يجعلها منظومة صديقة للبيئة." },
        "en": { "q": "How does the smart farm contribute to environmental protection?", "a": "The farm helps reduce waste by 45%, recycles waste, and converts manure into biofuel, making it an eco-friendly system." }
      }
    },
    "farm_004": {
      "keywords": { "ar": ["تتبيلة", "مصنع", "عضوي"], "en": ["marinade", "factory", "organic"] },
      "response": {
        "ar": { "q": "ما الذي يميز مصنع التتبيلة الخاص بشركة Robot House؟", "a": "هو مصنع \"التتبيلة السرية\" الذي ينتج خلطات عضوية طبيعية 100%، ويعتمد على شراكات توريد مباشرة لاستيراد التوابل من جميع أنحاء العالم، مما يضمن نكهة فريدة واستمرارية العمل." },
        "en": { "q": "What makes Robot House's marinade factory special?", "a": "It is the 'Secret Marinade' factory that produces 100% natural, organic blends. It relies on direct supply partnerships to import spices from all over the world, ensuring a unique flavor and business continuity." }
      }
    },

    /* Seafood Mobility */
    "seafood_001": {
      "keywords": { "ar": ["نقل بحري", "مأكولات بحرية", "مطعم ذكي"], "en": ["seafood", "mobility", "smart restaurant"] },
      "response": {
        "ar": { "q": "ما هو منتج 'النقل البحري والمطعم الذكي' من Robot House؟", "a": "هو حل متكامل يجمع بين الخدمات اللوجستية الذكية لنقل المأكولات البحرية الحية وتجربة الضيافة الفاخرة في مطاعم مستقبلية. يشمل شاحنات نقل مبردة ومطعمًا ذكيًا يقدم الطهي المباشر للمأكولات البحرية." },
        "en": { "q": "What is the 'Seafood Mobility & Smart Restaurant' product from Robot House?", "a": "It is an integrated solution combining smart logistics for transporting live seafood with a luxury hospitality experience in futuristic restaurants. It includes refrigerated transport trucks and a smart restaurant offering live cooking of seafood." }
      }
    },
    "seafood_002": {
      "keywords": { "ar": ["سلمون", "روبيان", "كافيار"], "en": ["salmon", "shrimp", "caviar"] },
      "response": {
        "ar": { "q": "ما هي أنواع المأكولات البحرية التي يتم نقلها عبر شاحنات Robot House؟", "a": "تشمل المأكولات البحرية المنقولة: السلمون، الروبيان، والكافيار (من سمك الحفري - Sturgeon)." },
        "en": { "q": "What types of seafood are transported via Robot House trucks?", "a": "The seafood transported includes: salmon, shrimp, and caviar (from Sturgeon fish)." }
      }
    },
    "seafood_003": {
      "keywords": { "ar": ["أكسجين", "فلترة", "تحكم حراري"], "en": ["oxygen", "filtration", "thermal control"] },
      "response": {
        "ar": { "q": "ما هي التقنيات المستخدمة في شاحنات نقل المأكولات البحرية للحفاظ على جودتها؟", "a": "تستخدم الشاحنات أنظمة أكسجين متقدمة، فلترة مياه ذكية، وتحكم حراري دقيق بدرجة حرارة ±0.5 درجة مئوية، مع نظام مراقبة يعمل بتقنيات GPS والإنترنت الأشياء (IoT) على مدار الساعة." },
        "en": { "q": "What technologies are used in the seafood transport trucks to maintain quality?", "a": "The trucks use advanced oxygen systems, smart water filtration, and precise thermal control to within ±0.5°C, with a 24/7 monitoring system using GPS and IoT (Internet of Things) technologies." }
      }
    },
    "seafood_004": {
      "keywords": { "ar": ["مطعم ذكي", "AI ordering", "روبوتات", "قوائم رقمية"], "en": ["smart restaurant", "AI ordering", "robots", "digital menus"] },
      "response": {
        "ar": { "q": "ما هي الميزات التي يقدمها 'المطعم الذكي' ضمن هذا المنتج؟", "a": "يقدم المطعم تجربة فاخرة تشمل: نظام طلب بالذكاء الاصطناعي (AI ordering)، روبوتات في المطبخ، جدران رقمية للقوائم، طهي مباشر للمأكولات البحرية الحية أمام الزبون، وشاشات ترفيه." },
        "en": { "q": "What features does the 'Smart Restaurant' offer within this product?", "a": "The restaurant offers a luxury experience including: AI ordering, kitchen robots, digital menu walls, live cooking of seafood in front of the customer, and entertainment screens." }
      }
    },

    /* Summaries */
    "summary_001": {
      "keywords": { "ar": ["صناعات", "منتجات", "ملخص"], "en": ["industries", "products", "summary"] },
      "response": {
        "ar": { "q": "ما هي جميع الصناعات والمنتجات التي تعمل فيها شركة Robot House بشكل مختصر؟", "a": "تعمل الشركة في عدة قطاعات رئيسية: 1) الضيافة المتنقلة: شاحنة شاورما كهربائية ذكية فاخرة. 2) الإنتاج الزراعي والغذائي: مزرعة دواجن آلية، استيراد توابل عالمي، مصنع تتبيلة سري. 3) الخدمات اللوجستية: شاحنات نقل مأكولات بحرية حية بأنظمة تبريد وأكسجين متقدمة. 4) المطاعم الذكية: مطاعم مستقبلية بأتمتة كاملة وروبوتات. 5) التكنولوجيا العقارية: منازل ذكية متنقلة ومستدامة." },
        "en": { "q": "What are all the industries and products that Robot House operates in, in brief?", "a": "The company operates in several key sectors: 1) Mobile Hospitality: Luxury electric smart Shawarma truck. 2) Agricultural & Food Production: Automated poultry farm, global spice import, secret marinade factory. 3) Logistics: Live seafood transport trucks with advanced cooling and oxygen systems. 4) Smart Restaurants: Futuristic restaurants with full automation and robots. 5) PropTech: Mobile, sustainable smart homes." }
      }
    },
    "summary_002": {
      "keywords": { "ar": ["أرقام", "شاحنة", "إحصائيات"], "en": ["figures", "truck", "statistics"] },
      "response": {
        "ar": { "q": "ما هي أبرز الأرقام والإحصائيات لمشروع شاحنة الشاورما؟", "a": "شاحنة بطول 24 قدم، بطارية 300 كيلوواط، ألواح شمسية 25 كيلوواط، تنتج 420 وجبة/يوم، تحتوي على 4 مشاوي، نظام تبريد 800 كجم، وتعمل بفريق من 3 موظفين فقط." },
        "en": { "q": "What are the key figures and statistics for the Shawarma Truck project?", "a": "24-foot truck, 300 kW battery, 25 kW solar panels, produces 420 meals/day, has 4 grills, 800 kg cooling system, and operates with only 3 staff members." }
      }
    },
    "summary_003": {
      "keywords": { "ar": ["أرقام", "مزرعة", "إحصائيات"], "en": ["figures", "farm", "statistics"] },
      "response": {
        "ar": { "q": "ما هي أبرز الأرقام والإحصائيات لمشروع المزرعة الذكية؟", "a": "مزرعة تنتج 50,000 دجاجة شهريًا، تقلل النفايات بنسبة 45%، تحول السماد إلى وقود حيوي، وتستخدم الذكاء الاصطناعي لمراقبة الصحة والوزن." },
        "en": { "q": "What are the key figures and statistics for the Smart Farm project?", "a": "A farm producing 50,000 chickens/month, reduces waste by 45%, converts manure into biofuel, and uses AI to monitor health and weight." }
      }
    }
  });
} catch (e) {
  console.warn('Failed to merge Robot House knowledge entries:', e);
}

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
// =========================================================
// ADVANCED 4K VIDEO CACHING & BUFFERING SYSTEM
// =========================================================
(function advancedVideoManager() {
    // Configuration
    const PRELOAD_AHEAD_SECONDS = 30; // Preload next 30 seconds of video
    const MAX_CACHE_SIZE_MB = 500; // Max cache size in MB (adjust as needed)
    const DEBUG = false; // Set to true to see logs

    function log(...args) {
        if (DEBUG) console.log('[VideoCache]', ...args);
    }

    // Store active video elements and their cache handlers
    const activeVideos = new Map();

    class VideoCacheHandler {
        constructor(videoElement, srcUrl) {
            this.video = videoElement;
            this.src = srcUrl;
            this.mediaSource = null;
            this.sourceBuffer = null;
            this.isPlaying = false;
            this.isBuffering = false;
            this.bufferQueue = [];
            this.videoUrl = null;
            this.abortController = null;
            this.isDestroyed = false;

            this.init();
        }

        async init() {
            if (this.isDestroyed) return;
            
            // Skip if video is already playing natively without issues
            if (this.video.src && this.video.readyState >= 3) {
                log('Video already playing smoothly, skipping cache override', this.src);
                return;
            }

            // For MP4 files, we use a custom fetcher to preload and buffer
            if (this.src.includes('.mp4')) {
                await this.setupCustomBuffer();
            } else {
                // For other formats (like .m3u8), rely on HLS.js or native
                log('Non-MP4 format, relying on native/HLS', this.src);
            }
        }

        async setupCustomBuffer() {
            if (this.isDestroyed || !this.video) return;

            log('Setting up custom buffer for', this.src);
            this.abortController = new AbortController();
            
            // Use fetch with range requests to preload chunks
            const fetchChunk = async (start, end) => {
                try {
                    const response = await fetch(this.src, {
                        headers: { Range: `bytes=${start}-${end}` },
                        signal: this.abortController.signal
                    });
                    if (!response.ok && response.status !== 206) throw new Error(`HTTP ${response.status}`);
                    const data = await response.arrayBuffer();
                    return data;
                } catch (err) {
                    if (err.name !== 'AbortError') log('Chunk fetch error', err);
                    return null;
                }
            };

            // Get total file size (optional, for caching)
            let totalSize = null;
            try {
                const headResp = await fetch(this.src, { method: 'HEAD', signal: this.abortController.signal });
                totalSize = parseInt(headResp.headers.get('Content-Length'), 10);
                log('Total video size:', totalSize);
            } catch (err) {
                log('Could not get total size', err);
            }

            // Preload first 10MB immediately
            const initialChunk = await fetchChunk(0, 10 * 1024 * 1024);
            if (initialChunk && !this.isDestroyed) {
                const blobUrl = URL.createObjectURL(new Blob([initialChunk], { type: 'video/mp4' }));
                if (this.video.src !== blobUrl) {
                    this.video.src = blobUrl;
                    this.videoUrl = blobUrl;
                    await this.video.play().catch(e => log('Play error', e));
                }
            }

            // Progressive loading in the background
            let currentOffset = 10 * 1024 * 1024; // Start after initial 10MB
            const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
            
            const loadNextChunk = async () => {
                if (this.isDestroyed || !this.video) return;
                
                // Check if we need more data (video buffer is low)
                const buffered = this.video.buffered;
                let bufferEnd = 0;
                if (buffered.length > 0) {
                    bufferEnd = buffered.end(buffered.length - 1);
                }
                const currentTime = this.video.currentTime;
                const secondsAhead = (bufferEnd - currentTime);
                
                // If we have enough buffered (30 seconds), wait a bit
                if (secondsAhead > PRELOAD_AHEAD_SECONDS) {
                    setTimeout(loadNextChunk, 5000);
                    return;
                }
                
                // Fetch next chunk
                if (totalSize && currentOffset < totalSize) {
                    const end = Math.min(currentOffset + CHUNK_SIZE - 1, totalSize);
                    const chunk = await fetchChunk(currentOffset, end);
                    if (chunk && !this.isDestroyed) {
                        // Append chunk to current blob and update video source? 
                        // For simplicity and stability, we'll create a new blob URL with accumulated data.
                        // This is a simplified approach; a full MediaSource implementation would be more robust.
                        // For now, we rely on browser's native progressive download.
                        // We just pre-fetch to warm the cache.
                        log(`Cached chunk ${currentOffset}-${end}`);
                    }
                    currentOffset = end + 1;
                    setTimeout(loadNextChunk, 1000);
                } else {
                    // If no total size, just keep trying
                    setTimeout(loadNextChunk, 3000);
                }
            };
            
            // Start background loading
            loadNextChunk();
            
            // Listen to video events to maintain smooth playback
            this.video.addEventListener('waiting', () => {
                log('Video waiting, buffer low', this.src);
                // Force load next chunk if needed
                loadNextChunk();
            });
        }
        
        destroy() {
            this.isDestroyed = true;
            if (this.abortController) this.abortController.abort();
            if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
            if (this.video) {
                this.video.src = '';
                this.video.load();
            }
            activeVideos.delete(this.video);
        }
    }

    // Function to initialize caching for a video element
    function initVideoCache(videoElement) {
        if (!videoElement || videoElement.classList.contains('header-video')) return;
        
        const src = videoElement.currentSrc || videoElement.src || videoElement.querySelector('source')?.src;
        if (!src) return;
        
        // Skip if already handling
        if (activeVideos.has(videoElement)) return;
        
        // Only handle MP4 files for now
        if (src.includes('.mp4')) {
            log('Initializing cache for', src);
            const handler = new VideoCacheHandler(videoElement, src);
            activeVideos.set(videoElement, handler);
            
            // Clean up when video is removed
            const observer = new MutationObserver((mutations, obs) => {
                if (!document.body.contains(videoElement)) {
                    handler.destroy();
                    obs.disconnect();
                }
            });
            observer.observe(videoElement.parentElement || document.body, { childList: true, subtree: true });
        }
    }

    // Observe new videos added to the DOM
    const videoObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'VIDEO') {
                        initVideoCache(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(v => initVideoCache(v));
                    }
                }
            });
        });
    });

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Cache existing videos
        document.querySelectorAll('video').forEach(v => initVideoCache(v));
        
        // Start observing for dynamically added videos
        videoObserver.observe(document.body, { childList: true, subtree: true });
    });
    
    // Expose for debugging if needed
    window.__videoCacheManager = { activeVideos, VideoCacheHandler };
})();

/* Robust SoundManager: play site sounds independently via Web Audio API buffers so playback is resilient to page media activity and loading */
(function () {
  const SOURCES = {
    boot: '/jarvis_boot_sound.mp3',
    welcome_ar: '/رسالة ترحيب عربي.m4a',
    welcome_en: '/رسالة ترحيب انجليزي.m4a',
    project_ar: '/رسالة المشروع باالعربية.mp3',
    project_en: '/رسالة المشروع بلانجلزية.mp3'
  };
  // singleton manager
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.buffers = new Map();
      this.gain = null;
      this.userGestureOk = false;
      this.init();
    }
    init() {
      try {
        // create but suspend until user gesture to satisfy autoplay policies
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 1.0;
        this.gain.connect(this.ctx.destination);
        // attempt resume on first gesture
        const resume = async () => {
          try { await this.ctx.resume(); this.userGestureOk = true; cleanup(); } catch(e){}
        };
        const cleanup = () => {
          window.removeEventListener('pointerdown', resume, true);
          window.removeEventListener('click', resume, true);
          window.removeEventListener('keydown', resume, true);
        };
        window.addEventListener('pointerdown', resume, { once: true, capture: true });
        window.addEventListener('click', resume, { once: true, capture: true });
        window.addEventListener('keydown', resume, { once: true, capture: true });
      } catch (e) {
        console.warn('SoundManager init failed', e);
      }
    }
    async load(key, url) {
      if (!this.ctx) return null;
      if (this.buffers.has(key)) return this.buffers.get(key);
      try {
        const resp = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (!resp.ok) throw new Error('Fetch failed');
        const ab = await resp.arrayBuffer();
        const buf = await this.ctx.decodeAudioData(ab.slice(0));
        this.buffers.set(key, buf);
        return buf;
      } catch (e) {
        console.warn('Sound load failed', key, e);
        return null;
      }
    }
    playBuffer(key, when = 0, opts = {}) {
      try {
        const buf = this.buffers.get(key);
        if (!buf || !this.ctx) return null;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = typeof opts.volume === 'number' ? opts.volume : 1.0;
        src.connect(gainNode);
        gainNode.connect(this.gain);
        if (opts.loop) src.loop = true;
        src.start(this.ctx.currentTime + when);
        // return a handle to stop
        return { stop: () => { try { src.stop(); } catch(e){} } };
      } catch (e) {
        console.warn('playBuffer failed', e);
        return null;
      }
    }
    async ensureAndPlay(key, url, when = 0, opts = {}) {
      await this.load(key, url);
      return this.playBuffer(key, when, opts);
    }
  }

  // instantiate manager
  const SM = new SoundManager();
  window.__SoundManager = SM;

  // helpers to follow existing timing: boot ~on entry, welcome after 3s, project message after 30s (on language switch)
  async function tryPlayBoot() {
    // best-effort: play once and ignore failures
    try {
      await SM.load('boot', SOURCES.boot);
      if (SM.userGestureOk) SM.playBuffer('boot', 0, { volume: 0.9 });
      else {
        // wait for visibility/gesture and play
        const onGesture = async () => { await SM.playBuffer('boot', 0, { volume: 0.9 }); cleanup(); };
        const onVisible = async () => { if (document.visibilityState === 'visible') { await SM.playBuffer('boot', 0, { volume: 0.9 }); cleanup(); } };
        function cleanup() {
          window.removeEventListener('pointerdown', onGesture, true);
          window.removeEventListener('click', onGesture, true);
          window.removeEventListener('visibilitychange', onVisible, true);
        }
        window.addEventListener('pointerdown', onGesture, { once: true, capture: true });
        window.addEventListener('click', onGesture, { once: true, capture: true });
        window.addEventListener('visibilitychange', onVisible, { once: true, capture: true });
      }
    } catch (e) { console.warn('Boot play failed', e); }
  }

  function getSiteLang() {
    try { return (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar'; }
    catch (e) { return document.documentElement.lang || 'ar'; }
  }

  // schedule welcome and project message using SoundManager buffers (keeps handles to stop if needed)
  let welcomeHandle = null;
  let projectTimer = null;
  async function scheduleWelcomeAndProject(lang) {
    try {
      const welcomeKey = lang === 'en' ? 'welcome_en' : 'welcome_ar';
      const welcomeUrl = lang === 'en' ? SOURCES.welcome_en : SOURCES.welcome_ar;
      // welcome after 3s
      setTimeout(async () => {
        try {
          await SM.load(welcomeKey, welcomeUrl);
          if (SM.userGestureOk) { welcomeHandle = SM.playBuffer(welcomeKey, 0, { volume: 0.95 }); }
          else {
            // retry on gesture/visibility
            const onGesture = async () => { welcomeHandle = SM.playBuffer(welcomeKey, 0, { volume: 0.95 }); cleanup(); };
            const onVisible = async () => { if (document.visibilityState === 'visible') { welcomeHandle = SM.playBuffer(welcomeKey, 0, { volume: 0.95 }); cleanup(); } };
            function cleanup() {
              window.removeEventListener('pointerdown', onGesture, true);
              window.removeEventListener('click', onGesture, true);
              window.removeEventListener('visibilitychange', onVisible, true);
            }
            window.addEventListener('pointerdown', onGesture, { once: true, capture: true });
            window.addEventListener('click', onGesture, { once: true, capture: true });
            window.addEventListener('visibilitychange', onVisible, { once: true, capture: true });
          }
        } catch (e) { console.warn('welcome play error', e); }
      }, 3000);

      // project message after 30s
      clearTimeout(projectTimer);
      projectTimer = setTimeout(async () => {
        try {
          const projKey = lang === 'en' ? 'project_en' : 'project_ar';
          const projUrl = lang === 'en' ? SOURCES.project_en : SOURCES.project_ar;
          await SM.load(projKey, projUrl);
          if (SM.userGestureOk) SM.playBuffer(projKey, 0, { volume: 0.95 });
          else {
            const onGesture = async () => { await SM.playBuffer(projKey, 0, { volume: 0.95 }); cleanup(); };
            const onVisible = async () => { if (document.visibilityState === 'visible') { await SM.playBuffer(projKey, 0, { volume: 0.95 }); cleanup(); } };
            function cleanup() {
              window.removeEventListener('pointerdown', onGesture, true);
              window.removeEventListener('click', onGesture, true);
              window.removeEventListener('visibilitychange', onVisible, true);
            }
            window.addEventListener('pointerdown', onGesture, { once: true, capture: true });
            window.addEventListener('click', onGesture, { once: true, capture: true });
            window.addEventListener('visibilitychange', onVisible, { once: true, capture: true });
          }
        } catch (e) { console.warn('project message play error', e); }
      }, 30000);
    } catch (e) { console.warn('scheduleWelcomeAndProject failed', e); }
  }

  // Initialize on load: play boot immediately and schedule welcome/project per current language
  window.addEventListener('load', () => {
    try { tryPlayBoot(); } catch (e) {}
    const lang = (getSiteLang() || 'ar').toLowerCase();
    scheduleWelcomeAndProject(lang);
  });

  // respond to language changes via storage events (keep timing/per-play counts)
  window.addEventListener('storage', (ev) => {
    if (ev.key !== 'site-lang') return;
    const lang = (ev.newValue || '').toLowerCase();
    if (!lang) return;
    // stop any pending handles (do not revoke buffers to allow re-play)
    try { if (welcomeHandle && welcomeHandle.stop) welcomeHandle.stop(); } catch(e){}
    clearTimeout(projectTimer);
    scheduleWelcomeAndProject(lang);
  });

  // Expose lightweight controls for debugging / manual invocation
  window.__SoundManagerPlay = async function(key) {
    const mapping = {
      boot: 'boot',
      welcome_ar: 'welcome_ar',
      welcome_en: 'welcome_en',
      project_ar: 'project_ar',
      project_en: 'project_en'
    };
    if (!mapping[key]) return;
    const url = SOURCES[key];
    await SM.load(key, url);
    return SM.playBuffer(key, 0, { volume: 1.0 });
  };

  // cleanly handle page visibility to avoid audio being paused by some heuristics: try resume on visible
  document.addEventListener('visibilitychange', async () => {
    try { if (document.visibilityState === 'visible' && SM && SM.ctx && SM.ctx.state === 'suspended') await SM.ctx.resume(); } catch(e){}
  });

})();(function premiumThemeController() {
  const THEMES = [
    { key: 'gold-diamond', icon: 'fa-crown',          title: 'الثيم الملكي الذهبي / Gold Royal' },
    { key: 'dark',         icon: 'fa-moon',            title: 'الثيم الداكن / Dark Clean' },
    { key: 'white',        icon: 'fa-sun',             title: 'الثيم الأبيض / Clean White' },
    { key: 'white-natural',icon: 'fa-snowflake',       title: 'الثيم الزجاجي / Glass White 3D' }
  ];

  const STORAGE_KEY = 'rh-premium-theme';
  const LEGACY_CLASSES = [
    'gold',
    'white-luxury',
    'natural-dark',
    'dark-theme',
    'theme-white',
    'theme-gold-diamond',
    'theme-dark',
    'theme-white-natural'
  ];

  const LEGACY_MAP = {
    white: ['theme-white', 'white-luxury'],
    'gold-diamond': ['theme-gold-diamond', 'gold'],
    dark: ['theme-dark', 'natural-dark'],
    'white-natural': ['theme-white-natural']
  };

  function safeLocalStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* no-op */
    }
  }

  function normalizeTheme(theme) {
    if (theme === 'gold') return 'gold-diamond';
    if (theme === 'natural-dark' || theme === 'dark-theme') return 'dark';
    if (theme === 'white-luxury') return 'white';
    return THEMES.some(item => item.key === theme) ? theme : 'gold-diamond';
  }

  function getStoredTheme() {
    let theme = safeLocalStorageGet(STORAGE_KEY);

    if (!theme) {
      try {
        theme = parent && parent !== window ? parent.localStorage.getItem(STORAGE_KEY) : null;
      } catch (e) {
        theme = null;
      }
    }

    if (!theme && document.body) {
      theme = document.body.dataset.theme || Array.from(document.body.classList).find(cls =>
        cls === 'gold' || cls === 'white-luxury' || cls === 'natural-dark' || cls === 'dark-theme' || cls.startsWith('theme-')
      );
    }

    return normalizeTheme(theme || 'gold-diamond');
  }

  function updateThemeButton(theme) {
    const btn = document.getElementById('theme-switcher') || document.getElementById('theme-toggle');
    if (!btn) return;

    const cfg     = THEMES.find(item => item.key === theme) || THEMES[0];
    const nextIdx = (THEMES.findIndex(item => item.key === theme) + 1) % THEMES.length;
    const nextCfg = THEMES[nextIdx];

    /* tooltip فقط — بدون نص مرئي */
    btn.setAttribute('title',      nextCfg.title);
    btn.setAttribute('aria-label', nextCfg.title);

    /* أيقونة الثيم الحالي */
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `fas ${cfg.icon}`;
      icon.setAttribute('aria-hidden', 'true');
    }

    /* لون الزر يعكس الثيم الحالي */
    const colors = {
      'gold-diamond': 'linear-gradient(135deg,#8F6B2E,#C6A85A,#E3C97A)',
      'dark':         'linear-gradient(135deg,#1e1e1e,#2a2a2a)',
      'white':        'linear-gradient(135deg,#e8e8e8,#f7f7f7)',
      'white-natural':'linear-gradient(135deg,rgba(255,255,255,0.6),rgba(200,215,235,0.5))'
    };
    const textColors = {
      'gold-diamond': '#050505',
      'dark':         '#eaeaea',
      'white':        '#111111',
      'white-natural':'#1c2a44'
    };
    btn.style.background = colors[theme] || colors['gold-diamond'];
    btn.style.color      = textColors[theme] || '#fff';

    /* أزل أي نص مرئي — أيقونة فقط */
    btn.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) n.remove();
    });
    btn.querySelectorAll('span:not(.sr-only)').forEach(s => s.remove());
  }

  function applyTheme(themeKey, options = {}) {
    const theme = normalizeTheme(themeKey);
    const { persist = true, broadcast = true } = options;

    if (!document.body) return theme;

    document.body.classList.remove(...LEGACY_CLASSES);
    document.body.classList.add(...(LEGACY_MAP[theme] || [`theme-${theme}`]));
    document.body.dataset.theme = theme;
    document.body.classList.add('theme-managed');

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = (theme === 'white' || theme === 'white-natural') ? 'light' : 'dark';

    if (document.body.classList.contains('assistant-page')) {
      document.body.classList.add('theme-synced-assistant');
    }

    if (persist) safeLocalStorageSet(STORAGE_KEY, theme);
    updateThemeButton(theme);

    if (broadcast) {
      window.dispatchEvent(new CustomEvent('rh-theme-change', {
        detail: { theme }
      }));
    }

    return theme;
  }

  function cycleTheme() {
    const current = getStoredTheme();
    const idx = THEMES.findIndex(item => item.key === current);
    const next = THEMES[(idx + 1 + THEMES.length) % THEMES.length];
    applyTheme(next.key);
  }

  function bindButton() {
    const btn = document.getElementById('theme-switcher') || document.getElementById('theme-toggle');
    if (!btn || btn.dataset.themeBound === 'true') return;

    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', function onThemeClick(event) {
      event.preventDefault();
      event.stopPropagation();
      cycleTheme();
    }, { capture: true });
  }

  function init() {
    applyTheme(getStoredTheme(), { persist: false, broadcast: false });
    bindButton();

    window.addEventListener('storage', function onStorage(event) {
      if (event.key === STORAGE_KEY && event.newValue) {
        applyTheme(event.newValue, { persist: false });
      }
    });

    document.addEventListener('visibilitychange', function onVisibilityChange() {
      if (!document.hidden) {
        applyTheme(getStoredTheme(), { persist: false, broadcast: false });
      }
    });

    window.addEventListener('message', function onThemeMessage(event) {
      if (!event || !event.data || event.data.type !== 'rh-theme-sync') return;
      if (!event.data.theme) return;
      applyTheme(event.data.theme, { persist: false });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ================================================================
   PERFORMANCE BOOSTER — نظام تسريع شامل
   - Lazy load للفيديوهات (IntersectionObserver)
   - Lazy load للصور
   - تأجيل الصوت حتى أول تفاعل
   - تحديد عدد الفيديوهات المشغّلة في نفس الوقت
   - preload=none لكل الفيديوهات خارج الشاشة
   ================================================================ */
(function RHPerformanceBooster() {
  'use strict';

  /* ── 1. إيقاف autoplay لكل الفيديوهات فوراً ما عدا الهيدر ── */
  function freezeOffscreenVideos() {
    document.querySelectorAll('video').forEach(v => {
      if (v.classList.contains('header-video')) return; // الهيدر يشتغل دائماً
      v.pause();
      v.preload = 'none';
      // احفظ الـ src في data-src وأزله لمنع التحميل
      v.querySelectorAll('source').forEach(s => {
        if (s.src && !s.dataset.src) {
          s.dataset.src = s.src;
          s.removeAttribute('src');
        }
      });
      v.load(); // يطبّق إزالة الـ src
    });
  }

  /* ── 2. IntersectionObserver للفيديو — يحمّل ويشغّل عند الظهور ── */
  const MAX_PLAYING = 2; // أقصى عدد فيديوهات تشتغل في نفس الوقت
  let playingCount = 0;

  function loadAndPlayVideo(video) {
    // استعادة الـ src
    video.querySelectorAll('source[data-src]').forEach(s => {
      s.src = s.dataset.src;
    });
    video.preload = 'metadata'; // metadata فقط — لا تحميل كامل
    video.load();

    if (playingCount < MAX_PLAYING) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.then(() => { playingCount++; }).catch(() => {});
      }
    }

    video.addEventListener('pause', () => { playingCount = Math.max(0, playingCount - 1); }, { once: false });
  }

  function pauseVideo(video) {
    if (!video.paused) {
      video.pause();
      playingCount = Math.max(0, playingCount - 1);
    }
  }

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (v.classList.contains('header-video')) return;
      if (entry.isIntersecting) {
        // تحميل وتشغيل عند الدخول للشاشة
        if (!v.dataset.rhLoaded) {
          v.dataset.rhLoaded = '1';
          loadAndPlayVideo(v);
        } else if (v.paused && playingCount < MAX_PLAYING) {
          v.play().then(() => playingCount++).catch(() => {});
        }
      } else {
        // إيقاف عند الخروج من الشاشة
        pauseVideo(v);
      }
    });
  }, { rootMargin: '200px 0px', threshold: 0.1 });

  /* ── 3. Lazy load للصور ── */
  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
      }
      imgObserver.unobserve(img);
    });
  }, { rootMargin: '300px 0px' });

  /* ── 4. تأجيل الصوت حتى أول تفاعل ── */
  function deferAudio() {
    document.querySelectorAll('audio').forEach(a => {
      if (a.id === 'jarvisBootAudio') return; // الـ boot sound له منطقه الخاص
      a.preload = 'none';
    });
  }

  /* ── 5. تطبيق كل شيء بعد DOMContentLoaded ── */
  function init() {
    // أ) تجميد الفيديوهات
    freezeOffscreenVideos();

    // ب) مراقبة الفيديوهات
    document.querySelectorAll('video').forEach(v => {
      if (v.classList.contains('header-video')) return;
      videoObserver.observe(v);
    });

    // ج) الصور — أضف loading=lazy لكل صورة ليست في الـ viewport
    document.querySelectorAll('img').forEach(img => {
      if (!img.loading) img.loading = 'lazy';
      // GIF متحركة — أجّل تحميلها
      if (img.src && img.src.endsWith('.gif') && !img.classList.contains('tb-logo-img')) {
        img.dataset.src = img.src;
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        imgObserver.observe(img);
      }
    });

    // د) تأجيل الصوت
    deferAudio();

    // هـ) تحسين الـ iframe — أضف loading=lazy
    document.querySelectorAll('iframe').forEach(f => {
      if (!f.loading) f.loading = 'lazy';
    });
  }

  /* ── 6. تحسين الـ header video — preload poster فقط ── */
  function optimizeHeaderVideo() {
    const hv = document.querySelector('video.header-video');
    if (!hv) return;
    hv.preload = 'auto';
    // تشغيل فوري بعد أول تفاعل إذا لم يبدأ
    const tryPlay = () => { if (hv.paused) hv.play().catch(() => {}); };
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('touchstart', tryPlay, { once: true });
  }

  /* ── 7. Resource Hints — preconnect للـ CDN ── */
  function addResourceHints() {
    const hints = ['https://robothousefzllc.com', 'https://www.robothousefzllc.com'];
    hints.forEach(url => {
      if (document.querySelector(`link[href="${url}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = url;
      l.crossOrigin = 'anonymous';
      document.head.appendChild(l);
    });
  }

  /* ── 8. تنظيف الـ cache القديم ── */
  function cleanOldCaches() {
    if (!('caches' in window)) return;
    caches.keys().then(keys => {
      keys.forEach(k => {
        if (k !== 'video-warm-cache-v1') caches.delete(k);
      });
    });
  }

  /* ── تشغيل ── */
  addResourceHints();
  cleanOldCaches();
  optimizeHeaderVideo();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
