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
  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abre', function () { revelar(el, piezas, 0.25); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: la corona crece y se queda en el hero ───────────────── */
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
    var corona = document.getElementById('cortina-corona');
    var heroCorona = document.getElementById('hero-corona');
    var izq = cort.querySelector('.cc--izq'), der = cort.querySelector('.cc--der');
    var mono = cort.querySelector('.cc--mono'), oro = cort.querySelector('.cc--oro'), tintaCopia = cort.querySelector('.cc--tinta');
    var nombre = cort.querySelector('.cortina__nombre span');
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      cort.classList.add('es-fuera');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes (el tirón de la carga saltaría el crecimiento) */
      if (gsapReady) gsap.ticker.lagSmoothing(0);
      if (lenis) lenis.start();
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }
    Aurea.retirarCortina = retirar;

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 0 : 60);
      return;
    }

    window.scrollTo(0, 0);
    if (lenis) lenis.stop();

    /* la corona de la cortina va EXACTAMENTE donde está la del hero: es el traspaso */
    var destino = null;
    function colocar() {
      if (!heroCorona) return;
      var r = heroCorona.getBoundingClientRect();
      destino = { left: r.left, top: r.top, width: r.width, height: r.height };
      corona.style.left = r.left + 'px';
      corona.style.top = r.top + 'px';
      corona.style.width = r.width + 'px';
      corona.style.height = r.height + 'px';
    }
    colocar();
    window.addEventListener('resize', colocar);
    Aurea.cortinaDestino = function () { return destino; };

    var hojas = todos('.cortina__hoja', cort);
    /* de abajo arriba, alternando ramas (cada rama ya viene ordenada así) */
    var porLado = [todos('.cortina__hojas--izq .cortina__hoja', cort), todos('.cortina__hojas--der .cortina__hoja', cort)];
    var orden = [];
    for (var i = 0; i < Math.max(porLado[0].length, porLado[1].length); i++) {
      if (porLado[0][i]) orden.push(porLado[0][i]);
      if (porLado[1][i]) orden.push(porLado[1][i]);
    }

    var SALE = 1.75;
    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    if (densidad() === 'laurel') {
      /* 1 · las ramas crecen desde el tallo hacia arriba (recorte, no trazo: son formas rellenas) */
      tl.fromTo(izq, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.inOut', immediateRender: false }, 0)
        .fromTo(der, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power2.inOut', immediateRender: false }, 0.15)
      /* 2 · las hojas se doran una a una, de abajo arriba (opacidad de una copia dorada) */
        .to(orden, { opacity: 1, duration: 0.28, ease: 'power1.out', stagger: 0.95 / Math.max(1, orden.length) }, 0.45)
      /* 3 · el monograma cae por recorte de arriba abajo; la balanza llega ya quieta */
        .fromTo(mono, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out', immediateRender: false }, 0.95)
      /* 4 · salida: la corona pasa de oro a tinta con un fundido entre dos copias,
         justo cuando el borde del panel (que sube con expo.inOut) le pasa por encima:
         antes, la copia tinta se perdería sobre el panel tinta */
        .add(function () {}, SALE);
      var cruce = function () {
        var h = window.innerHeight, r = destino || { top: h * 0.2, height: h * 0.3 };
        /* fracción del recorrido en que el borde llega al pie y a la cabeza de la corona */
        var pPie = Math.min(0.98, Math.max(0.02, 1 - (r.top + r.height) / h)), pCabeza = Math.min(0.99, Math.max(pPie + 0.01, 1 - r.top / h));
        var ease = gsap.parseEase('expo.inOut');
        var tiempo = function (p) { var lo = 0, hi = 1; for (var k = 0; k < 30; k++) { var m = (lo + hi) / 2; if (ease(m) < p) lo = m; else hi = m; } return lo * 1.1; };
        return { ini: tiempo(pPie), fin: tiempo(pCabeza) };
      };
      var c = cruce();
      tl.to(tintaCopia, { opacity: 1, duration: Math.max(0.12, c.fin - c.ini + 0.08), ease: 'none' }, SALE + c.ini - 0.04)
        .to([izq, der, mono, oro], { opacity: 0, duration: Math.max(0.12, c.fin - c.ini + 0.08), ease: 'none' }, SALE + c.ini - 0.04);
    } else {
      /* sobria: sin corona en la cortina; el nombre sube de su máscara */
      tl.fromTo(nombre, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', immediateRender: false }, 0.2);
      SALE = 1.2;
    }
    /* …y el panel tinta sube con expo.inOut; el borde curvo se aplana al subir */
    tl.call(avisarApertura, null, SALE)
      .to(panel, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, SALE)
      .fromTo(borde, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power2.out', immediateRender: false }, SALE)
      .to(borde, { scaleY: 0, duration: 0.6, ease: 'power2.inOut' }, SALE + 0.45);
    if (densidad() === 'sobria') tl.to(nombre, { yPercent: -60, opacity: 0, duration: 0.5, ease: 'power2.in' }, SALE);

    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; colocar(); tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 450);

    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });

    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
  })();

  /* ───────────────── hero: entra cuando la cortina empieza a subir ───────────────── */
  (function hero() {
    var abogada = document.getElementById('hero-abogada');
    if (!abogada || !movimiento) return;
    var resto = todos('.hero__linea, .hero__acciones');
    Aurea.alAbrirse(function () {
      /* «ABOGADA» cierra su espaciado */
      gsap.to(abogada, { letterSpacing: window.innerWidth <= 640 ? '.5em' : '.62em', opacity: 1, duration: 1.6, ease: 'expo.out', delay: 0.55 });
      gsap.to(resto, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.85 });
    });
  })();

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
