/* 设置与数据：资料 / 语音 / 数据备份 */
(function () {
  'use strict';

  var AVATARS = ['🐣', '🐼', '🦊', '🐯', '🐰', '🐨', '🦄', '🐬'];

  function render(root) {
    var profile = Store.state.profile;
    var settings = Store.state.settings;
    var voices = window.Speech ? Speech.voices() : [];
    var sizeKB = 0;
    try {
      sizeKB = Math.round((JSON.stringify(Store.state).length / 1024) * 10) / 10;
    } catch (e) { sizeKB = 0; }

    root.innerHTML =
      '<div class="card">' +
        '<div class="card-head"><h2>个人资料</h2><div class="spacer"></div>' +
          '<span class="hint">显示在顶部标语中</span></div>' +
        '<label class="field-label">名字</label>' +
        '<input class="input" id="name" maxlength="12" value="' + UI.esc(profile.name) + '" placeholder="给孩子起个昵称" />' +
        '<label class="field-label" style="margin-top:14px">头像</label>' +
        '<div class="avatar-row" id="avatars">' + AVATARS.map(function (a) {
          return '<button class="avatar-opt' + (a === profile.avatar ? ' active' : '') + '" data-a="' + a + '">' + a + '</button>';
        }).join('') + '</div>' +
        '<div class="btn-row" style="margin-top:16px">' +
          '<button class="btn btn-primary" id="saveProfile">保存资料</button>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><h2>语音设置</h2><div class="spacer"></div>' +
          '<span class="tag ' + (Speech.supported() ? 'mint' : 'amber') + '">' +
            (Speech.supported() ? '可用' : '不支持') + '</span></div>' +
        '<div class="section-note">朗读使用系统自带语音，不需要联网下载音频。不同设备音色会略有差别。</div>' +
        '<label class="field-label">朗读语速：<b id="rateVal" style="color:var(--purple-700)">' + settings.rate.toFixed(2) + '×</b></label>' +
        '<input type="range" id="rate" min="0.7" max="1.4" step="0.05" value="' + settings.rate + '" style="width:100%;accent-color:#2f6b4f" />' +
        '<div class="btn-row" style="margin-top:14px">' +
          '<button class="btn btn-soft" id="testZh">试听中文</button>' +
          '<button class="btn btn-soft" id="testEn">试听英文</button>' +
        '</div>' +
        '<div class="section-note" style="margin:14px 0 0">检测到 ' + voices.length + ' 个系统语音' +
          (voices.length ? '，已自动挑选最合适的中英文音色。' : '，如果听不到声音，请检查系统音量或换用 Chrome / Edge。') + '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><h2>数据管理</h2><div class="spacer"></div>' +
          '<span class="hint">约 ' + sizeKB + ' KB</span></div>' +
        '<div class="section-note">学习记录保存在这台设备的浏览器里。换设备、清理浏览器缓存前，记得先导出备份。</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-primary" id="export">⬇ 导出备份</button>' +
          '<button class="btn btn-ghost" id="importBtn">⬆ 导入备份</button>' +
          '<input type="file" id="file" accept=".json,application/json" style="display:none" />' +
          '<button class="btn btn-soft" id="demo">✨ 生成演示数据</button>' +
          '<button class="btn btn-danger" id="reset">🗑 清空全部数据</button>' +
        '</div>' +
        '<div class="notice" style="margin-top:16px">⚠️ <b>存储状态：</b>' +
          (Store.isStorageOK()
            ? '正常。数据只保存在本机，不会上传到任何服务器。'
            : '不可用！可能是浏览器隐私模式或本地文件限制，建议用启动脚本打开，或换用 Chrome / Edge。') +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-head"><h2>关于小芽学园</h2></div>' +
        '<div class="section-note" style="margin:0">' +
          '小芽学园是一套完全离线的学习计划：所有课程内容、题目、统计都在本地运行，没有账号、没有广告、不上传数据。<br>' +
          '· 语文：拼音卡片、识字本、古诗诵读、朗读练习<br>' +
          '· 数学：口算练习、四宫数独、应用题、方格专注<br>' +
          '· 英语：字母拼读、分级阅读、每日口语<br>' +
          '· 运动：拍球计数、跳绳计数、每日体能、平衡练习<br>' +
          '· 兴趣：游泳进阶、节拍练习<br>' +
          '· 更多：学习数据、科学小知识、设置与数据、打卡日历' +
        '</div>' +
      '</div>';

    var selectedAvatar = profile.avatar;

    root.querySelector('#avatars').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]');
      if (!b) return;
      selectedAvatar = b.getAttribute('data-a');
      root.querySelectorAll('.avatar-opt').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
    });

    root.querySelector('#saveProfile').addEventListener('click', function () {
      var name = root.querySelector('#name').value.trim() || '小小';
      Store.state.profile.name = name;
      Store.state.profile.avatar = selectedAvatar;
      Store.save();
      if (window.App) App.syncProfile();
      UI.toast('资料已保存', 'ok');
    });

    var rate = root.querySelector('#rate');
    rate.addEventListener('input', function () {
      var v = Number(rate.value);
      root.querySelector('#rateVal').textContent = v.toFixed(2) + '×';
      settings.rate = v;
      Store.save();
    });

    root.querySelector('#testZh').addEventListener('click', function () {
      if (UI.checkVoice()) Speech.speak('小朋友，你好呀！我们一起来学习吧。', { lang: 'zh-CN' });
    });
    root.querySelector('#testEn').addEventListener('click', function () {
      if (UI.checkVoice()) Speech.speak('Hello! Let us learn together.', { lang: 'en-US' });
    });

    root.querySelector('#export').addEventListener('click', function () {
      try {
        var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '小芽学园-学习数据-' + Store.today() + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 500);
        UI.toast('备份已导出', 'ok');
      } catch (e) {
        UI.toast('导出失败：' + e.message, 'err');
      }
    });

    var file = root.querySelector('#file');
    root.querySelector('#importBtn').addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          Store.importJSON(String(reader.result));
          UI.toast('导入成功，正在刷新…', 'ok');
          setTimeout(function () {
            if (window.App) { App.syncProfile(); App.reload(); }
          }, 600);
        } catch (e) {
          UI.toast('导入失败：' + e.message, 'err', 3000);
        }
        file.value = '';
      };
      reader.onerror = function () { UI.toast('文件读取失败', 'err'); };
      reader.readAsText(f);
    });

    root.querySelector('#demo').addEventListener('click', function () {
      UI.confirm({
        title: '生成演示数据？',
        message: '会在最近 6 天里写入示例打卡和口算成绩，用来预览报告图表。演示数据会混入真实记录，之后可用“清空全部数据”恢复干净状态。',
        okText: '生成'
      }).then(function (ok) {
        if (!ok) return;
        Store.seedDemo();
        UI.toast('演示数据已生成', 'ok');
        setTimeout(function () {
          if (window.App) App.reload();
        }, 400);
      });
    });

    root.querySelector('#reset').addEventListener('click', function () {
      UI.confirm({
        title: '清空全部数据？',
        message: '所有打卡、做题记录、错题本和保存的朗诵文本都会被删除，且无法恢复。建议先导出备份。',
        okText: '确认清空',
        danger: true
      }).then(function (ok) {
        if (!ok) return;
        Store.reset();
        UI.toast('已恢复初始状态', 'ok');
        setTimeout(function () {
          if (window.App) { App.syncProfile(); location.hash = '#/pinyin'; App.reload(); }
        }, 500);
      });
    });

    return function () { Speech.stop(); };
  }

  Modules.register('lab', {
    icon: '🧪',
    title: '设置与数据',
    subtitle: '个人资料 · 语音 · 备份与恢复',
    badge: '数据安全',
    render: render
  });
})();
