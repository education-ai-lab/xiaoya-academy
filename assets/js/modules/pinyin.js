/* 拼音训练 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  var TONE = ['', '第一声', '第二声', '第三声', '第四声'];

  function render(root) {
    var state = { mode: 'daily', tone: 0 };
    var daily = UI.dailyPick(DATA.pinyin, 10, 'pinyin');
    var day = Store.ensureDay();
    if (!Array.isArray(day.pinyinDone)) day.pinyinDone = [];

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<h2>今日卡片</h2><div class="spacer"></div>' +
          '<div class="seg" id="segMode">' +
            '<button data-mode="daily" class="active">每日练习</button>' +
            '<button data-mode="all">浏览全部</button>' +
          '</div>' +
        '</div>' +
        '<div class="progress-line"><span id="progText">已完成 <b>0</b>/10 组</span>' +
          '<span id="progHint">点卡片听发音 · 会自动打勾</span></div>' +
        '<div id="barWrap"></div>' +
        '<div id="cards" style="margin-top:14px"></div>' +
      '</div>' +
      '<div class="notice"><b>怎么玩：</b>先听一遍标准读音，再跟着读一遍。读完点一下卡片，就会自动打勾。声调读不准没关系，多听几遍就好啦。</div>' +
      UI.checkinButton('打卡');

    var cardsEl = root.querySelector('#cards');
    var barWrap = root.querySelector('#barWrap');
    var progText = root.querySelector('#progText');
    var progHint = root.querySelector('#progHint');
    var seg = root.querySelector('#segMode');

    function toneChips() {
      var html = '<div class="btn-row" style="margin-bottom:14px">';
      ['全部', '一声', '二声', '三声', '四声'].forEach(function (t, i) {
        html += '<button class="btn btn-sm ' + (state.tone === i ? 'btn-primary' : 'btn-ghost') +
          '" data-tone="' + i + '">' + t + '</button>';
      });
      html += '</div>';
      return html;
    }

    function paint() {
      var list = state.mode === 'daily' ? daily : DATA.pinyin.filter(function (p) {
        return state.tone === 0 || p.t === state.tone;
      });

      var doneCount = 0;
      daily.forEach(function (p) { if (day.pinyinDone.indexOf(p.s) !== -1) doneCount++; });

      if (state.mode === 'daily') {
        progText.innerHTML = '已完成 <b>' + doneCount + '</b>/10 组';
        progHint.textContent = '点卡片听发音 · 会自动打勾';
        barWrap.innerHTML = UI.bar((doneCount / 10) * 100);
      } else {
        var mastered = Store.state.mastered.pinyin.length;
        progText.innerHTML = '已掌握 <b>' + mastered + '</b>/' + DATA.pinyin.length + ' 个音节';
        progHint.textContent = '按声调筛选 · 点卡片听发音';
        barWrap.innerHTML = UI.bar((mastered / DATA.pinyin.length) * 100, 'mint');
      }

      var html = state.mode === 'all' ? toneChips() : '';
      html += '<div class="cards">';
      list.forEach(function (p, i) {
        var isDone = state.mode === 'daily'
          ? day.pinyinDone.indexOf(p.s) !== -1
          : Store.isMastered('pinyin', p.s);
        html += '<div class="py-card' + (isDone ? ' done' : '') + '" data-idx="' + i + '" data-s="' + UI.esc(p.s) + '">' +
          '<button class="play" data-play="1" aria-label="播放">▶</button>' +
          '<div class="py">' + UI.esc(p.s) + '</div>' +
          '<div class="tone">' + TONE[p.t] + '</div>' +
          '<div class="ch">' + UI.esc(p.ch) + '</div>' +
          '<div class="word">' + UI.esc(p.word) + '</div>' +
        '</div>';
      });
      html += '</div>';
      cardsEl.innerHTML = html;
      cardsEl.__list = list;
    }

    function speakItem(p) {
      if (!UI.checkVoice()) return;
      Speech.speak(p.ch + '，' + p.word, { lang: 'zh-CN' });
      var isNew = Store.markMastered('pinyin', p.s);
      if (state.mode === 'daily' && day.pinyinDone.indexOf(p.s) === -1) {
        day.pinyinDone.push(p.s);
        Store.save();
      }
      if (isNew || state.mode === 'daily') paint();
    }

    cardsEl.addEventListener('click', function (e) {
      var card = e.target.closest('.py-card');
      if (!card) return;
      var idx = Number(card.getAttribute('data-idx'));
      var list = cardsEl.__list || [];
      var p = list[idx];
      if (!p) return;
      speakItem(p);
    });

    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-mode]');
      if (!btn) return;
      state.mode = btn.getAttribute('data-mode');
      seg.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      paint();
    });

    cardsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-tone]');
      if (!chip) return;
      state.tone = Number(chip.getAttribute('data-tone'));
      paint();
    });

    paint();
    UI.bindCheckin(root, 'pinyin', '拼音');

    return function () { Speech.stop(); };
  }

  Modules.register('pinyin', {
    icon: '🔤',
    title: '拼音卡片',
    subtitle: '每日 10 组 · 声调 · 跟读',
    badge: '今日 10 组',
    render: render
  });
})();
