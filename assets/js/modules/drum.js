/* 架子鼓 · 节奏训练 */
(function () {
  'use strict';

  function render(root) {
    var bpm = 80;
    var beat = 0;
    var playing = false;
    var timer = null;
    var ctx = null;
    var taps = 0;

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>节拍器</h2><div class="spacer"></div>' +
          '<span class="hint" id="bpmText">80 BPM · 4/4 拍</span></div>' +
        '<div class="metronome" id="dots">' +
          '<div class="beat on"></div><div class="beat"></div><div class="beat"></div><div class="beat"></div>' +
        '</div>' +
        '<div style="text-align:center;font-size:12.5px;color:var(--ink-3);margin-top:6px" id="beatText">第 1 拍</div>' +
        '<div style="margin:18px 0 6px">' +
          '<label class="field-label">速度：<b id="bpmVal" style="color:var(--purple-700)">80</b> BPM</label>' +
          '<input type="range" id="bpm" min="50" max="160" step="5" value="80" style="width:100%;accent-color:#2f6b4f" />' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:8px">' +
          '<button class="btn btn-primary btn-lg" id="toggle">▶ 开始</button>' +
          '<button class="btn btn-ghost" id="tap">👏 跟拍一下</button>' +
        '</div>' +
        '<div style="text-align:center;font-size:12.5px;color:var(--ink-3);margin-top:12px">已跟拍 <b id="taps" style="color:var(--purple-700)">0</b> 次</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>节奏小课堂</h2></div>' +
        '<div class="section-note">4/4 拍就是每小节 4 拍，第 1 拍最重。跟着“咚 · 哒 · 哒 · 哒”念，手在桌子上敲一敲。</div>' +
        '<div class="rhythm">' +
          '<span class="r-beat strong">咚</span><span class="r-beat">哒</span>' +
          '<span class="r-beat">哒</span><span class="r-beat">哒</span>' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-pink" id="sayRhythm">🔊 听节奏</button>' +
          '<button class="btn btn-mint" id="saySlow">🐢 慢速念</button>' +
        '</div>' +
      '</div>' +
      '<div class="notice"><b>练习方法：</b>先不开节拍器，用嘴念“咚哒哒哒”，稳定了再跟节拍器。速度慢一点没关系，稳才是本事。</div>' +
      UI.checkinButton('打卡');

    var dots = root.querySelectorAll('.beat');
    var toggle = root.querySelector('#toggle');
    var bpmInput = root.querySelector('#bpm');
    var bpmVal = root.querySelector('#bpmVal');
    var bpmText = root.querySelector('#bpmText');
    var beatText = root.querySelector('#beatText');
    var tapsEl = root.querySelector('#taps');

    function ensureCtx() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; }
      return ctx;
    }

    function click(strong) {
      var c = ensureCtx();
      if (!c) return;
      if (c.state === 'suspended') { c.resume().catch(function () {}); }
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = strong ? 880 : 560;
      var t = c.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(strong ? 0.5 : 0.28, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    function paintBeat() {
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('on', i === beat);
      }
      beatText.textContent = '第 ' + (beat + 1) + ' 拍' + (beat === 0 ? ' · 重拍' : '');
    }

    function step() {
      click(beat === 0);
      paintBeat();
      beat = (beat + 1) % 4;
    }

    function start() {
      if (playing) return;
      playing = true;
      beat = 0;
      toggle.textContent = '⏸ 停止';
      toggle.classList.remove('btn-primary');
      toggle.classList.add('btn-danger');
      step();
      timer = setInterval(step, (60 / bpm) * 1000);
    }

    function stop() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      toggle.textContent = '▶ 开始';
      toggle.classList.add('btn-primary');
      toggle.classList.remove('btn-danger');
    }

    toggle.addEventListener('click', function () {
      if (playing) stop(); else start();
    });

    bpmInput.addEventListener('input', function () {
      bpm = Number(bpmInput.value);
      bpmVal.textContent = bpm;
      bpmText.textContent = bpm + ' BPM · 4/4 拍';
      if (playing) {
        clearInterval(timer);
        timer = setInterval(step, (60 / bpm) * 1000);
      }
    });

    root.querySelector('#tap').addEventListener('click', function () {
      taps++;
      tapsEl.textContent = taps;
      click(true);
      if (taps === 20) {
        Store.addPoints(2);
        UI.toast('跟拍 20 次，积分 +2', 'ok');
      }
    });

    root.querySelector('#sayRhythm').addEventListener('click', function () {
      if (UI.checkVoice()) Speech.speak('咚 哒 哒 哒', { lang: 'zh-CN', rate: 0.9 });
    });
    root.querySelector('#saySlow').addEventListener('click', function () {
      if (UI.checkVoice()) Speech.speak('咚 哒 哒 哒', { lang: 'zh-CN', slow: true });
    });

    paintBeat();
    UI.bindCheckin(root, 'drum', '架子鼓');
    return function () {
      stop();
      if (ctx && ctx.close) { try { ctx.close(); } catch (e) {} ctx = null; }
    };
  }

  Modules.register('drum', {
    icon: '🥁',
    title: '节拍练习',
    subtitle: '节拍器 · 4/4 拍 · 跟拍计数',
    badge: '50–160 BPM',
    render: render
  });
})();
