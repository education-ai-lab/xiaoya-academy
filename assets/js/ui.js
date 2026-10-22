/* ============================================================
   通用 UI 工具：提示、弹窗、模块注册、日期与格式化
   ============================================================ */
(function () {
  'use strict';

  var UI = {};

  /* ---------- 基础工具 ---------- */
  UI.esc = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  UI.pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  UI.fmtDuration = function (sec) {
    sec = Math.max(0, Math.round(sec || 0));
    if (sec < 60) return sec + ' 秒';
    var m = Math.floor(sec / 60), s = sec % 60;
    return s ? m + ' 分 ' + s + ' 秒' : m + ' 分钟';
  };

  UI.fmtClock = function (sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return UI.pad(m) + ':' + UI.pad(s);
  };

  UI.fmtDateCN = function (d) {
    var wd = '日一二三四五六'.charAt(d.getDay());
    return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 周' + wd;
  };

  UI.weekCN = function (d) { return '周' + '日一二三四五六'.charAt(d.getDay()); };

  UI.pct = function (a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; };

  /* ---------- 每日稳定抽取 ---------- */
  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  UI.shuffle = function (arr, seed) {
    var a = arr.slice();
    var rand = mulberry32(seed >>> 0 || 1);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /** 按日期稳定地抽取 count 个元素（每天一样，明天自动换） */
  UI.dailyPick = function (list, count, salt) {
    var d = new Date();
    var seed = hashStr(Store.today() + '|' + (salt || ''));
    var arr = UI.shuffle(list, seed);
    var n = Math.min(count, arr.length);
    // 尽量让连续两天不重复：用日期偏移再打散一次
    return arr.slice(0, n);
  };

  UI.dailyIndex = function (len) {
    if (!len) return 0;
    var d = new Date();
    var seed = hashStr(Store.today() + '|idx');
    return seed % len;
  };

  /* ---------- Toast ---------- */
  UI.toast = function (msg, type, ms) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    box.appendChild(el);
    var life = ms || 2100;
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 240);
    }, life);
  };

  /* ---------- Modal ---------- */
  var escHandler = null;

  UI.closeModal = function () {
    var root = document.getElementById('modalRoot');
    if (!root) return;
    root.classList.remove('open');
    root.innerHTML = '';
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
    document.body.style.overflow = '';
  };

  UI.modal = function (opts) {
    var root = document.getElementById('modalRoot');
    if (!root) return { close: function () {} };
    UI.closeModal();

    var title = opts.title || '';
    var body = opts.body || '';
    var actions = opts.actions || [];
    var width = opts.width || 520;

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal-mask"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" style="max-width:' + width + 'px">' +
        '<div class="modal-head"><span>' + UI.esc(title) + '</span>' +
          '<button class="icon-btn" data-close aria-label="关闭">✕</button></div>' +
        '<div class="modal-body">' + body + '</div>' +
        (actions.length ? '<div class="modal-foot"></div>' : '') +
      '</div>';

    root.appendChild(wrap);
    root.classList.add('open');
    document.body.style.overflow = 'hidden';

    var modalEl = wrap.querySelector('.modal');
    var foot = wrap.querySelector('.modal-foot');
    if (foot) {
      actions.forEach(function (a) {
        var b = document.createElement('button');
        b.className = 'btn ' + (a.kind === 'primary' ? 'btn-primary' : a.kind === 'danger' ? 'btn-danger' : a.kind === 'mint' ? 'btn-mint' : 'btn-ghost');
        b.textContent = a.text;
        b.addEventListener('click', function () {
          if (typeof a.onClick === 'function') {
            var keep = a.onClick();
            if (keep === false) return;
          }
          UI.closeModal();
        });
        foot.appendChild(b);
      });
    }

    wrap.querySelector('.modal-mask').addEventListener('click', function () {
      if (opts.dismissible !== false) UI.closeModal();
    });
    wrap.querySelector('[data-close]').addEventListener('click', UI.closeModal);

    escHandler = function (e) {
      if (e.key === 'Escape') UI.closeModal();
    };
    document.addEventListener('keydown', escHandler);

    return {
      close: UI.closeModal,
      el: modalEl,
      body: modalEl.querySelector('.modal-body')
    };
  };

  UI.confirm = function (opts) {
    return new Promise(function (resolve) {
      var done = false;
      UI.modal({
        title: opts.title || '确认',
        body: '<p>' + UI.esc(opts.message || '') + '</p>',
        width: 420,
        actions: [
          { text: opts.cancelText || '取消', kind: 'ghost', onClick: function () { done = true; resolve(false); } },
          {
            text: opts.okText || '确定',
            kind: opts.danger ? 'danger' : 'primary',
            onClick: function () { done = true; resolve(true); }
          }
        ]
      });
      // 遮罩关闭视为取消
      var root = document.getElementById('modalRoot');
      var obs = new MutationObserver(function () {
        if (!root.classList.contains('open') && !done) {
          done = true;
          obs.disconnect();
          resolve(false);
        }
      });
      obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    });
  };

  /* ---------- 模块注册 ---------- */
  var registry = {};
  window.Modules = {
    register: function (id, meta) {
      registry[id] = meta;
    },
    get: function (id) { return registry[id]; },
    all: function () { return registry; }
  };

  /* ---------- 片段 ---------- */
  UI.hero = function (meta) {
    var badge = typeof meta.badge === 'function' ? meta.badge() : (meta.badge || '');
    return '' +
      '<section class="hero">' +
        '<div class="hero-icon">' + (meta.icon || '📘') + '</div>' +
        '<div class="hero-main">' +
          '<h1>' + UI.esc(meta.title) + '</h1>' +
          '<p>' + UI.esc(meta.subtitle || '') + '</p>' +
        '</div>' +
        (badge ? '<div class="hero-badge">' + UI.esc(badge) + '</div>' : '') +
      '</section>';
  };

  UI.bar = function (percent, cls) {
    var p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + p + '%"></i></div>';
  };

  UI.empty = function (emoji, text) {
    return '<div class="empty"><span class="emoji">' + emoji + '</span>' + text + '</div>';
  };

  UI.tag = function (text, cls) {
    return '<span class="tag ' + (cls || '') + '">' + UI.esc(text) + '</span>';
  };

  /* ---------- 打卡 ---------- */
  UI.checkinButton = function (label) {
    return '<div class="checkin-bar"><button class="btn btn-primary btn-lg" data-checkin>' +
      '📌 ' + (label || '打卡') + '</button></div>';
  };

  UI.bindCheckin = function (root, moduleId, moduleName) {
    var btn = root.querySelector('[data-checkin]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var res = Store.checkin(moduleId, moduleName);
      if (res.first) {
        UI.toast('打卡成功！积分 +5 ⭐', 'ok');
      } else {
        UI.toast('今天已经打过卡啦，继续加油！', 'ok');
      }
      btn.textContent = '✅ 今日已打卡';
      btn.disabled = true;
      if (typeof root.__afterCheckin === 'function') root.__afterCheckin();
    });
    // 已打卡则显示状态
    var today = Store.ensureDay();
    if (today.checkins[moduleId]) {
      btn.textContent = '✅ 今日已打卡';
      btn.disabled = true;
    }
  };

  /* ---------- 语音提示 ---------- */
  UI.voiceWarned = false;
  UI.checkVoice = function () {
    if (window.Speech && !Speech.supported()) {
      if (!UI.voiceWarned) {
        UI.voiceWarned = true;
        UI.toast('当前浏览器不支持语音朗读，其他功能不受影响', 'warn', 3000);
      }
      return false;
    }
    return true;
  };

  window.UI = UI;
})();
