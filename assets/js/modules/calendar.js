/* 学习打卡日历 */
(function () {
  'use strict';

  var NAMES = {
    pinyin: '拼音', chars: '识字', poem: '古诗', recite: '朗读',
    math: '口算', sudoku: '数独', logic: '应用题', focus: '方格专注',
    phonics: '字母拼读', raz: '分级阅读', english: '每日口语',
    ball: '拍球', rope: '跳绳', fitness: '每日体能', vestibular: '平衡练习',
    swim: '游泳', drum: '节拍', science: '科学'
  };

  function render(root) {
    var now = new Date();
    var viewY = now.getFullYear();
    var viewM = now.getMonth();

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>打卡日历</h2><div class="spacer"></div>' +
          '<span class="hint" id="monthHint"></span></div>' +
        '<div class="stats" id="stats" style="margin-bottom:18px"></div>' +
        '<div class="cal-head">' +
          '<button class="icon-btn" id="prevM" aria-label="上个月">‹</button>' +
          '<span id="monthLabel"></span>' +
          '<button class="icon-btn" id="nextM" aria-label="下个月">›</button>' +
        '</div>' +
        '<div class="cal-grid" id="calGrid"></div>' +
        '<div class="btn-row center" style="margin-top:20px">' +
          '<button class="btn btn-pink" id="summary">📊 月末总结</button>' +
          '<button class="btn btn-mint" id="todayList">📌 今日打卡项</button>' +
        '</div>' +
      '</div>' +
      '<div class="notice"><b>打卡说明：</b>每个模块每天第一次打卡 +5 积分。日历上紫色的日子就是有学习记录的日子，点一下能看到当天做了什么。</div>';

    var grid = root.querySelector('#calGrid');
    var stats = root.querySelector('#stats');
    var monthLabel = root.querySelector('#monthLabel');
    var monthHint = root.querySelector('#monthHint');

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function paint() {
      var st = Store.monthStats(viewY, viewM);
      stats.innerHTML =
        '<div class="stat"><b>' + st.days + '</b><span>本月打卡天数</span></div>' +
        '<div class="stat mint"><b>' + st.times + '</b><span>打卡次数</span></div>' +
        '<div class="stat amber"><b>' + st.points + '</b><span>本月积分</span></div>' +
        '<div class="stat pink"><b>' + Store.streak() + '</b><span>连续天数</span></div>';

      monthLabel.textContent = viewY + ' 年 ' + (viewM + 1) + ' 月';
      monthHint.textContent = '共 ' + st.days + ' 天有学习记录';

      var first = new Date(viewY, viewM, 1);
      var startWd = first.getDay();
      var totalDays = new Date(viewY, viewM + 1, 0).getDate();
      var todayKey = Store.today();

      var html = ['日', '一', '二', '三', '四', '五', '六'].map(function (w) {
        return '<div class="cal-wd">' + w + '</div>';
      }).join('');

      for (var i = 0; i < startWd; i++) html += '<div class="cal-cell blank"></div>';

      for (var d = 1; d <= totalDays; d++) {
        var key = viewY + '-' + pad(viewM + 1) + '-' + pad(d);
        var day = Store.state.days[key];
        var has = false;
        if (day) {
          has = Object.keys(day.checkins || {}).length > 0 ||
            Object.keys(day.practice || {}).length > 0;
        }
        var cls = 'cal-cell';
        if (has) cls += ' has';
        if (key === todayKey) cls += ' today';
        if (key > todayKey) cls += ' future';
        html += '<div class="' + cls + '" data-key="' + key + '">' + d + '</div>';
      }

      grid.innerHTML = html;
    }

    function dayDetail(key) {
      var day = Store.state.days[key];
      if (!day) {
        UI.toast('这一天还没有学习记录', 'warn');
        return;
      }
      var checkins = Object.keys(day.checkins || {});
      var practices = Object.keys(day.practice || {});
      var html = '';
      if (checkins.length) {
        html += '<h3>📌 打卡项目</h3><div class="list">' + checkins.map(function (m) {
          return '<div class="list-row"><div class="lr-ico">✅</div><div class="lr-main"><strong>' +
            UI.esc(NAMES[m] || m) + '</strong><span>打卡 ' + day.checkins[m] + ' 次</span></div></div>';
        }).join('') + '</div>';
      }
      if (practices.length) {
        html += '<h3>🧮 做题记录</h3><div class="list">' + practices.map(function (m) {
          var p = day.practice[m];
          return '<div class="list-row"><div class="lr-ico">📝</div><div class="lr-main"><strong>' +
            UI.esc(NAMES[m] || m) + '</strong><span>完成 ' + p.total + ' 题 · 答对 ' + p.correct +
            ' · 正确率 ' + UI.pct(p.correct, p.total) + '%</span></div></div>';
        }).join('') + '</div>';
      }
      if (!html) html = UI.empty('🌙', '这一天只是打开了小芽学园，还没有留下记录');
      html += '<div class="section-note" style="margin-top:14px">当天积分：' + (day.points || 0) + ' 分</div>';
      UI.modal({ title: key, body: html, width: 460 });
    }

    grid.addEventListener('click', function (e) {
      var c = e.target.closest('[data-key]');
      if (c) dayDetail(c.getAttribute('data-key'));
    });

    root.querySelector('#prevM').addEventListener('click', function () {
      viewM--;
      if (viewM < 0) { viewM = 11; viewY--; }
      paint();
    });
    root.querySelector('#nextM').addEventListener('click', function () {
      viewM++;
      if (viewM > 11) { viewM = 0; viewY++; }
      paint();
    });

    root.querySelector('#summary').addEventListener('click', function () {
      var st = Store.monthStats(viewY, viewM);
      var rank = Store.moduleCheckinRank();
      var top = rank.length ? (NAMES[rank[0].id] || rank[0].id) + '（' + rank[0].count + ' 次）' : '还没有记录';
      var acc = st.practice ? Math.round((st.correct / st.practice) * 100) : 0;
      UI.modal({
        title: (viewM + 1) + ' 月学习总结',
        body:
          '<div class="kpi-grid" style="margin-bottom:6px">' +
            '<div class="kpi"><span>学习天数</span><b>' + st.days + '<em>天</em></b></div>' +
            '<div class="kpi"><span>打卡次数</span><b>' + st.times + '<em>次</em></b></div>' +
            '<div class="kpi"><span>做题总数</span><b>' + st.practice + '<em>题</em></b></div>' +
            '<div class="kpi"><span>正确率</span><b>' + acc + '<em>%</em></b></div>' +
          '</div>' +
          '<p style="margin-top:16px">🏆 最常练习：<b>' + UI.esc(top) + '</b></p>' +
          '<p>⭐ 本月获得积分：<b>' + st.points + '</b> 分</p>' +
          '<p>' + (st.days >= 20 ? '这个月几乎每天都在学习，非常了不起！' :
            st.days >= 10 ? '保持得不错，下个月试着多坚持几天。' :
            st.days > 0 ? '已经开始了，每天 10 分钟就很好。' :
            '这个月还没有记录，从今天开始吧。') + '</p>',
        actions: [{ text: '知道啦', kind: 'primary' }]
      });
    });

    root.querySelector('#todayList').addEventListener('click', function () {
      var list = Store.todayCheckins();
      if (!list.length) {
        UI.modal({
          title: '今日打卡项',
          body: UI.empty('📌', '今天还没有打卡<br>去任意模块点一下“打卡”吧'),
          actions: [{ text: '去学习', kind: 'primary', onClick: function () { location.hash = '#/pinyin'; } }]
        });
        return;
      }
      UI.modal({
        title: '今日打卡项',
        body: '<div class="list">' + list.map(function (c) {
          return '<div class="list-row"><div class="lr-ico">✅</div><div class="lr-main"><strong>' +
            UI.esc(NAMES[c.id] || c.id) + '</strong><span>今天打卡 ' + c.count + ' 次</span></div>' +
            '<div class="lr-act">' + UI.tag('已完成', 'mint') + '</div></div>';
        }).join('') + '</div>',
        actions: [{ text: '继续学习', kind: 'primary' }]
      });
    });

    paint();
    return function () {};
  }

  Modules.register('calendar', {
    icon: '📅',
    title: '打卡日历',
    subtitle: '每日打卡 · 月末总结',
    badge: function () { return Store.monthStats(new Date().getFullYear(), new Date().getMonth()).days + ' 天'; },
    render: render
  });
})();
