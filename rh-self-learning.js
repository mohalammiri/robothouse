/* ROBOT HOUSE — Self-learning + dev commands (runs first on processCommand) */
(function () {
  'use strict';

  // Light mode: disable local self-learning background logic to reduce CPU/storage churn
  if (window.RH_LIGHT_MODE === true) {
    console.log('[rh-self-learning] skipped (light mode)');
    window.rhLearning = {
      learn: function(){ return 'disabled'; },
      forget: function(){ return 'disabled'; },
      correctVoice: function(){},
      stats: function(){ return {answers:0,voiceFixes:0,features:0,bugs:0}; },
      reload: function(){}
    };
    return;
  }

  var learningDB = {
    failedCommands: [],
    customAnswers: {},
    voiceCorrections: {},
    featureRequests: [],
    bugReports: []
  };

  function loadAll() {
    try {
      learningDB.failedCommands = JSON.parse(localStorage.getItem('rh_failed') || '[]');
    } catch (e) { learningDB.failedCommands = []; }
    try {
      learningDB.customAnswers = JSON.parse(localStorage.getItem('rh_custom_answers') || '{}');
    } catch (e2) { learningDB.customAnswers = {}; }
    try {
      learningDB.voiceCorrections = JSON.parse(localStorage.getItem('rh_voice_corrections') || '{}');
    } catch (e3) { learningDB.voiceCorrections = {}; }
    try {
      learningDB.featureRequests = JSON.parse(localStorage.getItem('rh_features') || '[]');
    } catch (e4) { learningDB.featureRequests = []; }
    try {
      learningDB.bugReports = JSON.parse(localStorage.getItem('rh_bugs') || '[]');
    } catch (e5) { learningDB.bugReports = []; }
  }

  function saveAll() {
    try {
      localStorage.setItem('rh_failed', JSON.stringify(learningDB.failedCommands.slice(-80)));
      localStorage.setItem('rh_custom_answers', JSON.stringify(learningDB.customAnswers));
      localStorage.setItem('rh_voice_corrections', JSON.stringify(learningDB.voiceCorrections));
      localStorage.setItem('rh_features', JSON.stringify(learningDB.featureRequests.slice(-50)));
      localStorage.setItem('rh_bugs', JSON.stringify(learningDB.bugReports.slice(-50)));
    } catch (e) {}
  }

  loadAll();

  function correctVoiceInput(text) {
    if (!text) return '';
    return text.split(/\s+/).map(function (w) {
      var k = w.toLowerCase();
      return learningDB.voiceCorrections[k] || w;
    }).join(' ');
  }

  function getLearnedAnswer(question) {
    var q = String(question || '').toLowerCase().trim();
    if (!q) return null;
    if (learningDB.customAnswers[q]) return learningDB.customAnswers[q];
    var words = q.split(/\s+/).filter(function (w) { return w.length > 2; });
    for (var stored in learningDB.customAnswers) {
      if (!Object.prototype.hasOwnProperty.call(learningDB.customAnswers, stored)) continue;
      var sw = stored.split(/\s+/).filter(function (w) { return w.length > 2; });
      if (!sw.length) continue;
      var matchCount = words.filter(function (w) { return sw.indexOf(w) !== -1; }).length;
      if (matchCount >= Math.min(words.length, sw.length) * 0.7) {
        return learningDB.customAnswers[stored];
      }
    }
    return null;
  }

  function learnAnswer(question, answer) {
    var key = String(question || '').toLowerCase().trim();
    learningDB.customAnswers[key] = String(answer || '').trim();
    saveAll();
    return 'تم حفظ الإجابة المتعلمة.';
  }

  function runDevCommands(corrected) {
    var t = String(corrected || '');
    var tl = t.toLowerCase();

    if (/^علمني\s+/i.test(t) || /^learn\s+/i.test(t)) {
      var m = t.match(/علمني\s+["']?(.+?)["']?\s+["']?(.+?)["']?\s*$/i) || t.match(/learn\s+["']?(.+?)["']?\s+["']?(.+?)["']?\s*$/i);
      if (m && m[1] && m[2]) return learnAnswer(m[1].trim(), m[2].trim());
      return 'قل: علمني ثم السؤال ثم الإجابة بين علامتي تنصيص.';
    }

    if (/^(طور|أضف ميزة|اريد ميزة|add feature)\s+/i.test(t)) {
      var feat = t.replace(/^(طور|أضف ميزة|اريد ميزة|add feature)\s+/i, '').trim();
      if (!feat) return 'قل: طور ثم وصف الميزة.';
      learningDB.featureRequests.push({ feature: feat, date: new Date().toISOString(), status: 'pending' });
      saveAll();
      return 'سُجّلت الميزة: ' + feat;
    }

    if (/^(مشكلة|خلل|bug|عطل)\s+/i.test(t)) {
      var bug = t.replace(/^(مشكلة|خلل|bug|عطل)\s+/i, '').trim();
      if (!bug) return 'قل: مشكلة ثم وصف الخلل.';
      learningDB.bugReports.push({ bug: bug, date: new Date().toISOString(), status: 'reported' });
      saveAll();
      return 'سُجّل الخلل: ' + bug;
    }

    if (/اعرض الطلبات|طلباتي|list features/i.test(tl)) {
      if (!learningDB.featureRequests.length) return 'لا توجد طلبات ميزات.';
      return learningDB.featureRequests.slice(-5).map(function (r, i) {
        return (i + 1) + '. ' + r.feature + ' [' + r.status + ']';
      }).join('\n');
    }

    if (/اعرض المشاكل|مشاكلي|list bugs/i.test(tl)) {
      if (!learningDB.bugReports.length) return 'لا مشاكل مسجّلة.';
      return learningDB.bugReports.slice(-5).map(function (b, i) {
        return (i + 1) + '. ' + b.bug + ' [' + b.status + ']';
      }).join('\n');
    }

    if (/^اكتمل\s+\d+|^complete\s+\d+/i.test(t)) {
      var num = t.match(/\d+/);
      if (!num) return 'حدد رقم الطلب.';
      var idx = parseInt(num[0], 10) - 1;
      if (learningDB.featureRequests[idx]) {
        learningDB.featureRequests[idx].status = 'completed';
        learningDB.featureRequests[idx].completedAt = new Date().toISOString();
        saveAll();
        return 'تم تعليم الطلب ' + num[0] + ' كمكتمل.';
      }
      return 'لا يوجد طلب بهذا الرقم.';
    }

    if (/صدر الطلبات|export (data|all)/i.test(tl)) {
      var exportData = {
        features: learningDB.featureRequests,
        bugs: learningDB.bugReports,
        customAnswers: learningDB.customAnswers,
        voiceCorrections: learningDB.voiceCorrections,
        exportDate: new Date().toISOString()
      };
      var json = JSON.stringify(exportData, null, 2);
      console.log('[RH export]', json);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).catch(function () {});
        return 'نُسخ التصدير إلى الحافظة (إن وُجدت الصلاحية).';
      }
      return 'البيانات في الطابعة (console).';
    }

    return null;
  }

  function autoLearnMaybe(userQ, reply) {
    try {
      if (localStorage.getItem('rh_auto_learn') !== '1') return;
      var q = String(userQ || '').toLowerCase().trim().slice(0, 220);
      if (q.length < 6) return;
      learningDB.customAnswers[q] = String(reply || '').trim().slice(0, 800);
      saveAll();
    } catch (e) {}
  }

  function patchProcessCommand() {
    if (typeof window.processCommand !== 'function') {
      setTimeout(patchProcessCommand, 100);
      return;
    }
    if (window.__rhSelfLearningPatched) return;
    window.__rhSelfLearningPatched = true;

    var prev = window.processCommand;

    var prevHook = window.RH_afterAssistantReply;
    window.RH_afterAssistantReply = function (q, r) {
      try { if (typeof prevHook === 'function') prevHook(q, r); } catch (e0) {}
      try { autoLearnMaybe(q, r); } catch (e1) {}
    };

    window.processCommand = function (text) {
      var raw = String(text || '');
      if (/روبوت\s*استيقظ|روبوت\s*اصحى|robot\s*wake\s*up|wake\s*up\s*robot/i.test(raw)) {
        return prev.call(this, raw);
      }
      var st = typeof window.RH_getVoiceState === 'function' ? window.RH_getVoiceState() : { isAwake: true };
      if (!st.isAwake) {
        return prev.call(this, raw);
      }

      var corrected = correctVoiceInput(raw);
      var learned = getLearnedAnswer(corrected);
      if (learned) {
        if (typeof window.showToast === 'function') window.showToast(learned, 8000);
        if (typeof window.speak === 'function') window.speak(learned);
        return;
      }

      var devOut = runDevCommands(corrected);
      if (devOut !== null) {
        if (typeof window.showToast === 'function') window.showToast(devOut, 10000);
        if (typeof window.speak === 'function') window.speak(devOut);
        return;
      }

      try {
        return prev.call(this, corrected);
      } catch (e) {
        learningDB.failedCommands.push({ cmd: corrected, error: String(e && e.message), time: Date.now() });
        saveAll();
        throw e;
      }
    };
  }

  window.rhLearning = {
    learn: learnAnswer,
    forget: function (q) {
      delete learningDB.customAnswers[String(q || '').toLowerCase().trim()];
      saveAll();
      return 'تم المسح.';
    },
    correctVoice: function (wrong, right) {
      learningDB.voiceCorrections[String(wrong || '').toLowerCase()] = String(right || '');
      saveAll();
    },
    stats: function () {
      return {
        answers: Object.keys(learningDB.customAnswers).length,
        voiceFixes: Object.keys(learningDB.voiceCorrections).length,
        features: learningDB.featureRequests.length,
        bugs: learningDB.bugReports.length
      };
    },
    reload: loadAll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(patchProcessCommand, 520); });
  } else {
    setTimeout(patchProcessCommand, 520);
  }
})();
