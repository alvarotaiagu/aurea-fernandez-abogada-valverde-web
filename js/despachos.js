/* ═══ [MÓDULO DESPACHOS] · selector de dos despachos (sin azulejo) ═══
   Pestañas ARIA de verdad: flechas, Inicio y Fin mueven el foco y activan.
   Mapa de Google solo tras clic en .map-consent (maps?q=…&output=embed, sin
   API key); si ya está cargado, cambia con el despacho.
   Sin este archivo, el primer despacho se ve y el segundo queda oculto: por
   eso, si se quita el módulo, se quita entero (receta en el README). */
(function () {
  'use strict';
  var seccion = document.getElementById('despachos');
  if (!seccion) return;
  var pestanas = Array.prototype.slice.call(seccion.querySelectorAll('[role="tab"]'));
  var paneles = pestanas.map(function (p) { return document.getElementById(p.getAttribute('aria-controls')); });
  var caja = document.getElementById('despachos-mapa');
  var marco = null;
  var actual = 0;

  function urlMapa(panel) { return 'https://www.google.com/maps?q=' + encodeURIComponent(panel.dataset.mapa) + '&z=16&output=embed'; }

  function activar(i, enfocar) {
    actual = i;
    pestanas.forEach(function (p, k) {
      var si = k === i;
      p.setAttribute('aria-selected', si ? 'true' : 'false');
      p.tabIndex = si ? 0 : -1;
      paneles[k].hidden = !si;
      paneles[k].classList.toggle('es-activo', si);
    });
    if (enfocar) pestanas[i].focus();
    if (marco) { marco.src = urlMapa(paneles[i]); marco.title = paneles[i].dataset.mapaTitulo; }
  }
  window.Aurea = window.Aurea || {};
  window.Aurea.despachoActivo = function () { return actual; };

  pestanas.forEach(function (p, i) {
    p.addEventListener('click', function () { activar(i, false); });
    p.addEventListener('keydown', function (e) {
      var n = pestanas.length, k = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = n - 1;
      if (k === null) return;
      e.preventDefault();
      activar(k, true);
    });
  });

  var boton = seccion.querySelector('.map-consent');
  if (boton && caja) {
    boton.addEventListener('click', function () {
      marco = document.createElement('iframe');
      marco.src = urlMapa(paneles[actual]);
      marco.title = paneles[actual].dataset.mapaTitulo;
      marco.loading = 'lazy';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      var aviso = document.getElementById('mapa-consentimiento');
      if (aviso) aviso.remove();
      caja.appendChild(marco);
    });
  }
})();
/* ═══ fin [MÓDULO DESPACHOS] ═══ */
