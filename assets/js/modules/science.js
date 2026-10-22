/* 科普专区 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var listCard, detailCard, grid, progEl, current = null, answered = false;

    root.innerHTML =
      '<div class="card" id="listCard">' +
        '<div class="card-head"><h2>科学小知识</h2><div class="spacer"></div>' +
          '<span class="hint" id="prog"></span></div>' +
        '<div class="cards" id="grid"></div>' +
      '</div>' +
      '<div class="card" id="detailCard" style="display:none"></div>' +
      '<div class="notice sky"><b>怎么读：</b>先读一遍正文，再回答下面的小问题。答错没关系，看看解析就懂了。</div>' +
      UI.checkinButton('打卡');

    listCard = root.querySelector('#listCard');
    detailCard = root.querySelector('#detailCard');
    grid = root.querySelector('#grid');
    progEl = root.querySelector('#prog');

    function paintList() {
      var read = Store.state.mastered.science.length;
      progEl.textContent = '已读 ' + read + '/' + DATA.science.length + ' 篇';
      grid.innerHTML = DATA.science.map(function (s) {
        var done = Store.isMastered('science', s.id);
        return '<div class="sci-card" data-open="' + s.id + '">' +
          '<div class="sci-emo">' + s.emo + '</div>' +
          '<h4>' + UI.esc(s.title) + '</h4>' +
          '<div class="sci-foot">' + (done ? UI.tag('已读', 'mint') : UI.tag('未读', 'gray')) +
            '<span>读一读 →</span></div>' +
        '</div>';
      }).join('');
    }

    function open(id) {
      var s = DATA.science.filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      current = s;
      answered = false;
      listCard.style.display = 'none';
      detailCard.style.display = '';
      detailCard.innerHTML =
        '<div class="card-head">' +
          '<button class="btn btn-sm btn-ghost" id="back">← 返回科普馆</button><div class="spacer"></div>' +
          (Store.isMastered('science', s.id) ? UI.tag('已读', 'mint') : UI.tag('新内容', 'pink')) +
        '</div>' +
        '<div class="sci-hero"><span>' + s.emo + '</span><h2>' + UI.esc(s.title) + '</h2></div>' +
        '<div class="sci-body">' + UI.esc(s.body) + '</div>' +
        '<div class="sci-quiz">' +
          '<h3>🤔 小问答：' + UI.esc(s.q) + '</h3>' +
          '<div id="opts">' + s.opts.map(function (o, i) {
            return '<button class="opt" data-opt="' + i + '"><span class="k">' + 'ABC'.charAt(i) + '</span>' + UI.esc(o) + '</button>';
          }).join('') + '</div>' +
          '<div id="exp"></div>' +
        '</div>';

      detailCard.querySelector('#back').addEventListener('click', function () {
        detailCard.style.display = 'none';
        listCard.style.display = '';
        paintList();
      });

      detailCard.querySelector('#opts').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-opt]');
        if (!btn || answered) return;
        answered = true;
        var pick = Number(btn.getAttribute('data-opt'));
        var ok = pick === s.a;
        var opts = detailCard.querySelectorAll('.opt');
        for (var i = 0; i < opts.length; i++) {
          opts[i].disabled = true;
          var idx = Number(opts[i].getAttribute('data-opt'));
          if (idx === s.a) opts[i].classList.add('ok');
          if (idx === pick && !ok) opts[i].classList.add('bad');
        }
        if (ok) {
          Store.markMastered('science', s.id);
          Store.addPoints(2);
          Store.recordPractice('science', 1, 1, 0);
          UI.toast('答对啦！积分 +2', 'ok');
        } else {
          Store.addWrong({ module: 'science', moduleName: '科普', q: s.q, answer: s.opts[s.a], userAnswer: s.opts[pick] });
          Store.recordPractice('science', 1, 0, 0);
          UI.toast('再想想～看看解析', 'warn');
        }
        detailCard.querySelector('#exp').innerHTML =
          '<div class="answer-box" style="margin-top:14px">' +
            '<b>' + (ok ? '✅ 回答正确' : '💡 正确答案：' + UI.esc(s.opts[s.a])) + '</b><br>' + UI.esc(s.exp) +
          '</div>';
      });
    }

    grid.addEventListener('click', function (e) {
      var c = e.target.closest('[data-open]');
      if (c) open(c.getAttribute('data-open'));
    });

    paintList();
    UI.bindCheckin(root, 'science', '科普');
    return function () {};
  }

  Modules.register('science', {
    icon: '🔬',
    title: '科学小知识',
    subtitle: '生活中的为什么 · 小问答 · 亲子共读',
    badge: function () { return '已读 ' + Store.state.mastered.science.length + '/' + DATA.science.length; },
    render: render
  });
})();
