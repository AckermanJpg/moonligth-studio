# Registro de cambios

Cada versión corresponde a una tanda de cambios publicada con un solo push. Los números siguen `mayor.menor.parche`: una función nueva sube el número del medio y una tanda que solo arregla sube el último. Cada versión tiene su etiqueta anotada en git (`vX.Y.Z`).

La sección «Para quien usa Moonlight» es la que aparece en el botón Novedades de la página, palabra por palabra. Debajo va el detalle técnico de cada cambio, con el commit que lo hizo y, cuando hay, la medición.

## [1.4.0] - 2026-10-28

### Para quien usa Moonlight

- Del 15 de octubre al 2 de noviembre, Moonlight se viste de Halloween: colores calabaza y morado, y una luna con murciélagos en el inicio.
- Nuevos íconos pixel: calabaza, murciélago, telaraña, sombrero de bruja, caramelo y vela.
- Cuatro plantillas de Halloween, dos fondos nuevos por estilo y la paleta Halloween para tus fotos. Se quedan todo el año.

### Agregado

- Tema de temporada: `js/temporada.js`, cargado en el `<head>` después de la hoja de estilos, marca `data-temporada="halloween"` en `<html>` del 15 de octubre al 2 de noviembre según la fecha local, ambos días incluidos. No hay botón ni ajuste para apagarlo, y no se guarda nada en el navegador. `css/moonlight.css` cambia bajo ese atributo los tokens (`--cyan` pasa a naranja calabaza `#ff8c1a`; `--navy`, `--blue` y `--royal` a morados; la base sigue en azul noche) y los pocos colores fijos que eran cian o azul: el degradado del inicio y del lienzo, las franjas del inicio, el foco de los campos, el panel de propiedades, el cuadriculado de transparencia, el recuadro de selección y las sombras del riel en móvil (11c8043).
- Luna llena y 5 murciélagos en el fondo de estrellas del inicio (`js/starfield.js`), solo durante la temporada. Los murciélagos usan el sprite `bat` del editor. Con `prefers-reduced-motion` el fondo se dibuja una sola vez y los murciélagos quedan quietos (11c8043).
- Contenido disponible todo el año: sprites `pumpkin`, `bat`, `web`, `witchhat`, `candy` y `candle` (originales, con nombre para buscar en `SPRN`); plantillas «Post de Halloween» y «Fiesta de Halloween» (Normal), «Cartel de Halloween» e «Insignia de Halloween (PNG)» (Pixel); dos combos de fondo por estilo en `BG_COMBOS_PIXEL` y `BG_COMBOS_NORMAL`; paleta «Halloween» en `PALS`/`PALN`. La instantánea `tests/fixtures/filtros.json` suma solo las claves `paleta:halloween:0` y `paleta:halloween:60` (60fe364).
- Pruebas `tests/temporada.spec.js` (reloj fijado el 14 oct, 15 oct, 31 oct, 2 nov y 3 nov en hora de Ciudad de México; ningún control nuevo para apagar el tema; murciélagos quietos con movimiento reducido), `tests/halloween.spec.js` (sprites, plantillas, combos y paleta en junio y en octubre, sin errores en la consola) y `tests/contraste-temporada.spec.js` (cálculo de contraste propio sobre cada texto visible del inicio y del editor a 1440 y 375 px, con todas las paradas de los degradados, los `::before` y los colores de la luna y los murciélagos como posibles fondos).

### Cambiado

- README: 49 íconos pixel (eran 43) y 32 plantillas. Decía 20 plantillas, pero antes de esta versión ya había 28.

### Medido

- Contraste de los tokens de Halloween: texto claro sobre la base 16,69:1; lavanda sobre morado 6,29:1 o más; naranja sobre la base 8,44:1; texto oscuro sobre botón naranja 8,44:1; blanco sobre `--royal` 5,43:1. La luna (luminancia 0,047) y los murciélagos (0,044) se mantienen oscuros para que el texto que pasa encima siga en AA: el peor caso es naranja sobre la luna, 4,63:1.
- Fuera de temporada (10 de junio), el inicio y el editor a 1440 y 375 px salen idénticos píxel por píxel al commit anterior (34881f2).

## [1.3.1] - 2026-10-28

### Para quien usa Moonlight

- Si eliges un video en el inicio y cierras sin crear el diseño, ya no se queda ocupando memoria.

### Arreglado

- Inicio, «Editar una foto mía»: la URL del video elegido solo se liberaba al cambiarlo por otro. Ahora también se libera al cerrar el inicio sin crear el diseño («Volver al editor», Escape o «Crear GIF»), y no se libera cuando el video pasa al diseño (97aaf76).

### Agregado

- Prueba «PNG opaco sigue como image/png», con el fixture `opaca.png`: confirma que un PNG sin píxeles transparentes sigue guardándose como PNG después de b331f0e. No hizo falta cambiar `readImage` (c51f704).

## [1.3.0] - 2026-10-27

### Para quien usa Moonlight

- Ya puedes empezar un diseño con un GIF o un video desde el inicio.
- Las imágenes WebP, SVG y GIF conservan su transparencia.
- Nueva opción Fondo transparente al descargar en PNG o WEBP.

### Arreglado

- Inicio, «Editar una foto mía»: un GIF animado, un MP4 o un WebM entraban como foto fija (el GIF por `readImage`, los videos ni se podían elegir). Ahora `#hphoto` acepta `video/mp4` y `video/webm`, y el archivo pasa por `readMedia` (los mismos límites y mensajes que el panel Imágenes). La página se crea con un elemento `media` que cubre el lienzo: igual que la foto si se elige «Igual que la foto»; con otro tamaño se escala manteniendo la proporción, centrado, porque `media` se dibuja estirado y la foto se ajusta tipo cover. Exportar ofrece «GIF animado» y «Video». Un GIF de un solo cuadro sigue como foto. Esa página no tiene filtros, recorte ni volteo, como cualquier GIF o video del editor (4006fe1).
- `readImage` sin formato de salida convertía a JPEG todo lo que no fuera PNG: un WebP, SVG o GIF transparente quedaba con un recuadro negro (píxel transparente → `[0,0,0,255]`). Ahora guarda PNG si algún píxel tiene alfa menor que 255 y JPEG 0.92 si no; un JPG sigue como JPEG (b331f0e).
- Celdas de collage, reemplazar una foto que falta e imagen de fondo usan el primer cuadro de un GIF animado, pero ahora lo avisan: «Aquí se usa el primer cuadro. Para que se mueva, agrégalo desde Imágenes» (4f2b7f0).

### Agregado

- Casilla «Fondo transparente» en Exportar con PNG o WEBP (`S.conv.transp`, apagada por defecto). Si está marcada, `doExport` dibuja cada página sin el fondo y sin cambiar `bg.pat`. Si la página ya es transparente, sale marcada y desactivada. Con JPG y PDF no se muestra (23f0c2b).
- Pruebas `tests/transparencia.spec.js` y `tests/medios-inicio.spec.js`, con los fixtures `transparente.webp`, `transparente.svg`, `transparente.gif` y `opaca.jpg`.

## [1.2.0] - 2026-10-27

### Para quien usa Moonlight

- Nuevo botón Novedades, en el inicio y en la barra de abajo del editor, para ver qué cambió en cada versión.
- Un punto amarillo te avisa cuando hay una versión que aún no has visto.
- Al abrir Moonlight después de una actualización, un aviso pequeño te lo cuenta y se cierra solo.

### Agregado

- `CHANGELOG.md` con las versiones desde v1.0.0 y etiquetas anotadas `v1.0.0` (4ce9cf9), `v1.1.0` (2e8f56d) y `v1.2.0`.
- `js/novedades.js`: script clásico con `window.MoonNews`, la lista de versiones con sus notas sencillas. Funciona por `file://` y no cambia la CSP.
- Botón «★ Novedades»: en el inicio junto a Ayuda; en el editor, en la barra inferior antes del estado de guardado (solo la estrella hasta 1100 px), porque la barra superior no tenía sitio; en móvil, dentro de «Más». Abre `#modal` con las notas sencillas de todas las versiones.
- Punto amarillo en «Novedades» y, en móvil, en «Más», con el aviso en el `aria-label`, mientras la versión actual no se haya leído.
- Aviso al abrir tras una actualización: `role="status"`, no mueve el foco, se cierra solo o con Escape y sale una vez por versión. No sale en la primera visita, que es la de quien no tiene versión guardada, autoguardado ni imágenes en IndexedDB.
- Prueba que compara versión, fecha y cada nota sencilla de `js/novedades.js` con este archivo, y la versión del README.
- `vault.count()` en `02a-vault.js` para saber si hay imágenes guardadas.

### Problemas conocidos

- La barra superior del editor ya no tenía sitio antes de esta versión: entre 721 y 1280 px «Descargar» tapa botones (por ejemplo, «Guardar» a 1024 y a 1280 px).
- La barra inferior del editor se corta entre 721 y 900 px (antes ya cortaba «Quitar guías» y el estado de guardado); ahí «Novedades» queda fuera de la vista en el editor, pero sigue en el inicio y en el aviso.

## [1.1.0] - 2026-10-27

### Para quien usa Moonlight

- Ahora puedes poner GIF animados y videos MP4 o WebM en tu diseño, y pausarlos cuando quieras.
- Puedes descargar tu página como GIF animado o como video.
- Al descargar un GIF o un video ya no se saltan cuadros.
- Los GIF grandes ocupan mucha menos memoria, así el navegador va más suelto.
- El video descargado muestra cuánto dura en cualquier reproductor.
- Si al abrir tu proyecto falta una imagen, verás un aviso en su lugar y el resto del diseño se abre igual.
- En Crear GIF, si un GIF es demasiado grande para animarlo, se usa su primer cuadro y te lo avisamos.

### Agregado

- Elemento `media` para GIF y video, con decodificador de GIF propio (LZW, transparencia, disposal y entrelazado) usado en todos los navegadores, reproducción en `<canvas>` o `<video muted loop playsinline>`, Pausar/Reproducir y «Pausar todo» (c81b588).
- Exportación del cuadro visible de GIF y video en PNG, JPG y PDF, y salidas «GIF animado» y «Video» (MP4 si el navegador lo permite, si no WebM) (9397919).
- README con GIF y video, su exportación y el guardado en IndexedDB (e1396d3).

### Cambiado

- Los cuadros de GIF se guardan indexados como vienen en el archivo, con una instantánea RGBA cada 50 cuadros. Con un GIF de 547 × 547 × 300: de 360 a 22 MB (típico) y de 342 a 84 MB (peor caso) en Chromium; de 711 a 85 MB en Firefox. Salto al azar de 32 ms como máximo y avance de un cuadro por debajo de 1 ms (8ce995c).
- Al exportar, lo que está debajo de los medios se dibuja una sola vez y se reutilizan los lienzos: cada cuadro cuesta 2,8 ms en Firefox (antes 12,5) y 3,1 ms en Chromium (antes 8,7), con GIF idénticos byte a byte (63d2466).
- README: memoria de los GIF, duración del WebM, ritmo del video en Firefox y tope del Estudio de GIF (2e8f56d).

### Arreglado

- Se perdían cuadros al exportar (98 de 100 en Chromium): los tiempos de GIF se acumulaban en coma flotante y Chromium lanza `seeked` antes de presentar el cuadro. Ahora los tiempos van en centésimas enteras y `seekTo` espera también a `requestVideoFrameCallback` (2e95344).
- El póster del video podía salir en blanco con carga, porque `loadeddata` llega antes que el cuadro: 3 de 1600 antes, 0 de 1600 después (6e5e34e).
- El WebM grabado no declaraba su duración: se inserta (Chromium) o se sobrescribe (Firefox) el campo `Duration` del EBML, sin librerías. ffprobe pasa de `N/A` a 3,00 s (dad7b91).
- El Estudio de GIF no tenía límite de memoria: tope de 90 Mpx después de recortar a 300 cuadros, con mensaje (8ff4e0b).
- El proyecto guardado no abría si faltaba una imagen en IndexedDB; ahora abre y deja «Falta esta imagen» en su lugar (3c6fd34).
- Decodificador de GIF endurecido ante archivos dañados o maliciosos, sin reservar memoria de más (3828339).
- Solo se acepta como MP4 un archivo con marcas de video, y se quita el video que no se puede reproducir (59d6bda).

### Problemas conocidos

- Firefox captura el lienzo a 20 cuadros por segundo sin ventana y a 25 con ventana, aunque se pidan 30, incluso con un lienzo vacío.
- El MediaRecorder de Chromium a veces escribe dos bloques WebM con la misma marca de tiempo; el archivo se reproduce entero.

## [1.0.0] - 2026-10-26

### Para quien usa Moonlight

- Diseña publicaciones, carteles y GIF en tu navegador, sin cuenta y sin que tus archivos salgan de tu equipo.
- Elige entre diseño normal o pixel art, con plantillas, textos, formas, fondos y tu kit de marca.
- Busca imágenes libres en Openverse y guarda sus créditos con el diseño.
- Imprime un diseño en grande repartido en hojas y separa un logo en piezas por color y forma.
- Tus fotos se guardan en el navegador, así el proyecto aguanta muchas más imágenes.
- En el móvil tienes el menú Más, Seleccionar todo y botones más fáciles de tocar.

### Agregado

Primera versión con número. Recoge todo lo publicado hasta 4ce9cf9:

- Editor de diseño con capas, texto, formas, sprites, dibujo píxel a píxel, filtros, recorte, degradados, modos de mezcla, reglas y guías, varias páginas y plantillas en estilos Normal y Pixel.
- Inicio con asistente de tamaño, carrusel de plantillas y fondo de estrellas, escrito en `index.html` para que el LCP no dependa de JavaScript.
- Póster en hojas con plano de armado, Separar piezas por color y forma, y Crear GIF a partir de videos, imágenes o páginas.
- Exportación a PNG, JPG, WebP, PDF, ZIP y GIF; JSON del proyecto validado con `validateProject` al importarlo.
- Búsqueda de imágenes libres en Openverse con su atribución.
- Imágenes del proyecto en IndexedDB y solo referencias `@db:` en localStorage (4ce9cf9).
- Móvil: menú «Más», Seleccionar todo, selección múltiple y barra inferior completa.
- CSP, fuentes alojadas en `fonts/`, módulos cargados bajo demanda y pdf.js 3.11.174 con `isEvalSupported: false`.
- Pruebas con Playwright y ESLint en GitHub Actions.
