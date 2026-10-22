/* 日常英语互动 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var list = UI.dailyPick(DATA.english, 10, 'english');
    var i = 0;
    var day = Store.ensureDay();
    if (!Array.isArray(day.englishDone)) day.englishDone = [];

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>每日 10 句</h2><div class="spacer"></div>' +
          '<span class="tag" id="statusTag">未练习</span></div>' +
        '<div class="progress-line"><span id="idxText">第 1 题 / 10</span><span id="doneText">已练习 0/10</span></div>' +
        '<div id="barWrap"></div>' +
        '<div class="big-en" style="margin-top:14px">' +
          '<div class="en" id="en"></div>' +
          '<div class="zh" id="zh"></div>' +
          '<div class="audio-dots">' +
            '<button class="audio-dot" data-play="normal" title="正常语速">🔊</button>' +
            '<button class="audio-dot" data-play="slow" title="慢速跟读">🐢</button>' +
            '<button class="audio-dot" data-play="repeat" title="再听一遍">🔁</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>回答参考</h2><div class="spacer"></div>' +
          '<button class="btn btn-sm btn-soft" id="showAns">👀 看答案</button></div>' +
        '<div id="ansBox"></div>' +
      '</div>' +
      '<div class="btn-row center">' +
        '<button class="btn btn-ghost" id="prev">← 上一题</button>' +
        '<button class="btn btn-pink" id="next">下一题 →</button>' +
      '</div>' +
      '<div class="notice"><b>怎么练：</b>先听，再跟着说，最后看一眼“美式回答参考”，试着自己回一句。说不完整也没关系，敢开口最重要。</div>' +
      UI.checkinButton('打卡');

    var enEl = root.querySelector('#en');
    var zhEl = root.querySelector('#zh');
    var idxText = root.querySelector('#idxText');
    var doneText = root.querySelector('#doneText');
    var barWrap = root.querySelector('#barWrap');
    var ansBox = root.querySelector('#ansBox');
    var statusTag = root.querySelector('#statusTag');

    function doneCount() {
      return day.englishDone.filter(function (x) {
        return list.some(function (l) { return l.en === x; });
      }).length;
    }

    function markDone(item) {
      if (day.englishDone.indexOf(item.en) === -1) {
        day.englishDone.push(item.en);
        Store.save();
      }
    }

    function updateProgress() {
      var item = list[i];
      idxText.textContent = '第 ' + (i + 1) + ' 题 / ' + list.length;
      var d = doneCount();
      doneText.textContent = '已练习 ' + d + '/' + list.length;
      barWrap.innerHTML = UI.bar((d / list.length) * 100, 'mint');
      var done = day.englishDone.indexOf(item.en) !== -1;
      statusTag.textContent = done ? '已练习' : '未练习';
      statusTag.className = 'tag ' + (done ? 'mint' : 'gray');
    }

    function paint() {
      var item = list[i];
      enEl.textContent = item.en;
      zhEl.textContent = item.zh;
      updateProgress();
      ansBox.innerHTML = '<div class="hint-empty">🤔 先自己回答一句，再看参考哦</div>';
    }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-play]');
      if (b) {
        if (!UI.checkVoice()) return;
        var item = list[i];
        var mode = b.getAttribute('data-play');
        if (mode === 'slow') Speech.speak(item.en, { lang: 'en-US', slow: true });
        else Speech.speak(item.en, { lang: 'en-US' });
        markDone(item);
        updateProgress();
      }
    });

    root.querySelector('#showAns').addEventListener('click', function () {
      var item = list[i];
      ansBox.innerHTML = '<div class="answer-box"><b>参考回答：</b>' + UI.esc(item.ans) + '</div>' +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn-sm btn-mint" id="sayAns">🔊 听参考回答</button>' +
          '<button class="btn btn-sm btn-ghost" id="hideAns">收起</button>' +
        '</div>';
      markDone(item);
      updateProgress();
      var say = ansBox.querySelector('#sayAns');
      if (say) say.addEventListener('click', function () {
        if (UI.checkVoice()) Speech.speak(item.ans, { lang: 'en-US' });
      });
      var hide = ansBox.querySelector('#hideAns');
      if (hide) hide.addEventListener('click', function () {
        ansBox.innerHTML = '<div class="hint-empty">🤔 先自己回答一句，再看参考哦</div>';
      });
    });

    root.querySelector('#prev').addEventListener('click', function () {
      i = (i - 1 + list.length) % list.length;
      Speech.stop();
      paint();
    });
    root.querySelector('#next').addEventListener('click', function () {
      i = (i + 1) % list.length;
      Speech.stop();
      paint();
    });

    paint();
    UI.bindCheckin(root, 'english', '日常英语');
    return function () { Speech.stop(); };
  }

  Modules.register('english', {
    icon: '💬',
    title: '每日口语',
    subtitle: '每日 10 句 · 亲子对话 · 跟读练习',
    badge: '今日 10 题',
    render: render
  });
})();
