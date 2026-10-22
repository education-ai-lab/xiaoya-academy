/* 古诗学习 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var idx = 0;

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>选一首诗</h2><div class="spacer"></div>' +
          '<span class="hint">点标题切换</span></div>' +
        '<div class="poem-chips" id="chips"></div>' +
      '</div>' +
      '<div class="card" id="poemCard"></div>' +
      '<div class="card">' +
        '<div class="progress-line"><span>学习进度</span><span id="progText"></span></div>' +
        '<div id="barWrap"></div>' +
      '</div>' +
      UI.checkinButton('打卡');

    var chips = root.querySelector('#chips');
    var card = root.querySelector('#poemCard');
    var progText = root.querySelector('#progText');
    var barWrap = root.querySelector('#barWrap');

    function paintChips() {
      chips.innerHTML = DATA.poems.map(function (p, i) {
        var read = Store.isMastered('poems', p.id);
        return '<button class="poem-chip' + (i === idx ? ' active' : '') + '" data-i="' + i + '">' +
          (read ? '✓ ' : '') + UI.esc(p.title) +
          '<em>' + UI.esc(p.author) + '</em></button>';
      }).join('');
    }

    function paintCard() {
      var p = DATA.poems[idx];
      var read = Store.isMastered('poems', p.id);
      card.innerHTML =
        '<div class="poem">' +
          '<h3>' + UI.esc(p.title) + '</h3>' +
          '<div class="by">〔' + UI.esc(p.dynasty) + '〕' + UI.esc(p.author) + ' · ' + UI.esc(p.grade) + '</div>' +
          '<div class="lines">' + p.lines.map(UI.esc).join('<br>') + '</div>' +
          '<div class="trans"><b>诗意：</b>' + UI.esc(p.trans) + '</div>' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-pink" data-say>🔊 朗读</button>' +
          '<button class="btn btn-mint" data-slow>🐢 慢速跟读</button>' +
          '<button class="btn ' + (read ? 'btn-soft' : 'btn-ghost') + '" data-read>' +
            (read ? '✅ 已读' : '✅ 标记已读') + '</button>' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:10px">' +
          '<button class="btn btn-sm btn-ghost" data-prev>← 上一首</button>' +
          '<button class="btn btn-sm btn-ghost" data-next>下一首 →</button>' +
        '</div>';

      var done = DATA.poems.filter(function (x) { return Store.isMastered('poems', x.id); }).length;
      progText.innerHTML = '已完成 <b>' + done + '</b>/' + DATA.poems.length + ' 首 · ' + Math.round((done / DATA.poems.length) * 100) + '%';
      barWrap.innerHTML = UI.bar((done / DATA.poems.length) * 100);
      paintChips();
    }

    chips.addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      idx = Number(b.getAttribute('data-i'));
      Speech.stop();
      paintCard();
    });

    card.addEventListener('click', function (e) {
      var p = DATA.poems[idx];
      if (e.target.closest('[data-say]')) {
        if (UI.checkVoice()) Speech.speak(p.title + '。' + p.author + '。' + p.lines.join(''), { lang: 'zh-CN' });
        if (!Store.isMastered('poems', p.id)) {
          Store.markMastered('poems', p.id);
          paintCard();
        }
        return;
      }
      if (e.target.closest('[data-slow]')) {
        if (UI.checkVoice()) Speech.slow(p.lines.join(''), 'zh-CN');
        return;
      }
      if (e.target.closest('[data-read]')) {
        if (Store.isMastered('poems', p.id)) {
          Store.state.mastered.poems = Store.state.mastered.poems.filter(function (x) { return x !== p.id; });
          Store.save();
          UI.toast('已取消标记', 'warn');
        } else {
          Store.markMastered('poems', p.id);
          UI.toast('又读懂一首古诗啦！', 'ok');
        }
        paintCard();
        return;
      }
      if (e.target.closest('[data-prev]')) {
        idx = (idx - 1 + DATA.poems.length) % DATA.poems.length;
        Speech.stop(); paintCard();
        return;
      }
      if (e.target.closest('[data-next]')) {
        idx = (idx + 1) % DATA.poems.length;
        Speech.stop(); paintCard();
      }
    });

    paintCard();
    UI.bindCheckin(root, 'poem', '古诗');
    return function () { Speech.stop(); };
  }

  Modules.register('poem', {
    icon: '📜',
    title: '古诗诵读',
    subtitle: '逐句朗读 · 诗意讲解 · 阅读进度',
    badge: function () {
      return '已完成 ' + Store.state.mastered.poems.length + '/' + DATA.poems.length;
    },
    render: render
  });
})();
