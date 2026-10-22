/* 思维训练 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var order = UI.shuffle(DATA.logic.map(function (_, i) { return i; }), Date.now() % 99991);
    var pos = 0;
    var answered = false;
    var right = 0, total = 0;

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>读题作答</h2><div class="spacer"></div>' +
          '<span class="hint" id="score">本轮 0 题 · 答对 0 题</span></div>' +
        '<div class="question-text" id="q"></div>' +
        '<div class="btn-row center" style="margin-top:18px">' +
          '<input class="input" id="ans" inputmode="numeric" autocomplete="off" placeholder="?" ' +
            'style="max-width:130px;text-align:center;font-size:19px;font-weight:700" aria-label="答案">' +
          '<button class="btn btn-primary" id="submit">✅ 提交答案</button>' +
          '<button class="btn btn-amber" id="hint">💡 提示</button>' +
        '</div>' +
        '<div id="fb"></div>' +
      '</div>' +
      '<div class="btn-row center">' +
        '<button class="btn btn-pink" id="next">🎲 换一题</button>' +
      '</div>' +
      '<div class="notice"><b>做题方法：</b>先读两遍题目，把知道的数字圈出来，再想想是“变多”还是“变少”。想不出来就看提示，不丢人。</div>' +
      UI.checkinButton('打卡');

    var qEl = root.querySelector('#q');
    var ansEl = root.querySelector('#ans');
    var fb = root.querySelector('#fb');
    var scoreEl = root.querySelector('#score');

    function paint() {
      var item = DATA.logic[order[pos]];
      qEl.textContent = item.q;
      ansEl.value = '';
      ansEl.disabled = false;
      fb.innerHTML = '';
      answered = false;
      scoreEl.textContent = '本轮 ' + total + ' 题 · 答对 ' + right + ' 题';
    }

    function submit() {
      if (answered) { UI.toast('这题已经答过啦，换一题吧', 'warn'); return; }
      var raw = ansEl.value.trim();
      if (raw === '') { UI.toast('先写出你的答案', 'warn'); ansEl.focus(); return; }
      var val = Number(raw);
      if (isNaN(val)) { UI.toast('请输入数字答案', 'warn'); return; }

      var item = DATA.logic[order[pos]];
      answered = true;
      total++;
      ansEl.disabled = true;

      if (val === item.a) {
        right++;
        fb.innerHTML = '<div class="answer-box" style="margin-top:16px;border-color:#86efac;background:linear-gradient(180deg,#f0fdf6,#f7fffb);color:#0b6b52">' +
          '<b>✅ 答对啦！</b><br>' + UI.esc(item.s) + '</div>';
        Store.addPoints(3);
        Store.recordPractice('logic', 1, 1, 0);
        UI.toast('答对啦！积分 +3', 'ok');
      } else {
        fb.innerHTML = '<div class="answer-box" style="margin-top:16px;border-color:#fda4af;background:linear-gradient(180deg,#fff5f6,#fff9fa);color:#9f1239">' +
          '<b>再想一想～正确答案是 ' + item.a + '</b><br>' + UI.esc(item.s) + '</div>';
        Store.addWrong({
          module: 'logic', moduleName: '思维训练',
          q: item.q, answer: item.a, userAnswer: val
        });
        Store.recordPractice('logic', 1, 0, 0);
        UI.toast('差一点点，看看解析吧', 'warn');
      }
      scoreEl.textContent = '本轮 ' + total + ' 题 · 答对 ' + right + ' 题';
    }

    root.querySelector('#submit').addEventListener('click', submit);
    ansEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });

    root.querySelector('#hint').addEventListener('click', function () {
      var item = DATA.logic[order[pos]];
      fb.innerHTML = '<div class="answer-box" style="margin-top:16px">💡 <b>小提示：</b>' + UI.esc(item.h) + '</div>';
    });

    root.querySelector('#next').addEventListener('click', function () {
      pos = (pos + 1) % order.length;
      paint();
    });

    paint();
    UI.bindCheckin(root, 'logic', '思维');
    return function () {};
  }

  Modules.register('logic', {
    icon: '🧠',
    title: '应用题',
    subtitle: '生活数学 · 读题列式 · 逐步解析',
    badge: '每日一题',
    render: render
  });
})();
