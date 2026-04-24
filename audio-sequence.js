/**
 * audio-sequence.js — نظام الصوت السينمائي (النسخة المُحسَّنة v2)
 *
 * التسلسل عند دخول الموقع:
 *   1. jarvis_boot_sound.mp3  — يبدأ فوراً
 *   2. رسالة ترحيب (حسب اللغة) — يبدأ بعد 3 ثوانٍ من بدء boot
 *   3. رسالة المشروع (حسب اللغة) — يبدأ بعد انتهاء رسالة الترحيب (بحد أقصى 5 ثوانٍ)
 *
 * عند تغيير اللغة:
 *   - يوقف كل الأصوات الجارية
 *   - يشغّل welcome الجديد مباشرة
 *   - بعد انتهاء الترحيب يشغّل project الجديد
 *
 * ضمانات صارمة:
 *   - boot يُشغَّل مرة واحدة فقط طوال عمر الصفحة
 *   - لا يتداخل صوتان في نفس الوقت أبداً (sessionId guard)
 *   - تغيير اللغة أثناء التهيئة لا يُعيد تشغيل boot
 *   - تجاهل الأحداث المُكرَّرة عبر نافذة debounce
 *   - preload='metadata' للملفات الثقيلة لتوفير الحزمة
 */
(function () {
  'use strict';

  /* ── مسارات الملفات ── */
  var FILES = {
    boot:       'assets/audio/jarvis_boot_sound.mp3',
    welcome_ar: 'assets/audio/\u0631\u0633\u0627\u0644\u0629 \u062a\u0631\u062d\u064a\u0628 \u0639\u0631\u0628\u064a.m4a',
    welcome_en: 'assets/audio/\u0631\u0633\u0627\u0644\u0629 \u062a\u0631\u062d\u064a\u0628 \u0627\u0646\u062c\u0644\u064a\u0632\u064a.m4a',
    project_ar: 'assets/audio/\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0627\u0627\u0644\u0639\u0631\u0628\u064a\u0629.mp3',
    project_en: 'assets/audio/\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0644\u0627\u0646\u062c\u0644\u0632\u064a\u0629.mp3'
  };

  /* ── أوزان الأولوية للـ preload ── */
  /* boot خفيف جداً → auto، الباقي metadata لتوفير الحزمة حتى وقت الحاجة */
  var PRELOAD_MAP = {
    boot:       'auto',
    welcome_ar: 'metadata',
    welcome_en: 'metadata',
    project_ar: 'metadata',
    project_en: 'metadata'
  };

  /* ── الحالة الداخلية ── */
  var els          = {};       // عناصر audio المُنشأة
  var bootDone     = false;    // هل شُغِّل boot مرة واحدة؟
  var seqStarted   = false;    // هل بدأ التسلسل الكامل؟
  var currentLang  = null;     // اللغة المُطبَّقة حالياً في الصوت
  var activeTimers = [];       // مؤقتات نشطة
  var sessionId    = 0;        // معرِّف جلسة الصوت الحالية (يتغيّر عند كل إيقاف/إعادة)
  var lastSwitchAt = 0;        // وقت آخر تبديل لغة (لمنع التكرار السريع)
  var initDone     = false;    // انتهت التهيئة (للحماية من الأحداث الأولية)
  var SWITCH_DEBOUNCE = 450;   // ms — نافذة منع التكرار بين تبديلات اللغة
  var MAX_WELCOME_WAIT = 5000; // ms — حد أقصى لانتظار انتهاء welcome قبل project

  /* ── إنشاء عنصر audio مخفي ── */
  function make(key) {
    if (els[key]) return els[key];
    var a = document.createElement('audio');
    a.src = FILES[key];
    a.preload = PRELOAD_MAP[key] || 'metadata';
    a.volume = 0.92;
    a.style.cssText = 'display:none;position:absolute;left:-9999px;';
    a.setAttribute('aria-hidden', 'true');
    a.dataset.cinematic = '1';
    document.body.appendChild(a);
    els[key] = a;
    return a;
  }

  /* ── تشغيل صوت واحد مع ربط sessionId ── */
  function playAudio(key, vol, mySession) {
    /* إذا تغيّرت الجلسة قبل أن يبدأ التشغيل — ألغِ */
    if (mySession !== undefined && mySession !== sessionId) return null;

    var a = make(key);
    a.volume = (typeof vol === 'number') ? vol : 0.92;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
    var p = a.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { /* autoplay blocked — تجاهل */ });
    }
    return a;
  }

  /* ── إيقاف جميع الأصوات وإلغاء المؤقتات ومعرِّف جلسة جديد ── */
  function stopAll() {
    sessionId++;                 /* أي مؤقت قديم سيكتشف أن جلسته انتهت */
    activeTimers.forEach(function (id) { clearTimeout(id); });
    activeTimers = [];
    Object.keys(els).forEach(function (k) {
      try { els[k].pause(); els[k].currentTime = 0; } catch (e) {}
    });
  }

  /* ── مؤقت مُسجَّل ومربوط بـ sessionId ── */
  function later(ms, fn, mySession) {
    var id = setTimeout(function () {
      activeTimers = activeTimers.filter(function (t) { return t !== id; });
      /* ألغِ التنفيذ إذا تغيّرت الجلسة */
      if (mySession !== undefined && mySession !== sessionId) return;
      fn();
    }, ms);
    activeTimers.push(id);
    return id;
  }

  /* ── قراءة اللغة من localStorage أو <html lang> ── */
  function getLang() {
    try {
      var s = localStorage.getItem('site-lang');
      if (s) return (s.toLowerCase().indexOf('en') === 0) ? 'en' : 'ar';
    } catch (e) {}
    var l = (document.documentElement.lang || '').toLowerCase();
    return (l.indexOf('en') === 0) ? 'en' : 'ar';
  }

  /* ── تسلسل الترحيب + المشروع (بدون boot) ── */
  function runWelcomeSequence(lang, mySession) {
    var wk = (lang === 'en') ? 'welcome_en' : 'welcome_ar';
    var pk = (lang === 'en') ? 'project_en' : 'project_ar';

    var welcomeEl = playAudio(wk, 0.95, mySession);
    if (!welcomeEl) return; /* الجلسة انتهت */

    /* ── تشغيل project بعد انتهاء welcome فعلياً ── */
    var projectTriggered = false;
    function triggerProject() {
      if (projectTriggered) return;
      if (mySession !== sessionId) return;
      if (currentLang !== lang) return;   /* اللغة تغيّرت */
      projectTriggered = true;
      try { welcomeEl.removeEventListener('ended', triggerProject); } catch (e) {}
      playAudio(pk, 0.95, mySession);
    }

    /* استمع لحدث ended (الأكثر دقة) */
    try { welcomeEl.addEventListener('ended', triggerProject, { once: true }); } catch (e) {}

    /* حماية: إذا لم ينطلق ended خلال MAX_WELCOME_WAIT — ابدأ على أي حال */
    later(MAX_WELCOME_WAIT, triggerProject, mySession);
  }

  /* ── التسلسل الكامل عند الدخول ── */
  function runFullSequence() {
    if (seqStarted) return;
    seqStarted = true;

    var lang = getLang();
    currentLang = lang;
    var mySession = sessionId;

    /* boot مرة واحدة فقط */
    if (!bootDone) {
      bootDone = true;
      playAudio('boot', 0.92, mySession);
    }

    /* بعد 3 ثوانٍ: welcome */
    later(3000, function () {
      var activeLang = currentLang || lang;
      runWelcomeSequence(activeLang, sessionId);
    }, mySession);
  }

  /* ── معالجة تغيير اللغة (مع حماية من التكرار) ── */
  function onLangSwitch(newLang) {
    var lang = ((newLang || '').toLowerCase().indexOf('en') === 0) ? 'en' : 'ar';

    /* تجاهل إذا نفس اللغة */
    if (lang === currentLang) return;

    /* حماية من الأحداث المُكرَّرة خلال فترة قصيرة */
    var now = Date.now();
    if ((now - lastSwitchAt) < SWITCH_DEBOUNCE) return;
    lastSwitchAt = now;

    currentLang = lang;

    /* أوقف كل شيء (يزيد sessionId تلقائياً) */
    stopAll();
    var mySession = sessionId;

    /* بعد 300ms ابدأ تسلسل الترحيب للغة الجديدة */
    later(300, function () {
      /* إذا تغيّرت اللغة مرة أخرى خلال الانتظار، استخدم الأحدث */
      runWelcomeSequence(currentLang, mySession);
    }, mySession);
  }

  /* ── تهيئة ── */
  function init() {
    /* أنشئ عناصر الصوت (boot وحده preload=auto، البقية metadata) */
    Object.keys(FILES).forEach(make);

    /* اختبار autoplay */
    var silent = document.createElement('audio');
    silent.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    silent.volume = 0;
    var testPlay;
    try { testPlay = silent.play(); } catch (e) { testPlay = null; }

    if (testPlay && typeof testPlay.then === 'function') {
      testPlay.then(function () {
        try { silent.pause(); } catch (e) {}
        runFullSequence();
      }).catch(function () {
        waitForGesture(runFullSequence);
      });
    } else {
      /* متصفحات قديمة — انتظر تفاعل */
      waitForGesture(runFullSequence);
    }
  }

  /* ── انتظار أول تفاعل ── */
  function waitForGesture(cb) {
    var evts = ['click', 'pointerdown', 'touchstart', 'keydown'];
    var done = false;
    function handler() {
      if (done) return;
      done = true;
      evts.forEach(function (e) { document.removeEventListener(e, handler, true); });
      cb();
    }
    evts.forEach(function (e) {
      document.addEventListener(e, handler, { once: true, capture: true, passive: true });
    });
  }

  /* ══════════════════════════════════════════════════════
     مراقبة تغيير اللغة — مصادر متعددة مع debounce مركزي
  ══════════════════════════════════════════════════════ */

  /* 1. storage event (من نفس التبويب أو تبويب آخر) */
  window.addEventListener('storage', function (ev) {
    if (!initDone) return;
    if (ev.key === 'site-lang' && ev.newValue) {
      onLangSwitch(ev.newValue);
    }
  });

  /* 2. MutationObserver على <html lang> — فقط بعد انتهاء التهيئة */
  var langObserver = new MutationObserver(function () {
    if (!initDone) return;
    var newLang = document.documentElement.lang || '';
    if (newLang) onLangSwitch(newLang);
  });
  try {
    langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {}

  /* 3. النقر على زر اللغة مباشرة — يُمرَّر إلى onLangSwitch الذي يحمي من التكرار */
  document.addEventListener('click', function (e) {
    if (!initDone) return;
    var t = e.target;
    var btn = t && t.closest && t.closest('#site-lang-toggle, #langBtn, [data-lang-toggle]');
    if (btn) {
      /* تأخير قصير جداً حتى يُحدِّث زر اللغة الـ localStorage */
      setTimeout(function () { onLangSwitch(getLang()); }, 120);
    }
  }, { passive: true });

  /* 4. حدث مخصص من language_perf_patch.js */
  window.addEventListener('site-lang-applied-immediate', function (ev) {
    if (!initDone) return;
    var lang = ev && ev.detail && ev.detail.lang;
    if (lang) onLangSwitch(lang);
  });

  /* ── بدء التشغيل عند جاهزية الصفحة ── */
  function bootstrap() {
    init();
    /* علّم انتهاء التهيئة بعد تأخير قصير لتجاهل تغييرات اللغة الأولية
       (language_perf_patch.js يطلق حدث أولي فور التحميل) */
    setTimeout(function () { initDone = true; }, 2000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (document.body) {
      bootstrap();
    } else {
      document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    }
  } else {
    window.addEventListener('load', bootstrap, { once: true });
  }

  /* ── API عام ── */
  window.__AudioSeq = {
    replay: function () {
      stopAll();
      seqStarted = false;
      bootDone = false;
      currentLang = null;
      initDone = false;
      init();
      setTimeout(function () { initDone = true; }, 2000);
    },
    replayWelcome: function () {
      stopAll();
      currentLang = getLang();
      runWelcomeSequence(currentLang, sessionId);
    },
    getLang: getLang,
    stopAll: stopAll,
    /* للاستخدام من language_perf_patch.js مباشرة */
    onLangSwitch: function (lang) { if (initDone) onLangSwitch(lang); }
  };

})();
