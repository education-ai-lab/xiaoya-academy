/* 数独 4×4 */
(function () {
  'use strict';

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function candidates(g, idx) {
    var r = Math.floor(idx / 4), c = idx % 4;
    var used = {};
    for (var i = 0; i < 4; i++) { used[g[r * 4 + i]] = 1; used[g[i * 4 + c]] = 1; }
    var br = Math.floor(r / 2) * 2, bc = Math.floor(c / 2) * 2;
    for (var rr = br; rr < br + 2; rr++) {
      for (var cc = bc; cc < bc + 2; cc++) used[g[rr * 4 + cc]] = 1;
    }
    var out = [];
    for (var v = 1; v <= 4; v++) if (!used[v]) out.push(v);
    return out;
  }

  function solveFirst(g) {
    var idx = g.indexOf(0);
    if (idx === -1) return g.slice();
    var cands = shuffle(candidates(g, idx));
    for (var i = 0; i < cands.length; i++) {
      g[idx] = cands[i];
      var r = solveFirst(g);
      g[idx] = 0;
      if (r) return r;
    }
    return null;
  }

  function countSolutions(g, limit) {
    var idx = g.indexOf(0);
    if (idx === -1) return 1;
    var total = 0;
    var cands = candidates(g, idx);
    for (var i = 0; i < cands.length; i++) {
      g[idx] = cands[i];
      total += countSolutions(g, limit - total);
      g[idx] = 0;
      if (total >= limit) break;
    }
    return total;
  }

  function makePuzzle(blanks) {
    var solution = solveFirst(new Array(16).fill(0)) || [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
    var puzzle = solution.slice();
    var idxs = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    var removed = 0;
    for (var i = 0; i < idxs.length && removed < blanks; i++) {
      var k = idxs[i];
      var bak = puzzle[k];
      puzzle[k] = 0;
      if (countSolutions(puzzle.slice(), 2) !== 1) {
        puzzle[k] = bak;
      } else {
        removed++;
      }
    }
    return { puzzle: puzzle, solution: solution };
  }

  function render(root) {
    var level = 6;
    var game = makePuzzle(level);
    var values = game.puzzle.slice();
    var selected = -1;
    var seconds = 0;
    var timer = null;
    var solved = false;
    var errors = {};

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>四宫数独</h2><div class="spacer"></div>' +
          '<div class="seg" id="segLevel">' +
            '<button data-n="6" class="active">简单</button>' +
            '<button data-n="8">挑战</button>' +
          '</div>' +
        '</div>' +
        '<div class="progress-line"><span>每行、每列、每个 2×2 宫都要有 <b>1～4</b> 且不重复</span>' +
          '<span class="timer">⏱ <b id="clock">00:00</b></span></div>' +
        '<div class="sudoku-wrap"><div class="sudoku" id="grid"></div>' +
          '<div class="num-pad" id="pad">' +
            [1, 2, 3, 4].map(function (n) { return '<button data-num="' + n + '">' + n + '</button>'; }).join('') +
            '<button data-num="0" title="擦除">⌫</button>' +
          '</div>' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-mint" id="check">✅ 检查</button>' +
          '<button class="btn btn-amber" id="hint">💡 提示</button>' +
          '<button class="btn btn-ghost" id="restart">🧹 清空</button>' +
          '<button class="btn btn-primary" id="newGame">🎲 新题</button>' +
        '</div>' +
        '<div id="result"></div>' +
      '</div>' +
      '<div class="notice mint"><b>解题小技巧：</b>先找只差一个数字的行、列或小宫格，把它填上，再一步步推下去。点格子 → 点数字就能填。</div>' +
      UI.checkinButton('打卡');

    var grid = root.querySelector('#grid');
    var pad = root.querySelector('#pad');
    var clock = root.querySelector('#clock');
    var result = root.querySelector('#result');
    var seg = root.querySelector('#segLevel');

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        seconds++;
        clock.textContent = UI.fmtClock(seconds);
      }, 1000);
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    function paint() {
      var html = '';
      for (var i = 0; i < 16; i++) {
        var r = Math.floor(i / 4), c = i % 4;
        var given = game.puzzle[i] !== 0;
        var v = values[i];
        var cls = 'cell';
        if (c === 1) cls += ' box-r';
        if (r === 1) cls += ' box-b';
        if (given) cls += ' given';
        if (selected === i && !given) cls += ' sel';
        if (errors[i]) cls += ' err';
        if (values[i] && !given && values[i] === game.solution[i]) cls += ' hint';
        html += '<div class="' + cls + '" data-i="' + i + '">' + (v ? v : '') + '</div>';
      }
      grid.innerHTML = html;
    }

    grid.addEventListener('click', function (e) {
      var cell = e.target.closest('.cell');
      if (!cell) return;
      var i = Number(cell.getAttribute('data-i'));
      if (game.puzzle[i] !== 0) { selected = -1; paint(); return; }
      selected = (selected === i) ? -1 : i;
      paint();
    });

    pad.addEventListener('click', function (e) {
      var b = e.target.closest('[data-num]');
      if (!b) return;
      if (selected < 0) { UI.toast('先点一个空格子', 'warn'); return; }
      var n = Number(b.getAttribute('data-num'));
      values[selected] = n;
      delete errors[selected];
      paint();
      if (values.every(function (v) { return v > 0; })) {
        setTimeout(check, 120);
      }
    });

    function check(silent) {
      if (solved) return;
      errors = {};
      var filled = 0, wrong = 0;
      for (var i = 0; i < 16; i++) {
        if (!values[i]) continue;
        filled++;
        if (values[i] !== game.solution[i]) { errors[i] = 1; wrong++; }
      }
      paint();
      if (filled < 16) {
        if (!silent) UI.toast('还有 ' + (16 - filled) + ' 个格子没填', 'warn');
        return;
      }
      if (wrong > 0) {
        if (!silent) UI.toast('有 ' + wrong + ' 个数字不对，红色的再想想', 'warn');
        return;
      }
      solved = true;
      stopTimer();
      var pts = 10;
      Store.addPoints(pts);
      Store.recordPractice('sudoku', 1, 1, seconds);
      result.innerHTML =
        '<div class="result-banner">' +
          '<div class="rb-emoji">🎉</div>' +
          '<div class="rb-main"><strong>数独完成！用时 ' + UI.fmtDuration(seconds) + '</strong>' +
            '<span>积分 +' + pts + ' · 逻辑思维又变强了</span></div>' +
          '<button class="btn btn-primary" id="again">再来一题</button>' +
        '</div>';
      result.querySelector('#again').addEventListener('click', newGame);
      UI.toast('太棒了，数独完成！', 'ok', 2600);
    }

    function newGame() {
      game = makePuzzle(level);
      values = game.puzzle.slice();
      selected = -1;
      errors = {};
      solved = false;
      seconds = 0;
      clock.textContent = '00:00';
      result.innerHTML = '';
      paint();
      startTimer();
    }

    root.querySelector('#check').addEventListener('click', function () { check(false); });

    root.querySelector('#hint').addEventListener('click', function () {
      if (solved) return;
      var empties = [];
      for (var i = 0; i < 16; i++) if (!values[i] || values[i] !== game.solution[i]) empties.push(i);
      if (!empties.length) { UI.toast('已经填满啦，点检查试试', 'ok'); return; }
      var pick = empties[Math.floor(Math.random() * empties.length)];
      values[pick] = game.solution[pick];
      delete errors[pick];
      selected = pick;
      paint();
      UI.toast('已帮你填一个数字', 'ok');
    });

    root.querySelector('#restart').addEventListener('click', function () {
      values = game.puzzle.slice();
      selected = -1;
      errors = {};
      solved = false;
      result.innerHTML = '';
      paint();
      UI.toast('已清空，重新开始', 'ok');
    });

    root.querySelector('#newGame').addEventListener('click', newGame);

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-n]');
      if (!b) return;
      level = Number(b.getAttribute('data-n'));
      seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
      newGame();
      UI.toast(level === 6 ? '简单模式：6 个空格' : '挑战模式：8 个空格', 'ok');
    });

    paint();
    startTimer();
    UI.bindCheckin(root, 'sudoku', '数独');
    return function () { stopTimer(); };
  }

  Modules.register('sudoku', {
    icon: '🔢',
    title: '四宫数独',
    subtitle: '逻辑推理 · 每行每列不重复',
    badge: '4×4',
    render: render
  });
})();
