# Registro de cambios

Cada versión corresponde a una tanda de cambios publicada con un solo push. Los números siguen `mayor.menor.parche`: una función nueva sube el número del medio y una tanda que solo arregla sube el último. Cada versión tiene su etiqueta anotada en git (`vX.Y.Z`).

La sección «Para quien usa Moonlight» es la que aparece en el botón Novedades de la página, palabra por palabra. Debajo va el detalle técnico de cada cambio, con el commit que lo hizo y, cuando hay, la medición.

## [1.2.0] - 2026-10-27

### Para quien usa Moonlight

- Nuevo botón Novedades, junto a Ayuda, para ver qué cambió en cada versión.
- Un punto amarillo te avisa cuando hay una versión que aún no has visto.
- Al abrir Moonlight después de una actualización, un aviso pequeño te lo cuenta y se cierra solo.

### Agregado

- `CHANGELOG.md` con las versiones desde v1.0.0 y etiquetas anotadas `v1.0.0` (4ce9cf9), `v1.1.0` (2e8f56d) y `v1.2.0`.
- `js/novedades.js`: script clásico con `window.MoonNews`, la lista de versiones con sus notas sencillas. Funciona por `file://` y no cambia la CSP.
- Botón «★ Novedades» en el inicio y en la barra superior del editor (en móvil, dentro de «Más»). Abre `#modal` con las notas sencillas de todas las versiones.
- Punto amarillo en «Novedades» y, en móvil, en «Más», con el aviso en el `aria-label`, mientras la versión actual no se haya leído.
- Aviso al abrir tras una actualización: `role="status"`, no mueve el foco, se cierra solo o con Escape y sale una vez por versión. No sale en la primera visita, que es la de quien no tiene versión guardada, autoguardado ni imágenes en IndexedDB.
- Prueba que compara versión, fecha y cada nota sencilla de `js/novedades.js` con este archivo, y la versión del README.

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
