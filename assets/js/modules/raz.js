/* 分级阅读 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  function render(root) {
    var level = 'all';
    var current = null;

    root.innerHTML =
      '<div class="card" id="listCard">' +
        '<div class="card-head"><h2>阅读书架</h2><div class="spacer"></div>' +
          '<span class="hint" id="progText"></span></div>' +
        '<div class="btn-row" id="levels" style="margin-bottom:14px"></div>' +
        '<div id="list"></div>' +
      '</div>' +
      '<div class="card" id="readerCard" style="display:none"></div>' +
      '<div class="notice sky"><b>阅读建议：</b>先听一遍，再自己读一遍。遇到不认识的单词不要停，先读完，再回头看。同一篇读三遍，比读三篇新的更有用。</div>' +
      UI.checkinButton('打卡');

    var listEl = root.querySelector('#list');
    var levelsEl = root.querySelector('#levels');
    var progText = root.querySelector('#progText');
    var listCard = root.querySelector('#listCard');
    var readerCard = root.querySelector('#readerCard');

    var LEVELS = ['all', 'AA', 'A', 'B', 'C'];

    function paintLevels() {
      levelsEl.innerHTML = LEVELS.map(function (l) {
        return '<button class="btn btn-sm ' + (level === l ? 'btn-primary' : 'btn-ghost') +
          '" data-lv="' + l + '">' + (l === 'all' ? '全部' : l + ' 级') + '</button>';
      }).join('');
    }

    function paintList() {
      var readCount = Store.state.mastered.raz.length;
      progText.textContent = '已读 ' + readCount + '/' + DATA.raz.length + ' 篇';
      paintLevels();
      var list = DATA.raz.filter(function (r) { return level === 'all' || r.level === level; });
      listEl.innerHTML = '<div class="list">' + list.map(function (r) {
        var read = Store.isMastered('raz', r.id);
        return '<div class="list-row" data-open="' + r.id + '" style="cursor:pointer">' +
          '<div class="lr-ico">' + (read ? '✅' : '📖') + '</div>' +
          '<div class="lr-main"><strong>' + UI.esc(r.title) + '</strong>' +
            '<span>' + r.level + ' 级 · ' + r.words + ' words · ' + (read ? '已读' : '未读') + '</span></div>' +
          '<div class="lr-act">' +
            UI.tag(r.level + ' 级', r.level === 'AA' ? 'mint' : r.level === 'A' ? 'sky' : r.level === 'B' ? 'amber' : 'pink') +
            '<button class="btn btn-sm btn-soft" data-open="' + r.id + '">阅读</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    function openReader(id) {
      var r = DATA.raz.filter(function (x) { return x.id === id; })[0];
      if (!r) return;
      current = r;
      var read = Store.isMastered('raz', r.id);
      listCard.style.display = 'none';
      readerCard.style.display = '';
      readerCard.innerHTML =
        '<div class="card-head">' +
          '<button class="btn btn-sm btn-ghost" id="back">← 返回书架</button>' +
          '<div class="spacer"></div>' + UI.tag(r.level + ' 级', 'sky') +
        '</div>' +
        '<h2 style="margin:6px 0 4px;font-size:22px;color:#3b1d78">' + UI.esc(r.title) + '</h2>' +
        '<div class="section-note">' + r.words + ' words · 建议朗读 2～3 遍</div>' +
        '<div class="raz-text">' + r.text.split('\n').map(function (line) {
          return '<p>' + UI.esc(line) + '</p>';
        }).join('') + '</div>' +
        '<div class="btn-row center" style="margin-top:16px">' +
          '<button class="btn btn-pink" id="readAloud">🔊 朗读全文</button>' +
          '<button class="btn btn-mint" id="readSlow">🐢 慢速跟读</button>' +
          '<button class="btn btn-ghost" id="toggleZh">🀄 中文翻译</button>' +
          '<button class="btn ' + (read ? 'btn-soft' : 'btn-primary') + '" id="markRead">' +
            (read ? '✅ 已读' : '✅ 标记已读') + '</button>' +
        '</div>' +
        '<div id="zhBox" class="answer-box" style="display:none;margin-top:14px">' + UI.esc(r.zh) + '</div>';

      readerCard.querySelector('#back').addEventListener('click', function () {
        Speech.stop();
        readerCard.style.display = 'none';
        listCard.style.display = '';
        paintList();
      });

      readerCard.querySelector('#readAloud').addEventListener('click', function () {
        if (UI.checkVoice()) Speech.speak(r.text.replace(/\n/g, '. '), { lang: 'en-US' });
      });
      readerCard.querySelector('#readSlow').addEventListener('click', function () {
        if (UI.checkVoice()) Speech.speak(r.text.replace(/\n/g, '. '), { lang: 'en-US', slow: true });
      });
      readerCard.querySelector('#toggleZh').addEventListener('click', function () {
        var box = readerCard.querySelector('#zhBox');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if (box.style.display === 'block') box.style.marginTop = '14px';
      });
      readerCard.querySelector('#markRead').addEventListener('click', function () {
        if (Store.isMastered('raz', r.id)) {
          Store.state.mastered.raz = Store.state.mastered.raz.filter(function (x) { return x !== r.id; });
          Store.save();
          UI.toast('已取消标记', 'warn');
        } else {
          Store.markMastered('raz', r.id);
          Store.addPoints(2);
          UI.toast('读完一篇，积分 +2', 'ok');
        }
        openReader(r.id);
      });
    }

    listEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open]');
      if (!t) return;
      openReader(t.getAttribute('data-open'));
    });

    levelsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lv]');
      if (!b) return;
      level = b.getAttribute('data-lv');
      paintList();
    });

    paintList();
    UI.bindCheckin(root, 'raz', '分级阅读');
    return function () { Speech.stop(); };
  }

  Modules.register('raz', {
    icon: '📚',
    title: '分级阅读',
    subtitle: 'AA–C 级短文 · 听读跟读 · 中文对照',
    badge: function () {
      return '已读 ' + Store.state.mastered.raz.length + '/' + DATA.raz.length;
    },
    render: render
  });
})();
