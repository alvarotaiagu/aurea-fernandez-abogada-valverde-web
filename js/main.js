/* ═══════════════════════════════════════════════════════════════════════════
   Áurea Mª Fernández · «Laurel»
   La corona de su logo abre la página (cortina: las ramas crecen, las hojas se
   doran de abajo arriba, el monograma cae y la corona se queda en el hero) y
   la cierra (pie). La hoja suelta marca el área en curso. El oro, solo cuando
   algo se activa. La balanza del monograma NO se anima nunca.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue (área marcada, contador,
   mensajes compuestos); lo que se apaga es el viaje.

   Los módulos (opiniones, casos, despachos) viven en su propio archivo: este
   no depende de ellos y funciona igual si se borran.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;

  if (gsapReady) gsap.registerPlugin(window.ScrollTrigger);
  if (movimiento) html.classList.add('con-movimiento');

  var TELEFONO = '34657656956';
  var EMAIL = '4201@icaba.com';

  function densidad() { return html.classList.contains('densidad-sobria') ? 'sobria' : 'laurel'; }
  function alturaCabecera() { var c = document.getElementById('cabecera'); return c ? c.offsetHeight : 74; }
  function refrescar() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
  function todos(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function cuandoVisible(nodos, umbral, alEntrar, margen) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral, rootMargin: margen || '0px' });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* lo que comparten los módulos (si un módulo falta, nadie lo echa de menos) */
  var Aurea = window.Aurea = window.Aurea || {};
  Aurea.movimiento = movimiento;
  Aurea.gsapReady = gsapReady;
  Aurea.refrescar = refrescar;
  Aurea.cuandoVisible = cuandoVisible;
  Aurea.densidad = densidad;

  /* contador que sube (con movimiento reducido el número ya está puesto) */
  Aurea.contar = function (el, fin, decimales, sufijo) {
    var fmt = function (v) { return v.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: 'always' }) + (sufijo || ''); };
    if (!movimiento) { el.textContent = fmt(fin); return; }
    var t0 = performance.now(), dur = 1600;
    (function paso(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(fin * e);
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  };

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }
  Aurea.lenis = lenis;

  function irA(destino) {
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    var desfase = -alturaCabecera() + 1;
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.4 }); return; }
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }
  Aurea.irA = irA;

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('#areas-indice')) return;      /* el índice de áreas lo lleva su módulo */
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id === '#inicio' ? 0 : id);
  });

  /* ───────────────────── titulares partidos (char-reveal) ───────────────────── */
  /* la palabra es inline-block + nowrap: nunca se parte por dentro */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    if (!el.closest('[aria-hidden="true"]')) el.setAttribute('aria-label', texto);
    var piezas = [];
    function trocear(cadena, destino) {
      cadena.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          Array.from(trozo).forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra';
            s.textContent = c;
            caja.appendChild(s);
            piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int';
          s.textContent = trozo;
          caja.appendChild(s);
          piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    var hijos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    hijos.forEach(function (n) {
      if (n.nodeType === 3) { trocear(n.textContent, el); return; }
      if (n.nodeType === 1) {
        var envoltura = n.cloneNode(false);
        envoltura.setAttribute('aria-hidden', 'true');
        el.appendChild(envoltura);
        trocear(n.textContent, envoltura);
      }
    });
    return piezas;
  }
  function revelar(el, piezas, retardo) {
    var letras = el.dataset.revelar === 'letras';
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.1, ease: 'expo.out', delay: retardo || 0,
      stagger: letras ? Math.min(0.035, 1.1 / piezas.length) : 0.08
    });
  }
  /* la bandada (hero A): las 24 hojas vuelan y se posan. No en la sobria, ni al
     llegar por el paso entre páginas, ni sin movimiento: ahí la corona ya está puesta */
  var conBandada = movimiento && densidad() === 'laurel' && !html.classList.contains('con-paso') && !!document.getElementById('hero-corona');
  var RETRASO_HERO = conBandada ? 1.95 : 0.25;
  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abre', function () { revelar(el, piezas, RETRASO_HERO); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina corta: la hoja y su nombre; la corona se construye en el hero ───────────────── */
  var cortinaAbierta = false;
  function avisarApertura() {
    if (cortinaAbierta) return;
    cortinaAbierta = true;
    document.dispatchEvent(new CustomEvent('cortina-abre'));
  }
  Aurea.alAbrirse = function (fn) {
    if (cortinaAbierta) fn(); else document.addEventListener('cortina-abre', fn, { once: true });
  };

  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) { avisarApertura(); return; }
    var panel = document.getElementById('cortina-panel');
    var borde = document.getElementById('cortina-borde');
    var contenido = document.getElementById('cortina-contenido');
    var hoja = cort.querySelector('.cortina__hoja');
    var nombre = cort.querySelector('.cortina__nombre span');
    var pie = cort.querySelector('.cortina__abogada');
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      cort.classList.add('es-fuera');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes */
      if (gsapReady) gsap.ticker.lagSmoothing(0);
      if (lenis) lenis.start();
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }
    Aurea.retirarCortina = retirar;

    if (html.classList.contains('con-paso')) { setTimeout(retirar, 0); return; }   /* se llega por el paso: no se repite */
    if (!movimiento) { setTimeout(retirar, reduce ? 0 : 60); return; }              /* sin GSAP o reducido: nunca tapa */

    window.scrollTo(0, 0);
    if (lenis) lenis.stop();

    var SALE = 1.45;
    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    /* 1 · la hoja dorada se abre girando · 2 · el nombre sube de su máscara · 3 · «ABOGADA» asienta el espaciado */
    tl.fromTo(hoja, { opacity: 0, scale: 0.55, rotation: -60 }, { opacity: 1, scale: 1, rotation: -14, duration: 1.1, ease: 'expo.out', immediateRender: false }, 0.05)
      .fromTo(nombre, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 0.95, ease: 'expo.out', immediateRender: false }, 0.3)
      .fromTo(pie, { letterSpacing: '1.1em', opacity: 0 }, { letterSpacing: '.6em', opacity: 1, duration: 1.1, ease: 'expo.out', immediateRender: false }, 0.5)
    /* 4 · el panel tinta sube con expo.inOut, con paralaje interno y el borde curvo que se aplana */
      .call(avisarApertura, null, SALE)
      .to(contenido, { yPercent: -40, opacity: 0, duration: 0.7, ease: 'power2.in' }, SALE)
      .to(panel, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, SALE)
      .fromTo(borde, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power2.out', immediateRender: false }, SALE)
      .to(borde, { scaleY: 0, duration: 0.6, ease: 'power2.inOut' }, SALE + 0.45);

    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 450);
    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });
    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
  })();

  /* ───────────────── hero A · bandada: las 24 hojas vuelan y se posan ───────────────── */
  var bandadaHecha = !conBandada;
  function avisarBandada() {
    if (bandadaHecha && Aurea.bandadaAvisada) return;
    bandadaHecha = true; Aurea.bandadaAvisada = true;
    document.dispatchEvent(new CustomEvent('bandada-hecha'));
  }
  Aurea.trasBandada = function (fn) { if (bandadaHecha) fn(); else document.addEventListener('bandada-hecha', fn, { once: true }); };
  Aurea.bandadaActiva = function () { return !bandadaHecha; };

  (function bandada() {
    var corona = document.getElementById('hero-corona');
    if (!corona) return;
    if (!conBandada) { Aurea.alAbrirse(function () { avisarBandada(); }); return; }
    var svg = corona.querySelector('svg');
    var hojas = todos('.hero__hoja', corona);
    var bases = todos('.hero__rama > use:not(.hero__hoja)', corona);
    var mono = corona.querySelector('.hero__mono');
    /* estado de partida, antes de que se vea nada (la cortina tapa) */
    gsap.set(bases, { opacity: 0 });
    gsap.set(mono, { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(hojas, { opacity: 0 });
    Aurea.alAbrirse(function () {
      /* desde toda la pantalla: 1 px de pantalla = 1006 / ancho de la corona en unidades del logo */
      var r = svg.getBoundingClientRect();
      var k = 1006 / Math.max(1, r.width);
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var tl = gsap.timeline({ onComplete: avisarBandada });
      tl.fromTo(hojas, {
        opacity: 0,
        x: function () { return (gsap.utils.random(-0.15, 1.15) * window.innerWidth - cx) * k; },
        y: function () { return (gsap.utils.random(-0.25, 1.1) * window.innerHeight - cy) * k; },
        rotation: function () { return gsap.utils.random(-260, 260); },
        scale: function () { return gsap.utils.random(0.4, 1.9); }
      }, {
        opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%',
        duration: 1.7, ease: 'expo.out', stagger: { each: 0.032, from: 'random' }, immediateRender: true
      }, 0.15)
      /* al posarse aparece la rama, el oro se apaga y cae el monograma (la balanza, quieta) */
        .to(bases, { opacity: 1, duration: 0.7, ease: 'power1.inOut' }, 1.45)
        .to(hojas, { opacity: 0, duration: 0.7, ease: 'power1.in', stagger: { each: 0.018, from: 'end' } }, 1.7)
        .fromTo(mono, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.out', immediateRender: false }, 1.75)
        .set(hojas, { clearProps: 'transform' });
      Aurea.bandada = tl;
      /* quien empieza a bajar no espera */
      var prisa = function () { if (tl.progress() < 1) tl.timeScale(3); };
      ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });
    });
    /* red de seguridad: la corona nunca se queda a medias */
    setTimeout(function () {
      if (bandadaHecha) return;
      if (Aurea.bandada) Aurea.bandada.progress(1);
      gsap.set(bases, { opacity: 1 }); gsap.set(mono, { clipPath: 'none' }); gsap.set(hojas, { opacity: 0, clearProps: 'transform' });
      avisarBandada();
    }, 9000);
  })();

  /* ───────────────── hero: el resto entra con la corona ya puesta ───────────────── */
  (function hero() {
    var abogada = document.getElementById('hero-abogada');
    if (!abogada || !movimiento) return;
    var resto = todos('.hero__linea, .hero__acciones, .hero__pie');
    var d = conBandada ? 1.7 : 0;
    Aurea.alAbrirse(function () {
      /* «ABOGADA» cierra su espaciado */
      gsap.to(abogada, { letterSpacing: window.innerWidth <= 640 ? '.5em' : '.62em', opacity: 1, duration: 1.6, ease: 'expo.out', delay: 0.55 + d });
      gsap.to(resto, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.85 + d });
    });
  })();

  /* ───────────────── hero D · hojas al viento, cuando la bandada se posa ───────────────── */
  /* Canvas: la hoja del logo se pinta UNA vez en memoria (por tono) y se copia con
     drawImage; ningún filtro por fotograma. Se para fuera de pantalla y en la sobria. */
  (function viento() {
    var hero = document.getElementById('inicio');
    var cv = document.getElementById('hero-viento');
    var forma = document.querySelector('#hoja path');
    if (!hero || !cv || !forma || !movimiento || !window.Path2D) return;
    var ctx = cv.getContext('2d');
    var trazo = new Path2D(forma.getAttribute('d'));
    var sprites = ['#9C7A3C', '#B8934A', '#CDB78F', '#7E6230'].map(function (c) {
      var s = document.createElement('canvas'); s.width = 272; s.height = 150;
      var x = s.getContext('2d'); x.scale(2, 2); x.translate(-690, -44); x.fillStyle = c; x.fill(trazo); return s;
    });
    var dpr = Math.min(1.5, window.devicePixelRatio || 1), W = 0, H = 0, hojas = [], visible = false, raf = 0, empezado = false;
    var raton = { x: -9999, y: -9999, vx: 0, vy: 0 };
    var r = function (a, b) { return a + Math.random() * (b - a); };
    function medir() {
      var b = hero.getBoundingClientRect(); W = b.width; H = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    function nueva(rafaga) {
      var e = r(0.12, 0.26) * Math.min(1.25, Math.max(0.65, W / 1200));
      return { x: rafaga ? r(-W * 0.55, -20) : r(0, W), y: rafaga ? r(-H * 0.1, H * 0.85) : r(-H * 0.6, -30), vx: rafaga ? r(3.5, 9) : r(-0.3, 0.5), vy: r(0.25, 0.8),
        g: r(0, Math.PI * 2), vg: r(-0.025, 0.025), fase: r(0, 6.28), e: e, s: sprites[Math.floor(r(0, sprites.length))], a: r(0.35, 0.8) };
    }
    function pintar() {
      if (!visible) { raf = 0; return; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (densidad() === 'laurel') {
        hojas.forEach(function (h) {
          h.fase += 0.02;
          h.vx += Math.sin(h.fase) * 0.02; h.vx *= 0.985; h.vy = Math.min(h.vy + 0.004, 1.05);
          var dx = h.x - raton.x, dy = h.y - raton.y, dd = dx * dx + dy * dy;
          if (dd < 19600) { var f = (1 - Math.sqrt(dd) / 140) * 0.9; h.vx += (dx / 140) * f + raton.vx * 0.035; h.vy += (dy / 140) * f * 0.6; h.vg += 0.004 * (dx > 0 ? 1 : -1); }
          h.x += h.vx; h.y += h.vy; h.g += h.vg + Math.sin(h.fase) * 0.01;
          if (h.y > H + 40 || h.x > W + 140 || h.x < -W) Object.assign(h, nueva(false));
          ctx.setTransform(dpr * h.e, 0, 0, dpr * h.e, h.x * dpr, h.y * dpr);
          ctx.rotate(h.g);
          ctx.globalAlpha = h.a;
          ctx.drawImage(h.s, -68, -37.5, 136, 75);
        });
      }
      raf = requestAnimationFrame(pintar);
    }
    function empezar() {
      if (empezado) return;
      empezado = true;
      medir();
      var n = window.innerWidth < 640 ? 18 : 38;
      for (var i = 0; i < n; i++) hojas.push(nueva(i < n * 0.7));   /* una ráfaga desde la izquierda */
      cv.classList.add('es-vivo');
      if (visible && !raf) raf = requestAnimationFrame(pintar);
    }
    Aurea.viento = { activo: function () { return !!raf; }, hojas: function () { return hojas.length; } };
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && empezado && !raf) raf = requestAnimationFrame(pintar);
    }).observe(hero);
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (empezado) medir(); }).observe(hero);
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var b = hero.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      raton.vx = raton.x < -9000 ? 0 : x - raton.x; raton.vy = raton.y < -9000 ? 0 : y - raton.y; raton.x = x; raton.y = y;
    });
    hero.addEventListener('pointerleave', function () { raton.x = raton.y = -9999; });
    Aurea.trasBandada(function () { setTimeout(empezar, conBandada ? 150 : 600); });
  })();

  /* ───────────────── hero: luz que sigue al cursor, profundidad e indicador ───────────────── */
  (function heroPremium() {
    var hero = document.getElementById('inicio');
    var corona = document.getElementById('hero-corona');
    var bajar = document.getElementById('hero-bajar');
    if (!hero) return;
    /* el indicador se apaga al empezar a bajar (contenido: vale también sin movimiento) */
    if (bajar) {
      var apagar = function () { bajar.style.opacity = Math.max(0, 1 - window.pageYOffset / (window.innerHeight * 0.22)).toFixed(3); bajar.style.visibility = window.pageYOffset > window.innerHeight * 0.3 ? 'hidden' : ''; };
      window.addEventListener('scroll', apagar, { passive: true });
      apagar();
    }
    if (!movimiento || !corona || esTactil) return;
    var nombre = document.getElementById('hero-nombre');
    var cx = gsap.quickTo(corona, 'x', { duration: 1.1, ease: 'power3.out' });
    var cy = gsap.quickTo(corona, 'y', { duration: 1.1, ease: 'power3.out' });
    var nx = nombre ? gsap.quickTo(nombre, 'x', { duration: 1.3, ease: 'power3.out' }) : null;
    var luz = { x: 50, y: 32 }, meta = { x: 50, y: 32 }, viva = false;
    /* nada se mueve hasta que la cortina se ha ido y la bandada se ha posado */
    var lista = false;
    Aurea.trasBandada(function () { lista = true; });
    function pintarLuz() {
      luz.x += (meta.x - luz.x) * 0.06; luz.y += (meta.y - luz.y) * 0.06;
      hero.style.setProperty('--lx', luz.x.toFixed(2) + '%');
      hero.style.setProperty('--ly', luz.y.toFixed(2) + '%');
      if (Math.abs(meta.x - luz.x) + Math.abs(meta.y - luz.y) > 0.05) requestAnimationFrame(pintarLuz); else viva = false;
    }
    hero.addEventListener('pointermove', function (e) {
      if ((e.pointerType && e.pointerType !== 'mouse') || !lista) return;
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      meta.x = 30 + px * 40; meta.y = 18 + py * 34;
      if (!viva) { viva = true; requestAnimationFrame(pintarLuz); }
      cx((px - 0.5) * 18); cy((py - 0.5) * 12);
      if (nx) nx((px - 0.5) * -8);
    });
    hero.addEventListener('pointerleave', function () {
      meta.x = 50; meta.y = 32; if (!viva) { viva = true; requestAnimationFrame(pintarLuz); }
      cx(0); cy(0); if (nx) nx(0);
    });
  })();

  /* ───────────────── corona viva: las hojas se doran cerca del cursor y las ramas se recogen al bajar ───────────────── */
  (function coronaViva() {
    var corona = document.getElementById('hero-corona');
    var hero = document.getElementById('inicio');
    if (!corona || !hero || !movimiento) return;
    var izq = document.getElementById('hero-rama-izq'), der = document.getElementById('hero-rama-der');
    /* cada rama gira sobre la base de su tallo (svgOrigin, en coordenadas del PNG);
       el monograma y su balanza quedan fuera de estos grupos: no se mueven nunca */
    var recoger = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    if (izq) gsap.to(izq, { rotation: 7, svgOrigin: '884 852', ease: 'none', scrollTrigger: recoger });
    if (der) gsap.to(der, { rotation: -7, svgOrigin: '1122 852', ease: 'none', scrollTrigger: Object.assign({}, recoger) });
    if (esTactil) return;
    var hojas = todos('.hero__hoja', corona);
    var poner = null, pendiente = null;
    /* las mismas hojas vuelan en la bandada: el oro del cursor espera a que se posen */
    Aurea.trasBandada(function () { poner = hojas.map(function (h) { return gsap.quickTo(h, 'opacity', { duration: 0.55, ease: 'power2.out' }); }); });
    hero.addEventListener('pointermove', function (e) {
      if ((e.pointerType && e.pointerType !== 'mouse') || !poner) return;
      var x = e.clientX, y = e.clientY;
      if (pendiente) return;
      pendiente = requestAnimationFrame(function () {
        pendiente = null;
        var radio = Math.max(90, corona.offsetWidth * 0.34);
        hojas.forEach(function (h, i) {
          var r = h.getBoundingClientRect();
          var d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
          poner[i](Math.max(0, 1 - d / radio));
        });
      });
    });
    hero.addEventListener('pointerleave', function () { if (poner) poner.forEach(function (p) { p(0); }); });
  })();

  /* ───────────────── el retrato se abre dentro de su arco, con paralaje ───────────────── */
  (function retrato() {
    var fig = document.getElementById('sobre-retrato');
    if (!fig) return;
    /* se observa la sección: el retrato nace recortado al 100 % */
    cuandoVisible(todos('#sobre-mi'), 0.12, function () { fig.classList.add('es-visible'); });
    if (!movimiento) return;
    var img = fig.querySelector('img');
    gsap.fromTo(img, { scale: 1.14, yPercent: -5 }, {
      scale: 1.14, yPercent: 5, ease: 'none', immediateRender: true,
      scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  })();

  /* ───────────────── servicios: entran escalonados, con su filete ───────────────── */
  todos('.servicio').forEach(function (s, i) { s.style.setProperty('--i', i); });
  cuandoVisible(todos('.servicios'), 0.25, function (n) { n.classList.add('es-visible'); });

  /* ───────────────── áreas: pila con el mismo alto (o acordeón en la sobria) ───────────────── */
  (function areas() {
    var seccion = document.getElementById('areas');
    var lista = document.getElementById('pila');
    if (!seccion || !lista) return;
    var items = todos('.pila__item', lista);
    var tarjetas = items.map(function (it) { return it.querySelector('.area'); });
    var indice = todos('#areas-indice a');
    var disparos = [];
    var actual = -1;

    function tope() { return parseFloat(getComputedStyle(items[0]).top) || alturaCabecera(); }

    function marcar(k) {
      if (k === actual) return;
      actual = k;
      tarjetas.forEach(function (t, i) { t.classList.toggle('es-posada', i === k); });
      indice.forEach(function (a, i) {
        a.classList.toggle('es-activa', i === k);
        if (i === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    Aurea.areaActiva = function () { return actual; };

    /* la tarjeta en curso: la última que se ha posado en su tope (vale sin GSAP) */
    function medirActiva() {
      if (densidad() === 'sobria') return;
      var t = tope(), k = -1;
      items.forEach(function (it, i) { if (it.getBoundingClientRect().top <= t + 2) k = i; });
      if (k === -1 && items[0].getBoundingClientRect().top < window.innerHeight * 0.7) k = 0;
      marcar(k);
    }
    window.addEventListener('scroll', medirActiva, { passive: true });

    /* el índice lleva a la posición NATURAL de cada tarjeta (la anclada engaña al medir) */
    indice.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var y;
        if (html.classList.contains('es-pila-suelta') || densidad() === 'sobria') {
          y = items[i].getBoundingClientRect().top + window.pageYOffset - alturaCabecera() - 8;
        } else {
          var paso = items[0].offsetHeight + parseFloat(getComputedStyle(items[0]).marginBottom);
          y = lista.getBoundingClientRect().top + window.pageYOffset + i * paso - tope() + 2;
        }
        if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo(0, y);
      });
    });

    /* Todas miden lo que la más alta (condición para que la pila no se deshaga),
       medido sobre el contenido real, nunca la pantalla. Si no cabe anclada bajo
       la cabecera y el índice, se desapila. */
    function igualar() {
      html.classList.remove('es-pila-suelta');
      lista.style.removeProperty('--alto-tarjeta');
      seccion.style.removeProperty('--alto-tarjeta');
      tarjetas.forEach(function (t) { t.style.height = 'auto'; });
      var alto = Math.max.apply(null, tarjetas.map(function (t) { return t.offsetHeight; }));
      tarjetas.forEach(function (t) { t.style.removeProperty('height'); });
      if (alto > window.innerHeight - tope() - 16) { html.classList.add('es-pila-suelta'); return false; }
      seccion.style.setProperty('--alto-tarjeta', alto + 'px');
      return true;
    }

    /* acordeón (solo sobria): el título pasa a botón; en «Laurel» vuelve a ser texto */
    function acordeon(on) {
      tarjetas.forEach(function (t, i) {
        var h = t.querySelector('.area__titulo');
        var cuerpo = t.querySelector('.area__cuerpo');
        var boton = h.querySelector('.area__alternar');
        if (on && !boton) {
          boton = document.createElement('button');
          boton.type = 'button';
          boton.className = 'area__alternar';
          boton.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');
          boton.setAttribute('aria-controls', cuerpo.id);
          boton.textContent = h.textContent;
          h.textContent = '';
          h.appendChild(boton);
          cuerpo.hidden = i !== 0;
          boton.addEventListener('click', function () {
            var abre = boton.getAttribute('aria-expanded') !== 'true';
            boton.setAttribute('aria-expanded', abre ? 'true' : 'false');
            cuerpo.hidden = !abre;
            marcar(abre ? i : -1);
            setTimeout(refrescar, 30);
          });
        } else if (!on && boton) {
          h.textContent = boton.textContent;
          cuerpo.hidden = false;
        }
      });
      if (on) marcar(0);
    }

    function montar() {
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      tarjetas.forEach(function (t) {
        if (gsapReady) gsap.set(t, { clearProps: 'transform' });
        t.style.removeProperty('--oscuro');
      });
      var sobria = densidad() === 'sobria';
      acordeon(sobria);
      if (sobria) { html.classList.remove('es-pila-suelta'); return; }
      var apilada = igualar();
      actual = -1;
      medirActiva();
      if (!movimiento || !apilada) return;
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var tw = gsap.fromTo(tarjetas[i], { scale: 1, '--oscuro': 0 }, { scale: 0.94, '--oscuro': 0.28, ease: 'none', paused: true });
        disparos.push(window.ScrollTrigger.create({
          trigger: siguiente,
          start: 'top bottom',
          end: 'top ' + Math.round(tope()) + 'px',          /* acaba EXACTAMENTE cuando la siguiente se posa */
          scrub: true,
          animation: tw
        }));
      });
    }

    montar();
    var temporizador;
    function rehacer(ms) { clearTimeout(temporizador); temporizador = setTimeout(function () { montar(); refrescar(); }, ms); }
    var anchoPrevio = window.innerWidth, altoPrevio = window.innerHeight;
    window.addEventListener('resize', function () {
      /* la barra del móvil cambia el alto al bajar: solo se rehace si cambia de verdad */
      if (window.innerWidth === anchoPrevio && Math.abs(window.innerHeight - altoPrevio) < 120) return;
      anchoPrevio = window.innerWidth; altoPrevio = window.innerHeight;
      rehacer(220);
    });
    document.addEventListener('densidad-cambiada', function () { rehacer(60); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { rehacer(0); });
  })();

  /* ───────────────── cursos: entrada escalonada ───────────────── */
  todos('#cursos li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  cuandoVisible(todos('#cursos'), 0.15, function (n) { n.classList.add('es-visible'); });

  /* ───────────────── la corona del pie cierra la página ───────────────── */
  cuandoVisible(todos('#pie-corona'), 0.6, function (n) { n.classList.add('es-visible'); });

  /* ───────────────── marquee con la hoja dorada ───────────────── */
  (function cinta() {
    var pista = document.getElementById('cinta-pista');
    if (!pista) return;
    var grupo = pista.firstElementChild;
    var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
    for (var i = 0; i < copias; i++) {
      var c = grupo.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      pista.appendChild(c);
    }
    if (!movimiento) return;
    var x = 0, base = 0.55, extra = 0;
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.35, 9); });
    /* rAF propio: ningún tween de GSAP toca esta propiedad */
    (function paso() {
      var ancho = grupo.offsetWidth;
      if (densidad() === 'laurel' && ancho) {
        x -= base + extra;
        extra *= 0.92;
        if (x <= -ancho) x += ancho;
        pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      requestAnimationFrame(paso);
    })();
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    todos('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.26);
        aY((e.clientY - (c.top + c.height / 2)) * 0.36);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto sólido + aro ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var aro = document.createElement('div');
    var pt = document.createElement('div');
    aro.className = 'cursor';
    pt.className = 'cursor-punto';
    [aro, pt].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(aro, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(aro, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;
    function mostrar(si) { aro.classList.toggle('cursor--vivo', si); pt.classList.toggle('cursor--vivo', si); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!aro.classList.contains('cursor--vivo')) { gsap.set(aro, { x: e.clientX, y: e.clientY }); mostrar(true); }
      /* el del sistema se oculta solo cuando el propio ya se ve */
      if (!html.classList.contains('con-cursor')) html.classList.add('con-cursor');
      gsap.set(pt, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      if (e.target !== ultimo) {
        ultimo = e.target;
        var t = e.target.closest ? e.target : null;
        var sobre = !!(t && t.closest('a, button, label, input, select, textarea, [role="tab"]'));
        var oscuro = !!(t && t.closest('.cinta, .opiniones, .pie, .cookies, .mando'));
        aro.classList.toggle('cursor--activo', sobre);
        aro.classList.toggle('cursor--claro', oscuro);
        pt.classList.toggle('cursor-punto--activo', sobre);
      }
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
  })();

  /* ───────────────── cabecera fija y menú móvil ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');
  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() { cabecera.classList.toggle('cabecera--fija', window.pageYOffset > 40); }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  })();
  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── escríbeme: compone el mensaje, sin backend ───────────────── */
  var DESPACHOS = {
    valverde: 'en el despacho de Valverde de Leganés',
    badajoz: 'en el despacho de Badajoz',
    videollamada: 'por videollamada'
  };
  /* mailto según RFC 6068: saltos de línea como CRLF y todo codificado */
  function mailto(asunto, cuerpo) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo.replace(/\r?\n/g, '\r\n'));
  }
  function whatsapp(texto) { return 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(texto); }
  Aurea.componer = function (d) {
    var tema = d.area && d.area !== 'Otra' ? 'Te escribo por un tema de ' + d.area + '.' : 'Te escribo por una consulta.';
    var lineas = ['Hola, Áurea. Soy ' + d.nombre + '. ' + tema + ' Preferiría la cita ' + (DESPACHOS[d.despacho] || DESPACHOS.valverde) + '.'];
    if (d.mensaje) lineas.push('', d.mensaje);
    lineas.push('', 'Mi teléfono: ' + d.telefono);
    return lineas.join('\n');
  };

  /* los CTA «Consultar sobre…» llegan con el área ya elegida */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-consultar]');
    if (!a) return;
    var sel = document.getElementById('f-area');
    if (sel) sel.value = a.dataset.consultar;
    setTimeout(function () { var n = document.getElementById('f-nombre'); if (n) n.focus({ preventScroll: true }); }, 900);
  });

  (function formulario() {
    var form = document.getElementById('formulario');
    if (!form) return;
    var error = document.getElementById('formulario-error');
    var listo = document.getElementById('listo');
    var salida = document.getElementById('listo-texto');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {
        nombre: form.elements.nombre.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        area: form.elements.area.value,
        despacho: (form.querySelector('input[name="despacho"]:checked') || {}).value || 'valverde',
        mensaje: form.elements.mensaje.value.trim()
      };
      var fallos = [];
      if (!d.nombre) fallos.push('tu nombre');
      if (!/\d{6,}/.test(d.telefono.replace(/\D/g, ''))) fallos.push('un teléfono');
      if (!form.elements.privacidad.checked) fallos.push('aceptar la política de privacidad');
      if (fallos.length) {
        error.textContent = 'Falta ' + fallos.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
        listo.hidden = true;
        return;
      }
      error.textContent = '';
      var texto = Aurea.componer(d);
      salida.textContent = texto;
      document.getElementById('enviar-whatsapp').href = whatsapp(texto);
      document.getElementById('enviar-email').href = mailto('Consulta · ' + (d.area && d.area !== 'Otra' ? d.area : 'nueva consulta') + ' · ' + d.nombre, texto);
      document.getElementById('enviar-llamar').href = 'tel:+' + TELEFONO;
      listo.hidden = false;
      setTimeout(refrescar, 30);
      document.getElementById('enviar-whatsapp').focus({ preventScroll: true });
    });
  })();

  /* ───────────────── carril lateral: en qué sección estás y cuánto queda ───────────────── */
  /* Es contenido (orientación), no adorno: funciona sin GSAP y con movimiento reducido.
     Cuenta las secciones que existen de verdad: si se quita un módulo, el total baja solo. */
  (function carril() {
    var c = document.getElementById('carril');
    if (!c) return;
    var nEl = document.getElementById('carril-n'), totalEl = document.getElementById('carril-total'), nombreEl = document.getElementById('carril-nombre');
    var NOMBRES = { inicio: 'Inicio', areas: 'Áreas', 'como-trabajo': 'Cómo trabajo', 'sobre-mi': 'Sobre mí', ficha: 'Ficha rápida', opiniones: 'Opiniones', casos: 'Casos', despachos: 'Despachos', escribeme: 'Escríbeme', notas: 'Notas' };
    var oscuras = ['#cinta', '#opiniones', '#pie'];
    var secciones = [], pendiente = false;
    function listar() {
      secciones = todos('main > section[id]').filter(function (s) { return !s.hidden && s.offsetHeight > 0 && NOMBRES[s.id]; });
      totalEl.textContent = String(secciones.length).padStart(2, '0');
    }
    function actualizar() {
      pendiente = false;
      var y = window.pageYOffset, vh = window.innerHeight;
      var total = document.documentElement.scrollHeight - vh;
      c.style.setProperty('--p', total > 0 ? Math.min(1, y / total).toFixed(4) : 0);
      c.classList.toggle('es-visible', y > vh * 0.55);
      var k = 0;
      secciones.forEach(function (s, i) { if (s.getBoundingClientRect().top <= vh * 0.4) k = i; });
      if (secciones[k]) {
        var n = String(k + 1).padStart(2, '0');
        if (nEl.textContent !== n) { nEl.textContent = n; nombreEl.textContent = NOMBRES[secciones[k].id]; }
      }
      /* sobre las bandas tinta (marquee, opiniones, pie) el carril se vuelve marfil */
      /* cada pieza mira lo que tiene debajo: el número puede caer en la banda y el hilo, fuera */
      var sobre = function (el) { var m = el.getBoundingClientRect(), cy = m.top + m.height / 2; return oscuras.some(function (sel) { var e = document.querySelector(sel); if (!e || e.offsetHeight === 0) return false; var r = e.getBoundingClientRect(); return r.top <= cy && r.bottom >= cy; }); };
      c.classList.toggle('es-oscuro', sobre(c.querySelector('.carril__pista')));
      nEl.parentNode.classList.toggle('es-claro', sobre(nEl.parentNode));
      nombreEl.classList.toggle('es-claro', sobre(nombreEl));
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); } }
    listar(); actualizar();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', function () { listar(); pedir(); });
    document.addEventListener('densidad-cambiada', function () { setTimeout(function () { listar(); pedir(); }, 120); });
    /* el módulo de casos se pinta tarde (fetch): volver a contar */
    if ('MutationObserver' in window) new MutationObserver(function () { listar(); pedir(); }).observe(document.querySelector('main'), { attributes: true, subtree: true, attributeFilter: ['hidden'] });
    Aurea.carril = function () { return { n: nEl.textContent, total: totalEl.textContent, nombre: nombreEl.textContent, visible: c.classList.contains('es-visible'), oscuro: c.classList.contains('es-oscuro'), p: parseFloat(c.style.getPropertyValue('--p')) || 0 }; };
  })();

  /* ───────────────── paso entre páginas: la hoja cruza en vez de un corte seco ───────────────── */
  /* No depende de GSAP: dos clases y transiciones CSS. Con movimiento reducido no hay paso. */
  (function paso() {
    if (reduce) return;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname) return;               /* anclas del mismo documento */
      if (!/(\/|\.html)$/.test(url.pathname)) return;                /* solo páginas de la web */
      e.preventDefault();
      try { sessionStorage.setItem('aurea-paso', '1'); } catch (err) {}
      var capa = document.createElement('div');
      capa.className = 'paso';
      capa.setAttribute('aria-hidden', 'true');
      capa.innerHTML = '<svg viewBox="0 0 136 75"><use href="#hoja"/></svg>';
      document.body.appendChild(capa);
      void capa.offsetWidth;
      capa.classList.add('es-cubre');
      setTimeout(function () { location.href = url.href; }, 660);
    });
    /* volver con «atrás» desde la caché: la capa no se queda puesta */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) todos('.paso').forEach(function (n) { n.remove(); });
    });
    /* llegada: el panel puesto en el <head> sigue subiendo */
    if (html.classList.contains('con-paso')) {
      var sale = function () {
        html.classList.add('es-paso-sale');
        setTimeout(function () { html.classList.remove('con-paso', 'es-paso-sale'); }, 820);
      };
      var espera = new Promise(function (r) { setTimeout(r, 320); });
      Promise.race([document.fonts && document.fonts.ready ? document.fonts.ready : espera, espera]).then(function () { requestAnimationFrame(sale); });
    }
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    var reabrir = document.getElementById('cookies-reabrir');
    if (!caja || !ok) return;
    function ver(si) {
      caja.hidden = !si;                       /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.toggle('cookies-visibles', si);
    }
    var guardado = null;
    try { guardado = localStorage.getItem('aurea-cookies'); } catch (e) {}
    if (guardado !== 'ok') ver(true);
    ok.addEventListener('click', function () {
      ver(false);
      try { localStorage.setItem('aurea-cookies', 'ok'); } catch (e) {}
    });
    if (reabrir) reabrir.addEventListener('click', function () { ver(true); ok.focus(); });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  if (gsapReady && document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);
  /* contenido que cambia de alto (módulos, mensaje compuesto): el fin de página de ScrollTrigger se queda viejo */
  if (gsapReady && 'ResizeObserver' in window) {
    var altoBody = 0, espera;
    new ResizeObserver(function () {
      var a = document.body.offsetHeight;
      if (Math.abs(a - altoBody) < 40) return;
      altoBody = a;
      clearTimeout(espera);
      espera = setTimeout(refrescar, 150);
    }).observe(document.body);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Lo quita scripts/quitar-mando.mjs (receta en el README).
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;
    var botones = todos('[data-densidad]', mando);
    function aplicar(d) {
      html.classList.remove('densidad-laurel', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('aurea-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      setTimeout(refrescar, 90);
    }
    var actual = densidad();
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
})();
