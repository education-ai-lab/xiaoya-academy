/* 居家体适能 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var m = Store.state.mastered;
    if (m.fitnessDate !== Store.today()) {
      m.fitnessDate = Store.today();
      m.fitness = [];
      Store.save();
    }

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>今日运动</h2><div class="spacer"></div>' +
          '<span class="hint" id="progText"></span></div>' +
        '<div id="barWrap"></div>' +
        '<div class="cards" id="grid" style="margin-top:16px"></div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-sm btn-ghost" id="reset">🔄 重新开始</button>' +
        '</div>' +
      '</div>' +
      '<div class="notice"><b>运动小提示：</b>先热身 1 分钟，再开始做。每组之间休息 30 秒，做完记得拉伸和喝水。身体不舒服就停下来。</div>' +
      UI.checkinButton('打卡');

    var grid = root.querySelector('#grid');
    var barWrap = root.querySelector('#barWrap');
    var progText = root.querySelector('#progText');

    function paint() {
      var done = m.fitness.length;
      progText.textContent = '已完成 ' + done + '/' + DATA.fitness.length + ' 项';
      barWrap.innerHTML = UI.bar((done / DATA.fitness.length) * 100, 'mint');
      grid.innerHTML = DATA.fitness.map(function (f) {
        var on = m.fitness.indexOf(f.name) !== -1;
        return '<div class="fit-card' + (on ? ' done' : '') + '" data-n="' + UI.esc(f.name) + '">' +
          '<div class="fit-emo">' + f.emo + '</div>' +
          '<h4>' + UI.esc(f.name) + '</h4>' +
          '<div class="fit-spec">' + UI.esc(f.spec) + '</div>' +
          '<div class="fit-tip">' + UI.esc(f.tip) + '</div>' +
          '<button class="btn btn-sm ' + (on ? 'btn-mint' : 'btn-ghost') + '" data-toggle>' +
            (on ? '✓ 已完成' : '标记完成') + '</button>' +
        '</div>';
      }).join('');
    }

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.fit-card');
      if (!card) return;
      var name = card.getAttribute('data-n');
      var i = m.fitness.indexOf(name);
      if (i === -1) {
        m.fitness.push(name);
        UI.toast('完成「' + name + '」，真棒！', 'ok');
      } else {
        m.fitness.splice(i, 1);
      }
      Store.save();
      paint();
    });

    root.querySelector('#reset').addEventListener('click', function () {
      m.fitness = [];
      Store.save();
      paint();
      UI.toast('已重置今天的运动清单', 'ok');
    });

    paint();
    UI.bindCheckin(root, 'fitness', '居家体适能');
    return function () {};
  }

  Modules.register('fitness', {
    icon: '🏃',
    title: '每日体能',
    subtitle: '6 项运动 · 每天一轮',
    badge: '6 项',
    render: render
  });
})();
