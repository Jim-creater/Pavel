/* ============================================================
   ПАВЕЛ ИЗ ТАРСА — звуковой слой
   ------------------------------------------------------------
   Философия та же, что у сериала: не музыка поверх всего,
   а тишина с редкими звуками. И один удар — на вспышке.

   Звук ВСЕГДА выключен по умолчанию. Включает только человек,
   кнопкой в шапке. Выбор запоминается.

   Файлов может не быть — слой это переживает молча:
   отсутствующий файл просто не звучит, сайт не ломается.

   Куда класть файлы:
     assets/audio/theme-road.mp3    — тема дороги (до Дамаска)
     assets/audio/theme-dark.mp3    — тема гонителя (блок «Поворот»)
     assets/audio/theme-risen.mp3   — тема после вспышки (до конца)
     assets/audio/sfx-flash.mp3     — удар на вспышке
     assets/audio/sfx-hover.mp3     — тик при наведении
     assets/audio/sfx-click.mp3     — щелчок
   ============================================================ */
(function(){
'use strict';

var BASE  = 'assets/audio/';
var STORE = 'paul.sound';
var FADE  = 2200;   /* кроссфейд между темами, мс */

/* ── запомненный выбор ─────────────────────────────────── */
function remembered(){
  try { return localStorage.getItem(STORE) === 'on'; } catch(e){ return false; }
}
function remember(on){
  try { localStorage.setItem(STORE, on ? 'on' : 'off'); } catch(e){}
}

/* ── плавное изменение громкости ───────────────────────── */
function fade(el, to, ms, done){
  if (el._raf) cancelAnimationFrame(el._raf);
  var from = el.volume, t0 = performance.now();
  if (ms <= 0 || from === to){ el.volume = to; if (done) done(); return; }
  function step(t){
    var k = Math.min(1, (t - t0) / ms);
    /* ease-out: громкость не должна «въезжать» линейно */
    var e = 1 - Math.pow(1 - k, 2);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * e));
    if (k < 1) el._raf = requestAnimationFrame(step);
    else { el._raf = 0; if (done) done(); }
  }
  el._raf = requestAnimationFrame(step);
}

/* ── создание дорожки ──────────────────────────────────── */
function track(name, vol, loop){
  var a = new Audio();
  a.preload = 'none';
  a.loop = !!loop;
  a.volume = 0;
  a.src = BASE + name + '.mp3';
  a._peak = vol;
  a._dead = false;
  a.addEventListener('error', function(){ a._dead = true; }, {once:true});
  return a;
}

var THEMES = {
  road : track('theme-road',  .30, true),
  dark : track('theme-dark',  .28, true),
  risen: track('theme-risen', .36, true)
};
var SFX = {
  flash: track('sfx-flash', .55, false),
  hover: track('sfx-hover', .12, false),
  click: track('sfx-click', .20, false)
};

var on      = false;   /* включён ли звук вообще */
var wanted  = 'road';  /* какая тема должна звучать сейчас */
var playing = null;    /* какая звучит фактически */

/* ── переключение темы ─────────────────────────────────── */
function setTheme(name){
  if (wanted === name) return;
  wanted = name;
  if (on) apply();
}

function apply(){
  var next = THEMES[wanted];
  if (playing === next) return;

  if (playing){
    var old = playing;
    fade(old, 0, FADE, function(){ old.pause(); });
  }
  playing = next;
  if (!next || next._dead) return;

  next.volume = 0;
  var p = next.play();
  if (p && p.catch) p.catch(function(){ next._dead = true; });
  fade(next, next._peak, FADE);
}

/* ── разовые звуки ─────────────────────────────────────── */
function shot(name){
  if (!on) return;
  var s = SFX[name];
  if (!s || s._dead) return;
  /* клон, чтобы звуки не обрывали друг друга */
  var c = s.cloneNode();
  c.volume = s._peak;
  var p = c.play();
  if (p && p.catch) p.catch(function(){});
}

/* ── включение / выключение ────────────────────────────── */
function enable(){
  on = true;
  remember(true);
  document.documentElement.dataset.sound = 'on';
  playing = null;
  apply();
}
function disable(){
  on = false;
  remember(false);
  document.documentElement.dataset.sound = 'off';
  if (playing){
    var old = playing;
    fade(old, 0, 600, function(){ old.pause(); });
    playing = null;
  }
}

/* ── кнопка в шапке ────────────────────────────────────── */
var btn = document.getElementById('sound');
if (btn){
  btn.addEventListener('click', function(){
    if (on) disable(); else enable();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
    btn.classList.remove('hint');
  });

  /* один раз, ненавязчиво: подсказать, что звук есть.
     Только если человек ещё ни разу его не трогал. */
  var touched = false;
  try { touched = localStorage.getItem(STORE) !== null; } catch(e){}
  if (!touched){
    setTimeout(function(){ if (!on) btn.classList.add('hint'); }, 4000);
    setTimeout(function(){ btn.classList.remove('hint'); }, 12000);
  }
}

/* ── карта тем по секциям ──────────────────────────────── */
/* road  — от начала до блока «Поворот»
   dark  — блок «Поворот» до вспышки
   risen — после вспышки и до конца                        */
var turn = document.getElementById('turn');
if (turn){
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (document.documentElement.dataset.act === 'after') return;
      setTheme(e.isIntersecting ? 'dark' : 'road');
    });
  }, {threshold:.15}).observe(turn);
}

/* смена акта = смена темы. Слушаем то же, что меняет палитру. */
new MutationObserver(function(){
  setTheme(document.documentElement.dataset.act === 'after' ? 'risen' : 'dark');
}).observe(document.documentElement, {attributes:true, attributeFilter:['data-act']});

/* удар на вспышке — событие шлёт main.js */
addEventListener('paul:flash', function(){ shot('flash'); });

/* ── звуки интерфейса ──────────────────────────────────── */
/* Только там, где это осмысленно: навигация и кнопки.
   Не на каждой карточке — иначе страница начинает трещать. */
if (!matchMedia('(hover:none)').matches){
  document.querySelectorAll('.menu a, .contacts a, .burger, .sound').forEach(function(el){
    el.addEventListener('pointerenter', function(){ shot('hover'); });
  });
}
document.querySelectorAll('.menu a, .contacts a, .burger').forEach(function(el){
  el.addEventListener('click', function(){ shot('click'); });
});

/* ── фон: молчим, когда вкладка не активна ─────────────── */
document.addEventListener('visibilitychange', function(){
  if (!on || !playing) return;
  if (document.hidden) fade(playing, 0, 400, function(){ playing.pause(); });
  else { playing.play().catch(function(){}); fade(playing, playing._peak, 900); }
});

/* ── восстановить выбор ────────────────────────────────── */
document.documentElement.dataset.sound = 'off';
if (remembered() && btn){
  /* Браузер не даст запустить звук без жеста. Ждём первого
     касания страницы и только тогда поднимаем громкость. */
  var resume = function(){
    enable();
    btn.setAttribute('aria-pressed','true');
    btn.setAttribute('aria-label','Выключить звук');
    removeEventListener('pointerdown', resume);
    removeEventListener('keydown', resume);
    removeEventListener('wheel', resume);
  };
  addEventListener('pointerdown', resume, {once:true});
  addEventListener('keydown', resume, {once:true});
  addEventListener('wheel', resume, {once:true, passive:true});
}

})();
