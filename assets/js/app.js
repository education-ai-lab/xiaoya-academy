/* ============================================================
   应用入口：导航、路由、顶部状态
   ============================================================ */
(function () {
  'use strict';

  var NAV = [
    {
      title: '语文', items: [
        { id: 'pinyin', icon: '🔤', label: '拼音卡片' },
        { id: 'chars', icon: '✏️', label: '识字本' },
        { id: 'poem', icon: '📜', label: '古诗诵读' },
        { id: 'recite', icon: '🎤', label: '朗读练习' }
      ]
    },
    {
      title: '数学', items: [
        { id: 'math', icon: '➕', label: '口算练习' },
        { id: 'sudoku', icon: '🔢', label: '四宫数独' },
        { id: 'logic', icon: '🧠', label: '应用题' },
        { id: 'focus', icon: '🎯', label: '方格专注' }
      ]
    },
    {
      title: '英语', items: [
        { id: 'phonics', icon: '🔡', label: '字母拼读' },
        { id: 'raz', icon: '📚', label: '分级阅读' },
        { id: 'english', icon: '💬', label: '每日口语' }
      ]
    },
    {
      title: '运动', items: [
        { id: 'ball', icon: '🏀', label: '拍球计数' },
        { id: 'rope', icon: '🪢', label: '跳绳计数' },
        { id: 'fitness', icon: '🏃', label: '每日体能' },
        { id: 'vestibular', icon: '🌀', label: '平衡练习' }
      ]
    },
    {
      title: '兴趣', items: [
        { id: 'swim', icon: '🏊', label: '游泳进阶' },
        { id: 'drum', icon: '🥁', label: '节拍练习' }
      ]
    },
    {
      title: '更多', items: [
        { id: 'report', icon: '📊', label: '学习数据' },
        { id: 'science', icon: '🔬', label: '科学小知识' },
        { id: 'lab', icon: '🧪', label: '设置与数据' },
        { id: 'calendar', icon: '📅', label: '打卡日历' }
      ]
    }
  ];

  var appEl = document.getElementById('app');
  var view = document.getElementById('view');
  var navEl = document.getElementById('nav');
  var cleanup = null;

  function buildNav() {
    navEl.innerHTML = NAV.map(function (group) {
      return '<div class="nav-title">' + group.title + '</div>' +
        group.items.map(function (it) {
          return '<button class="nav-item" data-id="' + it.id + '">' +
            '<span class="nav-ico">' + it.icon + '</span>' +
            '<span>' + it.label + '</span>' +
            '<span class="nav-dot" style="display:none"></span>' +
          '</button>';
        }).join('');
    }).join('');
  }

  function routeId() {
    var m = /^#\/([A-Za-z0-9_-]+)/.exec(location.hash || '');
    return m ? m[1] : 'pinyin';
  }

  function markActive(id) {
    var active = null;
    navEl.querySelectorAll('.nav-item').forEach(function (b) {
      var on = b.getAttribute('data-id') === id;
      b.classList.toggle('active', on);
      if (on) active = b;
      var dot = b.querySelector('.nav-dot');
      if (dot) dot.style.display = on ? 'block' : 'none';
    });
    // 让当前模块在侧栏中保持可见
    if (active) {
      var nr = navEl.getBoundingClientRect();
      var ar = active.getBoundingClientRect();
      if (ar.top < nr.top) navEl.scrollTop += ar.top - nr.top - 10;
      else if (ar.bottom > nr.bottom) navEl.scrollTop += ar.bottom - nr.bottom + 10;
    }
  }

  function renderRoute() {
    var id = routeId();
    var mod = Modules.get(id);
    if (!mod) {
      id = 'pinyin';
      mod = Modules.get(id);
      location.replace('#/pinyin');
    }
    if (!mod) return;

    if (cleanup) {
      try { cleanup(); } catch (e) { /* ignore */ }
      cleanup = null;
    }
    try { Speech.stop(); } catch (e) { /* ignore */ }

    document.getElementById('crumb').textContent = mod.title;
    document.title = mod.title + ' · 小芽学园';

    view.innerHTML = UI.hero(mod) + '<div class="module-body" id="modBody"></div>';
    var body = document.getElementById('modBody');
    try {
      cleanup = mod.render(body) || null;
    } catch (e) {
      body.innerHTML = '<div class="card"><div class="empty">😵 这个模块加载出错了<br><span style="font-size:12px">' +
        UI.esc(e && e.message ? e.message : e) + '</span></div></div>';
      if (window.console) console.error(e);
    }

    if (!Store.isStorageOK()) {
      var warn = document.createElement('div');
      warn.className = 'notice';
      warn.style.marginBottom = '14px';
      warn.innerHTML = '⚠️ <b>浏览器禁止了本地存储</b>：这次的记录刷新后会丢失。请换用 Chrome / Edge，或用文件夹里的启动脚本打开。';
      body.insertBefore(warn, body.firstChild);
    }

    markActive(id);
    appEl.classList.remove('nav-open');
    window.scrollTo({ top: 0, behavior: 'auto' });
    syncChrome();
  }

  function syncProfile() {
    var p = Store.state.profile;
    document.getElementById('brandName').textContent = '小芽学园';
    document.getElementById('brandLogo').textContent = p.avatar;
    var tag = document.getElementById('brandTag');
    if (tag) tag.textContent = p.name + '的学习计划';
    document.title = '小芽学园 · 每日学习计划';
  }

  function syncChrome() {
    var totals = Store.totals();
    var today = Store.todayCheckins();
    var todayCount = today.reduce(function (a, b) { return a + b.count; }, 0);
    document.getElementById('chipStreak').textContent = Store.streak();
    document.getElementById('chipPoints').textContent = totals.points;
    document.getElementById('footCheckins').textContent = todayCount;
    document.getElementById('footPoints').textContent = totals.points;
    document.getElementById('footBar').style.width = Math.min(100, (todayCount / 8) * 100) + '%';
  }

  /* ---------- 讲解 ---------- */
  function openGuide() {
    UI.modal({
      title: '💡 使用讲解',
      width: 560,
      body:
        '<h3>1. 怎么开始</h3>' +
        '<p>左边是六个大类，点开任意一个小练习就能直接学。每天建议挑 3～4 个：一个语文、一个数学、一个英语，再加一项运动。</p>' +
        '<h3>2. 做题数据怎么算</h3>' +
        '<p>口算练习点“自动批改”后会记录题量、正确率、用时和速度，答错的题自动进入错题本；拼音卡片、识字本、古诗诵读这些点一下卡片或“认识”，就会记进度。所有记录都能在“学习数据”里看到。</p>' +
        '<h3>3. 打卡和积分</h3>' +
        '<p>每个练习底部都有“打卡”，每天第一次打卡 +5 积分，连续打卡天数会显示在右上角。日历里紫色的日子就是有学习记录的日子。</p>' +
        '<h3>4. 语音朗读</h3>' +
        '<p>朗读用的是系统自带语音，不需要联网。如果没声音：检查系统音量、换 Chrome / Edge，或在“设置与数据 → 语音设置”里试听。</p>' +
        '<h3>5. 数据保存在哪里</h3>' +
        '<p>全部保存在本机浏览器，不上传服务器。换设备或清理缓存前，到“设置与数据”导出备份（JSON 文件），在新设备导入即可。</p>' +
        '<h3>6. 换名字和头像</h3>' +
        '<p>在“设置与数据 → 个人资料”里修改，左上角会同步更新。</p>',
      actions: [{ text: '开始学习', kind: 'primary' }]
    });
  }

  /* ---------- 事件 ---------- */
  navEl.addEventListener('click', function (e) {
    var b = e.target.closest('.nav-item');
    if (!b) return;
    location.hash = '#/' + b.getAttribute('data-id');
  });

  document.getElementById('navToggle').addEventListener('click', function () {
    appEl.classList.toggle('nav-open');
  });
  document.getElementById('navOverlay').addEventListener('click', function () {
    appEl.classList.remove('nav-open');
  });

  document.getElementById('btnGuide').addEventListener('click', openGuide);
  document.getElementById('btnReport').addEventListener('click', function () {
    location.hash = '#/report';
  });
  document.getElementById('btnRefresh').addEventListener('click', function () {
    Store.save();
    renderRoute();
    UI.toast('已刷新数据', 'ok', 1400);
  });

  window.addEventListener('hashchange', renderRoute);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') appEl.classList.remove('nav-open');
  });

  Store.subscribe(syncChrome);

  /* ---------- 启动 ---------- */
  buildNav();
  syncProfile();
  renderRoute();

  if (location.protocol === 'file:') {
    window.setTimeout(function () {
      UI.toast('本地文件模式已打开 · 用启动脚本打开数据保存更稳', 'warn', 4200);
    }, 900);
  }

  window.App = {
    reload: renderRoute,
    syncProfile: syncProfile,
    syncChrome: syncChrome,
    go: function (id) { location.hash = '#/' + id; },
    nav: NAV
  };
})();
