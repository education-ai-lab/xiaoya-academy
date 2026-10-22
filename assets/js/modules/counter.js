/* 拍球 / 跳绳 计数器 */
(function () {
  'use strict';

  function build(id, cfg) {
    function render(root) {
      var value = 0;
      var seconds = 0;
      var timer = null;
      var running = false;

      if (!Array.isArray(Store.state.counterLog)) Store.state.counterLog = [];
      var best = (Store.state.counters[id] && Store.state.counters[id].best) || 0;

      root.innerHTML =
        '<div class="card">' +
          '<div class="counter">' +
            '<div class="emoji">' + cfg.emoji + '</div>' +
            '<div class="big" id="num">0</div>' +
            '<div class="target">/ ' + cfg.target + ' 个目标 · 最佳 <b id="best">' + best + '</b> 个</div>' +
            '<div style="margin-top:14px">' + UI.bar(0, 'sky') + '</div>' +
          '</div>' +
          '<div class="btn-row center" style="margin-top:20px">' +
            '<button class="btn btn-mint btn-lg" id="plus" style="min-width:96px">+1</button>' +
            '<button class="btn btn-danger btn-lg" id="minus" style="min-width:96px">−1</button>' +
          '</div>' +
          '<div class="btn-row center" style="margin-top:12px">' +
            '<button class="btn btn-sm btn-ghost" id="zero">🧹 清零</button>' +
            '<button class="btn btn-sm btn-primary" id="save">💾 保存成绩</button>' +
            '<span class="timer">⏱ <b id="clock">00:00</b></span>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><h2>训练记录</h2><div class="spacer"></div>' +
            '<span class="hint">共 ' + (Store.state.counterLog.filter(function (r) { return r.type === id; }).length) + ' 次</span></div>' +
          '<div id="logs"></div>' +
        '</div>' +
        '<div class="notice"><b>' + cfg.tipTitle + '：</b>' + cfg.tip + '</div>' +
        UI.checkinButton('打卡');

      var num = root.querySelector('#num');
      var bar = root.querySelector('.bar');
      var clock = root.querySelector('#clock');
      var logs = root.querySelector('#logs');
      var bestEl = root.querySelector('#best');

      function paintLogs() {
        var list = Store.state.counterLog.filter(function (r) { return r.type === id; }).slice(0, 6);
        if (!list.length) {
          logs.innerHTML = UI.empty('📝', '还没有记录，练完记得点“保存成绩”');
          return;
        }
        logs.innerHTML = '<div class="list">' + list.map(function (r) {
          return '<div class="list-row">' +
            '<div class="lr-ico">' + cfg.emoji + '</div>' +
            '<div class="lr-main"><strong>' + r.value + ' 个</strong>' +
              '<span>' + UI.esc(r.date) + (r.seconds ? ' · 用时 ' + UI.fmtDuration(r.seconds) : '') + '</span></div>' +
            '<div class="lr-act">' + (r.value >= cfg.target ? UI.tag('达标', 'mint') : UI.tag('继续加油', 'gray')) + '</div>' +
          '</div>';
        }).join('') + '</div>';
      }

      function paint() {
        num.textContent = value;
        var p = Math.min(100, (value / cfg.target) * 100);
        bar.innerHTML = '<i style="width:' + p + '%"></i>';
      }

      function startTimer() {
        if (running) return;
        running = true;
        var t0 = Date.now();
        timer = setInterval(function () {
          seconds = Math.floor((Date.now() - t0) / 1000);
          clock.textContent = UI.fmtClock(seconds);
        }, 500);
      }

      function stopTimer() {
        if (timer) { clearInterval(timer); timer = null; }
        running = false;
      }

      root.querySelector('#plus').addEventListener('click', function () {
        value++;
        startTimer();
        paint();
      });
      root.querySelector('#minus').addEventListener('click', function () {
        value = Math.max(0, value - 1);
        paint();
      });
      root.querySelector('#zero').addEventListener('click', function () {
        value = 0;
        seconds = 0;
        stopTimer();
        clock.textContent = '00:00';
        paint();
        UI.toast('已清零，重新开始', 'ok');
      });
      root.querySelector('#save').addEventListener('click', function () {
        if (value <= 0) { UI.toast('先数几个再保存吧', 'warn'); return; }
        stopTimer();
        Store.state.counterLog.unshift({
          type: id, value: value, seconds: seconds, date: Store.today()
        });
        if (Store.state.counterLog.length > 200) Store.state.counterLog.length = 200;
        var rec = Store.state.counters[id] || { best: 0, last: 0 };
        rec.last = value;
        if (value > (rec.best || 0)) rec.best = value;
        Store.state.counters[id] = rec;
        Store.addPoints(2);
        Store.recordPractice(id, 1, 1, seconds);
        Store.save();
        bestEl.textContent = rec.best;
        paintLogs();
        UI.toast('已保存 ' + value + ' 个，积分 +2', 'ok');
      });

      paint();
      paintLogs();
      UI.bindCheckin(root, id, cfg.name);
      return function () { stopTimer(); };
    }

    Modules.register(id, {
      icon: cfg.emoji,
      title: cfg.name,
      subtitle: cfg.subtitle,
      badge: '目标 ' + cfg.target + ' 个',
      render: render
    });
  }

  build('ball', {
    emoji: '🏀',
    name: '拍球计数',
    subtitle: '目标 100 个 · 自动计时 · 记录最佳成绩',
    target: 100,
    tipTitle: '拍球要领',
    tip: '双脚分开与肩同宽，用手腕和小臂发力，球拍到腰部高度就好。眼睛看前方，不要一直盯着球。'
  });

  build('rope', {
    emoji: '🪢',
    name: '跳绳计数',
    subtitle: '目标 200 个 · 自动计时 · 记录最佳成绩',
    target: 200,
    tipTitle: '跳绳要领',
    tip: '前脚掌轻轻落地，膝盖微弯缓冲；手腕摇绳，大臂夹紧身体。先慢后快，节奏比速度更重要。'
  });
})();
