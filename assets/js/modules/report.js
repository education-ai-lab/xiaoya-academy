/* 学习报告 · 做题数据看板 */
(function () {
  'use strict';
  var DATA = window.APP_DATA;

  var NAMES = {
    pinyin: '拼音', chars: '识字', poem: '古诗', recite: '朗读',
    math: '口算', sudoku: '数独', logic: '应用题', focus: '方格专注',
    phonics: '字母拼读', raz: '分级阅读', english: '每日口语',
    ball: '拍球', rope: '跳绳', fitness: '每日体能', vestibular: '平衡练习',
    swim: '游泳', drum: '节拍', science: '科学'
  };

  function nameOf(id) { return NAMES[id] || id; }

  function chartSVG(days) {
    var W = 680, H = 240;
    var pad = { l: 40, r: 42, t: 22, b: 34 };
    var innerW = W - pad.l - pad.r;
    var innerH = H - pad.t - pad.b;
    var maxTotal = 10;
    days.forEach(function (d) { if (d.total > maxTotal) maxTotal = d.total; });
    maxTotal = Math.ceil(maxTotal / 5) * 5;

    var bw = innerW / days.length;
    var barW = Math.min(38, bw * 0.5);

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="近七日做题趋势">';
    svg += '<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed"/>' +
      '</linearGradient></defs>';

    // 网格
    for (var g = 0; g <= 4; g++) {
      var y = pad.t + (innerH / 4) * g;
      var val = Math.round(maxTotal - (maxTotal / 4) * g);
      svg += '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y +
        '" stroke="#efeaf9" stroke-width="1"/>';
      svg += '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#9a92b3">' + val + '</text>';
    }

    var pts = [];
    days.forEach(function (d, i) {
      var cx = pad.l + bw * i + bw / 2;
      var h = maxTotal ? (d.total / maxTotal) * innerH : 0;
      var y = pad.t + innerH - h;
      svg += '<rect x="' + (cx - barW / 2) + '" y="' + pad.t + '" width="' + barW + '" height="' + innerH +
        '" rx="' + Math.min(8, barW / 2) + '" fill="#faf8ff"/>';
      if (d.total > 0) {
        svg += '<rect x="' + (cx - barW / 2) + '" y="' + y + '" width="' + barW + '" height="' + Math.max(3, h) +
          '" rx="' + Math.min(8, barW / 2) + '" fill="url(#barGrad)"/>';
        svg += '<text x="' + cx + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6d28d9">' + d.total + '</text>';
      } else {
        svg += '<rect x="' + (cx - barW / 2) + '" y="' + (pad.t + innerH - 3) + '" width="' + barW +
          '" height="3" rx="1.5" fill="#ece6f8"/>';
      }
      svg += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" font-size="10.5" fill="#9a92b3">' + d.label + '</text>';

      var acc = d.total ? (d.correct / d.total) * 100 : 0;
      pts.push({ x: cx, y: pad.t + innerH - (acc / 100) * innerH, acc: acc, has: d.total > 0 });
    });

    // 正确率折线
    var linePts = pts.filter(function (p) { return p.has; });
    if (linePts.length > 1) {
      svg += '<polyline fill="none" stroke="#ec4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="' +
        linePts.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '"/>';
    }
    linePts.forEach(function (p) {
      svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.4" fill="#fff" stroke="#ec4899" stroke-width="2"/>';
    });

    svg += '<g><rect x="' + (pad.l) + '" y="' + (H - 2) + '" width="0" height="0"/></g>';
    svg += '</svg>';
    return svg;
  }

  function render(root) {
    var totals = Store.totals();
    var days = Store.lastNDays(7);
    var rank = Store.moduleCheckinRank().slice(0, 6);
    var maxRank = rank.length ? rank[0].count : 1;
    var focus = Store.state.focusRecords;
    var bestFocus = focus.length ? Math.min.apply(null, focus.map(function (r) { return r.seconds; })) : null;
    var mathRecs = Store.state.mathRecords.slice(0, 6);
    var wrongs = Store.state.wrongBook;

    var html = '';

    // 概览
    html += '<div class="card">' +
      '<div class="card-head"><h2>总览</h2><div class="spacer"></div>' +
        '<span class="hint">数据保存在本机浏览器</span></div>' +
      '<div class="kpi-grid">' +
        '<div class="kpi"><span>累计学习天数</span><b>' + totals.activeDays + '<em>天</em></b></div>' +
        '<div class="kpi"><span>累计做题</span><b>' + totals.practice + '<em>题</em></b></div>' +
        '<div class="kpi"><span>平均正确率</span><b>' + totals.accuracy + '<em>%</em></b></div>' +
        '<div class="kpi"><span>累计积分</span><b>' + totals.points + '<em>分</em></b></div>' +
      '</div>' +
      '<div class="streak-days" id="streakDays"></div>' +
    '</div>';

    // 趋势
    html += '<div class="card">' +
      '<div class="card-head"><h2>近 7 天做题趋势</h2><div class="spacer"></div>' +
        '<span class="hint"><span style="color:#7c3aed">■</span> 做题数 &nbsp;<span style="color:#ec4899">●</span> 正确率</span></div>';

    var hasData = days.some(function (d) { return d.total > 0; });
    if (hasData) {
      html += '<div class="chart-box">' + chartSVG(days) + '</div>';
    } else {
      html += UI.empty('📉', '这周还没有做题记录<br>去「数学口算」做一组，图表就会亮起来');
    }
    html += '</div>';

    // 打卡分布
    html += '<div class="card">' +
      '<div class="card-head"><h2>打卡分布</h2><div class="spacer"></div>' +
        '<span class="hint">累计次数</span></div>';
    if (rank.length) {
      html += '<div class="hbar">' + rank.map(function (r) {
        return '<div class="hbar-row"><span>' + UI.esc(nameOf(r.id)) + '</span>' +
          '<div class="track"><i style="width:' + Math.max(4, (r.count / maxRank) * 100) + '%"></i></div>' +
          '<b>' + r.count + '</b></div>';
      }).join('') + '</div>';
    } else {
      html += UI.empty('🗂', '还没有打卡记录，先去任意模块打个卡吧');
    }
    html += '</div>';

    // 内容掌握进度
    var progressRows = [
      { id: 'pinyin', label: '拼音卡片', val: Store.state.mastered.pinyin.length, total: DATA.pinyin.length },
      { id: 'chars', label: '识字', val: Store.state.mastered.chars.length, total: DATA.chars.length },
      { id: 'poem', label: '古诗', val: Store.state.mastered.poems.length, total: DATA.poems.length },
      { id: 'phonics', label: '字母拼读', val: Store.state.mastered.phonics.length, total: 26 },
      { id: 'raz', label: '分级阅读', val: Store.state.mastered.raz.length, total: DATA.raz.length },
      { id: 'science', label: '科学小知识', val: Store.state.mastered.science.length, total: DATA.science.length }
    ];
    var learnedTotal = progressRows.reduce(function (a, b) { return a + b.val; }, 0);

    html += '<div class="card">' +
      '<div class="card-head"><h2>内容掌握</h2><div class="spacer"></div>' +
        '<span class="hint">已掌握 ' + learnedTotal + ' 项</span></div>' +
      '<div class="hbar">' + progressRows.map(function (r) {
        var pct = UI.pct(r.val, r.total);
        return '<div class="hbar-row prog"><span>' + UI.esc(r.label) + '</span>' +
          '<div class="track"><i style="width:' + Math.max(r.val ? 3 : 0, pct) + '%"></i></div>' +
          '<b>' + r.val + '/' + r.total + '</b></div>';
      }).join('') + '</div>' +
    '</div>';

    // 数学成绩
    html += '<div class="card">' +
      '<div class="card-head"><h2>口算成绩</h2><div class="spacer"></div>' +
        '<span class="hint">最近 ' + mathRecs.length + ' 次</span></div>';
    if (mathRecs.length) {
      html += '<div style="overflow-x:auto"><table class="data"><thead><tr>' +
        '<th>日期</th><th>题量</th><th>答对</th><th>正确率</th><th>用时</th><th>速度</th></tr></thead><tbody>' +
        mathRecs.map(function (r) {
          var per = r.seconds ? (r.total / (r.seconds / 60)) : 0;
          return '<tr><td>' + UI.esc(r.date) + '</td><td>' + r.total + '</td>' +
            '<td class="strong">' + r.correct + '</td><td>' + UI.pct(r.correct, r.total) + '%</td>' +
            '<td>' + UI.fmtClock(r.seconds) + '</td><td>' + per.toFixed(1) + ' 题/分</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html += UI.empty('🧮', '还没有口算记录，去做一组试试');
    }
    html += '</div>';

    // 专注力
    html += '<div class="card">' +
      '<div class="card-head"><h2>方格专注成绩</h2><div class="spacer"></div>' +
        '<span class="hint">共 ' + focus.length + ' 组</span></div>' +
      '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
        '<div class="kpi"><span>最佳单组</span><b>' + (bestFocus == null ? '—' : bestFocus.toFixed(1)) + '<em>秒</em></b></div>' +
        '<div class="kpi"><span>最近一组</span><b>' + (focus.length ? focus[0].seconds.toFixed(1) : '—') + '<em>秒</em></b></div>' +
      '</div>' +
      '<div class="section-note" style="margin:12px 0 0">5～7 岁孩子完成 5×5 方格，一般在 40～70 秒之间，多练会越来越快。</div>' +
    '</div>';

    // 错题本
    html += '<div class="card">' +
      '<div class="card-head"><h2>错题本</h2><div class="spacer"></div>' +
        '<span class="hint">共 ' + wrongs.length + ' 题</span>' +
        (wrongs.length ? '<button class="btn btn-sm btn-danger" id="clearWrong" style="margin-left:8px">清空</button>' : '') +
      '</div>';
    if (wrongs.length) {
      html += '<div class="list" id="wrongList">' + wrongs.slice(0, 12).map(function (w) {
        return '<div class="list-row">' +
          '<div class="lr-ico">❌</div>' +
          '<div class="lr-main"><strong>' + UI.esc(w.q) + '</strong>' +
            '<span>' + UI.esc(nameOf(w.module)) + ' · 你的答案 ' + UI.esc(w.userAnswer || '空') +
            ' · 正确答案 <b style="color:#047857">' + UI.esc(w.answer) + '</b> · ' + UI.esc(w.date) + '</span></div>' +
          '<div class="lr-act"><button class="btn btn-sm btn-ghost" data-del-wrong="' + w.id + '">移除</button></div>' +
        '</div>';
      }).join('') + '</div>';
      if (wrongs.length > 12) {
        html += '<div class="section-note" style="margin:10px 0 0">仅显示最近 12 题，共 ' + wrongs.length + ' 题。清空后可重新积累。</div>';
      }
    } else {
      html += UI.empty('🎉', '错题本是空的，说明做题很认真！');
    }
    html += '</div>';

    // 建议
    var tips = [];
    if (!totals.activeDays) tips.push('今天还没有开始学习，先从一个 5 分钟的小模块开始吧。');
    else if (Store.streak() >= 3) tips.push('已经连续学习 ' + Store.streak() + ' 天，保持这个节奏非常棒。');
    if (totals.practice >= 20 && totals.accuracy < 75) tips.push('正确率还有提升空间，建议把错题重新做一遍，再练一组口算。');
    if (totals.accuracy >= 90 && totals.practice >= 20) tips.push('正确率很稳，可以试试提高速度，或者挑战数独的“挑战模式”。');
    if (bestFocus != null && bestFocus > 70) tips.push('方格专注可以每天练 1 组，先求稳再求快。');
    if (!tips.length) tips.push('坚持每天一点点，一个月后回头看，会发现进步很大。');

    html += '<div class="card">' +
      '<div class="card-head"><h2>学习建议</h2></div>' +
      '<div class="answer-box" style="border-style:solid;border-color:#c7e9dc;background:linear-gradient(180deg,#f0fdf8,#f8fffc);color:#0b6b52">' +
        tips.map(function (t) { return '· ' + UI.esc(t); }).join('<br>') +
      '</div>' +
      '<div class="btn-row center" style="margin-top:16px">' +
        '<button class="btn btn-primary" id="printReport">打印 / 存为 PDF</button>' +
        '<button class="btn btn-ghost" id="goLab">数据备份与设置</button>' +
      '</div>' +
    '</div>';

    root.innerHTML = html;

    var chartBox = root.querySelector('.chart-box');
    if (chartBox) {
      chartBox.scrollLeft = chartBox.scrollWidth;
      if (chartBox.scrollWidth > chartBox.clientWidth + 4) {
        var tip = document.createElement('div');
        tip.className = 'section-note';
        tip.style.margin = '6px 0 0';
        tip.textContent = '← 左右滑动可查看完整 7 天';
        chartBox.parentNode.appendChild(tip);
      }
    }

    // 近 7 天打卡点
    var streakBox = root.querySelector('#streakDays');
    if (streakBox) {
      var dd = Store.lastNDays(7);
      streakBox.innerHTML = dd.map(function (d) {
        return '<div class="sd' + (d.checkins || d.total ? ' on' : '') + '" title="' + d.key + '">' +
          d.weekday + '</div>';
      }).join('');
    }

    var clearBtn = root.querySelector('#clearWrong');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        UI.confirm({
          title: '清空错题本？', message: '所有错题记录都会被删除，且无法恢复。',
          okText: '清空', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.clearWrong();
          UI.toast('错题本已清空', 'ok');
          App.reload();
        });
      });
    }

    root.addEventListener('click', function (e) {
      var del = e.target.closest('[data-del-wrong]');
      if (del) {
        Store.removeWrong(del.getAttribute('data-del-wrong'));
        UI.toast('已移除这道错题', 'ok');
        App.reload();
      }
    });

    var printBtn = root.querySelector('#printReport');
    if (printBtn) printBtn.addEventListener('click', function () {
      UI.toast('在打印窗口选择“另存为 PDF”即可保存', 'ok', 2600);
      setTimeout(function () { window.print(); }, 300);
    });

    var goLab = root.querySelector('#goLab');
    if (goLab) goLab.addEventListener('click', function () {
      location.hash = '#/lab';
    });

    return function () {};
  }

  Modules.register('report', {
    icon: '📊',
    title: '学习数据',
    subtitle: '做题记录 · 趋势 · 错题本 · 建议',
    badge: function () { return '正确率 ' + Store.totals().accuracy + '%'; },
    render: render
  });
})();
