/* 生字学习 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var filter = 'all';

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>常用字</h2><div class="spacer"></div>' +
          '<div class="seg" id="segFilter">' +
            '<button data-f="all" class="active">全部</button>' +
            '<button data-f="todo">未认识</button>' +
            '<button data-f="done">已认识</button>' +
          '</div>' +
        '</div>' +
        '<div class="progress-line"><span id="progText">已认识 <b>0</b>/' + DATA.chars.length + ' 个字</span>' +
          '<span>点字听读音 · 认识就打个勾</span></div>' +
        '<div id="barWrap"></div>' +
        '<div id="charArea" style="margin-top:16px"></div>' +
      '</div>' +
      '<div class="notice"><b>识字小妙招：</b>先看字形，再听读音，最后用这个字说一个词语。每天认识 3～5 个新字，比一次记很多更牢。</div>' +
      UI.checkinButton('打卡');

    var area = root.querySelector('#charArea');
    var barWrap = root.querySelector('#barWrap');
    var progText = root.querySelector('#progText');
    var seg = root.querySelector('#segFilter');

    function paint() {
      var done = DATA.chars.filter(function (c) { return Store.isMastered('chars', c.ch); }).length;
      progText.innerHTML = '已认识 <b>' + done + '</b>/' + DATA.chars.length + ' 个字';
      barWrap.innerHTML = UI.bar((done / DATA.chars.length) * 100, 'mint');

      var list = DATA.chars.filter(function (c) {
        var m = Store.isMastered('chars', c.ch);
        if (filter === 'todo') return !m;
        if (filter === 'done') return m;
        return true;
      });

      if (!list.length) {
        area.innerHTML = UI.empty('🌱', filter === 'done' ? '还没有认识的字，去学几个吧' : '全部认识啦，太棒了！');
        return;
      }

      area.innerHTML = '<div class="cards wide">' + list.map(function (c) {
        var m = Store.isMastered('chars', c.ch);
        return '<div class="char-card' + (m ? ' done' : '') + '" data-ch="' + UI.esc(c.ch) + '">' +
          '<div class="zi">' + UI.esc(c.ch) + '</div>' +
          '<div class="info">' +
            '<div class="py">' + UI.esc(c.p) + '</div>' +
            '<div class="meta">' +
              UI.tag('部首 ' + c.r, 'sky') + UI.tag(c.s + ' 画', 'gray') +
            '</div>' +
            '<div class="words">组词：' + c.w.map(UI.esc).join(' · ') + '</div>' +
            '<div class="sent">例句：' + UI.esc(c.e) + '</div>' +
          '</div>' +
          '<div class="acts">' +
            '<button class="btn btn-sm btn-soft" data-say>🔊 读</button>' +
            '<button class="btn btn-sm ' + (m ? 'btn-mint' : 'btn-ghost') + '" data-know>' +
              (m ? '✓ 已认识' : '认识') + '</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    area.addEventListener('click', function (e) {
      var card = e.target.closest('.char-card');
      if (!card) return;
      var ch = card.getAttribute('data-ch');
      var item = DATA.chars.filter(function (c) { return c.ch === ch; })[0];
      if (!item) return;

      if (e.target.closest('[data-know]')) {
        if (Store.isMastered('chars', ch)) {
          Store.state.mastered.chars = Store.state.mastered.chars.filter(function (x) { return x !== ch; });
          Store.save();
          UI.toast('已移回“未认识”', 'warn');
        } else {
          Store.markMastered('chars', ch);
          UI.toast('认识“' + ch + '”啦！', 'ok');
        }
        paint();
        return;
      }

      if (UI.checkVoice()) {
        Speech.speak(item.ch + '，' + item.w[0] + '，' + item.e, { lang: 'zh-CN' });
      }
    });

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (!b) return;
      filter = b.getAttribute('data-f');
      seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
      paint();
    });

    paint();
    UI.bindCheckin(root, 'chars', '生字');
    return function () { Speech.stop(); };
  }

  Modules.register('chars', {
    icon: '✏️',
    title: '识字本',
    subtitle: '常用字 · 部首笔画 · 组词例句',
    badge: function () {
      return '已认识 ' + Store.state.mastered.chars.length + '/' + DATA.chars.length;
    },
    render: render
  });
})();
