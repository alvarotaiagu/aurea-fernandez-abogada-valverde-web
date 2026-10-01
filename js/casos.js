/* ═══ [MÓDULO CASOS] · apagado por defecto ═══
   Lee data/casos.json. Con "permiso": false no hace nada: la sección sigue
   vacía y con [hidden], y su enlace del menú también. Con true, la pinta, la
   enseña en el menú y, en el índice del blog, muestra las dos entradas.
   Si este archivo falta, la web no lo nota. */
(function () {
  'use strict';
  if (!window.fetch) return;
  var A = window.Aurea || {};
  var raiz = document.documentElement.getAttribute('data-raiz') || '';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fechaLarga(iso) {
    var p = iso.split('-');
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return Number(p[2]) + ' de ' + meses[Number(p[1]) - 1] + ' de ' + p[0];
  }

  fetch(raiz + 'data/casos.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (datos) {
      if (!datos || datos.permiso !== true) return;          /* sin permiso: nada, ni hueco */
      Array.prototype.forEach.call(document.querySelectorAll('[data-modulo="casos"][hidden]:not(section)'), function (n) { n.hidden = false; });
      var seccion = document.getElementById('casos');
      if (!seccion) return;
      seccion.innerHTML =
        '<div class="casos__cabeza"><p class="antetitulo">Casos que he publicado</p>' +
        '<h2 class="titular" id="casos-titulo">Dos acuerdos por cláusula suelo</h2></div>' +
        '<ul class="casos__lista">' + datos.casos.map(function (c) {
          return '<li class="caso">' +
            '<p class="caso__cifra" data-cifra="' + c.cifra + '" data-decimales="' + c.decimales + '">' +
              Number(c.cifra).toLocaleString('es-ES', { minimumFractionDigits: c.decimales, maximumFractionDigits: c.decimales, useGrouping: 'always' }) + ' €</p>' +
            '<p class="caso__entidad">' + esc(c.entidad) + '</p>' +
            '<p class="caso__que">' + esc(c.que) + '</p>' +
            '<p class="caso__fuente"><time datetime="' + esc(c.fecha) + '">' + fechaLarga(c.fecha) + '</time> · ' + esc(c.fuente) + '. ' +
              '<a class="enlace" href="' + esc(raiz + c.entrada) + '">Leer la entrada</a></p>' +
            '<p class="caso__fijo">' + esc(datos.aviso) + '</p>' +
          '</li>';
        }).join('') + '</ul>';
      seccion.hidden = false;
      /* las cifras cuentan al entrar */
      var cifras = Array.prototype.slice.call(seccion.querySelectorAll('.caso__cifra'));
      if (A.contar) {
        if (A.movimiento) cifras.forEach(function (c) { c.textContent = '0 €'; });
        (A.cuandoVisible || function (ns, u, f) { ns.forEach(f); })(cifras, 0.5, function (c) {
          A.contar(c, Number(c.dataset.cifra), Number(c.dataset.decimales), ' €');
        });
      }
      if (A.refrescar) setTimeout(A.refrescar, 60);
    })
    .catch(function () { /* sin JSON: la web ya está completa sin el módulo */ });
})();
/* ═══ fin [MÓDULO CASOS] ═══ */
