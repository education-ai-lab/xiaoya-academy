/* 前庭感统运动 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var m = Store.state.mastered;
    if (m.vestDate !== Store.today()) {
      m.vestDate = Store.today();
      m.vest = [];
      Store.save();
    }

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>今日练习</h2><div class="spacer"></div>' +
          '<span class="hint" id="progText"></span></div>' +
        '<div id="barWrap"></div>' +
        '<div class="vest-list" id="list" style="margin-top:16px"></div>' +
      '</div>' +
      '<div class="notice mint"><b>安全提醒：</b>旋转、翻滚类项目一定要在软垫上做，家长在旁边保护。孩子说头晕就立刻停下来休息。</div>' +
      UI.checkinButton('打卡');

    var list = root.querySelector('#list');
    var barWrap = root.querySelector('#barWrap');
    var progText = root.querySelector('#progText');

    function paint() {
      var done = m.vest.length;
      progText.textContent = '已完成 ' + done + '/' + DATA.vestibular.length + ' 组';
      barWrap.innerHTML = UI.bar((done / DATA.vestibular.length) * 100, 'mint');
      list.innerHTML = DATA.vestibular.map(function (v) {
        var on = m.vest.indexOf(v.name) !== -1;
        return '<div class="vest-card' + (on ? ' done' : '') + '" data-n="' + UI.esc(v.name) + '">' +
          '<div class="vest-head">' +
            '<span class="vest-emo">' + v.emo + '</span>' +
            '<h4>' + UI.esc(v.name) + '</h4>' +
            '<span class="tag ' + (on ? 'mint' : 'gray') + '">' + (on ? '✓ 已完成' : '待完成') + '</span>' +
          '</div>' +
          '<p>' + UI.esc(v.desc) + '</p>' +
          '<div class="vest-foot">' +
            '<span class="timer">⏱ 建议 ' + UI.esc(v.time) + '</span>' +
            '<button class="btn btn-sm ' + (on ? 'btn-soft' : 'btn-mint') + '" data-toggle>' +
              (on ? '取消完成' : '完成打卡') + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    list.addEventListener('click', function (e) {
      var card = e.target.closest('.vest-card');
      if (!card) return;
      var name = card.getAttribute('data-n');
      var i = m.vest.indexOf(name);
      if (i === -1) {
        m.vest.push(name);
        UI.toast('完成「' + name + '」', 'ok');
      } else {
        m.vest.splice(i, 1);
      }
      Store.save();
      paint();
    });

    paint();
    UI.bindCheckin(root, 'vestibular', '前庭训练');
    return function () {};
  }

  Modules.register('vestibular', {
    icon: '🌀',
    title: '平衡练习',
    subtitle: '平衡与协调 · 点击卡片打卡',
    badge: function () { return Store.state.mastered.vest.length + '/' + DATA.vestibular.length + ' 组'; },
    render: render
  });
})();
