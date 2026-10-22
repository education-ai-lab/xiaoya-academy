/* 朗诵比赛 */
(function () {
  'use strict';

  function render(root) {
    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>录入文本</h2><div class="spacer"></div>' +
          '<span class="hint">支持粘贴长文</span></div>' +
        '<textarea class="textarea" id="ta" placeholder="在这里输入或粘贴朗诵文本……&#10;&#10;例如：&#10;《春晓》孟浩然&#10;春眠不觉晓，处处闻啼鸟。"></textarea>' +
        '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn-primary" id="save">💾 保存文本</button>' +
          '<button class="btn btn-mint" id="read">🔊 朗读全文</button>' +
          '<button class="btn btn-ghost" id="clear">🧹 清空</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h2>已保存</h2><div class="spacer"></div>' +
          '<span class="hint" id="cnt">0 篇</span></div>' +
        '<div id="list"></div>' +
      '</div>' +
      '<div class="notice sky"><b>跟读建议：</b>先用“朗读全文”听一遍，再一句一句跟读。遇到长句子可以停下来，用慢速多听两遍。</div>' +
      UI.checkinButton('打卡');

    var ta = root.querySelector('#ta');
    var listEl = root.querySelector('#list');
    var cntEl = root.querySelector('#cnt');

    function paint() {
      var arr = Store.state.recite;
      cntEl.textContent = arr.length + ' 篇';
      if (!arr.length) {
        listEl.innerHTML = UI.empty('🎤', '还保存文本哦～录入一篇吧');
        return;
      }
      listEl.innerHTML = '<div class="list">' + arr.map(function (r) {
        var mins = Math.max(1, Math.round(r.text.length / 200));
        return '<div class="list-row">' +
          '<div class="lr-ico">📄</div>' +
          '<div class="lr-main"><strong>' + UI.esc(r.title) + '</strong>' +
            '<span>' + r.text.length + ' 字 · 约 ' + mins + ' 分钟 · ' + UI.esc(r.date) + '</span></div>' +
          '<div class="lr-act">' +
            '<button class="btn btn-sm btn-soft" data-say="' + r.id + '">🔊 朗读</button>' +
            '<button class="btn btn-sm btn-danger" data-del="' + r.id + '">删除</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    function makeTitle(text) {
      var first = text.split('\n').filter(function (l) { return l.trim(); })[0] || '未命名朗诵';
      first = first.replace(/[《》]/g, '').trim();
      return first.length > 16 ? first.slice(0, 16) + '…' : first;
    }

    root.querySelector('#save').addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { UI.toast('先写点内容再保存哦', 'warn'); return; }
      Store.state.recite.unshift({
        id: 'r' + Date.now(),
        title: makeTitle(text),
        text: text,
        date: Store.today(),
        chars: text.length
      });
      Store.save();
      ta.value = '';
      paint();
      UI.toast('已保存！可以开始朗读啦', 'ok');
    });

    root.querySelector('#read').addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { UI.toast('先输入要朗读的文本', 'warn'); return; }
      if (UI.checkVoice()) Speech.speak(text, { lang: 'zh-CN' });
    });

    root.querySelector('#clear').addEventListener('click', function () {
      ta.value = '';
      ta.focus();
    });

    listEl.addEventListener('click', function (e) {
      var say = e.target.closest('[data-say]');
      if (say) {
        var item = Store.state.recite.filter(function (r) { return r.id === say.getAttribute('data-say'); })[0];
        if (item && UI.checkVoice()) Speech.speak(item.text, { lang: 'zh-CN' });
        return;
      }
      var del = e.target.closest('[data-del]');
      if (del) {
        var id = del.getAttribute('data-del');
        UI.confirm({ title: '删除这篇文本？', message: '删除后无法恢复。', okText: '删除', danger: true }).then(function (ok) {
          if (!ok) return;
          Store.state.recite = Store.state.recite.filter(function (r) { return r.id !== id; });
          Store.save();
          paint();
          UI.toast('已删除', 'ok');
        });
      }
    });

    paint();
    UI.bindCheckin(root, 'recite', '朗诵');
    return function () { Speech.stop(); };
  }

  Modules.register('recite', {
    icon: '🎤',
    title: '朗读练习',
    subtitle: '录入文本 · 语音朗读 · 慢速跟读',
    badge: '自由录入',
    render: render
  });
})();
