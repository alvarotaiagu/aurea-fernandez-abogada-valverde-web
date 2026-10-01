# Áurea Mª Fernández García-Moreno, abogada · web «Laurel»

> **Maqueta para una clienta real.** Todas las páginas llevan `noindex, nofollow`: blog, redirecciones y legales incluidas.
> Áurea María Fernández García-Moreno, abogada ejerciente nº 4.201 del ICABA. Tiene despacho en Valverde de Leganés y en Badajoz.
> La web sale del boceto **A · Laurel** de `../aurea-fernandez-abogada-valverde-bocetos/`. Lleva tres módulos que se pueden quitar: el selector de despachos (del boceto C, sin azulejo), las opiniones (del E) y los casos (del E, **apagados**).

```
node scripts/servir.mjs                 → http://127.0.0.1:4210  (hace falta HTTP: las viñetas son mask-image)
http://127.0.0.1:4210/?revision         → con el mando de las dos versiones
node scripts/verificar.mjs              → 186 comprobaciones (con --capturas guarda screenshots/)
```

Si cambias datos o textos, ejecuta en este orden: `node scripts/construir.mjs` → `python scripts/logo.py` → `node scripts/versionar.mjs`.

---

## Pendientes para ella

| # | Qué | Dónde está ahora |
|---|---|---|
| 1 | **Horario real de cada despacho.** Su web dice L–V de 10 a 14 y de 17 a 20:30. Google dice L–X de 10 a 14 y de 17 a 21, J de 9 a 14 y de 17 a 21, V de 9 a 14. ¿Atiende en Badajoz los mismos días? | La web dice solo «Con cita previa · de lunes a viernes, mañana y tarde». Sin «abierto ahora». Las horas están en `data/horario.json`, marcadas `[CONFIRMAR]`. |
| 2 | **¿Sigue la «primera consulta gratuita»?** Su web la ofrece. | **No está puesta.** Si dice que sí, el texto del botón sería «Primera consulta gratuita» junto a «Pedir cita» en la cabecera y en Escríbeme. Hay que quitar ese veto de `verificar.mjs`. |
| 3 | **Permiso para los casos** (8.700 € con Ibercaja; 16.610,23 € con Caja Rural de Extremadura). | Apagado: `data/casos.json` → `"permiso": false`. Con `true` aparece la sección, su enlace en el menú y las dos entradas en el índice del blog. Ya está probado. |
| 4 | **Permiso para citar las opiniones.** Son 12 citas literales de su ficha de Google, firmadas con nombre e inicial. | `data/opiniones.json`, cada una con su índice en `google-resenas.json`. |
| 5 | **La línea del 016** en Violencia de Género: «El 016 atiende las 24 horas, es gratuito y no deja rastro en la factura. En una emergencia, llama al 112.» | **La hemos añadido nosotros.** Tiene que aprobarla ella. Está en `index.html`, `#linea-016`. |
| 6 | **NIF** para el aviso legal y la privacidad. | `[PENDIENTE]`. La titular sí consta: «Aurea María Fernández García Moreno», como en su aviso de cookies. |
| 7 | **Fotos del despacho** por dentro (y de la fachada de Valverde, si quiere). | No hay. La web usa solo sus dos retratos. |
| 8 | **Kit Digital y dominio.** Su web actual lleva la banda «Financiado por la Unión Europea · Kit Digital» (Siweb). ¿Sigue en el periodo en que tiene que mantener esa solución? ¿De quién es el dominio, suyo o del agente digitalizador? | Banda **no copiada**. Los `canonical` de las redirecciones apuntan a `aureafernandezabogada.es`. |
| 9 | **¿Quiere el logo tal cual?** | Vectorizado sin redibujar: `assets/logo-aurea.svg` y `logo-aurea-marfil.svg`, con grupos `laurel-izq`, `laurel-der`, `monograma`, `nombre` y `abogada`. |
| 10 | Su web dice «Áurea» con y sin tilde (en el aviso de cookies va sin ella). | Aquí va **con** tilde en todo el texto. En el aviso legal se mantiene su forma registral sin tilde. Hay que confirmarlo con ella. |

Correcciones de contenido que hemos hecho (díselas):

- **Violencia de Género, primer subapartado.** Su web dice «garantizando justicia y apoyo emocional». Aquí pone «con apoyo emocional durante todo el proceso legal». «Garantizar» en publicidad roza la promesa de resultado.
- **Bancario.** Se ha quitado el subapartado «Amplia experiencia en derecho bancario con multitud de casos de éxito y sentencias favorables». Es una afirmación de resultados, no un trámite. Su frase «Experta en el ámbito bancario» sí está, entre comillas y atribuida.
- **Servicios.** En su web, «garantizar una defensa sólida» y «garantizando seguridad jurídica». Aquí no aparece «garantiz» en ningún sitio.
- **Primera persona.** Su web mezcla «nuestros servicios». Aquí todo está en primera persona y de tú.
- **Frases fuera.** «Es el espíritu y no la forma de la ley…» no es suya y no se usa. «Un buen abogado nunca se rinde…» tampoco se usa: suena a promesa.
- **Opiniones.** No hay ninguna reseña que hable de un caso penal o de familia. Las 12 elegidas tratan de hipoteca, trato, Madrid y Barcelona, una empresa (un SAT), un contrato de alquiler y una de las dos de cuatro estrellas.

### Correcciones del blog (texto íntegro, solo erratas evidentes)

Las 6 entradas se migran **enteras**, con su fecha original. `scripts/blog-fuente.mjs` las lee de los volcados de su web, y `verificar.mjs` hace un diff línea a línea: solo cambian estas cinco líneas.

| Entrada | Original | Queda |
|---|---|---|
| Violencia de género | «VIOLENCIA DE GÉNERO INFO-» | «VIOLENCIA DE GÉNERO INFO» (guion suelto al final) |
| Delito de lesiones | «DELITO DE LESIONES INFO -» | «DELITO DE LESIONES INFO» (guion suelto al final) |
| Pensión de alimentos | «a pensión de alimentos se ha de actualizar…» | «La pensión…» (faltaba la L) |
| 16.600 € | «Nada más satisfactorio … dinero!» | «¡Nada más…!» (faltaba el signo de apertura) |
| Divorcio | «como Aurea María Fernández» | «como Áurea…» (faltaba la tilde) |

El resumen de su portada decía «…CLÁUSULA SUELO DE SU **HIPOCA**». La entrada completa ya decía HIPOTECA, y aquí los resúmenes salen de la entrada completa.
La maquetación no toca el texto: los «▪️» y los «- » pasan a viñetas de hoja, y los títulos numerados pasan a `<h2>`.
Los títulos se dejan en mayúsculas, como los escribió ella.

---

## El concepto: «Laurel»

Sale de su logo, que es bueno y no se toca. Es un monograma **AF**: el asta de la F es una columna estriada y de las dos letras cuelgan los platillos de una balanza. Lo rodea una corona de laurel abierta por arriba. La web es ese logo desplegado:

| Dónde | Qué hace la corona o la hoja |
|---|---|
| **Cortina** (tinta, ~2,2 s) | Las dos ramas crecen desde el tallo hacia arriba por recorte (`clip-path`, nada de trazo), la derecha 0,15 s después. Las **12 hojas de cada rama** se doran una a una, de abajo arriba (copia dorada, solo opacidad). El monograma cae por recorte de arriba abajo. La balanza llega quieta. Después el panel tinta sube con `expo.inOut` y el borde curvo se aplana. La corona de la cortina está **exactamente** donde va la del hero y pasa de oro a tinta justo cuando el borde del panel le pasa por encima: la cortina «deja» la corona en el hero. |
| **Hero** | La corona con el monograma, su nombre completo con char-reveal y «ABOGADA» cerrando su espaciado. |
| **Áreas** | Al posarse cada tarjeta de la pila, su hoja se dora. Arriba, un índice de 5 hojas marca la tarjeta en curso. |
| **Viñetas y separadores** | La hoja suelta, recortada del propio PNG. Ninguna hoja es inventada. |
| **Marquee** | Sobre tinta, con la hoja dorada de separador. |
| **Pie** | La corona pequeña, sin monograma, cierra la página: crece al llegar. |

**El oro solo aparece cuando algo se activa**: la hoja posada, el índice, el cursor sobre un botón, las hojas de la cortina.

**La balanza no se mueve nunca.** Botejara y Pozo Rondón, también de Badajoz, ya la nivelan. `verificar.mjs` comprueba que el monograma no tiene `transform` ni animación en ningún fotograma.

### Paleta

| Token | Valor | Papel |
|---|---|---|
| `--marfil` | #F6F2EA | Fondo |
| `--tostado` | #EDE6D8 | Superficie (tarjetas, formulario, notas) |
| `--tinta` | #151412 | Texto, cortina y bandas oscuras (opiniones, marquee, pie) |
| `--oro` | #9C7A3C | El **único** acento: hojas, filetes, cursor |
| `--oro-texto` | `color-mix(oro 66 %, tinta)` | Oro como texto pequeño sobre marfil o tostado |
| `--oro-claro` | `color-mix(oro 55 %, marfil)` | Oro sobre tinta |

Nada de azul: su pizarra #60728A no entra.
Contrastes medidos en el navegador componiendo el alfa (`verificar.mjs`): todos los pares de texto pasan 4,5:1, el texto principal 7:1.

### Letra

La elección sale de `scripts/comparar-letra.py`. La lámina está en `scripts/fuentes/comparar-letra.png`. El método: se compone «Áurea María Fernández García-Moreno» con cada candidata, a la misma altura de mayúscula que el PNG.

| Candidata | Ancho | Mancha (logo 0,252) | Solape nombre | Solape ABOGADA |
|---|---|---|---|---|
| Libre Caslon Text 700 | 1,059 | 0,276 | **0,501** | **0,712** |
| Lora 700 | 1,064 | 0,278 | 0,490 | 0,589 |
| **Ibarra Real Nova 700** | **1,037** | **0,229** | 0,320 | 0,644 |
| Ibarra Real Nova 600 | 1,009 | 0,202 | 0,298 | 0,584 |
| Libre Caslon Display 400 | 0,846 | 0,127 | 0,270 | 0,456 |

**Elegida: Ibarra Real Nova 700.** Libre Caslon Text es la que más solapa, pero **ya la usa Botejara**, asesor en Badajoz, y la quiero lejos de las webs de esa ciudad. Lora la usa MJ Ramos («Cláusula»).
Ibarra es la que tiene el ancho y la mancha más cercanos al logo. Es una serif de transición negrita con remates finos, como la del logo, y está libre en las más de 60 webs de la carpeta.
Para el texto, **Source Sans 3**. Hanken Grotesk, la que proponía el boceto, la usa FPR (Badajoz).
Excluidas desde el principio: Gelasio (Pozo Rondón) y DM Serif Display con Outfit (su web actual).

### Logo

`scripts/logo.py` vectoriza el PNG original con potrace, sin redibujar nada. Las piezas salen por componentes conexos, que en este logo coinciden con ellas.

Cada rama se parte además en sus 12 hojas para la cortina. Se hace una apertura morfológica de radio 14 px, que se come el tallo y deja las hojas sueltas.

La «hoja suelta» es la de arriba de la rama izquierda, recortada con su pecíolo. El favicon es el monograma.

---

## Tercera ronda: hero «Bandada» + hojas al viento, rueda de texto y carril (elegidos en el tablero)

El tablero con los cinco heros y los seis indicadores está en `../aurea-fernandez-abogada-valverde-bocetos/hero/` (se eligieron **A + D** y los indicadores **3 + 5**).

| Pieza | Qué hace |
|---|---|
| **Cortina corta** | Sobre tinta, la hoja dorada se abre girando, «Áurea Mª Fernández» sube de su máscara y «ABOGADA» asienta. El panel sube con `expo.inOut` y su borde curvo. Ya no construye la corona: eso pasa en el hero. |
| **Hero A · Bandada** | Cuando el panel empieza a subir, las 24 hojas reales del logo entran volando desde toda la pantalla, girando, y se posan cada una en su sitio. Aparece la rama, el oro se apaga y cae el monograma (recorte). Después el nombre, letra a letra. No se ejecuta en la sobria, ni al volver por el paso entre páginas, ni con movimiento reducido: ahí la corona ya está puesta. Hay red de seguridad a 9 s. |
| **Hero D · Hojas al viento** | Cuando la bandada se posa, una ráfaga suelta hojas doradas que cruzan el hero y caen meciéndose. El ratón hace de viento. Es un canvas con la hoja pintada una vez por tono y copiada, sin filtros por fotograma. Se para fuera de pantalla y en la sobria. |
| **Indicador 3 · Rueda de texto** | «Baja · Descubre» gira despacio alrededor de la hoja. Al pasar el ratón el centro se dora, y es magnético. Al pulsarla baja a las áreas. Cabe entera en la primera pantalla desde 1280×720, y se apaga al bajar. |
| **Indicador 5 · Carril lateral** | A la derecha, a partir del hero: «02 / 08 · Áreas» con una hoja que avanza con la página. Sobre las bandas tinta se vuelve marfil, pieza a pieza. Cuenta las secciones que existen: si se quita un módulo, el total baja solo. En el móvil, solo el hilo y la hoja. |

## Segunda ronda de movimiento (1/10/2026, tras verla publicada)

Todo sale de la corona y la hoja. Nada se anima porque sí.

| Dónde | Qué hace |
|---|---|
| Hero | **Destello**: al aterrizar la corona, un brillo de oro la recorre de abajo arriba una sola vez. **Corona viva**: las hojas cercanas al cursor se doran (copia dorada de cada hoja, solo opacidad). Al bajar, las dos ramas se recogen 7º sobre la base de su tallo; el monograma y la balanza no se mueven. **Luz de oro** tenue que sigue al cursor, con **grano de papel** fijo. **Profundidad**: la corona y el nombre se desplazan unos píxeles con el ratón, solo cuando la cortina ya se ha ido, para no descuadrar el traspaso. |
| Hero, franja de abajo | «5,0★ · 183 opiniones en Google» y «Con cita previa · en despacho o por videollamada». En medio, el **indicador de scroll**: una hoja que cae meciéndose por un hilo fino y se apaga al empezar a bajar. En móvil solo queda el indicador. En la sobria, un trazo que baja en vez de la hoja. |
| Cómo trabajo | Los servicios entran escalonados y su filete dorado se tiende. |
| Sobre mí | El retrato se abre de abajo arriba dentro de su arco, con paralaje dentro. |
| Opiniones | Las estrellas de cada cita se doran una a una al entrar. |
| Notas | La hoja de cada tarjeta se dora al pasar el ratón o con el foco. |
| Entre páginas | Al ir de la portada a una nota (o volver), un panel tinta con la hoja dorada tapa la página y la nueva se destapa. Al volver a la portada no se repite la cortina larga. Usa `sessionStorage` (`aurea-paso`, anotado en la privacidad). Con movimiento reducido no hay paso. |

## Mapa de secciones

| # | Sección | Qué hace |
|---|---|---|
| — | Cortina | Ver arriba. Se retira siempre: sin GSAP (60 ms), sin JS (`<noscript>`), con un `setTimeout` de 7 s en el `<head>`, con uno de 6 s en `main.js` y con movimiento reducido (`display:none` en CSS, ni un fotograma). La regla de retirada repite el ancestro para ganar en especificidad. |
| 1 | Hero | Corona, nombre (char-reveal, la palabra nunca se parte), «ABOGADA», «Valverde de Leganés y Badajoz · en despacho o por videollamada · colegiada nº 4.201 del ICABA», «Llamar · 657 65 69 56» (magnético) y «Escribir por WhatsApp». |
| 2 | Áreas | Pila sticky de 5 tarjetas con el mismo peso, según la receta del checklist: el mismo alto medido por JS, el mismo `margin-bottom` en todas (la última incluida), el reposo en `::after` y `margin-top` negativo en la sección siguiente. Si la más alta no cabe, se desapila. Cada tarjeta lleva sus subapartados reales con la hoja de viñeta, su frase entre comillas si la tiene y «Consultar sobre [área]», que llega al formulario con el área elegida. |
| 3 | Cómo trabajo | «Cada cliente merece ser tratado de manera única» con char-reveal. Debajo, sus 4 servicios y los tres hechos. |
| 4 | Sobre mí | El retrato `tezza_4835`, la colegiación, el grado, el máster, los **11 cursos** con su nombre exacto (dos columnas, entrada escalonada) y sus valores entre comillas. |
| — | Ficha rápida | Solo en la versión «Sobria». |
| 5 | Marquee | Civil · Bancario · Penal · Familia · Violencia de género · Valverde de Leganés · Badajoz. La velocidad va ligada al scroll. |
| 6 | Opiniones | **Módulo.** «5,0» y «183 opiniones en Google», que cuenta al entrar, y dos columnas de citas en bucle, en sentidos opuestos, que se pausan con hover y con foco. En móvil, una columna de alto fijo. Con movimiento reducido o sin JS, lista quieta. |
| 7 | Casos | **Módulo apagado.** Ver «Pendientes» 3. |
| 8 | Despachos | **Módulo.** Pestañas ARIA (flechas, Inicio y Fin), un fundido corto sin saltos de alto y un mapa que solo carga tras clic en `.map-consent`. |
| 9 | Escríbeme | La nota de datos sensibles, el formulario sin backend y tres salidas: WhatsApp, email y llamar. Sin el módulo de despachos, aquí salen las dos direcciones en texto (CSS `:has()`). |
| 10 | Notas legales | Las 3 más recientes. Debajo, el enlace a `/blog/`. |
| — | Pie | El logo vectorizado sobre tinta, los despachos, el teléfono, el email, las 4 redes, legal, privacidad, cookies y la corona. |

**Blog:** `/blog/` y `/blog/<slug>/`. Mismo slug que en Siweb.

**Redirecciones** de las URLs de Siweb. Son páginas mínimas con meta refresh, canonical y enlace visible:

| URL vieja | Lleva a |
|---|---|
| `/sobre-mi` | `#sobre-mi` |
| `/areas-legales` | `#areas` |
| `/servicios` | `#como-trabajo` |
| `/contacto` | `#escribeme` |
| `/cookies` | `privacidad.html#cookies` |
| `/D/post/<slug>/` | `/blog/<slug>/` |
| `/Blog/All/` | lo resuelve `404.html` con JS, porque en Windows «Blog» y «blog» son la misma carpeta |

Lista completa en `scripts/redirecciones.json`.

---

## Recetas de borrado (comprobadas por `verificar.mjs` en copias temporales)

### Un módulo (opiniones, casos o despachos)

```
node scripts/quitar-modulo.mjs despachos ../copia      (o --aqui)
```

Cada módulo es:
- un único `<section data-modulo="…">` entre marcas `[MÓDULO X]`;
- su CSS en `css/<módulo>.css`;
- su JS en `js/<módulo>.js`;
- el enlace del menú con `data-modulo`.

El script borra:
- la sección;
- las líneas con `data-modulo="x"` (el enlace del menú, el `<link>` y el `<script>`);
- sus dos archivos;
- en el caso de casos, también sus `<li>` del índice del blog y `data/casos.json`.

Después vuelve a versionar. `main.js` y `estilos.css` no dependen de ningún módulo.

### El mando de maqueta (NUNCA viaja a la clienta)

```
node scripts/quitar-mando.mjs ../aurea-entrega
node scripts/comprobar-borrado.mjs ../aurea-entrega     → «Sin rastros del mando»
```

Corta, entre marcas exactas y sin comodines:
- **index.html:** el aviso, la lectura de la densidad en el `<head>`, la ficha rápida, el `<div class="mando">` y la clase `densidad-laurel`;
- **estilos.css:** el bloque del mando y de la sobria;
- **opiniones.css:** sus reglas sobrias;
- **main.js:** la función `mandoMaqueta()`;
- **privacidad.html:** la fila `aurea-densidad`.

El mando solo se enseña con `?revision`. Sin ese parámetro tampoco se aplica una densidad guardada.

**«Laurel» frente a «Sobria»:**

| | «Laurel» (la cargada) | «Sobria» |
|---|---|---|
| Corona | En la cortina, el hero y el pie | Solo en el hero. La cortina enseña el nombre |
| Separadores | Hoja | Línea fina |
| Viñetas | Hoja | Guion |
| Índice de áreas | Con hojas | No hay |
| Marquee | Sí | No |
| Áreas | Pila sticky | Acordeón |
| Opiniones | Columnas en bucle | 3 citas fijas |
| Ficha rápida | — | **La añade**: colegiación, formación, despachos, modalidad, áreas, cita previa, teléfono, WhatsApp y email |

---

## Qué es real y qué es provisional

**Real** (su web y su ficha de Google, 1/10/2026):
- nombre, colegiación, formación, los 11 cursos, valores y las dos frases suyas citadas;
- teléfono y WhatsApp (su web ya tiene el botón a wa.me), email y los dos despachos con su dirección exacta;
- las coordenadas de la ficha;
- las 5 áreas con sus subapartados (salvo los dos cambios de arriba) y los 4 servicios;
- 5,0★ con 183 reseñas, y las 12 citas literales;
- el logo, vectorizado, y sus dos retratos, con una gradación suave igual en los dos, recortados por encima del azulejo y en AVIF, WebP y JPG a 480, 800 y 960 px;
- las 6 entradas del blog, íntegras y con su fecha;
- las 4 redes.

**Provisional o nuestro:**
- la línea del 016;
- «mañana y tarde» como horario;
- el aviso legal y la privacidad, escritos por nosotros: la de su web es una plantilla de Siweb que habla de cookies de terceros que esta web no usa;
- el NIF;
- el formulario sin backend (compone el mensaje en el navegador);
- el texto «Abogada cercana y comprometida», que es el titular de su propia portada;
- el resumen de «Desde que me gradué…», recortado sin «equitativa».

**Datos estructurados:** `Attorney` + 2 `LegalService`. **Sin `aggregateRating`**, porque Google no lo admite para reseñas de terceros autoservidas.

---

## Informe: qué la separa de las otras siete webs legales de la carpeta

| Web | Su recurso | Aquí |
|---|---|---|
| MJ Ramos Castro («Cláusula») | Rotulador SVG que subraya, secciones I–VI, indicador de folio, Lora | Ni subrayado, ni numeración romana, ni folio, ni Lora |
| Blanco Regueiro | Prensa B/N con un rojo, papel rasgado | Marfil y oro, ningún rasgado |
| **Castro Pombo** («Escritura») | Revisada: papel timbrado, **cuño que cae y estampa** al entrar cada bloque, **rúbrica que se traza** con `stroke-dashoffset`, folios en romanos, Playfair + Inter, granate y oro apagado | Nada se estampa ni se firma. Nada se traza: las ramas crecen por recorte. Sin granate. El oro es otro (#9C7A3C) y solo aparece al activar algo |
| Trinquete (plantilla) | Engranajes, calculadora de plazos | No hay ninguna de las dos cosas |
| Botejara y Pozo Rondón (Badajoz) | Balanza que se nivela, platillos y pesas | La balanza de su logo está **quieta**, y verificado. Sin Libre Caslon (Botejara) ni Gelasio (Pozo Rondón) |
| FPR y Miralles (Badajoz) | Placas, mesa despejada, Hanken Grotesk (FPR) | Ninguna de las dos. Sin Hanken |
| Cervantes | Wordmark que se escribe a mano solo | El nombre entra con char-reveal, sin trazo |
| Las Dehesillas (provincia de Badajoz) | Zócalo de cal y almagre | El selector de despachos va **sin azulejo**, y los retratos van recortados por encima de él |

Lo propio de esta web:
- la corona que crece y se queda en el hero, con un traspaso exacto;
- las hojas que se doran;
- la pila de áreas marcada por hojas;
- las columnas de opiniones;
- todo sacado del PNG de su logo.

---

## Archivos

- `index.html`, `css/estilos.css` y `js/main.js`, más los tres módulos (`css/` y `js/` `opiniones`, `casos` y `despachos`).
- `data/`:
  - `opiniones.json`, del que `construir.mjs` saca las citas;
  - `casos.json`, que tiene el interruptor;
  - `horario.json`, con las horas `[CONFIRMAR]`.
- `blog/`, las redirecciones, `aviso-legal.html`, `privacidad.html` y `404.html`. Todo lo genera `scripts/construir.mjs`: no se editan a mano.
- `assets/`: logo, monograma, hoja y favicon (SVG), `og-aurea.jpg` (1200×630) y `img/`, con los retratos.
- `scripts/`:
  - `logo.py` y `retratos.py`;
  - `comparar-letra.py`;
  - `construir.mjs` y `blog-fuente.mjs`;
  - `versionar.mjs` (pone `?v=` solo en `href` y `src`);
  - `servir.mjs`;
  - `quitar-modulo.mjs`, `quitar-mando.mjs` y `comprobar-borrado.mjs`;
  - `verificar.mjs`.
  - `scripts/fuentes/` tiene los volcados de su web y las reseñas de Google. En el repo publicado, las reseñas van **sin el campo de autor**: una autora firmaba con su correo.
- `screenshots/`: la cortina en 6 fotogramas, las secciones, las dos densidades, sin GSAP, con movimiento reducido, casos con permiso, y el hero y la página completa a 360×640, 375×667, 390×844, 768×1024 y 1440×900.
