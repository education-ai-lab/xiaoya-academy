/* 游泳训练 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    if (!Array.isArray(Store.state.swimLog)) Store.state.swimLog = [];

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>四种泳姿</h2><div class="spacer"></div>' +
          '<span class="hint">每升一级 +5 积分</span></div>' +
        '<div class="cards" id="grid"></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>训练记录</h2><div class="spacer"></div>' +
          '<span class="hint" id="logCount"></span></div>' +
        '<div id="records"></div>' +
      '</div>' +
      '<div class="notice sky"><b>升级说明：</b>每个泳姿 0～5 级。孩子能独立完成该级别的小目标（比如换气 5 次、游 10 米），就点 “+” 升一级。</div>' +
      UI.checkinButton('打卡');

    var grid = root.querySelector('#grid');
    var records = root.querySelector('#records');
    var logCount = root.querySelector('#logCount');

    function lvOf(id) { return Store.state.swim[id] || 0; }

    function paint() {
      grid.innerHTML = DATA.swim.map(function (s) {
        var lv = lvOf(s.id);
        var label = lv === 0 ? '未开始' : '初学';
        return '<div class="swim-card" data-id="' + s.id + '">' +
          '<div class="emo">' + s.emo + '</div>' +
          '<h4>' + UI.esc(s.name) + '</h4>' +
          '<span class="tag ' + (lv > 0 ? 'sky' : 'gray') + '">' + label + '</span>' +
          '<div class="lv-row">' +
            '<button class="lv-btn" data-lv="-1" aria-label="降一级">−</button>' +
            '<span class="lv-chip' + (lv === 0 ? ' zero' : '') + '">Lv.' + lv + '</span>' +
            '<button class="lv-btn" data-lv="1" aria-label="升一级">+</button>' +
          '</div>' +
          '<div style="margin-top:12px">' + UI.bar((lv / 5) * 100, 'sky') + '</div>' +
          '<button class="btn btn-sm btn-ghost btn-block" data-swim-checkin style="margin-top:12px">📌 打卡</button>' +
          '<div class="fit-tip" style="margin-top:8px">' + UI.esc(s.tip) + '</div>' +
        '</div>';
      }).join('');

      logCount.textContent = '共 ' + Store.state.swimLog.length + ' 条';
      var rows = DATA.swim.map(function (s) {
        var lv = lvOf(s.id);
        return '<div class="hbar-row"><span>' + s.emo + ' ' + UI.esc(s.name) + '</span>' +
          '<div class="track"><i style="width:' + (lv / 5) * 100 + '%"></i></div>' +
          '<b>Lv.' + lv + '/5</b></div>';
      }).join('');
      records.innerHTML = '<div class="hbar">' + rows + '</div>';
    }

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.swim-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var s = DATA.swim.filter(function (x) { return x.id === id; })[0];

      if (e.target.closest('[data-swim-checkin]')) {
        var res = Store.checkin('swim', '游泳');
        Store.state.swimLog.unshift({
          id: id, name: s.name, level: lvOf(id), date: Store.today()
        });
        Store.recordPractice('swim', 1, 1, 0);
        Store.save();
        UI.toast(res.first ? '游泳打卡成功，积分 +5' : '今天已经打过卡啦', 'ok');
        paint();
        return;
      }

      var btn = e.target.closest('[data-lv]');
      if (!btn) return;
      var delta = Number(btn.getAttribute('data-lv'));
      var cur = lvOf(id);
      var next = Math.max(0, Math.min(5, cur + delta));
      if (next === cur) {
        UI.toast(delta > 0 ? '已经是最高等级 Lv.5 啦' : '已经是最低等级 Lv.0', 'warn');
        return;
      }
      Store.state.swim[id] = next;
      if (delta > 0) {
        Store.addPoints(5);
        Store.state.swimLog.unshift({ id: id, name: s.name, level: next, date: Store.today() });
        UI.toast(s.name + ' 升级到 Lv.' + next + '，积分 +5', 'ok');
      } else {
        UI.toast(s.name + ' 调整为 Lv.' + next, 'warn');
      }
      Store.save();
      paint();
    });

    paint();
    UI.bindCheckin(root, 'swim', '游泳');
    return function () {};
  }

  Modules.register('swim', {
    icon: '🏊',
    title: '游泳进阶',
    subtitle: '四种泳姿 · 等级升级 · 打卡记录',
    badge: '4 种泳姿',
    render: render
  });
})();
