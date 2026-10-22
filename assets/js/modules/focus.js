/* 方格专注 */
(function () {
  'use strict';

  var ROUNDS = 5;

  function shuffleNums() {
    var a = [];
    for (var i = 1; i <= 25; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function render(root) {
    var round = 1;
    var next = 1;
    var running = false;
    var elapsed = 0;
    var tick = null;
    var nums = shuffleNums();
    var roundTimes = [];

    root.innerHTML =
      '<div class="card">' +
        '<div class="notice"><b>玩法：</b>从 1 开始，按 1→2→3……→25 的顺序快速点数字，每组单独计时，一共 5 组。眼睛尽量少乱跑，用余光找数字。</div>' +
        '<div class="focus-status">' +
          '<div class="fs-item"><span>组数</span><b id="roundTxt">1/' + ROUNDS + '</b></div>' +
          '<div class="fs-item"><span>计时</span><b id="clock">0.0s</b></div>' +
          '<div class="fs-item"><span>已完成</span><b id="doneTxt">0/' + ROUNDS + '</b></div>' +
          '<div class="fs-item"><span>最好成绩</span><b id="bestTxt">—</b></div>' +
        '</div>' +
        '<div class="btn-row center" style="margin:4px 0 16px">' +
          '<button class="btn btn-primary" id="start">▶ 开始本组</button>' +
        '</div>' +
        '<div class="schulte" id="grid"></div>' +
        '<div id="result"></div>' +
      '</div>' +
      UI.checkinButton('打卡');

    var grid = root.querySelector('#grid');
    var clock = root.querySelector('#clock');
    var roundTxt = root.querySelector('#roundTxt');
    var doneTxt = root.querySelector('#doneTxt');
    var bestTxt = root.querySelector('#bestTxt');
    var startBtn = root.querySelector('#start');
    var result = root.querySelector('#result');

    function best() {
      var recs = Store.state.focusRecords;
      if (!recs.length) return null;
      return Math.min.apply(null, recs.map(function (r) { return r.seconds; }));
    }

    function paintBest() {
      var b = best();
      bestTxt.textContent = b == null ? '—' : b.toFixed(1) + 's';
    }

    function paintGrid() {
      grid.innerHTML = nums.map(function (n) {
        return '<button data-n="' + n + '">' + n + '</button>';
      }).join('');
    }

    function stopTick() {
      if (tick) { clearInterval(tick); tick = null; }
    }

    function startRound() {
      if (running) return;
      running = true;
      next = 1;
      elapsed = 0;
      nums = shuffleNums();
      paintGrid();
      result.innerHTML = '';
      clock.textContent = '0.0s';
      startBtn.disabled = true;
      startBtn.textContent = '进行中…';
      stopTick();
      var t0 = Date.now();
      tick = setInterval(function () {
        elapsed = (Date.now() - t0) / 1000;
        clock.textContent = elapsed.toFixed(1) + 's';
      }, 100);
      UI.toast('开始！按顺序点 1 到 25', 'ok', 1500);
    }

    function finishRound() {
      running = false;
      stopTick();
      var sec = Math.round(elapsed * 10) / 10;
      roundTimes.push(sec);
      Store.state.focusRecords.unshift({
        date: Store.today(), round: round, seconds: sec
      });
      if (Store.state.focusRecords.length > 200) Store.state.focusRecords.length = 200;
      Store.addPoints(2);
      Store.recordPractice('focus', 1, 1, Math.round(sec));
      Store.save();

      roundTxt.textContent = Math.min(round, ROUNDS) + '/' + ROUNDS;
      doneTxt.textContent = roundTimes.length + '/' + ROUNDS;
      paintBest();
      clock.textContent = sec.toFixed(1) + 's';
      startBtn.disabled = false;

      if (roundTimes.length >= ROUNDS) {
        startBtn.textContent = '🎉 全部完成';
        startBtn.disabled = true;
        var avg = roundTimes.reduce(function (a, b) { return a + b; }, 0) / roundTimes.length;
        result.innerHTML =
          '<div class="result-banner">' +
            '<div class="rb-emoji">🏅</div>' +
            '<div class="rb-main"><strong>5 组全部完成！平均 ' + avg.toFixed(1) + ' 秒</strong>' +
              '<span>最快 ' + Math.min.apply(null, roundTimes).toFixed(1) + ' 秒 · 积分 +' + (ROUNDS * 2) + '</span></div>' +
            '<button class="btn btn-primary" id="again">再来一轮</button>' +
          '</div>';
        result.querySelector('#again').addEventListener('click', function () {
          round = 1; roundTimes = []; next = 1; elapsed = 0;
          roundTxt.textContent = '1/' + ROUNDS;
          doneTxt.textContent = '0/' + ROUNDS;
          clock.textContent = '0.0s';
          startBtn.textContent = '▶ 开始本组';
          startBtn.disabled = false;
          result.innerHTML = '';
          nums = shuffleNums();
          paintGrid();
        });
        UI.toast('5 组全部完成，专注力真棒！', 'ok', 3000);
      } else {
        round++;
        startBtn.textContent = '▶ 开始第 ' + round + ' 组';
        UI.toast('第 ' + (round - 1) + ' 组完成：' + sec.toFixed(1) + ' 秒', 'ok', 2200);
      }
    }

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-n]');
      if (!b) return;
      if (!running) { UI.toast('先点“开始本组”再开始哦', 'warn'); return; }
      var n = Number(b.getAttribute('data-n'));
      if (n === next) {
        b.classList.add('hit');
        b.disabled = true;
        next++;
        if (next > 25) finishRound();
      } else {
        b.classList.add('err');
        setTimeout(function () { b.classList.remove('err'); }, 320);
      }
    });

    startBtn.addEventListener('click', startRound);

    paintGrid();
    paintBest();
    UI.bindCheckin(root, 'focus', '专注力');

    return function () { stopTick(); };
  }

  Modules.register('focus', {
    icon: '🎯',
    title: '方格专注',
    subtitle: '5×5 方格 · 5 组 · 每组独立计时',
    badge: '5 组',
    render: render
  });
})();
