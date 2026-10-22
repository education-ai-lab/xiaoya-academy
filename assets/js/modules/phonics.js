/* 自然拼读 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var idx = UI.dailyIndex(DATA.phonics.length);
    var cvcIdx = UI.dailyIndex(DATA.cvc.length);

    root.innerHTML =
      '<div class="card">' +
        '<div class="letter-hero">' +
          '<div class="cap" id="cap">A</div>' +
          '<div class="sound" id="sound"></div>' +
          '<div class="word" id="word"></div>' +
          '<div class="sent" id="sent"></div>' +
          '<div class="audio-dots">' +
            '<button class="audio-dot" data-say="letter" title="读字母">🔤</button>' +
            '<button class="audio-dot" data-say="word" title="读单词">📖</button>' +
            '<button class="audio-dot" data-say="sent" title="读句子">🎵</button>' +
          '</div>' +
        '</div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-sm btn-ghost" id="prev">← 上一个</button>' +
          '<button class="btn btn-mint" id="learn">✓ 学会这个字母</button>' +
          '<button class="btn btn-sm btn-ghost" id="next">下一个 →</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>拼读练习</h2><div class="spacer"></div>' +
          '<button class="btn btn-sm btn-soft" id="swap">换一个</button></div>' +
        '<div style="text-align:center;padding:6px 0 2px">' +
          '<div class="cvc-word" id="cvcWord">sun</div>' +
          '<div class="cvc-split" id="cvcSplit">s - u - n</div>' +
          '<div class="cvc-zh" id="cvcZh">太阳 ☀️</div>' +
          '<div class="btn-row center" style="margin-top:14px">' +
            '<button class="btn btn-pink" id="cvcSay">🐢 慢速跟读</button>' +
            '<button class="btn btn-ghost" id="cvcNormal">🔊 正常速度</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="progress-line"><span>26 个字母学习进度</span><span id="progText"></span></div>' +
        '<div id="barWrap"></div>' +
      '</div>' +
      '<div class="notice"><b>拼读小窍门：</b>先记住字母的“音”（不是名字），再把声音连起来：/s/ - /ʌ/ - /n/ → sun。慢慢连，别着急。</div>' +
      UI.checkinButton('打卡');

    var cap = root.querySelector('#cap');
    var sound = root.querySelector('#sound');
    var word = root.querySelector('#word');
    var sent = root.querySelector('#sent');
    var progText = root.querySelector('#progText');
    var barWrap = root.querySelector('#barWrap');
    var cvcWord = root.querySelector('#cvcWord');
    var cvcSplit = root.querySelector('#cvcSplit');
    var cvcZh = root.querySelector('#cvcZh');

    function paintLetter() {
      var p = DATA.phonics[idx];
      cap.textContent = p.letter;
      sound.textContent = p.sound;
      word.innerHTML = p.word + ' <span style="font-size:13px;color:var(--ink-3);font-weight:500">' + UI.esc(p.zh) + '</span>';
      sent.textContent = p.sent;
      var learned = Store.state.mastered.phonics.length;
      progText.innerHTML = '已学 <b>' + learned + '</b>/26 个字母';
      barWrap.innerHTML = UI.bar((learned / 26) * 100);
    }

    function paintCvc() {
      var c = DATA.cvc[cvcIdx];
      cvcWord.textContent = c.w;
      cvcSplit.textContent = c.w.split('').join(' - ');
      cvcZh.textContent = c.zh + ' ' + (c.w === 'sun' ? '☀️' : '');
    }

    root.addEventListener('click', function (e) {
      var say = e.target.closest('[data-say]');
      if (say) {
        if (!UI.checkVoice()) return;
        var p = DATA.phonics[idx];
        var kind = say.getAttribute('data-say');
        if (kind === 'letter') Speech.speak(p.letter, { lang: 'en-US', rate: 0.8 });
        if (kind === 'word') Speech.speak(p.word, { lang: 'en-US', rate: 0.85 });
        if (kind === 'sent') Speech.speak(p.sent, { lang: 'en-US', rate: 0.85 });
      }
    });

    root.querySelector('#prev').addEventListener('click', function () {
      idx = (idx - 1 + DATA.phonics.length) % DATA.phonics.length;
      Speech.stop();
      paintLetter();
    });
    root.querySelector('#next').addEventListener('click', function () {
      idx = (idx + 1) % DATA.phonics.length;
      Speech.stop();
      paintLetter();
    });
    root.querySelector('#learn').addEventListener('click', function () {
      var p = DATA.phonics[idx];
      if (Store.isMastered('phonics', p.letter)) {
        Store.state.mastered.phonics = Store.state.mastered.phonics.filter(function (x) { return x !== p.letter; });
        Store.save();
        UI.toast('已取消标记', 'warn');
      } else {
        Store.markMastered('phonics', p.letter);
        Store.addPoints(1);
        UI.toast('学会字母 ' + p.letter + ' 啦！积分 +1', 'ok');
      }
      paintLetter();
    });

    root.querySelector('#swap').addEventListener('click', function () {
      cvcIdx = (cvcIdx + 1 + Math.floor(Math.random() * (DATA.cvc.length - 1))) % DATA.cvc.length;
      paintCvc();
    });
    root.querySelector('#cvcSay').addEventListener('click', function () {
      var c = DATA.cvc[cvcIdx];
      if (!UI.checkVoice()) return;
      Speech.speak(c.w, { lang: 'en-US', slow: true });
    });
    root.querySelector('#cvcNormal').addEventListener('click', function () {
      var c = DATA.cvc[cvcIdx];
      if (!UI.checkVoice()) return;
      Speech.speak(c.w, { lang: 'en-US' });
    });

    paintLetter();
    paintCvc();
    UI.bindCheckin(root, 'phonics', '自然拼读');
    return function () { Speech.stop(); };
  }

  Modules.register('phonics', {
    icon: '🔡',
    title: '字母拼读',
    subtitle: '26 字母发音 · CVC 拼词 · 跟读',
    badge: function () {
      return '第 ' + (Store.state.mastered.phonics.length + 1) + '/26 字母';
    },
    render: render
  });
})();
