/* ═══ [MÓDULO OPINIONES] · se quita con su sección, su hoja de estilos y su enlace ═══
   Las citas ya están en el HTML (las mete scripts/construir.mjs desde
   data/opiniones.json): sin este archivo se leen igual, en lista.
   Aquí solo: duplicar cada pista para el bucle y contar «183» al entrar. */
(function () {
  'use strict';
  var seccion = document.getElementById('opiniones');
  if (!seccion) return;
  var A = window.Aurea || {};

  /* bucle: cada pista se duplica (la copia, oculta al lector) y anima a −50 % */
  if (A.movimiento) {
    Array.prototype.forEach.call(seccion.querySelectorAll('.opiniones__pista'), function (pista) {
      Array.prototype.slice.call(pista.children).forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.classList.add('es-copia');
        pista.appendChild(c);
      });
      pista.classList.add('es-doble');
    });
  }

  /* las estrellas de cada cita se doran una a una al entrar (también las copias del bucle) */
  if (A.movimiento && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('es-vista'); obs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(seccion.querySelectorAll('.cita'), function (c) { obs.observe(c); });
  }

  /* el recuento cuenta al entrar (con movimiento reducido ya pone 183) */
  var n = document.getElementById('opiniones-n');
  if (n && A.contar) {
    var fin = Number(n.dataset.contar) || 183;
    if (A.movimiento) n.textContent = '0';
    (A.cuandoVisible || function (ns, u, f) { ns.forEach(f); })([n], 0.6, function () { A.contar(n, fin, 0, ''); });
  }
})();
/* ═══ fin [MÓDULO OPINIONES] ═══ */
