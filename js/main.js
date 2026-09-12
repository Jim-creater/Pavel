/* ============================================================
   ПАВЕЛ ИЗ ТАРСА · v5 — скрипты
   ============================================================ */
(function(){
'use strict';

var RM  = matchMedia('(prefers-reduced-motion: reduce)').matches;
var MOB = matchMedia('(max-width: 768px)').matches;

/* ── всегда начинаем сверху ────────────────────────────── */
/* Браузер по умолчанию возвращает страницу туда, где её закрыли
   в прошлый раз. На телефоне это особенно заметно: длинный лендинг
   открывается с середины, и человек не понимает, что произошло.
   Забираем управление себе. Якорь в адресе уважаем — на него
   переходим уже после того, как GSAP посчитает свои позиции,
   иначе закреплённый блок «Поворот» сдвигает всю раскладку
   и переход промахивается мимо цели. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function startPosition(){
  if (location.hash){
    var t = document.querySelector(location.hash);
    if (t) t.scrollIntoView({behavior:'instant', block:'start'});
  } else {
    scrollTo(0, 0);
  }
}
startPosition();
/* Дважды: ScrollTrigger при пересчёте возвращает браузеру право
   восстанавливать позицию и делает это уже после load, поэтому
   одной установки в начале скрипта не хватает — проверено. */
addEventListener('load', function(){
  startPosition();
  requestAnimationFrame(startPosition);
});

/* ── год в подвале ─────────────────────────────────────── */
var yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

/* ── шапка: фон при скролле ────────────────────────────── */
var nav = document.getElementById('nav');
var onScroll = function(){ nav.classList.toggle('stuck', scrollY > 40); };
onScroll(); addEventListener('scroll', onScroll, {passive:true});

/* ── бургер ────────────────────────────────────────────── */
var burger = document.getElementById('burger');
var menu = document.getElementById('menu');
burger.addEventListener('click', function(){
  var open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  burger.textContent = open ? 'Закрыть' : 'Меню';
});
menu.addEventListener('click', function(e){
  if (e.target.tagName === 'A'){
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    burger.textContent = 'Меню';
  }
});

/* ── появление ─────────────────────────────────────────── */
/* .rv — заголовок выезжает из-под маски (титр)
   .rise — короткий подъём для всего остального            */
/* Заголовку нужен внутренний span, который и поедет из-под маски.
   Создаём его здесь, а не в разметке: если скрипт не выполнится,
   заголовки останутся видимыми, а не пропадут. */
document.querySelectorAll('.rv').forEach(function(el){
  var s = document.createElement('span');
  s.className = 'rvi';
  while (el.firstChild) s.appendChild(el.firstChild);
  el.appendChild(s);
});

/* Список в порядке документа. Наблюдатель показывает блоки по мере
   появления, а подчистка sweep() догоняет всё, что успело уйти
   вверх при быстрой прокрутке или переходе по якорю: одного
   наблюдателя мало — такие блоки он пропускает, и они остаются
   скрытыми навсегда. */
var pending = [].slice.call(document.querySelectorAll('.rise,.rv'));

function reveal(el){
  el.classList.add('in');
  io.unobserve(el);
  var i = pending.indexOf(el);
  if (i > -1) pending.splice(i, 1);
}

var io = new IntersectionObserver(function(es){
  es.forEach(function(e){ if (e.isIntersecting) reveal(e.target); });
}, {rootMargin:'0px 0px -8% 0px', threshold:0.02});

pending.forEach(function(el){
  if (el.classList.contains('rise')){
    var sibs = [].slice.call(el.parentNode.children).filter(function(n){
      return n.classList && n.classList.contains('rise');
    });
    /* шаг 45 мс, не больше пяти ступеней: длиннее лестница
       начинает читаться как задержка, а не как последовательность */
    el.style.transitionDelay = Math.min(sibs.indexOf(el), 4) * 45 + 'ms';
  }
  io.observe(el);
});

function sweep(){
  var edge = innerHeight * 0.92;
  while (pending.length && pending[0].getBoundingClientRect().top < edge){
    reveal(pending[0]);
  }
}

/* ── дыхание кадров ────────────────────────────────────── */
/* Медленный наезд и отъезд крутится только у того, что сейчас
   на экране. Фаза у каждого кадра своя: если все начнут дышать
   в такт, страница станет похожа на заставку. */
if (!RM){
  var shots = [].slice.call(document.querySelectorAll('.ep-img img, .shot img, .refs figure > img'));
  shots.forEach(function(img, i){
    img.style.animationDelay = -((i * 4.7) % 22).toFixed(1) + 's';
  });
  var kio = new IntersectionObserver(function(es){
    es.forEach(function(e){ e.target.classList.toggle('kb', e.isIntersecting); });
  }, {rootMargin:'10% 0px'});
  shots.forEach(function(img){ kio.observe(img); });
}

/* ── подсветка активного пункта меню ───────────────────── */
var links = [].slice.call(document.querySelectorAll('.menu a'));
var targets = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
var nio = new IntersectionObserver(function(es){
  es.forEach(function(e){
    if (!e.isIntersecting) return;
    links.forEach(function(a,i){ a.classList.toggle('on', targets[i] === e.target); });
  });
}, {rootMargin:'-45% 0px -50% 0px'});
targets.forEach(function(t){ if (t) nio.observe(t); });

/* ── видео: грузим и играем только то, что на экране ───── */
/* mp4 (H.264) — везде; webm — запасной для сборок без H.264 */
var probe = document.createElement('video');
var EXT_MP4 = !!probe.canPlayType('video/mp4; codecs="avc1.42E01E"');
var PORTRAIT = matchMedia('(max-aspect-ratio: 3/4)').matches;

/* ── блок «Поворот»: на телефоне кадры, на широком экране видео ──
   Лишнюю половину выкидываем из документа до того, как заработают
   ленивые загрузчики: иначе телефон качает два видео, которых не
   увидит, а компьютер — две картинки, которых не покажет.
   Картинки ждут в data-src, чтобы браузер не начал их тянуть сам. */
(function(){
  var stage = document.getElementById('turnStage');
  if (!stage) return;
  var frame = document.getElementById('turnFrame');
  if (PORTRAIT){
    stage.classList.add('pics');
    stage.querySelectorAll('video.lay').forEach(function(v){ v.remove(); });
    frame.querySelectorAll('img.lay').forEach(function(i){
      i.src = i.dataset.src;
      i.removeAttribute('data-src');
    });
  } else if (frame){
    frame.remove();
  }
})();

/* Если у кадра есть вертикальный вариант и телефон держат стоя —
   берём его. Горизонтальный кадр 2.39:1 на вертикальном экране
   превращается в полоску высотой в палец.
   Запасной webm лежит не для всех роликов, поэтому уходим на него
   только там, где он реально есть (data-webm): иначе браузер без
   H.264 получал бы 404 вместо картинки. */
function ext(el){
  return (!EXT_MP4 && el && el.dataset && 'webm' in el.dataset) ? '.webm' : '.mp4';
}
function vsrc(el){
  var base = (PORTRAIT && el.dataset.vidVert) ? el.dataset.vidVert : el.dataset.vid;
  return base.replace(/\.mp4$/, '') + ext(el);
}

var heroVid = document.getElementById('heroVid');
if (heroVid){
  var base = PORTRAIT ? 'assets/video/hero-loop-9x16' : 'assets/video/hero-loop';
  heroVid.src = base + '.mp4';
  heroVid.poster = base + '.webp';
  heroVid.play().catch(function(){});
}

var lazyVids = [].slice.call(document.querySelectorAll('video[data-vid]'));
var vio = new IntersectionObserver(function(es){
  es.forEach(function(e){
    var v = e.target;
    if (e.isIntersecting){
      if (!v.src){
        v.src = vsrc(v);
        if (PORTRAIT && v.dataset.posterVert) v.poster = v.dataset.posterVert;
      }
      v.play().catch(function(){});
      var band = v.closest('.band');
      if (band) band.classList.add('playing');
    } else {
      v.pause();
    }
  });
}, {rootMargin: MOB ? '80px 0px' : '200px 0px'});
lazyVids.forEach(function(v){ vio.observe(v); });

/* экономим батарею: пауза, когда вкладка не активна.
   Возвращаясь, будим только то, что реально на экране. */
document.addEventListener('visibilitychange', function(){
  var all = lazyVids.concat(heroVid ? [heroVid] : []);
  all.forEach(function(v){
    if (document.hidden){ v.pause(); return; }
    var r = v.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) v.play().catch(function(){});
  });
});

/* ── переключатель палитры ─────────────────────────────── */
function setAct(v){
  if (document.documentElement.dataset.act !== v) document.documentElement.dataset.act = v;
}

/* Уважаем «уменьшить движение»: закреплённый блок на 260% экрана —
   ровно то, что эта настройка просит не делать. Уходим в простую ветку. */
if (window.gsap && window.ScrollTrigger && !RM){
  gsap.registerPlugin(ScrollTrigger);

  /* Параллакс на полосах-картинках.
     scale обязан перекрывать ход: 1.14 даёт 7% запаса на сторону
     при ходе 4.5% — края картинки не оголяются. */
  document.querySelectorAll('.band').forEach(function(b){
    gsap.fromTo(b.querySelector('img'),
      {yPercent:-4.5, scale:1.14},
      {yPercent:4.5, scale:1.14, ease:'none',
       scrollTrigger:{trigger:b, start:'top bottom', end:'bottom top', scrub:.6}});
  });

  /* Герой: медленный наезд. На телефоне выключен — постоянное
     масштабирование полноэкранного видео там стоит слишком дорого. */
  var heroMedia = document.querySelector('.hero-media img, .hero-media video');
  if (heroMedia && !MOB){
    gsap.fromTo(heroMedia, {scale:1.0}, {scale:1.14, ease:'none',
      scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:.8}});
  }

  /* ── ГЛАВНЫЙ БЛОК: вспышка и смена палитры ───────────── */
  var stage = document.getElementById('turnStage');
  var flash = document.getElementById('turnFlash');
  var tag   = document.getElementById('turnTag');
  var after = stage.querySelector('.after');
  var before= stage.querySelector('.before');
  var grain = document.querySelector('.grain');

  var struck  = false;
  var warmNow = null;   /* подпись перерисовывается только при смене акта:
                           innerHTML на каждом кадре прокрутки — это парсинг
                           разметки шестьдесят раз в секунду впустую */

  var tl = gsap.timeline({scrollTrigger:{
    /* на телефоне ход короче: 2.6 экрана большим пальцем — это долго */
    trigger: stage, start:'top top', end: PORTRAIT ? '+=185%' : '+=260%',
    pin:true, scrub:.7, anticipatePin:1,
    onUpdate: function(s){
      var warm = s.progress > 0.46;
      setAct(warm ? 'after' : 'before');
      if (warm !== warmNow){
        warmNow = warm;
        tag.innerHTML = warm ? 'Акт III · <em>Павел</em>' : 'Акт I · <em>Савл</em>';
      }
      /* вспышка начинается на 0.28 — звук должен опережать её
         на кадр-другой, иначе удар слышится позже, чем виден */
      if (!struck && s.progress > 0.26 && s.direction === 1){
        struck = true;
        dispatchEvent(new CustomEvent('paul:flash'));
      }
      if (s.progress < 0.20) struck = false;
    },
    onLeaveBack: function(){ setAct('before'); struck = false; }
  }});

  /* Кадр в рамке 4:5 наезжает мягче: там нет запаса по краям,
     сильный зум съел бы фигуру. */
  tl.fromTo(before, {scale: PORTRAIT ? 1.0 : 1.03},
                    {scale: PORTRAIT ? 1.09 : 1.22, duration:.62, ease:'none'}, 0);

  var gr0 = getComputedStyle(grain).opacity;
  tl.fromTo(flash, {scale:0, opacity:0},
                   {scale: MOB ? 36 : 58, opacity:1, duration:.16, ease:'power2.in'}, .28)
    .to(grain, {opacity:0, duration:.12, ease:'none'}, .30)
    .set(after, {opacity:1}, .46)
    .fromTo(after, {scale: PORTRAIT ? 1.10 : 1.20},
                   {scale: PORTRAIT ? 1.0  : 1.02, duration:.34, ease:'none'}, .46)
    .to(flash, {opacity:0, duration:.16, ease:'power1.out'}, .58)
    .to(grain, {opacity:gr0, duration:.16, ease:'none'}, .58);

  tl.to({}, {duration:.14}, .86);

  addEventListener('load', function(){
    ScrollTrigger.refresh();
    /* Позиции пересчитаны — только теперь якорь встанет точно,
       а страница без якоря окончательно вернётся наверх. */
    startPosition();
    requestAnimationFrame(startPosition);
  });

} else {
  /* GSAP не загрузился ИЛИ человек попросил меньше движения —
     палитра переключается простым наблюдателем, без закрепления */
  var st = document.getElementById('turnStage');
  var af = st.querySelector('.after');
  af.style.opacity = 1;
  document.getElementById('turnFlash').style.display = 'none';
  var tagEl = document.getElementById('turnTag');
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      var warm = e.isIntersecting || e.boundingClientRect.top < 0;
      setAct(warm ? 'after' : 'before');
      if (tagEl) tagEl.innerHTML = warm ? 'Акт III · <em>Павел</em>' : 'Акт I · <em>Савл</em>';
    });
  }, {threshold:.4}).observe(st);
}

/* ── полоса прочитанного ───────────────────────────────── */
/* Страница длинная и без привычных ориентиров: линия отвечает
   на единственный вопрос «сколько ещё».
   Ширину пишем через transform: изменение width дёргает раскладку. */
var bar = document.getElementById('progress');
var ticking = false;
var draw = function(){
  if (bar){
    var max = document.documentElement.scrollHeight - innerHeight;
    var k = max > 0 ? Math.min(1, scrollY / max) : 0;
    bar.style.transform = 'scaleX(' + k + ')';
  }
  sweep();          /* один обработчик на две задачи, лишних кадров нет */
  ticking = false;
};
addEventListener('scroll', function(){
  if (!ticking){ ticking = true; requestAnimationFrame(draw); }
}, {passive:true});
addEventListener('resize', draw, {passive:true});
addEventListener('load', draw);
draw();

})();
