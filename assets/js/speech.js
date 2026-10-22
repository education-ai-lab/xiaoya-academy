/* ============================================================
   语音朗读（浏览器原生 TTS，无需联网下载音频）
   ============================================================ */
(function () {
  'use strict';

  var synth = window.speechSynthesis;
  var supported = !!(synth && window.SpeechSynthesisUtterance);
  var voices = [];

  function refresh() {
    if (!supported) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
  }

  if (supported) {
    refresh();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = refresh;
    }
  }

  function norm(lang) {
    return String(lang || 'zh-CN').toLowerCase().replace('_', '-');
  }

  function pickVoice(lang) {
    if (!voices.length) refresh();
    var target = norm(lang);
    var prefix = target.slice(0, 2);
    var list = voices.filter(function (v) {
      return norm(v.lang).indexOf(target) === 0;
    });
    if (!list.length) {
      list = voices.filter(function (v) {
        return norm(v.lang).indexOf(prefix) === 0;
      });
    }
    if (!list.length) return null;

    var prefer = prefix === 'zh'
      ? ['tingting', 'ting-ting', 'meijia', 'mei-jia', 'sinji', 'xiaoxiao', 'yunxi', 'huihui', 'yaoyao', 'kangkang', '普通话']
      : ['samantha', 'aria', 'jenny', 'google us english', 'alex', 'zira', 'david'];

    for (var i = 0; i < prefer.length; i++) {
      for (var j = 0; j < list.length; j++) {
        if (list[j].name.toLowerCase().indexOf(prefer[i]) !== -1) return list[j];
      }
    }
    // 优先本地语音，避免网络语音加载慢
    for (var k = 0; k < list.length; k++) {
      if (list[k].localService) return list[k];
    }
    return list[0];
  }

  var lastEnd = null;

  function speak(text, opts) {
    opts = opts || {};
    if (!supported) {
      if (window.UI) UI.toast('当前浏览器不支持语音朗读', 'warn');
      return false;
    }
    var content = String(text == null ? '' : text).trim();
    if (!content) return false;

    try { synth.cancel(); } catch (e) { /* ignore */ }

    var lang = opts.lang || 'zh-CN';
    var setting = 1;
    try { setting = (Store.state.settings.rate || 1); } catch (e) { setting = 1; }

    var base = lang.indexOf('zh') === 0 ? 0.95 : 0.92;
    var rate = (opts.rate || base) * setting;
    if (opts.slow) rate = (lang.indexOf('zh') === 0 ? 0.62 : 0.6) * setting;
    rate = Math.max(0.3, Math.min(2, rate));

    var u = new SpeechSynthesisUtterance(content);
    u.lang = lang;
    u.rate = rate;
    u.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1.05;
    u.volume = 1;
    var v = pickVoice(lang);
    if (v) u.voice = v;

    u.onend = function () {
      if (typeof opts.onend === 'function') opts.onend();
    };
    u.onerror = function (e) {
      // interrupted / canceled 属于正常打断，不提示
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      if (typeof opts.onerror === 'function') opts.onerror(e);
    };

    // Chrome 在 cancel 之后立即 speak 偶尔会吞掉第一句，延迟一帧更稳
    window.setTimeout(function () {
      try { synth.speak(u); } catch (e) { /* ignore */ }
    }, 30);

    lastEnd = u.onend;
    return true;
  }

  function stop() {
    if (!supported) return;
    try { synth.cancel(); } catch (e) { /* ignore */ }
  }

  window.Speech = {
    supported: function () { return supported; },
    speak: speak,
    stop: stop,
    slow: function (text, lang) { return speak(text, { lang: lang || 'zh-CN', slow: true }); },
    voices: function () { refresh(); return voices.slice(); }
  };
})();
