/* ROBOT HOUSE Voice AI — v3 Full */
(function () {
  'use strict';

  var GROQ_API_KEY = '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';
  var GROQ_API_KEY_BACKUP = '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';
  var GROQ_MODEL   = 'llama-3.3-70b-versatile';
  var GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
  // Prefer local assets folder when available; other scripts may set window.RH_ASSET_DIR
  var IMG_BASE     = (window && window.RH_ASSET_DIR) ? (window.RH_ASSET_DIR + 'images/') : 'https://robothousefzllc.com/';
  var IMG_COUNT    = 140;

  var SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي صوتي فائق الذكاء اسمك ROBOT HOUSE. تمثّل شركة ROBOT HOUSE FZ LLC في رأس الخيمة، الإمارات العربية المتحدة.

=== من نحن ===
شركة ROBOT HOUSE FZ LLC شركة تقنية مبتكرة تجمع بين الذكاء الاصطناعي والهندسة المعمارية الذكية لتقديم حلول متكاملة في السكن والمواصلات والتغذية والزراعة والتعليم والتجارة. رؤيتنا: بناء مستقبل أكثر ذكاءً وراحةً واستدامة للإنسانية. رسالتنا: تحويل الأفكار الثورية إلى واقع ملموس يخدم المجتمعات حول العالم.

=== المنتجات العشرة ===
1. المجمع السكني الذكي
   - 480 شقة موزعة على 4 أبراج
   - مساحة الشقة 400م²
   - كهرباء مجانية للسكان
   - إنترنت مجاني لمدة 5 سنوات
   - نظام إدارة ذكي متكامل
2. المركبات المبتكرة
   - سيارة روبوت برمائية بسعر 50,000 دولار أمريكي
   - طائرة كهربائية شفافة بالكامل
   - قطار ذكي متطور
3. المنزل الذكي المتنقل
   - مضاد للرصاص ومقاوم للاختراق
   - مقاوم للحريق بالكامل
   - جدران ذكية تغير لونها إلكترونياً
4. المدرسة الذكية
   - مساحة 42,000م²
   - 10 طوابق
   - بيئة تعليمية تفاعلية بالكامل بتقنيات الذكاء الاصطناعي
5. المول التجاري الذكي
   - مركز تسوق متكامل بأحدث التقنيات الذكية
6. الجسر المعلق
   - يقع في الطابق 15
   - مساحة 1,200م²
   - منشأة حضرية فريدة من نوعها
7. شاحنة الشاورما الذكية
   - طول 24 قدم
   - طاقة إنتاجية 420 وجبة يومياً
   - مجهزة بأحدث معدات المطابخ الذكية
8. المزرعة الذكية
   - إنتاج 50,000 دجاجة شهرياً
   - نظام إدارة زراعي ذكي بالكامل
9. نقل المأكولات البحرية
   - خدمة لوجستية متخصصة لنقل الأسماك والمأكولات البحرية
10. مصنع التتبيلة السرية
    - منتج غذائي حصري بوصفة سرية مميزة

=== المعلومات المالية ===
العائد على الاستثمار (ROI): من 43% إلى 72%
نقطة التعادل: سنة واحدة فقط
نوع الاستثمار: متعدد القطاعات (عقارات، تقنية، غذاء، زراعة، تعليم)

=== معلومات التواصل ===
البريد الإلكتروني العام: info@robothousefzllc.com
البريد الشخصي لإدارة العلاقات: m.alammiri@robothousefzllc.com
رقم الهاتف 1: +962 7853 53408
رقم الهاتف 2: +971 567952199
الموقع الجغرافي: رأس الخيمة، الإمارات العربية المتحدة

=== تعليمات الرد ===
- اسمك هو ROBOT HOUSE وأنت المساعد الذكي للموقع الرسمي للشركة
- أجب على أي سؤال في العالم بحرية كاملة مثل ChatGPT
- أجب دائماً بنفس لغة المستخدم (عربية إذا تحدث بالعربية، إنجليزية إذا تحدث بالإنجليزية)
- كن ودياً ومفيداً ودقيقاً ومباشراً في إجاباتك
- عند الأسئلة عن الشركة أو منتجاتها استخدم المعلومات أعلاه بالضبط
- لا تتردد في الإجابة على أي موضوع سواء كان علمياً أو تقنياً أو إبداعياً أو غيره`;

  var isAwake = false;
  var isListening = false;
  var isSpeaking = false;
  var recognition = null;
  var conversationHistory = [];
  var pendingVideoChoice = false;
  var activeGroqKeyIndex = 0;
  var rhManagedWindows = {};
  var rhManagedWindowOrder = [];
  var rhPerformanceBooted = false;

  /* ---------- [ADD-ONLY] Lightweight Key Manager & telemetry (non-blocking helpers) ---------- */
  var RH_KEY_STATS = {}; // { apiKey: { failCount:0, lastFail:0, avgLatency:0 } }
  function _rhInitKeyStats() {
    try {
      var pool = getGroqKeyPool();
      pool.forEach(function(k){ if(!RH_KEY_STATS[k]) RH_KEY_STATS[k] = { failCount:0, lastFail:0, avgLatency: null }; });
    } catch(e){}
  }
  function _rhRecordKeyFailure(key, latency) {
    try {
      if(!key) return;
      var s = RH_KEY_STATS[key] || (RH_KEY_STATS[key] = { failCount:0, lastFail:0, avgLatency:null });
      s.failCount = (s.failCount || 0) + 1;
      s.lastFail = Date.now();
      if (typeof latency === 'number') {
        // EMA with alpha=0.25
        s.avgLatency = s.avgLatency ? (0.75 * s.avgLatency + 0.25 * latency) : latency;
      }
    } catch(e){}
  }
  function _rhRecordKeySuccess(key, latency) {
    try {
      if(!key) return;
      var s = RH_KEY_STATS[key] || (RH_KEY_STATS[key] = { failCount:0, lastFail:0, avgLatency:null });
      s.failCount = 0;
      if (typeof latency === 'number') {
        s.avgLatency = s.avgLatency ? (0.88 * s.avgLatency + 0.12 * latency) : latency;
      }
    } catch(e){}
  }
  function _rhSelectBestKeyOrder() {
    try {
      _rhInitKeyStats();
      var pool = getGroqKeyPool();
      // sort by failCount asc, avgLatency asc (nulls last), original order as tiebreak
      var ordered = pool.slice(0).sort(function(a,b){
        var sa = RH_KEY_STATS[a] || {}, sb = RH_KEY_STATS[b] || {};
        var fa = sa.failCount||0, fb = sb.failCount||0;
        if (fa !== fb) return fa - fb;
        var la = sa.avgLatency || 1e12, lb = sb.avgLatency || 1e12;
        if (la !== lb) return la - lb;
        return pool.indexOf(a) - pool.indexOf(b);
      });
      return ordered;
    } catch(e) { return getGroqKeyPool(); }
  }
  // ensure stats seeded on load
  try { _rhInitKeyStats(); } catch(e){}

  var VIDEO_LIST = [
    { id:'header',    ar:'فيديو الهيدر الرئيسي',      en:'Main Header Video',         url:'https://robothousefzllc.com/ROBOT%20HOUSE%20Header%20Video.mp4' },
    { id:'about',     ar:'فيديو من نحن',               en:'About Us Video',            url:'https://robothousefzllc.com/About%20Us%20Video.mp4' },
    { id:'complex',   ar:'فيديو المجمع السكني',        en:'Residential Complex Video', url:'https://robothousefzllc.com/Smart%20Residential%20Complex%20Video.mp4' },
    { id:'vehicles',  ar:'فيديو المركبات المبتكرة',    en:'Innovative Vehicles Video', url:'https://robothousefzllc.com/Innovative%20Vehicles%20Video.mp4' },
    { id:'why',       ar:'فيديو لماذا تستثمر معنا',   en:'Why Invest With Us',        url:'https://robothousefzllc.com/Why%20Invest%20With%20Us%20Video.mp4' },
    { id:'apartment', ar:'فيديو الشقة الذكية',         en:'Smart Apartment Video',     url:'https://robothousefzllc.com/Smart%20Apartment.mp4' },
    { id:'train',     ar:'فيديو القطار الذكي',         en:'Smart Train Video',         url:'https://robothousefzllc.com/Smart%20Train%20Video.mp4' },
    { id:'invest',    ar:'فيديو الاستثمار',            en:'Investment Video',          url:'https://robothousefzllc.com/Investment%20Invitation%20Video.mp4' },
    { id:'shawarma',  ar:'فيديو شاحنة الشاورما',       en:'Shawarma Truck Video',      url:'https://www.robothousefzllc.com/Shawarma%20truck%20video.mp4' },
    { id:'farm',      ar:'فيديو المزرعة',              en:'Farm Video',                url:'https://www.robothousefzllc.com/Poultry%20farm%20video.mp4' },
    { id:'fish',      ar:'فيديو نقل الاسماك',          en:'Fish Transport Video',      url:'https://www.robothousefzllc.com/Fish%20transport%20truck.mp4' },
    { id:'spices',    ar:'فيديو التوابل',              en:'Spices Video',              url:'https://robothousefzllc.com/Spices%20video.mp4' }
  ];

  function getLang() {
    try {
      /* جرب كل المفاتيح المحتملة في localStorage */
      var l = localStorage.getItem('site-lang')
           || localStorage.getItem('lang')
           || localStorage.getItem('language')
           || localStorage.getItem('rh-lang')
           || localStorage.getItem('selectedLang');
      if (l) return l.toLowerCase().substring(0,2);
    } catch(e) {}
    /* اكتشف من HTML lang attribute */
    var hl = document.documentElement.lang || document.body.lang || '';
    if (hl) return hl.toLowerCase().substring(0,2);
    /* اكتشف من dir attribute */
    if (document.documentElement.dir === 'ltr' || document.body.dir === 'ltr') return 'en';
    return 'ar';
  }
  function isAr() { return getLang() !== 'en'; }

  /* مراقبة تغيير اللغة تلقائياً */
  var _lastLang = getLang();
  setInterval(function() {
    var nl = getLang();
    if (nl !== _lastLang) {
      _lastLang = nl;
      /* أعد تعيين لغة STT */
      if (recognition && isListening) {
        try { recognition.stop(); } catch(e) {}
      }
      updateMic();
    }
  }, 800);

  function injectCSS() {
    if (document.getElementById('rh-voice-css')) return;
    var s = document.createElement('style');
    s.id = 'rh-voice-css';
    s.textContent = [
      '#rh-mic{width:38px;height:38px;border-radius:50%;border:2px solid rgba(0,200,255,0.4);background:rgba(0,10,20,0.85);color:#00c8ff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.3s;flex-shrink:0;outline:none;padding:0;box-shadow:0 0 10px rgba(0,200,255,0.2);}',
      '#rh-mic:hover{background:rgba(0,200,255,0.15);box-shadow:0 0 18px rgba(0,200,255,0.4);transform:scale(1.08);}',
      '#rh-mic.rh-listening{background:rgba(220,50,50,0.8);border-color:#ff4444;color:#fff;animation:rh-pulse 1s infinite;}',
      '#rh-mic.rh-awake{background:rgba(0,180,80,0.8);border-color:#00ff88;color:#fff;animation:rh-pulse 2s infinite;}',
      '#rh-mic.rh-busy{background:rgba(198,168,90,0.8);border-color:#C6A85A;color:#fff;}',
      '@keyframes rh-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.5);}50%{box-shadow:0 0 0 10px rgba(255,255,255,0);}}',
      '#rh-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(2,8,20,0.97);color:#e8f4ff;padding:12px 22px;border-radius:16px;font-size:14px;font-family:Cairo,sans-serif;font-weight:700;z-index:99998;pointer-events:none;opacity:0;transition:opacity 0.3s,transform 0.3s;max-width:85vw;text-align:center;border:1px solid rgba(0,200,255,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.7);}',
      '#rh-toast.rh-show{opacity:1;transform:translateX(-50%) translateY(0);}',
      '#rh-video-modal,#rh-img-modal,#rh-vlist-modal{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,0.96)!important;display:none!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;overflow:hidden!important;}',
      '#rh-video-modal.rh-open,#rh-img-modal.rh-open,#rh-vlist-modal.rh-open{display:flex!important;}',
      '#rh-modal-video{max-width:95vw;max-height:85vh;border-radius:12px;box-shadow:0 0 60px rgba(0,200,255,0.2);}',
      '#rh-modal-img{max-width:98vw;max-height:92vh;border-radius:12px;object-fit:contain;box-shadow:0 0 60px rgba(0,200,255,0.2);transition:transform .28s ease;cursor:zoom-in;transform-origin:center center;}',
      '#rh-modal-img.rh-zoomed{transform:scale(1.25);cursor:zoom-out;}',
      '.rh-mclose{position:absolute;top:16px;right:20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:20px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:100000;transition:background 0.2s;}',
      '.rh-mclose:hover{background:rgba(255,60,60,0.7);}',
      '#rh-vlist-inner{background:rgba(10,15,30,0.99);border-radius:18px;padding:28px 24px;max-width:460px;width:90vw;border:1px solid rgba(0,200,255,0.2);max-height:80vh;overflow-y:auto;}',
      '#rh-vlist-inner h3{color:#00c8ff;margin:0 0 18px;font-size:17px;text-align:center;font-family:Cairo,sans-serif;}',
      '.rh-vi{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;cursor:pointer;color:#ddd;font-size:14px;font-family:Cairo,sans-serif;transition:background 0.2s;border:1px solid transparent;}',
      '.rh-vi:hover{background:rgba(0,200,255,0.1);border-color:rgba(0,200,255,0.2);color:#fff;}',
      '.rh-vn{width:26px;height:26px;border-radius:50%;background:rgba(0,200,255,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;flex-shrink:0;color:#00c8ff;}',
      '#rh-modal-caption{color:rgba(255,255,255,0.7);font-size:13px;margin-top:10px;font-family:Cairo,sans-serif;}'
    ].join('');
    document.head.appendChild(s);
  }

  function showToast(msg, dur) {
    var cleanMsg = (typeof cleanTextForDisplay === 'function') ? cleanTextForDisplay(msg) : String(msg || '').trim();
    var t = document.getElementById('rh-toast');
    if (t) {
      t.textContent = cleanMsg;
      t.classList.add('rh-show');
      clearTimeout(t._t);
      if (dur !== 0) {
        t._t = setTimeout(function(){ t.classList.remove('rh-show'); }, Math.max(dur || 15000, 15000));
      }
    }
    try {
      if (typeof window.showAdvancedToast === 'function' && cleanMsg) {
        return window.showAdvancedToast(cleanMsg, {
          duration: dur === 0 ? 0 : Math.max(dur || 15000, 15000),
          showCloseButton: true,
          isRTL: detectLang(cleanMsg) === 'ar',
          type: /خطأ|error|blocked|محجوب|critical|⚠️/i.test(cleanMsg) ? 'critical' : 'info'
        });
      }
    } catch (e) {}
    return null;
  }

  function speak(text, cb) {
    if (!window.speechSynthesis) { if (cb) cb(); return; }
    window.speechSynthesis.cancel();
    isSpeaking = true;

    var clean = text.replace(/<[^>]+>/g,'').replace(/\[CMD:[^\]]+\]/g,'').trim().substring(0, 400);
    if (!clean) { isSpeaking=false; if(cb)cb(); if(isAwake&&!isListening) setTimeout(startListen,400); return; }

    /* Chrome TTS bug fix: قسّم النص ودوّر watchdog */
    var chunks = splitText(clean, 120);
    var idx = 0;
    var watchdog = null;

    function sayNext() {
      clearInterval(watchdog);
      if (idx >= chunks.length) {
        isSpeaking = false;
        if (cb) cb();
        if (isAwake && !isListening) setTimeout(startListen, 500);
        return;
      }
      var chunk = chunks[idx++];
      var u = new SpeechSynthesisUtterance(chunk);
      u.lang   = (getLang() === 'en') ? 'en-US' : 'ar-SA';
      u.rate   = 1.05;
      u.pitch  = 1.0;
      u.volume = 1.0;
      u.onend   = function() { clearInterval(watchdog); sayNext(); };
      u.onerror = function(e) {
        clearInterval(watchdog);
        /* تجاهل خطأ interrupted — يحدث عند cancel() */
        if (e.error !== 'interrupted') {
          isSpeaking = false;
          if (cb) cb();
          if (isAwake && !isListening) setTimeout(startListen, 500);
        }
      };
      window.speechSynthesis.speak(u);

      /* Chrome Watchdog: إذا توقف TTS أعده */
      watchdog = setInterval(function() {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        /* إذا لم يبدأ بعد 3 ثوان — أعد المحاولة */
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          clearInterval(watchdog);
          sayNext();
        }
      }, 200);
    }

    sayNext();
  }

  function splitText(text, maxLen) {
    if (text.length <= maxLen) return [text];
    var chunks = [];
    /* قسّم على الجمل أولاً */
    var sentences = text.split(/[.،؟!]/);
    var current = '';
    sentences.forEach(function(s) {
      s = s.trim();
      if (!s) return;
      if ((current + s).length < maxLen) {
        current += (current ? '، ' : '') + s;
      } else {
        if (current) chunks.push(current);
        current = s;
      }
    });
    if (current) chunks.push(current);
    return chunks.length ? chunks : [text.substring(0, maxLen)];
  }

  function buildDOM() {
    // single toast element (keeps existing behaviour)
    if (!document.getElementById('rh-toast')) {
      var toast = document.createElement('div'); toast.id='rh-toast'; document.body.appendChild(toast);
    }

    // Single unified dialogue modal to display any conversational content (images, video links, lists, plain text)
    if (!document.getElementById('rh-dialog-modal')) {
      var dlg = document.createElement('div');
      dlg.id = 'rh-dialog-modal';
      dlg.className = 'rh-dialog-modal';
      dlg.innerHTML = ''
        + '<div class="rh-dialog-inner" role="dialog" aria-modal="true" aria-label="ROBOT HOUSE dialog">'
        +   '<button class="rh-mclose" id="rh-dialog-close" aria-label="Close">&times;</button>'
        +   '<div id="rh-dialog-content" style="max-height:78vh; overflow:auto; padding:12px 14px; color:#e8f4ff; font-family:Cairo, sans-serif;"></div>'
        + '</div>';
      document.body.appendChild(dlg);

      // styles for the dialog (minimal, non-intrusive)
      var style = document.createElement('style');
      style.id = 'rh-dialog-styles';
      style.textContent = [
        '.rh-dialog-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.78);z-index:2147483646;}',
        '.rh-dialog-modal.rh-open{display:flex;}',
        '.rh-dialog-inner{width:min(920px,94vw);border-radius:12px;background:linear-gradient(180deg,rgba(6,10,18,0.98),rgba(10,18,30,0.98));border:1px solid rgba(0,200,255,0.12);box-shadow:0 30px 80px rgba(0,0,0,0.8);overflow:hidden;position:relative;}',
        '.rh-dialog-inner .rh-mclose{position:absolute;top:10px;right:12px;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#cfe7ff;width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:20px;}',
        '#rh-dialog-content img{max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0;}',
        '#rh-dialog-content video{max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0;}',
        '#rh-dialog-content .rh-list {display:flex;flex-direction:column;gap:8px;}',
        '#rh-dialog-content .rh-list button{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:#e8f4ff;padding:8px 10px;border-radius:8px;text-align:left;cursor:pointer;}'
      ].join('\n');
      document.head.appendChild(style);

      document.getElementById('rh-dialog-close').onclick = closeAll;
      // close by clicking outside inner dialog
      dlg.addEventListener('click', function (e) { if (e.target === dlg) closeAll(); });
      // ESC closes
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    }
  }

  function closeAll() {
    var dlg = document.getElementById('rh-dialog-modal');
    if (dlg) dlg.classList.remove('rh-open');
    // stop any media inside dialog
    var v = document.getElementById('rh-dialog-content')?.querySelector('video');
    if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
    var img = document.getElementById('rh-dialog-content')?.querySelector('img');
    if (img) { try { img.remove(); } catch (e) {} }
    pendingVideoChoice = false;
    speak(isAr() ? 'تم الإغلاق' : 'Closed');
  }

  function openImg(num) {
    buildDOM();
    var dlg = document.getElementById('rh-dialog-modal');
    var content = document.getElementById('rh-dialog-content');
    if (!dlg || !content) return;
    content.innerHTML = '<div style="text-align:center;"><img src="'+(IMG_BASE+num+'.jpg')+'" alt="'+(isAr()?'صورة رقم ':'Image #')+num+'"></div>'
      + '<div style="margin-top:8px;color:#cfeff4;">'+(isAr()?'صورة رقم ':'Image #')+num+' / '+IMG_COUNT+'</div>';
    dlg.classList.add('rh-open');
    speak(isAr() ? 'يتم عرض الصورة رقم ' + num : 'Showing image number ' + num);
  }

  function openVideo(url, title) {
    buildDOM();
    var dlg = document.getElementById('rh-dialog-modal');
    var content = document.getElementById('rh-dialog-content');
    if (!dlg || !content) return;
    // Present a lightweight video element inside the single dialog
    content.innerHTML = '<div style="text-align:center;"><video controls playsinline preload="metadata" style="max-width:100%;height:auto;border-radius:8px;"><source src="'+url+'" type="video/mp4">Your browser does not support video playback.</video></div>'
      + '<div style="margin-top:8px;color:#cfeff4;">' + (title || '') + '</div>';
    dlg.classList.add('rh-open');
    var v = content.querySelector('video');
    try { v.play().catch(()=>{}); } catch(e){}
    speak(isAr() ? ('يتم تشغيل ' + (title || 'الفيديو')) : ('Playing ' + (title || 'video')));
  }

  function showVideoList() {
    buildDOM();
    var dlg = document.getElementById('rh-dialog-modal');
    var content = document.getElementById('rh-dialog-content');
    if (!dlg || !content) return;
    var html = '<h3 style="margin:0 0 10px;color:#00c8ff;">' + (isAr() ? 'قائمة الفيديوهات' : 'Video list') + '</h3>';
    html += '<div class="rh-list">';
    VIDEO_LIST.forEach(function(v, i) {
      html += '<button data-vid="'+i+'"><strong>' + (i+1) + '.</strong> ' + (isAr() ? v.ar : v.en) + '</button>';
    });
    html += '</div>';
    content.innerHTML = html;
    // bind buttons
    content.querySelectorAll('.rh-list button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(this.getAttribute('data-vid'));
        if (!isNaN(idx)) {
          closeAll();
          setTimeout(function(){ openVideo(VIDEO_LIST[idx].url, isAr()?VIDEO_LIST[idx].ar:VIDEO_LIST[idx].en); }, 260);
        }
      });
    });
    dlg.classList.add('rh-open');
    pendingVideoChoice = true;
    var names = VIDEO_LIST.map(function(v,i){ return (i+1)+'. '+(isAr()?v.ar:v.en); }).join(isAr()?' ، ':' , ');
    speak((isAr()?'الفيديوهات المتاحة: ':'Available videos: ')+names+(isAr()? ' . قل رقم الفيديو او اسمه' : '. Say the video number or name.'));
  }

  var NAV_MAP = {
    'الرئيسية|البداية|home':'home',
    'من نحن|عن الشركة|about':'about',
    'المنتجات|منتجاتنا|products':'products',
    'التقنيات|التكنولوجيا|technology':'technology',
    'السوق|التوقعات|market':'market',
    'المالية|الجوانب المالية|financials':'financials',
    'الاستثمار|المستثمرين|investors':'investors',
    'الصور|البوم الصور|photo-album|album':'photo-album',
    'آراء العملاء|التقييمات|testimonials':'testimonials',
    'الاسئلة|الاسئلة الشائعة|faq':'faq',
    'تواصل|اتصل بنا|contact':'contact'
  };

  var THEME_MAP = {
    'ذهبي|ذهب|الذهبي|ملكي|gold':'gold-diamond',
    'اسود|داكن|الاسود|dark':'dark',
    'ابيض|فاتح|الابيض|white':'white',
    'زجاجي|الزجاجي|glass':'white-natural'
  };

  function unlockDocs() {
    var investEl = document.getElementById('investors');
    if (investEl) investEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(function() {
      var boxEl = document.getElementById('passwordBox');
      if (!boxEl) {
        speak(isAr() ? 'قسم دراسات الجدوى غير متاح حالياً' : 'Feasibility section not available');
        return;
      }
      var docPass = document.getElementById('docPassword');
      if (!docPass) {
        speak(isAr() ? 'حقل كلمة المرور غير موجود' : 'Password field not found');
        return;
      }
      var unlockBtn = document.getElementById('unlockBtn');
      if (!unlockBtn) {
        speak(isAr() ? 'زر الفتح غير موجود' : 'Unlock button not found');
        return;
      }
      docPass.value = '123ALAMMIRI';
      docPass.dispatchEvent(new Event('input', { bubbles: true }));
      unlockBtn.click();

      speak(isAr()
        ? 'تم فتح الملفات. أي ملف تريد أن أحمّله لك؟ تحميل دراسة الجدوى 1، تحميل دراسة الجدوى 2، أو تحميل الترخيص.'
        : 'Files unlocked. Which file would you like? Feasibility Study 1, Feasibility Study 2, or the License.');

      if (window._rhDocsTimer) clearTimeout(window._rhDocsTimer);
      window._rhDocsTimer = setTimeout(function() {
        speak(isAr() ? 'انتهت مهلة الوصول للملفات.' : 'File access window has expired.');
      }, 30000);
    }, 600);
  }

  function unlockProtected(type) {
    if (typeof window.rhOpenProtected !== 'function') {
      speak(isAr() ? 'خاصية فتح المحتوى المحمي غير متاحة حالياً' : 'Protected content feature is not available');
      return;
    }
    speak(isAr()
      ? (type === 'ft' ? 'جاري فتح صفحة الفود تراك' : 'جاري فتح صفحة الشاورما')
      : (type === 'ft' ? 'Opening Food Truck page' : 'Opening Shawarma page'));

    window.rhOpenProtected(type);

    setTimeout(function() {
      var passInput = document.getElementById('rhPassInput');
      if (passInput) {
        passInput.value = '123ALAMMIRI';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (typeof window.rhSubmitPass === 'function') {
        window.rhSubmitPass();
      }
    }, 300);
  }


  function getGroqKeyPool() {
    return [GROQ_API_KEY, GROQ_API_KEY_BACKUP].filter(Boolean);
  }

  function buildGroqHeaders(apiKey) {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
  }

  function isGroqRetryable(status, data) {
    if (status === 401 || status === 403 || status === 408 || status === 429) return true;
    if (status >= 500) return true;
    var msg = '';
    try {
      msg = ((data && data.error && (data.error.message || data.error.code)) || '').toString().toLowerCase();
    } catch (e) {}
    return /rate|quota|limit|timeout|unavailable|temporarily|overloaded|invalid api key|authentication/i.test(msg);
  }

  function fetchGroqWithFallback(payload) {
    var keyPool = getGroqKeyPool();
    if (!keyPool.length) return Promise.reject(new Error('No Groq API keys configured'));

    var order = [];
    for (var i = 0; i < keyPool.length; i++) {
      order.push((activeGroqKeyIndex + i) % keyPool.length);
    }

    function tryAt(pos, lastError) {
      if (pos >= order.length) return Promise.reject(lastError || new Error('All Groq keys failed'));
      var keyIndex = order[pos];
      var key = keyPool[keyIndex];
      return fetch(GROQ_URL, {
        method: 'POST',
        headers: buildGroqHeaders(key),
        body: JSON.stringify(payload)
      }).then(function(r) {
        return r.text().then(function(raw) {
          var data = null;
          try { data = raw ? JSON.parse(raw) : {}; } catch (e) { data = { raw: raw }; }
          if (!r.ok || (data && data.error)) {
            var err = new Error((data && data.error && (data.error.message || data.error.code)) || ('Groq HTTP ' + r.status));
            err.status = r.status;
            err.data = data;
            err.keyIndex = keyIndex;
            if (isGroqRetryable(r.status, data)) {
              return tryAt(pos + 1, err);
            }
            throw err;
          }
          activeGroqKeyIndex = keyIndex;
          return data;
        });
      }).catch(function(err) {
        if (pos + 1 < order.length) return tryAt(pos + 1, err);
        throw err;
      });
    }

    return tryAt(0);
  }

  function askGroq(text) {
    conversationHistory.push({ role: 'user', content: text });
    if (conversationHistory.length > 16) conversationHistory = conversationHistory.slice(-16);
    var msgs = [{ role: 'system', content: SYSTEM_PROMPT }].concat(conversationHistory);
    showToast(isAr() ? '💭 جاري التفكير...' : '💭 Thinking...', 0);

    return fetchGroqWithFallback({ model: GROQ_MODEL, messages: msgs, max_tokens: 350, temperature: 0.75 })
      .then(function(data) {
        var reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
          ? data.choices[0].message.content.trim()
          : (isAr() ? 'عذراً، لم أفهم' : 'Sorry, I did not understand');
        conversationHistory.push({ role: 'assistant', content: reply });
        if (conversationHistory.length > 16) conversationHistory = conversationHistory.slice(-16);
        showToast(reply, 18000);
        speak(reply);
        return reply;
      })
      .catch(function(err) {
        console.error('[RH Voice] Groq fallback error:', err);
        var msg = isAr() ? 'خطأ في الاتصال، حاول مرة أخرى' : 'Connection error, please try again';
        showToast(msg, 18000);
        speak(msg);
        throw err;
      });
  }

  function normalizeManagedWindowKey(key) {
    return String(key || 'window').toLowerCase().replace(/[^a-z0-9\-]+/g, '-');
  }

  function rememberManagedWindow(key, winRef) {
    key = normalizeManagedWindowKey(key);
    if (!winRef) return null;
    rhManagedWindows[key] = winRef;
    if (rhManagedWindowOrder.indexOf(key) === -1) rhManagedWindowOrder.push(key);
    return winRef;
  }

  function openManagedWindow(url, key, title) {
    if (!url) return null;
    key = normalizeManagedWindowKey(key || title || 'window');

    // Close any other managed windows so only one is open at a time
    try {
      Object.keys(rhManagedWindows).forEach(function(k) {
        if (k !== key) {
          try {
            var w = rhManagedWindows[k];
            if (w && !w.closed) w.close();
          } catch (ee) {}
          try { delete rhManagedWindows[k]; } catch (ee) {}
        }
      });
      rhManagedWindowOrder = rhManagedWindowOrder.filter(function(k){ return k === key; });
    } catch (e) {}

    // If a window with the same key exists, close it first (ensure a fresh open)
    try {
      if (rhManagedWindows[key] && !rhManagedWindows[key].closed) {
        try { rhManagedWindows[key].close(); } catch (e) {}
        delete rhManagedWindows[key];
      }
    } catch (e) {}

    var winRef = null;
    try {
      winRef = window.open(url, 'rh_single_window', 'noopener,noreferrer'); // single target name to reuse same tab/window
      if (winRef) {
        // store under normalized key but reuse same window target so subsequent opens reuse the same window
        rememberManagedWindow(key, winRef);
        try { winRef.document.title = title || key; } catch (e) {}
      }
    } catch (e) {}
    return winRef;
  }

  function closeManagedWindow(key) {
    key = normalizeManagedWindowKey(key);
    var winRef = rhManagedWindows[key];
    if (winRef) {
      try { if (!winRef.closed) winRef.close(); } catch (e) {}
      delete rhManagedWindows[key];
    }
  }

  function closeManagedWindows() {
    var count = 0;
    Object.keys(rhManagedWindows).forEach(function(key) {
      var winRef = rhManagedWindows[key];
      if (winRef) {
        try { if (!winRef.closed) { winRef.close(); count++; } } catch (e) {}
      }
      delete rhManagedWindows[key];
    });
    rhManagedWindowOrder = [];
    return count;
  }

  function getElementOpenUrl(el) {
    if (!el) return '';
    var raw = el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-url') || el.dataset && (el.dataset.href || el.dataset.url) || '';
    if (!raw && el.querySelector) {
      var child = el.querySelector('a[href], [data-href], [data-url]');
      if (child) raw = child.getAttribute('href') || child.getAttribute('data-href') || child.getAttribute('data-url') || '';
    }
    if (!raw || raw === '#') return '';
    try { return new URL(raw, window.location.href).href; } catch (e) { return raw; }
  }

  function openProtectedFileWindow(elementId, key, arLabel, enLabel) {
    var el = document.getElementById(elementId);
    if (!el) {
      speak(isAr() ? 'الملف غير متاح حالياً' : 'File not available right now');
      return false;
    }
    var url = getElementOpenUrl(el);
    if (url) {
      var winRef = openManagedWindow(url, key, isAr() ? arLabel : enLabel);
      if (winRef) {
        speak(isAr() ? ('تم فتح ' + arLabel + ' في نافذة جديدة') : ('Opened ' + enLabel + ' in a new window'));
        return true;
      }
    }
    try { el.click(); } catch (e) {}
    speak(isAr() ? ('تم فتح ' + arLabel) : ('Opened ' + enLabel));
    return true;
  }

  function optimizeV4Performance() {
    if (rhPerformanceBooted) return;
    rhPerformanceBooted = true;

    function addHint(rel, href, crossOrigin) {
      if (!href) return;
      var id = 'rh-hint-' + rel + '-' + href.replace(/[^a-z0-9]/gi, '-');
      if (document.getElementById(id)) return;
      var link = document.createElement('link');
      link.id = id;
      link.rel = rel;
      link.href = href;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    addHint('dns-prefetch', 'https://api.groq.com');
    addHint('preconnect', 'https://api.groq.com', true);
    addHint('dns-prefetch', 'https://robothousefzllc.com');
    addHint('preconnect', 'https://robothousefzllc.com', true);
    addHint('dns-prefetch', 'https://www.robothousefzllc.com');
    addHint('preconnect', 'https://www.robothousefzllc.com', true);

    var idle = window.requestIdleCallback || function(cb){ return setTimeout(cb, 500); };
    idle(function() {
      try {
        [1,2,3,4,5,6].forEach(function(n) {
          var img = new Image();
          img.decoding = 'async';
          img.loading = 'eager';
          img.src = IMG_BASE + n + '.jpg';
        });
      } catch (e) {}
      try {
        VIDEO_LIST.slice(0, 4).forEach(function(v){
          var link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'video';
          link.href = v.url;
          document.head.appendChild(link);
        });
      } catch (e) {}
    });
  }

  function processCommand(text) {
    var t = text.trim();
    var tl = t.toLowerCase();

    /* ── دائماً: كلمة الاستيقاظ (حتى وهو نائم) ── */
    if (/روبوت\s*استيقظ|robot\s*wake\s*up|wake\s*up\s*robot|hey\s*robot/i.test(t)) {
      isAwake = true; updateMic();
      speak(isAr() ? 'أنا هنا، كيف يمكنني مساعدتك؟' : 'I am here, how can I help you?');
      return;
    }

    /* ── إذا نائم: تجاهل كل شيء ── */
    if (!isAwake) return;

    /* ── توقف / نوم ── */
    if (/^(توقف|stop|نم|sleep|اوقف|سكوت)$/i.test(tl)) {
      isAwake = false; stopListen(); updateMic();
      speak(isAr() ? 'إلى اللقاء!' : 'Goodbye!'); return;
    }

    /* ── إغلاق ── */
    if (/اغلق.*(كل\s*)?(النوافذ|windows|window)|close\s*(all\s*)?windows?/i.test(tl)) {
      var closedCount = closeManagedWindows();
      speak(isAr() ? ('تم إغلاق ' + closedCount + ' نافذة خارجية') : ('Closed ' + closedCount + ' external windows'));
      return;
    }
    if (/اغلق.*(الترخيص|license)|close\s*license/i.test(tl)) {
      closeManagedWindow('license');
      speak(isAr() ? 'تم إغلاق نافذة الترخيص' : 'License window closed');
      return;
    }
    if (/اغلق.*(دراسة\s*(الجدوى)?\s*1|ملف\s*1|file\s*1|feasibility\s*1)/i.test(tl)) {
      closeManagedWindow('feasibility-1');
      speak(isAr() ? 'تم إغلاق نافذة دراسة الجدوى 1' : 'Feasibility Study 1 window closed');
      return;
    }
    if (/اغلق.*(دراسة\s*(الجدوى)?\s*2|ملف\s*2|file\s*2|feasibility\s*2)/i.test(tl)) {
      closeManagedWindow('feasibility-2');
      speak(isAr() ? 'تم إغلاق نافذة دراسة الجدوى 2' : 'Feasibility Study 2 window closed');
      return;
    }
    if (/^(اغلق|اغلق|اقفل|close|exit|اخرج)$/i.test(tl) || /اغلق الصورة|اغلق الفيديو|close (image|video|modal)/i.test(tl)) {
      closeAll(); return;
    }

    /* ── صورة رقم N ── (محسّن لجميع الصياغات) */
    var imgM =
      tl.match(/(?:اعرض|عرض|افتح|show|open|display)\s*(?:الصورة|صورة|image|photo|pic(?:ture)?)\s*(?:رقم|number|num|#|no\.?)?\s*(\d+)/i) ||
      tl.match(/(?:صورة|image|photo)\s*(?:رقم|number|#|no\.?)?\s*(\d+)/i) ||
      tl.match(/(?:number|رقم|#)\s*(\d+)\s*(?:صورة|image|photo)/i) ||
      tl.match(/\b(\d+)\b/) && /صورة|image|photo/i.test(tl) ? tl.match(/\b(\d+)\b/) : null;

    if (imgM && /صورة|image|photo|pic/i.test(tl)) {
      var n = parseInt(imgM[1]);
      if (n >= 1 && n <= IMG_COUNT) {
        openImg(n);
      } else {
        speak(isAr() ? 'الرقم يجب أن يكون بين 1 و 140' : 'Number must be between 1 and 140');
      }
      return;
    }

    /* ── قائمة الفيديوهات ── */
    if (/اعرض\s*(الفيديوهات|الفيديو|فيديو)|show\s*videos?|video\s*list|قائمة\s*الفيديو/i.test(tl)) {
      showVideoList(); return;
    }

    /* ── اختيار فيديو برقم أو اسم (بعد showVideoList) ── */
    if (pendingVideoChoice) {
      var nm = tl.match(/\b(\d+)\b/);
      if (nm) {
        var idx = parseInt(nm[1]) - 1;
        if (idx >= 0 && idx < VIDEO_LIST.length) {
          pendingVideoChoice = false; closeAll();
          setTimeout(function() { openVideo(VIDEO_LIST[idx].url, isAr() ? VIDEO_LIST[idx].ar : VIDEO_LIST[idx].en); }, 300);
          return;
        }
      }
      for (var vi = 0; vi < VIDEO_LIST.length; vi++) {
        var vv = VIDEO_LIST[vi];
        if (tl.indexOf(vv.id) !== -1 || t.indexOf(vv.ar) !== -1 || tl.indexOf(vv.en.toLowerCase()) !== -1) {
          pendingVideoChoice = false; closeAll();
          (function(v){ setTimeout(function(){ openVideo(v.url, isAr()?v.ar:v.en); }, 300); })(vv);
          return;
        }
      }
    }

    /* ── دراسات الجدوى ── */
    if (/دراسات?\s*الجدوى|feasibility|الملفات\s*المحمية|فتح\s*الملفات|unlock\s*files/i.test(tl)) {
      unlockDocs(); return;
    }

    /* ── تحميل ملف محدد ── */
    if (/دراسة\s*(الجدوى)?\s*1|ملف\s*1|file\s*1|feasibility\s*1/i.test(tl)) {
      var f1 = document.getElementById('file1');
      if (f1) { openProtectedFileWindow('file1', 'feasibility-1', 'دراسة الجدوى 1', 'Feasibility Study 1'); }
      else speak(isAr() ? 'الملف غير متاح حالياً، افتح دراسات الجدوى أولاً' : 'File not available yet, unlock feasibility first');
      return;
    }
    if (/دراسة\s*(الجدوى)?\s*2|ملف\s*2|file\s*2|feasibility\s*2/i.test(tl)) {
      var f2 = document.getElementById('file2');
      if (f2) { openProtectedFileWindow('file2', 'feasibility-2', 'دراسة الجدوى 2', 'Feasibility Study 2'); }
      else speak(isAr() ? 'الملف غير متاح حالياً، افتح دراسات الجدوى أولاً' : 'File not available yet, unlock feasibility first');
      return;
    }
    if (/ترخيص|ملف\s*3|file\s*3|license/i.test(tl)) {
      var f3 = document.getElementById('file3');
      if (f3) { openProtectedFileWindow('file3', 'license', 'الترخيص', 'License'); }
      else speak(isAr() ? 'الملف غير متاح حالياً' : 'File not available yet');
      return;
    }

    /* ── Food Truck & Shawarma ── */
    if (/فود\s*تراك|food\s*truck|فودتراك/i.test(tl)) { unlockProtected('ft'); return; }
    if (/شاورما|shawarma|شاحنة\s*الشاورما/i.test(tl)) { unlockProtected('sw'); return; }

    /* ── تنقل ── */
    for (var nk in NAV_MAP) {
      if (new RegExp(nk, 'i').test(t)) {
        var sid = NAV_MAP[nk];
        var el = document.getElementById(sid);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          speak(isAr() ? 'تم الانتقال إلى ' + sid : 'Navigated to ' + sid);
        } else {
          speak(isAr() ? 'القسم غير موجود' : 'Section not found');
        }
        return;
      }
    }

    /* ── ثيم ── */
    for (var tk in THEME_MAP) {
      if (new RegExp(tk, 'i').test(t)) {
        var thk = THEME_MAP[tk];
        if (window.applyTheme) {
          window.applyTheme(thk);
          speak(isAr() ? 'تم تغيير الثيم' : 'Theme changed');
        } else {
          speak(isAr() ? 'خاصية تغيير الثيم غير متاحة' : 'Theme switching not available');
        }
        return;
      }
    }

    /* ── Groq API — أي سؤال آخر ── */
    askGroq(t);
  }

  function initSTT() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast(isAr() ? '⚠️ المتصفح لا يدعم الصوت' : '⚠️ Browser does not support voice');
      return null;
    }
    var r = new SR();
    r.continuous    = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = function() {
      isListening = true;
      updateMic();
      if (isAwake) showToast(isAr() ? '🎙 أستمع...' : '🎙 Listening...', 0);
    };

    r.onend = function() {
      isListening = false;
      updateMic();
      /* إعادة الاستماع تلقائياً في وضع اليقظة */
      if (isAwake && !isSpeaking) {
        setTimeout(startListen, 700);
      }
      /* إذا نائم: استمر في الاستماع للـ wake word فقط في الخلفية */
      if (!isAwake) {
        setTimeout(function() {
          if (!isAwake && !isListening) startListen();
        }, 2000);
      }
    };

    r.onerror = function(e) {
      isListening = false;
      updateMic();
      if (e.error === 'not-allowed') {
        showToast(isAr() ? '❌ الميكروفون محجوب — أذن للموقع باستخدامه' : '❌ Mic blocked — allow access in browser settings');
        return;
      }
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        showToast(isAr() ? 'خطأ في الميكروفون: ' + e.error : 'Mic error: ' + e.error);
      }
      /* أعد المحاولة */
      var delay = (e.error === 'no-speech') ? 200 : 2000;
      setTimeout(function() {
        if (!isListening) startListen();
      }, delay);
    };

    r.onresult = function(e) {
      var tr = e.results[0][0].transcript;
      if (isAwake) showToast((isAr() ? '🗣 قلت: ' : '🗣 You said: ') + tr);
      processCommand(tr);
    };

    return r;
  }

  function startListen() {
    if(isListening||isSpeaking) return;
    if(!recognition) recognition=initSTT();
    if(!recognition) return;
    try{ recognition.lang=isAr()?'ar-SA':'en-US'; recognition.start(); }catch(e){}
  }

  function stopListen() {
    try{ if(recognition&&isListening) recognition.stop(); }catch(e){}
    isListening=false; updateMic();
  }

  function toggleMic() {
    if(isAwake){ isAwake=false; stopListen(); speak(isAr()?'الى اللقاء!':'Goodbye!'); updateMic(); }
    else if(isListening){ stopListen(); }
    else{ startListen(); }
  }

  function updateMic() {
    var btn=document.getElementById('rh-mic'); if(!btn) return;
    btn.classList.remove('rh-listening','rh-awake','rh-busy');
    if(isAwake){ btn.classList.add('rh-awake'); btn.title=isAr()?'مستيقظ - انقر للايقاف':'Awake - click to stop'; }
    else if(isListening){ btn.classList.add('rh-listening'); btn.title=isAr()?'يستمع...':'Listening...'; }
    else{ btn.title=isAr()?'انقر للتحدث':'Click to speak'; }
  }

  function createMicBtn() {
    if(document.getElementById('rh-mic')) return;
    var btn=document.createElement('button');
    btn.id='rh-mic'; btn.type='button';
    btn.setAttribute('aria-label',isAr()?'التحكم الصوتي':'Voice Control');
    btn.innerHTML='<i class="fas fa-microphone"></i>';
    btn.onclick=toggleMic;

    var themeBtn=document.getElementById('theme-switcher');
    var langBtn=document.getElementById('site-lang-toggle');
    if(themeBtn&&themeBtn.parentElement){
      var p=themeBtn.parentElement;
      if(langBtn&&langBtn.parentElement===p) p.insertBefore(langBtn,themeBtn);
      p.insertBefore(btn,themeBtn);
    } else {
      btn.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;';
      document.body.appendChild(btn);
    }
    updateMic();
  }

  function init() {
    injectCSS();
    buildDOM();
    createMicBtn();
    recognition = initSTT();
    try { optimizeV4Performance(); } catch (e) {}

    /* ابدأ الاستماع للـ wake word فوراً (بعد تأخير قصير للتأكد من الـ DOM) */
    setTimeout(function() {
      if (!isListening) startListen();
    }, 1500);

    /* Alt+M لتبديل الميكروفون */
    document.addEventListener('keydown', function(e) {
      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'م')) {
        e.preventDefault();
        toggleMic();
      }
    });

    console.log('[ROBOT HOUSE Voice] ✅ Ready. قل: "روبوت استيقظ" أو "robot wake up"');
  }

  // Defer heavy initialization to avoid freezing the page:
  // - wait for DOMContentLoaded (if needed) then schedule init via requestIdleCallback or a short timeout
  (function deferredInit() {
    function schedule() {
      try {
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(function() {
            try { init(); } catch (e) { console.warn('[RH Voice] init failed', e); }
          }, { timeout: 1200 });
        } else {
          setTimeout(function() {
            try { init(); } catch (e) { console.warn('[RH Voice] init failed', e); }
          }, 900);
        }
      } catch (e) {
        try { init(); } catch (err) { console.warn('[RH Voice] init failed', err); }
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        // further delay heavy pieces to let the main thread finish layout and paint
        setTimeout(schedule, 2000);
      }, { once: true });
    } else {
      // Already loaded; schedule slightly delayed
      setTimeout(schedule, 500);
    }
  })();

  /* =========================================================================
   * ═══════════════════════════════════════════════════════════════════════
   *  V3.0 ENHANCEMENT BLOCK — ADD-ONLY (لا يُحذف أي كود موجود)
   *  Bilingual Core + Typewriter + Persistent Toast + WhatsApp + Meta Layer
   * ═══════════════════════════════════════════════════════════════════════
   * ========================================================================= */

  /* ---------- [V3.1] دفاعي: alias لإصلاح أي استدعاء لـ startListening ---------- */
  try {
    if (typeof window !== 'undefined') {
      window.startListening = function () {
        try { return startListen.apply(null, arguments); } catch (e) { console.warn('[RH v3] startListen unavailable', e); }
      };
      window.startListen = window.startListen || function () { try { return startListen.apply(null, arguments); } catch(e){} };
    }
  } catch (e) {}

  /* ---------- [V3.2] تنظيف النصوص قبل العرض ---------- */
  function cleanTextForDisplay(rawText) {
    if (!rawText) return '';
    return String(rawText)
      .replace(/["'`\u201C\u201D\u2018\u2019\u00AB\u00BB]/g, '')   /* جميع أنواع علامات التنصيص */
      .replace(/```[a-zA-Z]*\n?/g, '')                               /* code fences */
      .replace(/```/g, '')
      .replace(/\*\*/g, '')                                          /* bold markdown */
      .replace(/__+/g, '')
      .replace(/\s+/g, ' ')                                          /* تنظيف المسافات المتعددة */
      .trim();
  }

  /* ---------- [V3.3] كشف لغة النص تلقائياً (AR / EN / Mixed) ---------- */
  function detectLang(text) {
    if (!text) return getLang();
    var arChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    var enChars = (text.match(/[A-Za-z]/g) || []).length;
    if (arChars === 0 && enChars === 0) return getLang();
    /* إذا كانت النسبة العربية ≥ 30% من مجموع الأحرف الدالة -> عربي */
    return (arChars / (arChars + enChars) >= 0.3) ? 'ar' : 'en';
  }

  /* ---------- [V3.4] CSS للمكونات الجديدة (Toast متقدم + Typewriter) ---------- */
  function injectV3CSS() {
    if (document.getElementById('rh-voice-v3-css')) return;
    var s = document.createElement('style');
    s.id = 'rh-voice-v3-css';
    s.textContent = [
      /* --- Persistent Advanced Toast --- */
      '#rh-v3-toast-layer{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none;max-width:92vw;}',
      '.rh-v3-toast{position:relative;background:linear-gradient(135deg,rgba(2,8,20,0.98),rgba(6,18,34,0.98));color:#e8f4ff;padding:14px 44px 14px 22px;border-radius:14px;font-family:Cairo,"Segoe UI",sans-serif;font-size:14.5px;font-weight:600;border:1px solid rgba(0,200,255,0.28);box-shadow:0 12px 40px rgba(0,0,0,0.7),0 0 22px rgba(0,200,255,0.18);pointer-events:auto;min-width:240px;max-width:560px;line-height:1.7;opacity:0;transform:translateY(14px) scale(0.96);transition:opacity 420ms cubic-bezier(.25,.8,.25,1),transform 420ms cubic-bezier(.25,.8,.25,1);display:flex;align-items:center;gap:10px;}',
      '.rh-v3-toast.rh-v3-show{opacity:1;transform:translateY(0) scale(1);}',
      '.rh-v3-toast.rh-v3-rtl{direction:rtl;text-align:right;padding:14px 22px 14px 44px;}',
      '.rh-v3-toast.rh-v3-ltr{direction:ltr;text-align:left;}',
      '.rh-v3-toast.rh-v3-critical{border-color:rgba(255,120,120,0.6);box-shadow:0 12px 40px rgba(0,0,0,0.75),0 0 26px rgba(255,80,80,0.35);}',
      '.rh-v3-toast.rh-v3-success{border-color:rgba(120,255,170,0.55);box-shadow:0 12px 40px rgba(0,0,0,0.7),0 0 22px rgba(80,255,170,0.28);}',
      '.rh-v3-toast-icon{font-size:18px;flex-shrink:0;filter:drop-shadow(0 0 6px currentColor);}',
      '.rh-v3-toast-msg{flex:1 1 auto;word-wrap:break-word;overflow-wrap:anywhere;}',
      '.rh-v3-toast-close{position:absolute;top:6px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#cfe7ff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;padding:0;line-height:1;}',
      '.rh-v3-toast.rh-v3-ltr .rh-v3-toast-close{right:8px;}',
      '.rh-v3-toast.rh-v3-rtl .rh-v3-toast-close{left:8px;}',
      '.rh-v3-toast-close:hover{background:rgba(255,80,80,0.85);border-color:rgba(255,80,80,1);color:#fff;transform:scale(1.1);}',
      '.rh-v3-toast-bar{position:absolute;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#00c8ff,#C6A85A);border-radius:0 0 14px 14px;width:100%;transform-origin:left;animation:rh-v3-bar linear forwards;}',
      '.rh-v3-toast.rh-v3-rtl .rh-v3-toast-bar{transform-origin:right;}',
      '@keyframes rh-v3-bar{from{width:100%;}to{width:0%;}}',
      '.rh-v3-toast.rh-v3-fadeout{opacity:0;transform:translateY(-10px) scale(0.95);}',

      /* --- Typewriter Display --- */
      '#rh-typewriter{position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:99997;background:linear-gradient(135deg,rgba(2,8,20,0.97),rgba(10,20,38,0.97));color:#e8f4ff;padding:18px 26px;border-radius:18px;font-family:Cairo,"Segoe UI",sans-serif;font-size:15.5px;font-weight:500;border:1px solid rgba(0,200,255,0.25);box-shadow:0 16px 46px rgba(0,0,0,0.75),0 0 28px rgba(0,200,255,0.18);max-width:88vw;min-width:220px;line-height:1.85;opacity:0;transition:opacity 400ms ease,transform 400ms ease;pointer-events:auto;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;max-height:40vh;overflow-y:auto;}',
      '#rh-typewriter.rh-tw-show{opacity:1;transform:translateX(-50%) translateY(-6px);}',
      '#rh-typewriter.rh-tw-rtl{direction:rtl;text-align:right;}',
      '#rh-typewriter.rh-tw-ltr{direction:ltr;text-align:left;}',
      '#rh-typewriter::-webkit-scrollbar{width:6px;}',
      '#rh-typewriter::-webkit-scrollbar-thumb{background:rgba(0,200,255,0.3);border-radius:4px;}',
      '.rh-tw-cursor{display:inline-block;width:2px;background:#00c8ff;margin-inline-start:2px;animation:rh-tw-blink 0.85s step-end infinite;vertical-align:middle;height:1.1em;}',
      '@keyframes rh-tw-blink{50%{opacity:0;}}',
      '.rh-tw-close{position:absolute;top:8px;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#cfe7ff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}',
      '#rh-typewriter.rh-tw-ltr .rh-tw-close{right:10px;}',
      '#rh-typewriter.rh-tw-rtl .rh-tw-close{left:10px;}',
      '.rh-tw-close:hover{background:rgba(255,80,80,0.8);color:#fff;}',

      /* --- Mobile responsive --- */
      '@media (max-width:600px){',
      '  .rh-v3-toast{font-size:13px;padding:12px 38px 12px 16px;min-width:200px;}',
      '  .rh-v3-toast.rh-v3-rtl{padding:12px 16px 12px 38px;}',
      '  #rh-typewriter{font-size:13.5px;padding:14px 18px;bottom:100px;max-height:32vh;}',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- [V3.5] حاوية طبقة Toast المتقدمة ---------- */
  function ensureToastLayer() {
    var layer = document.getElementById('rh-v3-toast-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'rh-v3-toast-layer';
      layer.setAttribute('role', 'status');
      layer.setAttribute('aria-live', 'polite');
      document.body.appendChild(layer);
    }
    return layer;
  }

  /* ---------- [V3.6] Toast المتقدم الدائم مع زر X و RTL/LTR ---------- */
  /*
   * showAdvancedToast(message, options)
   * options:
   *   duration: ms (افتراضي 15000). مرّر 0 للبقاء حتى الإغلاق اليدوي.
   *   showCloseButton: boolean (افتراضي true)
   *   isRTL: boolean (افتراضي: auto من detectLang)
   *   type: 'info' | 'success' | 'critical'  (critical لا يغلق تلقائياً)
   *   icon: string (اختياري — emoji/رمز)
   */
  function showAdvancedToast(message, options) {
    if (!message) return null;
    options = options || {};
    injectV3CSS();
    var layer = ensureToastLayer();

    var clean = cleanTextForDisplay(message);
    var lang = (typeof options.isRTL === 'boolean')
      ? (options.isRTL ? 'ar' : 'en')
      : detectLang(clean);
    var isRTL = (lang === 'ar');
    var type = options.type || 'info';
    var duration = (typeof options.duration === 'number') ? options.duration : 15000;
    var showClose = (options.showCloseButton !== false);
    var isCritical = (type === 'critical');

    /* الأولوية الذكية: critical لا يغلق إلا يدوياً */
    if (isCritical) duration = 0;

    var toast = document.createElement('div');
    toast.className = 'rh-v3-toast rh-v3-' + (isRTL ? 'rtl' : 'ltr') + ' rh-v3-' + type;
    toast.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    toast.setAttribute('lang', isRTL ? 'ar' : 'en');

    var icon = options.icon;
    if (!icon) {
      icon = (type === 'success') ? '✅' : (type === 'critical' ? '⚠️' : '💬');
    }

    var iconEl = document.createElement('span');
    iconEl.className = 'rh-v3-toast-icon';
    iconEl.textContent = icon;

    var msgEl = document.createElement('span');
    msgEl.className = 'rh-v3-toast-msg';
    msgEl.textContent = clean;

    toast.appendChild(iconEl);
    toast.appendChild(msgEl);

    var timer = null;
    function closeToast() {
      if (timer) { clearTimeout(timer); timer = null; }
      toast.classList.add('rh-v3-fadeout');
      setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 450);
    }

    if (showClose) {
      var closeBtn = document.createElement('button');
      closeBtn.className = 'rh-v3-toast-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', isRTL ? 'إغلاق' : 'Close');
      closeBtn.innerHTML = '&#x2715;';
      closeBtn.onclick = closeToast;
      toast.appendChild(closeBtn);
    }

    if (duration > 0) {
      var bar = document.createElement('div');
      bar.className = 'rh-v3-toast-bar';
      bar.style.animationDuration = duration + 'ms';
      toast.appendChild(bar);
      timer = setTimeout(closeToast, duration);
      /* إيقاف المؤقت عند hover — تجربة أفضل */
      toast.addEventListener('mouseenter', function () {
        if (timer) { clearTimeout(timer); timer = null; bar.style.animationPlayState = 'paused'; }
      });
      toast.addEventListener('mouseleave', function () {
        if (!timer && duration > 0) {
          bar.style.animationPlayState = 'running';
          timer = setTimeout(closeToast, 4000);
        }
      });
    }

    layer.appendChild(toast);
    /* force reflow then animate in */
    requestAnimationFrame(function () { toast.classList.add('rh-v3-show'); });

    return { close: closeToast, element: toast };
  }

  /* تعريض الدالة للـ window للاستخدام الخارجي */
  try { window.showAdvancedToast = showAdvancedToast; } catch (e) {}

  /* ---------- [V3.7] محرك Typewriter الذكي (RTL + LTR) ---------- */
  var _twState = { active: null, timer: null, element: null };

  function ensureTypewriterEl() {
    var el = document.getElementById('rh-typewriter');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rh-typewriter';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function typewriter(rawText, options) {
    injectV3CSS();
    options = options || {};
    var text = cleanTextForDisplay(rawText);
    if (!text) return;

    var lang = options.lang || detectLang(text);
    var isRTL = (lang === 'ar');
    var baseSpeed = (typeof options.speed === 'number') ? options.speed : (isRTL ? 38 : 28); /* ms/char */
    var onDone = options.onDone || function () {};

    var el = ensureTypewriterEl();
    /* إلغاء أي جلسة سابقة */
    if (_twState.timer) { clearTimeout(_twState.timer); _twState.timer = null; }
    el.innerHTML = '';
    el.className = 'rh-tw-' + (isRTL ? 'rtl' : 'ltr');
    el.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    el.setAttribute('lang', isRTL ? 'ar' : 'en');

    /* زر الإغلاق */
    var closeBtn = document.createElement('button');
    closeBtn.className = 'rh-tw-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', isRTL ? 'إغلاق' : 'Close');
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.onclick = function () {
      if (_twState.timer) { clearTimeout(_twState.timer); _twState.timer = null; }
      el.classList.remove('rh-tw-show');
      setTimeout(function () { if (el.parentNode) el.innerHTML = ''; }, 400);
    };
    el.appendChild(closeBtn);

    /* container للنص */
    var span = document.createElement('span');
    span.className = 'rh-tw-text';
    el.appendChild(span);

    /* cursor */
    var cursor = document.createElement('span');
    cursor.className = 'rh-tw-cursor';
    el.appendChild(cursor);

    /* عرض الحاوية */
    requestAnimationFrame(function () { el.classList.add('rh-tw-show'); });

    /* عرض الحروف تدريجياً */
    var i = 0;
    var N = text.length;
    _twState.active = { text: text, i: 0 };

    function step() {
      if (i >= N) {
        /* انتهى — أبقِ المؤشر يومض لبرهة ثم أخفه */
        setTimeout(function () {
          if (cursor && cursor.parentNode) cursor.style.display = 'none';
        }, 1200);
        try { onDone(); } catch (e) {}
        return;
      }
      /* أضف حرفاً (التسريع الطبيعي عند علامات الترقيم) */
      var ch = text.charAt(i);
      span.textContent += ch;
      i++;
      /* تمرير تلقائي للأسفل */
      el.scrollTop = el.scrollHeight;
      var delay = baseSpeed;
      if ('.،؟!?.'.indexOf(ch) !== -1) delay = baseSpeed * 5;
      else if (ch === ' ') delay = baseSpeed * 0.6;
      _twState.timer = setTimeout(step, delay);
    }
    step();
  }

  try { window.rhTypewriter = typewriter; } catch (e) {}

  /* ---------- [V3.8] ربط Typewriter تلقائياً مع speak() (بدون تعديل speak الأصلية) ---------- */
  /*
   * نلتقط كل استدعاء لـ showToast مع نص طويل ونعرضه أيضاً في typewriter.
   * كما نراقب responses من Groq بواسطة wrapper خفيف.
   */
  try {
    var _origSpeak = speak;
    /* eslint-disable-next-line no-native-reassign */
    speak = function (text, cb) {
      /* شغّل typewriter بالتزامن مع الصوت */
      if (text && typeof text === 'string') {
        var cleaned = cleanTextForDisplay(text.replace(/\[CMD:[^\]]+\]/g, ''));
        if (cleaned && cleaned.length > 2) {
          try { typewriter(cleaned, { lang: detectLang(cleaned) }); } catch (e) {}
        }
      }
      return _origSpeak.call(this, text, cb);
    };
    try { window.speak = speak; } catch (e) {}
  } catch (e) {
    console.warn('[RH v3] speak wrap failed', e);
  }

  /* ---------- [V3.9] إخطار الأدمن عبر WhatsApp بصمت عند دخول زائر ---------- */
  var ADMIN_WA_NUMBER = '962785353408';

  function getDeviceKind() {
    var ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return 'Mobile';
    if (/Tablet|iPad/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  function notifyAdminVisitor() {
    try {
      /* منع التكرار في نفس الجلسة */
      if (sessionStorage.getItem('rh_v3_notified') === '1') return;
      sessionStorage.setItem('rh_v3_notified', '1');
    } catch (e) {}

    var now = new Date();
    var lang = getLang();
    var device = getDeviceKind();
    var page = window.location.pathname + (window.location.hash || '');
    var ref = document.referrer || ((lang === 'ar') ? 'مباشر' : 'Direct');
    var msg = (lang === 'ar')
      ? ('🚨 زائر جديد على ROBOT HOUSE' +
         '\n🕒 الوقت: ' + now.toLocaleString('ar-EG') +
         '\n📄 الصفحة: ' + page +
         '\n📱 الجهاز: ' + device +
         '\n🔗 المصدر: ' + ref)
      : ('🚨 New visitor on ROBOT HOUSE' +
         '\n🕒 Time: ' + now.toLocaleString('en-US') +
         '\n📄 Page: ' + page +
         '\n📱 Device: ' + device +
         '\n🔗 Referrer: ' + ref);

    var url = 'https://wa.me/' + ADMIN_WA_NUMBER + '?text=' + encodeURIComponent(msg);

    /* طريقة 1 (المفضّلة): fetch صامت للـ endpoint (لن يفتح نافذة، قد يُحظر بـ CORS لكنه لا يعطل الواجهة) */
    try {
      if (typeof fetch === 'function') {
        fetch(url, { mode: 'no-cors', cache: 'no-store', credentials: 'omit', keepalive: true }).catch(function(){});
      }
    } catch (e) {}

    /* طريقة 2: صورة خفية (ping) — يعمل دون blocker في معظم المتصفحات */
    try {
      var img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = url;
      img.style.display = 'none';
      img.onerror = function(){}; /* تجاهل */
    } catch (e) {}

    /* طريقة 3 (backup): نافذة منبثقة 1x1 pixel — ستُحظر عادةً بدون تفاعل مستخدم،
       لكن نحاول فقط بعد أول حدث تفاعل لتجنب إزعاج المستخدم */
    var attempted = false;
    function tryOpen() {
      if (attempted) return;
      attempted = true;
      try {
        var w = window.open(url, '_blank', 'noopener,noreferrer,width=1,height=1,left=-9999,top=-9999');
        if (w) { try { setTimeout(function(){ w.close(); }, 400); } catch(e){} }
      } catch (e) {}
    }
    ['click','keydown','touchstart','pointerdown'].forEach(function (evt) {
      document.addEventListener(evt, tryOpen, { once: true, passive: true });
    });

    console.log('[RH v3] visitor notify dispatched silently');
  }

  /* ---------- [V3.10] طبقة Meta — تتبع السلوك واقتراحات ذكية ---------- */
  var _meta = {
    startTs: Date.now(),
    clicks: {},
    sections: {},
    currentSection: null,
    sectionEnterTs: null
  };

  function trackBehavior() {
    /* النقرات */
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('a,button,[data-track]');
      if (!t) return;
      var key = (t.id || t.getAttribute('data-track') || t.textContent || '').toString().slice(0, 40).trim();
      if (!key) return;
      _meta.clicks[key] = (_meta.clicks[key] || 0) + 1;
    }, { passive: true });

    /* مراقبة الأقسام عبر IntersectionObserver */
    try {
      var sections = document.querySelectorAll('section[id], [data-section]');
      if (sections.length && typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (ent) {
            var id = ent.target.id || ent.target.getAttribute('data-section') || 'unknown';
            if (ent.isIntersecting && ent.intersectionRatio > 0.4) {
              /* إغلاق السابق */
              if (_meta.currentSection && _meta.currentSection !== id && _meta.sectionEnterTs) {
                var delta = Date.now() - _meta.sectionEnterTs;
                _meta.sections[_meta.currentSection] = (_meta.sections[_meta.currentSection] || 0) + delta;
              }
              _meta.currentSection = id;
              _meta.sectionEnterTs = Date.now();
            }
          });
        }, { threshold: [0, 0.4, 0.75] });
        sections.forEach(function (sec) { io.observe(sec); });
      }
    } catch (e) {}

    /* إغلاق الجلسة — تجميع وقت القسم الأخير */
    window.addEventListener('beforeunload', function () {
      if (_meta.currentSection && _meta.sectionEnterTs) {
        var delta = Date.now() - _meta.sectionEnterTs;
        _meta.sections[_meta.currentSection] = (_meta.sections[_meta.currentSection] || 0) + delta;
      }
      try { localStorage.setItem('rh_v3_meta', JSON.stringify(_meta)); } catch (e) {}
    });
  }

  /* توليد اقتراح ذكي بناءً على السلوك */
  function suggestIdeas() {
    try {
      /* ابحث عن القسم الأكثر زيارة */
      var topSec = null, topTime = 0;
      for (var k in _meta.sections) {
        if (_meta.sections[k] > topTime) { topTime = _meta.sections[k]; topSec = k; }
      }
      /* والعنصر الأكثر نقراً */
      var topClick = null, topCnt = 0;
      for (var c in _meta.clicks) {
        if (_meta.clicks[c] > topCnt) { topCnt = _meta.clicks[c]; topClick = c; }
      }

      if (!topSec && !topClick) return null;

      var lang = getLang();
      var secMap = {
        'products':   { ar: 'المنتجات',     en: 'Products' },
        'investors':  { ar: 'الاستثمار',    en: 'Investors' },
        'financials': { ar: 'المالية',      en: 'Financials' },
        'technology': { ar: 'التقنيات',     en: 'Technology' },
        'about':      { ar: 'من نحن',        en: 'About' },
        'market':     { ar: 'السوق',         en: 'Market' },
        'photo-album':{ ar: 'الألبوم',       en: 'Album' },
        'contact':    { ar: 'تواصل',         en: 'Contact' }
      };
      var label = topSec && secMap[topSec] ? secMap[topSec][lang === 'ar' ? 'ar' : 'en'] : topSec;

      var msg;
      if (lang === 'ar') {
        msg = '💡 ملاحظة ذكية: الزوار يركّزون على قسم "' + (label || 'غير محدد') + '"' +
              (topClick ? ' — والعنصر الأكثر تفاعلاً: ' + topClick : '') +
              '. اقتراح: أبرز هذا القسم في الواجهة الرئيسية وأضِف عرضاً ترويجياً له.';
      } else {
        msg = '💡 Smart insight: Visitors focus on "' + (label || 'unspecified') + '" section' +
              (topClick ? ' — top interaction: ' + topClick : '') +
              '. Suggestion: highlight this section on the homepage with a featured promo.';
      }
      return msg;
    } catch (e) { return null; }
  }

  try { window.rhSuggestIdeas = suggestIdeas; } catch (e) {}
  try { window.rhCloseManagedWindows = closeManagedWindows; window.rhCloseManagedWindow = closeManagedWindow; } catch (e) {}

  /* ---------- [V3.11] تهيئة V3 بعد DOM جاهز (دون تعديل init الأصلية) ---------- */
  function bootV3() {
    try { injectV3CSS(); } catch (e) {}
    try { ensureToastLayer(); } catch (e) {}
    try { ensureTypewriterEl(); } catch (e) {}
    try { trackBehavior(); } catch (e) {}
    try { notifyAdminVisitor(); } catch (e) { console.warn('[RH v3] notify failed', e); }
    try { optimizeV4Performance(); } catch (e) {}

    /* اقتراح ذكي بعد 90 ثانية من التصفح */
    setTimeout(function () {
      var idea = suggestIdeas();
      if (idea) {
        showAdvancedToast(idea, { duration: 18000, type: 'info', icon: '💡' });
      }
    }, 90000);

    /* مراقبة تغيير اللغة: حدّث dir التلقائي للـ toasts الحالية */
    window.addEventListener('storage', function (ev) {
      if (ev && (ev.key === 'site-lang' || ev.key === 'lang')) {
        var lang = getLang();
        var layer = document.getElementById('rh-v3-toast-layer');
        if (layer) layer.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      }
    });

    console.log('[ROBOT HOUSE Voice v3.0] 🚀 Enhancement layer loaded — Bilingual+Typewriter+AdvancedToast+Meta');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootV3);
  } else {
    /* تأخير بسيط لضمان انتهاء init الأصلية */
    setTimeout(bootV3, 200);
  }

})();
