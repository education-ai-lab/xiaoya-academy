/* ============================================================
   数据层：本地持久化 + 学习数据统计
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'kid-study-workbench.v1';
  var storageOK = true;
  var listeners = [];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function keyOf(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function today() { return keyOf(new Date()); }

  function defaults() {
    return {
      version: 1,
      profile: { name: '小小', avatar: '🐣' },
      createdAt: today(),
      points: 0,
      days: {},
      mastered: {
        pinyin: [], chars: [], poems: [], phonics: [], raz: [], english: [], science: [],
        fitnessDate: '', fitness: [], vestDate: '', vest: []
      },
      wrongBook: [],
      mathRecords: [],
      focusRecords: [],
      recite: [],
      counters: { ball: { best: 0, last: 0 }, rope: { best: 0, last: 0 } },
      swim: { free: 1, breast: 0, back: 0, fly: 0 },
      swimLog: [],
      settings: { rate: 1, sound: true },
      demo: false
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch (e) {
      storageOK = false;
    }
    if (!raw) return defaults();
    try {
      var parsed = JSON.parse(raw);
      var base = defaults();
      // 浅合并，保证新增字段不缺失
      var merged = Object.assign(base, parsed);
      merged.profile = Object.assign(base.profile, parsed.profile || {});
      merged.mastered = Object.assign(base.mastered, parsed.mastered || {});
      merged.settings = Object.assign(base.settings, parsed.settings || {});
      merged.counters = Object.assign(base.counters, parsed.counters || {});
      merged.swim = Object.assign(base.swim, parsed.swim || {});
      if (!merged.days || typeof merged.days !== 'object') merged.days = {};
      if (!Array.isArray(merged.wrongBook)) merged.wrongBook = [];
      if (!Array.isArray(merged.mathRecords)) merged.mathRecords = [];
      if (!Array.isArray(merged.focusRecords)) merged.focusRecords = [];
      if (!Array.isArray(merged.recite)) merged.recite = [];
      if (!Array.isArray(merged.swimLog)) merged.swimLog = [];
      return merged;
    } catch (e) {
      return defaults();
    }
  }

  var state = load();

  function save() {
    if (storageOK) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        storageOK = false;
      }
    }
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (e) { /* 忽略订阅者错误 */ }
    }
  }

  function ensureDay(key) {
    var k = key || today();
    if (!state.days[k]) {
      state.days[k] = { checkins: {}, points: 0, practice: {} };
    }
    var d = state.days[k];
    if (!d.checkins) d.checkins = {};
    if (!d.practice) d.practice = {};
    if (typeof d.points !== 'number') d.points = 0;
    return d;
  }

  function isActiveDay(d) {
    if (!d) return false;
    return Object.keys(d.checkins || {}).length > 0 || Object.keys(d.practice || {}).length > 0;
  }

  function addPoints(n) {
    n = Math.round(n);
    if (!n) return 0;
    state.points = Math.max(0, (state.points || 0) + n);
    var d = ensureDay();
    d.points = Math.max(0, d.points + n);
    save();
    return n;
  }

  function checkin(moduleId, moduleName) {
    var d = ensureDay();
    var had = d.checkins[moduleId] || 0;
    d.checkins[moduleId] = had + 1;
    var first = had === 0;
    if (first) {
      state.points = (state.points || 0) + 5;
      d.points += 5;
    }
    save();
    return { first: first, points: first ? 5 : 0, name: moduleName || moduleId };
  }

  function todayCheckins() {
    var d = ensureDay();
    return Object.keys(d.checkins).map(function (k) {
      return { id: k, count: d.checkins[k] };
    });
  }

  function recordPractice(moduleId, total, correct, seconds) {
    total = total || 0;
    correct = correct || 0;
    var d = ensureDay();
    var p = d.practice[moduleId] || { total: 0, correct: 0, seconds: 0 };
    p.total += total;
    p.correct += correct;
    p.seconds += (seconds || 0);
    d.practice[moduleId] = p;
    save();
    return p;
  }

  function addWrong(item) {
    var rec = {
      id: 'w' + Date.now() + Math.floor(Math.random() * 1000),
      module: item.module || 'math',
      moduleName: item.moduleName || '数学口算',
      q: String(item.q || ''),
      answer: String(item.answer == null ? '' : item.answer),
      userAnswer: String(item.userAnswer == null ? '' : item.userAnswer),
      date: today()
    };
    state.wrongBook.unshift(rec);
    if (state.wrongBook.length > 200) state.wrongBook.length = 200;
    save();
    return rec;
  }

  function removeWrong(id) {
    state.wrongBook = state.wrongBook.filter(function (w) { return w.id !== id; });
    save();
  }

  function clearWrong() {
    state.wrongBook = [];
    save();
  }

  function markMastered(listName, value) {
    var arr = state.mastered[listName];
    if (!Array.isArray(arr)) { arr = []; state.mastered[listName] = arr; }
    if (arr.indexOf(value) === -1) {
      arr.push(value);
      save();
      return true;
    }
    return false;
  }

  function isMastered(listName, value) {
    var arr = state.mastered[listName];
    return Array.isArray(arr) && arr.indexOf(value) !== -1;
  }

  function streak() {
    var d = new Date();
    var count = 0;
    // 今天还没学习时，从昨天开始算连续
    if (!isActiveDay(state.days[keyOf(d)])) {
      d.setDate(d.getDate() - 1);
    }
    for (var i = 0; i < 400; i++) {
      if (isActiveDay(state.days[keyOf(d)])) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }

  function monthStats(year, month) {
    var prefix = year + '-' + pad(month + 1);
    var days = 0, times = 0, points = 0, practice = 0, correct = 0;
    Object.keys(state.days).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      var d = state.days[k];
      if (isActiveDay(d)) days++;
      Object.keys(d.checkins || {}).forEach(function (m) { times += d.checkins[m]; });
      points += d.points || 0;
      Object.keys(d.practice || {}).forEach(function (m) {
        practice += d.practice[m].total || 0;
        correct += d.practice[m].correct || 0;
      });
    });
    return { days: days, times: times, points: points, practice: practice, correct: correct };
  }

  function totals() {
    var practice = 0, correct = 0, checkins = 0, activeDays = 0;
    Object.keys(state.days).forEach(function (k) {
      var d = state.days[k];
      if (isActiveDay(d)) activeDays++;
      Object.keys(d.checkins || {}).forEach(function (m) { checkins += d.checkins[m]; });
      Object.keys(d.practice || {}).forEach(function (m) {
        practice += d.practice[m].total || 0;
        correct += d.practice[m].correct || 0;
      });
    });
    return {
      practice: practice,
      correct: correct,
      accuracy: practice ? Math.round((correct / practice) * 100) : 0,
      checkins: checkins,
      activeDays: activeDays,
      points: state.points || 0
    };
  }

  function lastNDays(n) {
    var out = [];
    var d = new Date();
    d.setDate(d.getDate() - (n - 1));
    for (var i = 0; i < n; i++) {
      var k = keyOf(d);
      var day = state.days[k];
      var total = 0, correct = 0, checkins = 0;
      if (day) {
        Object.keys(day.practice || {}).forEach(function (m) {
          total += day.practice[m].total || 0;
          correct += day.practice[m].correct || 0;
        });
        Object.keys(day.checkins || {}).forEach(function (m) { checkins += day.checkins[m]; });
      }
      out.push({
        key: k,
        label: (d.getMonth() + 1) + '/' + d.getDate(),
        weekday: '日一二三四五六'.charAt(d.getDay()),
        total: total,
        correct: correct,
        checkins: checkins
      });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function moduleCheckinRank() {
    var map = {};
    Object.keys(state.days).forEach(function (k) {
      var c = state.days[k].checkins || {};
      Object.keys(c).forEach(function (m) { map[m] = (map[m] || 0) + c[m]; });
    });
    return Object.keys(map).map(function (m) { return { id: m, count: map[m] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    var parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.days) {
      throw new Error('文件格式不正确');
    }
    var base = defaults();
    var merged = Object.assign(base, parsed);
    merged.profile = Object.assign(base.profile, parsed.profile || {});
    merged.mastered = Object.assign(base.mastered, parsed.mastered || {});
    merged.settings = Object.assign(base.settings, parsed.settings || {});
    merged.counters = Object.assign(base.counters, parsed.counters || {});
    merged.swim = Object.assign(base.swim, parsed.swim || {});
    state = merged;
    save();
    return true;
  }

  function reset() {
    state = defaults();
    save();
  }

  function seedDemo() {
    var names = ['pinyin', 'math', 'focus', 'english', 'poem', 'fitness', 'raz'];
    var now = new Date();
    for (var i = 6; i >= 1; i--) {
      var d = new Date(now.getTime());
      d.setDate(d.getDate() - i);
      var k = keyOf(d);
      var day = ensureDay(k);
      var picks = names.slice(0, 2 + (i % 4));
      picks.forEach(function (m) {
        day.checkins[m] = 1;
        day.points += 5;
        state.points += 5;
      });
      var total = 10 + ((i * 3) % 15);
      var correct = total - (i % 3);
      day.practice.math = { total: total, correct: correct, seconds: total * 12 };
      state.mathRecords.unshift({
        date: k, total: total, correct: correct, seconds: total * 12, at: k + ' 18:00'
      });
    }
    state.demo = true;
    save();
  }

  function clearDemo() {
    // 仅清除标记，保留用户真实数据（演示数据已混入，提示用户可整体重置）
    state.demo = false;
    save();
  }

  window.Store = {
    get state() { return state; },
    today: today,
    keyOf: keyOf,
    save: save,
    ensureDay: ensureDay,
    addPoints: addPoints,
    checkin: checkin,
    todayCheckins: todayCheckins,
    recordPractice: recordPractice,
    addWrong: addWrong,
    removeWrong: removeWrong,
    clearWrong: clearWrong,
    markMastered: markMastered,
    isMastered: isMastered,
    streak: streak,
    monthStats: monthStats,
    totals: totals,
    lastNDays: lastNDays,
    moduleCheckinRank: moduleCheckinRank,
    exportJSON: exportJSON,
    importJSON: importJSON,
    reset: reset,
    seedDemo: seedDemo,
    clearDemo: clearDemo,
    isStorageOK: function () { return storageOK; },
    subscribe: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
    }
  };
})();
