/* 20 以内加减法 */
(function () {
  'use strict';

  var COUNT = 20;

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function makeQuestion() {
    if (Math.random() < 0.5) {
      var a = rand(1, 14);
      var b = rand(1, 20 - a);
      return { a: a, b: b, op: '+', ans: a + b };
    }
    var x = rand(4, 20);
    var y = rand(1, x - 1);
    return { a: x, b: y, op: '-', ans: x - y };
  }

  function makeSet(n) {
    var list = [], seen = {};
    var guard = 0;
    while (list.length < n && guard < n * 60) {
      guard++;
      var q = makeQuestion();
      var key = q.a + q.op + q.b;
      if (seen[key]) continue;
      seen[key] = 1;
      list.push(q);
    }
    while (list.length < n) list.push(makeQuestion());
    return list;
  }

  function hintFor(q) {
    if (q.op === '+') {
      if (q.a % 10 === 0 || q.b % 10 === 0) return '整十最好算，直接加';
      if (q.a >= 10 || q.b >= 10) return '个位相加，十位不变';
      if (q.a + q.b <= 10) return '先数一数，再算';
      return '凑十法：先凑成 10 再加';
    }
    if (q.b === 10) return '直接减 10，最好算';
    if (q.a > 10) {
      if (q.b <= 9) return '破十法：先算 10 - ' + q.b;
      return '平十法：先减 10 再减 ' + (q.b - 10);
    }
    return '倒着数：往前数 ' + q.b + ' 个';
  }

  function render(root) {
    var questions = makeSet(COUNT);
    var seconds = 0;
    var timer = null;
    var graded = false;

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<h2>用时 <b id="clock" style="color:var(--purple-700);font-variant-numeric:tabular-nums">00:00</b></h2>' +
          '<div class="spacer"></div>' +
          '<span class="hint" id="ansCount">0/' + COUNT + ' 已答</span>' +
        '</div>' +
        '<div id="ansBar"></div>' +
        '<div class="btn-row" style="margin-top:14px">' +
          '<button class="btn btn-sm btn-ghost" id="resetTimer">🔄 重置计时</button>' +
          '<button class="btn btn-sm btn-mint" id="gradeTop">✅ 自动批改</button>' +
          '<button class="btn btn-sm btn-pink" id="newSet">🎲 换题</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>答题</h2><div class="spacer"></div>' +
          '<span class="hint">按回车跳到下一题</span></div>' +
        '<div class="math-grid" id="grid"></div>' +
        '<div id="result"></div>' +
      '</div>' +
      '<div class="card" id="recentCard"></div>' +
      '<div class="notice"><b>批改规则：</b>全部答完后点“自动批改”，会立刻算出正确率、用时和积分，答错的题会自动进入错题本。</div>' +
      UI.checkinButton('打卡');

    var grid = root.querySelector('#grid');
    var clock = root.querySelector('#clock');
    var ansCount = root.querySelector('#ansCount');
    var ansBar = root.querySelector('#ansBar');
    var result = root.querySelector('#result');
    var recentCard = root.querySelector('#recentCard');

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        seconds++;
        clock.textContent = UI.fmtClock(seconds);
      }, 1000);
    }
    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function paintGrid() {
      grid.innerHTML = questions.map(function (q, i) {
        return '<div class="q-card" data-i="' + i + '">' +
          '<div class="q-line"><span class="idx">' + (i + 1) + '</span>' +
            '<span>' + q.a + ' ' + q.op + ' ' + q.b + ' =</span>' +
            '<input class="q-input" data-in="' + i + '" inputmode="numeric" autocomplete="off" maxlength="2" aria-label="第' + (i + 1) + '题答案">' +
          '</div>' +
          '<div class="q-hint">' + hintFor(q) + '</div>' +
        '</div>';
      }).join('');
      updateAnswered();
    }

    function inputs() {
      return Array.prototype.slice.call(grid.querySelectorAll('.q-input'));
    }

    function answeredCount() {
      return inputs().filter(function (inp) { return inp.value.trim() !== ''; }).length;
    }

    function updateAnswered() {
      var n = answeredCount();
      ansCount.textContent = n + '/' + COUNT + ' 已答';
      ansBar.innerHTML = UI.bar((n / COUNT) * 100, 'mint');
    }

    grid.addEventListener('input', function (e) {
      var inp = e.target.closest('.q-input');
      if (!inp) return;
      var clean = inp.value.replace(/[^\d]/g, '').slice(0, 2);
      if (clean !== inp.value) inp.value = clean;
      updateAnswered();
    });

    grid.addEventListener('keydown', function (e) {
      var inp = e.target.closest('.q-input');
      if (!inp) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        var i = Number(inp.getAttribute('data-in'));
        var all = inputs();
        var next = all[i + 1];
        if (next) next.focus();
        else inp.blur();
      }
    });

    function paintRecent() {
      var recs = Store.state.mathRecords.slice(0, 4);
      if (!recs.length) {
        recentCard.innerHTML = '<div class="card-head"><h2>最近成绩</h2></div>' +
          UI.empty('📝', '还没有记录，完成一组口算就会出现啦');
        return;
      }
      recentCard.innerHTML = '<div class="card-head"><h2>最近成绩</h2><div class="spacer"></div>' +
        '<span class="hint">共 ' + Store.state.mathRecords.length + ' 次</span></div>' +
        '<table class="data"><thead><tr><th>日期</th><th>题量</th><th>正确</th><th>正确率</th><th>用时</th></tr></thead><tbody>' +
        recs.map(function (r) {
          return '<tr><td>' + UI.esc(r.date) + '</td><td>' + r.total + '</td><td class="strong">' + r.correct +
            '</td><td>' + UI.pct(r.correct, r.total) + '%</td><td>' + UI.fmtClock(r.seconds) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    function grade() {
      if (graded) {
        UI.toast('这一组已经批改过啦，换一组再练吧', 'warn');
        return;
      }
      var all = inputs();
      var empty = all.filter(function (x) { return x.value.trim() === ''; }).length;
      if (empty > 0) {
        UI.toast('还有 ' + empty + ' 题没写答案哦', 'warn');
        var firstEmpty = all.filter(function (x) { return x.value.trim() === ''; })[0];
        if (firstEmpty) firstEmpty.focus();
        return;
      }
      stopTimer();
      graded = true;

      var correct = 0, wrong = [];
      all.forEach(function (inp, i) {
        var q = questions[i];
        var card = grid.querySelector('.q-card[data-i="' + i + '"]');
        var val = Number(inp.value);
        var hintEl = card.querySelector('.q-hint');
        if (val === q.ans) {
          correct++;
          card.classList.add('ok');
          hintEl.textContent = '✓ 答对了，真棒！';
        } else {
          card.classList.add('bad');
          hintEl.textContent = '正确答案是 ' + q.ans;
          wrong.push({ q: q, val: val });
          Store.addWrong({
            module: 'math',
            moduleName: '数学口算',
            q: q.a + ' ' + q.op + ' ' + q.b + ' = ?',
            answer: q.ans,
            userAnswer: val
          });
        }
        inp.disabled = true;
      });

      var acc = UI.pct(correct, questions.length);
      var pts = correct;
      Store.recordPractice('math', questions.length, correct, seconds);
      Store.addPoints(pts);
      Store.state.mathRecords.unshift({
        date: Store.today(),
        total: questions.length,
        correct: correct,
        seconds: seconds,
        at: Store.today() + ' ' + new Date().toTimeString().slice(0, 5)
      });
      if (Store.state.mathRecords.length > 100) Store.state.mathRecords.length = 100;
      Store.save();

      var emoji = acc >= 90 ? '🏆' : acc >= 70 ? '👍' : '💪';
      result.innerHTML =
        '<div class="result-banner">' +
          '<div class="rb-emoji">' + emoji + '</div>' +
          '<div class="rb-main">' +
            '<strong>正确 ' + correct + '/' + questions.length + ' · 正确率 ' + acc + '%</strong>' +
            '<span>用时 ' + UI.fmtDuration(seconds) + ' · 积分 +' + pts + (wrong.length ? ' · 错题已收入错题本' : '') + '</span>' +
          '</div>' +
          '<button class="btn btn-primary" id="again">再来一组</button>' +
        '</div>';

      var again = result.querySelector('#again');
      if (again) {
        again.addEventListener('click', function () {
          reset(true);
        });
      }
      paintRecent();
      UI.toast('批改完成：' + correct + '/' + questions.length, acc >= 70 ? 'ok' : 'warn', 2600);
    }

    function reset(newQuestions) {
      stopTimer();
      seconds = 0;
      graded = false;
      clock.textContent = '00:00';
      result.innerHTML = '';
      if (newQuestions) questions = makeSet(COUNT);
      paintGrid();
      startTimer();
      var first = grid.querySelector('.q-input');
      if (first) first.focus();
    }

    root.querySelector('#resetTimer').addEventListener('click', function () {
      if (graded) { UI.toast('本组已批改，换题后重新计时', 'warn'); return; }
      seconds = 0;
      clock.textContent = '00:00';
      startTimer();
      UI.toast('计时已重置', 'ok');
    });

    root.querySelector('#gradeTop').addEventListener('click', grade);
    root.querySelector('#newSet').addEventListener('click', function () { reset(true); UI.toast('已换一组新题', 'ok'); });

    paintGrid();
    paintRecent();
    startTimer();
    UI.bindCheckin(root, 'math', '数学');

    return function () { stopTimer(); };
  }

  Modules.register('math', {
    icon: '➕',
    title: '口算练习',
    subtitle: '凑十法 · 破十法 · 自动批改 · 计时',
    badge: COUNT + ' 题',
    render: render
  });
})();
