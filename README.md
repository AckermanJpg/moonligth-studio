# Moonlight Studio

[![Pruebas](https://github.com/AckermanJpg/moonligth-studio/actions/workflows/tests.yml/badge.svg)](https://github.com/AckermanJpg/moonligth-studio/actions/workflows/tests.yml)

Editor de diseño que corre en el navegador, con estética de pixel art y una interfaz inspirada en Persona 3. Sirve para armar imágenes (posts, carteles, insignias, miniaturas), imprimirlas en tamaño grande repartidas en hojas, separar un logo en sus piezas y convertir videos o imágenes en GIFs.

No tiene servidor, cuenta ni base de datos. Es HTML, CSS y JavaScript sin framework y sin paso de compilación. Lo que cargas y lo que creas se queda en tu equipo; solo las búsquedas de imágenes salen de él, hacia Openverse.

## Cómo usarlo

Puedes probarlo en línea en https://ackermanjpg.github.io/moonligth-studio/ o descargarlo y abrir `index.html` con el navegador. No hace falta instalar nada ni levantar un servidor. Está probado en Chromium y Firefox; los demás navegadores modernos deberían servir. Los GIF animados se leen con un decodificador propio, así que no dependen de `ImageDecoder`.

La cuenta del proyecto está en [Moonlight Studio en Instagram](https://www.instagram.com/moonlight___studio__/) (usuario `moonlight___studio__`).

Necesita conexión a internet para cuatro cosas:

- las tipografías (Google Fonts),
- el código QR (`qrcode-generator` 1.4.4, se descarga la primera vez que usas un QR),
- importar PDFs (`pdf.js` 3.11.174, también bajo demanda),
- buscar imágenes libres: lo que escribes en el buscador se envía a la API de [Openverse](https://openverse.org) (`api.openverse.org`), de donde también se descargan las miniaturas y la imagen elegida. Sin cuenta, Openverse permite 20 búsquedas por minuto y 200 al día.

Las dos librerías se cargan desde cdnjs con hash de integridad (SRI), así que el navegador rechaza el archivo si no coincide con la versión esperada. Todo lo demás funciona sin conexión.

## Qué hace

### Diseño

El lienzo se mide en píxeles, de 16 a 5000 por lado, y un proyecto puede tener varias páginas. Cada elemento de la página es un objeto con posición, tamaño, giro, opacidad, sombra, modo de mezcla (10 disponibles) y contorno.

Los objetos que se pueden agregar:

- 11 formas: cuadrado, círculo, triángulo, rombo, estrella, hexágono, corazón, marco, anillo, línea y flecha.
- 49 íconos y pegatinas en pixel art.
- Texto, con 43 fuentes agrupadas en cuatro familias (pixel, impacto, elegantes y manuscritas, limpias y monoespaciadas).
- Código QR y gráficos de barras, líneas y pastel a partir de datos escritos a mano.
- 9 cuadrículas de collage con celdas donde se arrastran fotos.
- Dibujo libre sobre una cuadrícula de píxeles, con pincel, borrador y simetría (horizontal, vertical o en cuatro cuadrantes).
- Imágenes propias, que se suben, se arrastran o se pegan con `Ctrl+V`.
- Imágenes libres de Openverse, buscadas desde la pestaña Imágenes. Solo aparecen licencias que permiten uso comercial y modificación (CC BY, CC0 y dominio público) y nunca contenido para adultos. Cada imagen guarda su atribución, que se ve en Propiedades (con "adaptada" si le aplicas filtros, recorte o pixelado) y se copia con "Copiar créditos" en Exportar.

Para trabajar con varios objetos hay selección múltiple, grupos, alineación y distribución, orden de capas, panel de capas con ocultar y bloquear, copiar y pegar estilo, y deshacer o rehacer hasta 100 pasos.

También hay:

- 32 plantillas listas para editar.
- 8 tipos de fondo: transparente, color liso, degradado, rayas, ajedrez, puntos, estrellas e imagen.
- Un kit de marca (colores y fuentes) que se guarda aparte del proyecto.
- Reglas y guías arrastrables. Se crean arrastrando desde una regla, los objetos se pegan a ellas, y se quitan llevándolas de vuelta a la regla.
- Cuadrícula e imán de alineación para los bordes y centros de la página y de otros objetos.

### Imágenes

A cada imagen se le puede aplicar:

- 37 ajustes preestablecidos (incluye "Original"): sepia, vintage, noir, 8-bit, Game Boy, CRT, glitch, relieve, bordes, posterizar, umbral, entre otros.
- Recorte con 9 proporciones (libre, original, marco actual, 1:1, 4:3, 3:4, 16:9, 9:16 y 3:2).
- Quitar fondo.
- Máscara con forma, volteo, contorno tipo sticker y control del tamaño del píxel.

Con nada seleccionado, la sección «Filtro del proyecto» de Propiedades aplica los mismos presets y ajustes a toda la página, como una capa de ajuste: fondo, textos, formas, íconos e imágenes, en todas las páginas. El filtro se ve en el lienzo y sale en todas las descargas, y se suma al filtro propio de cada imagen.

### GIF y video en el diseño

Desde la pestaña Imágenes se puede agregar un GIF animado (hasta 8 MB y 300 cuadros) o un video MP4 o WebM (hasta 30 MB y 15 s) como un objeto más: se mueve, se redimensiona, se gira, cambia de opacidad y de capa, y se deshace igual que una imagen. Se reproduce en bucle y siempre sin sonido. El tipo se reconoce por los primeros bytes del archivo, no por la extensión.

Cada uno tiene Reproducir/Pausar en Propiedades, y "Pausar todo" en la barra superior (en el menú Más en el móvil) detiene todos. Si el sistema pide reducir el movimiento, arrancan en pausa.

### Póster en hojas

Toma una imagen y la reparte en hojas para pegarlas y obtener el tamaño final. Se escribe el tamaño del diseño completo (en cm, mm, pulgadas o metros) o el número de hojas, y se elige el papel: A5, A4, A3, A2, Carta, Oficio, Tabloide o medidas propias.

Cada hoja sale con:

- Margen configurable.
- Traslape entre hojas (la franja que se repite para que no falte nada al pegar).
- Marcas de corte en las esquinas y marcas de unión donde empieza la hoja vecina.
- Su número y el de las hojas de arriba, abajo, izquierda y derecha, en el margen.

Antes de las hojas se puede agregar un plano de armado: la cuadrícula numerada, la medida total y las instrucciones. La vista previa marca en rojo las zonas de traslape y avisa cuando la resolución de la imagen, al tamaño elegido, queda por debajo de 100 ppp.

El resultado se descarga como PDF con las hojas a tamaño real, o se abre como proyecto del editor con una página por hoja. El límite es de 150 hojas.

### Separar piezas

Toma un logo o diseño y lo divide en piezas que se guardan como PNG transparente y como proyecto aparte. Se puede separar:

- por color (una A azul y una B amarilla salen como dos piezas, aunque se toquen),
- por forma (partes que no están conectadas),
- o por las dos cosas a la vez.

Se ajusta cuánto del fondo se quita, cuántos colores buscar, qué tan distintos deben ser, cuánta mota limpiar y cuánto suavizar los bordes. Si falta un color, se toca esa zona en la vista previa y se agrega. Si se escribe el ancho real del diseño, cada pieza muestra su tamaño al imprimirse y puede mandarse al póster en hojas, o juntarse con las demás en un PDF a tamaño real. Las piezas más chicas que una hoja se acomodan varias por página; las más grandes se reparten en hojas con marcas.

### Crear GIF

Combina clips en una secuencia: videos, GIFs animados, imágenes sueltas o las páginas del proyecto abierto. Un GIF largo se corta en 300 cuadros; si aun así sus cuadros suman más de 90 millones de píxeles, se usa solo el primero y se avisa. Cada video o GIF se recorta con inicio y fin, se acelera o se frena, y se puede reproducir al revés. A las imágenes se les define cuántos segundos duran. Entre clips hay corte directo o fundido.

La salida se configura con el ancho (hasta 1000 px), la forma (la del primer clip, 1:1, 16:9, 9:16 o 4:3), cómo encajar cada clip (completo, llenando con recorte o estirado), los cuadros por segundo (de 2 a 30), el número de colores (256, 128, 64 o 32) y las repeticiones. Tiene dos opciones extra: ida y vuelta (boomerang) y una hoja de sprites en PNG con hasta 64 cuadros.

Desde un clip también se pueden convertir sus cuadros en páginas del editor para retocarlos uno por uno, y volver a armar el GIF con "Páginas como cuadros".

### Exportar y convertir

- Imagen: PNG, JPG, WebP, a escala 0.5×, 1× o 2×. Los GIF y videos salen con el cuadro que se ve en ese momento.
- Compartir: con PNG, JPG o WebP y «Página actual», el botón Compartir abre el menú del sistema para mandar la imagen a Instagram u otras apps. Solo aparece en navegadores que pueden compartir archivos (sobre todo en el celular) y en la página publicada por https; abierto como archivo (`file://`) no se muestra. Usa el mismo archivo que Descargar. Si el navegador pide un segundo toque, el botón pasa a «Compartir ahora» con la imagen ya lista.
- GIF animado de la página actual: combina el fondo y las capas con los cuadros de sus GIF y videos. Se eligen los cuadros por segundo y la duración (por defecto, la del medio más largo).
- Video de la página actual, grabado en tiempo real: MP4 si el navegador lo permite y si no WebM.
- PDF de una o varias páginas.
- ZIP con una imagen por página.
- Exportar de una vez en 8 tamaños para redes (Instagram cuadrado, vertical e historia, X, YouTube, Facebook, Pinterest y LinkedIn).
- Convertir archivos: PDF a páginas editables (hasta 30 páginas), imagen a JPG o PNG, e imágenes a un PDF.
- El proyecto completo se puede copiar o cargar como JSON.

### Atajos

| Acción | Atajo |
|---|---|
| Deshacer, rehacer | `Ctrl+Z`, `Ctrl+Y` |
| Duplicar | `Ctrl+D` |
| Copiar, pegar | `Ctrl+C`, `Ctrl+V` |
| Seleccionar todo | `Ctrl+A` |
| Guardar | `Ctrl+S` |
| Subir o bajar una capa | `Ctrl+]`, `Ctrl+[` |
| Mover | flechas |
| Borrar | `Supr` |
| Seleccionar varios | `Shift+clic` |
| Zoom | `Ctrl+rueda` |
| Cancelar una herramienta | `Esc` |

## Cómo funciona

### Estructura del código

Son scripts clásicos que comparten el ámbito global, sin módulos ES. Se eligió así porque los módulos no cargan cuando el HTML se abre con doble clic (`file://`), y esa es la forma de uso prevista. El orden de los `<script>` en `index.html` es el orden de dependencia y no se puede alterar.

```
index.html              estructura y orden de carga
css/moonlight.css       todos los estilos
img/logo.svg            logo e ícono de la pestaña
js/icons.js             iconos de la interfaz (SVG)
js/print-tools.js       cálculo del póster y separación de piezas
js/print-studio.js      ventana del póster y de las piezas
js/gif-encoder.js       codificador de GIF
js/gif-decoder.js       decodificador de GIF y utilidades de video
js/gif-studio.js        ventana del creador de GIF
js/novedades.js         versiones y notas sencillas del botón Novedades
js/app/01 … 23-*.js     el editor, dividido por responsabilidad
```

Los archivos de `js/app/` van de datos y estado (`01-data`, `02-core`) a dibujo de objetos y filtros (`03` a `05`), lienzo e interacción (`06` a `12`), paneles (`13`, `14`), exportación y conversión (`15` a `17`), plantillas, refresco de la interfaz y atajos, kit de marca, exportar en varios tamaños y menú de inicio (`18` a `22`), el botón Novedades y su aviso (`22a-news`) y el arranque (`23-main`).

### El modelo

Todo el estado vive en un objeto `S`: páginas, objetos de cada página, selección, zoom y herramientas. Cada objeto es un registro plano (`type`, `x`, `y`, `w`, `h`, `rot`, colores y demás). Para dibujarlo se genera un `canvas` del tamaño del objeto y se guarda en una caché; la clave de la caché reúne todas las propiedades que cambian el resultado, así que un objeto que no cambió no se vuelve a pintar. El lienzo reutiliza los nodos del DOM de los objetos que siguen iguales.

El historial guarda una instantánea JSON del proyecto por cada cambio. Las imágenes (que llegan como `data:` URL de varios megas) no se copian en cada instantánea: se registran una sola vez y las copias llevan una referencia corta. Sin esto, 100 pasos con una foto grande ocupaban cientos de megas.

El proyecto se guarda solo en el navegador, un segundo después de cada cambio. Las imágenes, GIF y videos van a IndexedDB y el `localStorage` guarda el proyecto con referencias cortas (`@db:`) a ellos; si IndexedDB no está disponible, las imágenes se guardan dentro del proyecto como antes. Solo cabe un proyecto a la vez. Si al continuar falta alguna imagen o video, el proyecto abre igual y deja un aviso en su lugar.

El JSON que se copia desde Exportar lleva las imágenes y los medios dentro, para que abra en cualquier navegador. Si con los videos pasa de unos 20 MB, se ofrece exportarlo sin ellos.

### Archivos sin librerías

El PDF, el ZIP y el GIF los escribe el propio programa:

- El PDF lleva cada página como una imagen JPEG a tamaño físico exacto. No tiene texto seleccionable ni vectores.
- El ZIP guarda los archivos sin comprimir.
- El GIF usa una paleta global calculada por corte mediano (median cut) sobre una muestra de píxeles de todos los cuadros, compresión LZW, y marca como transparentes los píxeles que no cambian entre un cuadro y el siguiente para que el archivo pese menos. Los cuadros idénticos seguidos se funden en uno solo con la suma de sus tiempos. Opcionalmente aplica tramado Floyd-Steinberg.

### Cómo se separa un logo

1. Se detecta el fondo: si la imagen ya es transparente, se usa eso; si no, se toma el color más común de los bordes.
2. Se buscan los colores del diseño solo entre los píxeles planos (los que rodean píxeles casi iguales), para que los tonos intermedios de los bordes no cuenten como colores propios.
3. Los píxeles de borde se asignan mirando qué colores hay cerca y pensando en cada uno como una mezcla entre un color de la pieza y el fondo.
4. Se limpian las manchas pequeñas y se rellenan los huecos mínimos.
5. Se agrupan los píxeles conectados de cada color con un llenado por inundación.
6. Para cada pieza se recupera la transparencia de sus bordes, de modo que no quede un halo del color de fondo, y se suaviza el contorno ampliando la imagen con interpolación y aplicando una curva sobre el canal alfa.

### Cómo se parte un póster

Dado el tamaño final, el de la hoja, el margen y el traslape, se calcula cuántas columnas y filas hacen falta (probando hoja vertical y horizontal y quedándose con la que gasta menos), y para cada hoja qué porción de la imagen le toca. Cada hoja se dibuja en un `canvas` a 100, 150 o 300 ppp, con las marcas y rótulos encima, y se junta en el PDF con el tamaño de página en puntos.

## Límites conocidos

- Un solo proyecto guardado a la vez. Al guardar el primer GIF o video se pide al navegador almacenamiento persistente; si lo niega, puede borrar los medios cuando le falte espacio.
- Un GIF del editor guarda cada cuadro como viene en el archivo (un byte por píxel del rectángulo que cambia) y una imagen completa cada 50 cuadros. El más grande permitido (unos 90 millones de píxeles) ocupa entre 20 y 85 MB según cuánto cambie cada cuadro. Saltar a un cuadro lejano puede tardar hasta unos 30 ms.
- En Firefox el video sale a unos 20 a 25 cuadros por segundo aunque se pidan 30: es el ritmo al que ese navegador captura el lienzo, aun con una página vacía. Chromium graba a 30.
- Los videos se leen con el navegador: si no entiende el formato o el códec, el clip no se carga. MP4 con H.264 y WebM suelen funcionar.
- El GIF no lleva sonido y su ancho máximo es de 1000 px. El tamaño total (ancho por alto por cuadros) tiene un tope de unos 90 millones de píxeles.
- Para separar piezas, las imágenes mayores de 3600 px se reducen antes de analizarlas.
- El PDF del póster y de las piezas es de imágenes, no de vectores.
- Todos los cálculos pesados corren en el hilo principal. Separar un logo de 3600 por 2400 px tarda alrededor de un segundo.

## Versiones

Versión actual: **1.5.0** (2026-10-29). Agrega el filtro del proyecto: los mismos presets y ajustes del filtro de imagen, aplicados sobre todo lo que se ve en todas las páginas, en el lienzo y en todas las exportaciones. Se guarda con el proyecto y se puede deshacer.

Cada tanda de cambios publicada es una versión, con su etiqueta anotada en git (`v1.5.0`, `v1.4.0`, `v1.3.1`, `v1.3.0`, `v1.2.0`, `v1.1.0`, `v1.0.0`). El detalle técnico de cada cambio, con sus commits y mediciones, está en el [registro de cambios](CHANGELOG.md). Una prueba comprueba que las notas sencillas de `js/novedades.js` y las del registro dicen lo mismo.

## Estado del proyecto

Hay pruebas automáticas con Playwright en `tests/`, sobre Chromium: `npm test` corre todas y `npm run test:mobile` solo las de tamaños de teléfono. ESLint usa la configuración de `eslint.config.js` (`npm run lint`). GitHub Actions corre ESLint y todas las pruebas en cada push y en cada pull request (`.github/workflows/tests.yml`).

## Privacidad

No usa analítica ni cookies. Los archivos que abres no se suben a ningún servidor. El proyecto se guarda en el `localStorage` y en IndexedDB del navegador. Se conecta a Google Fonts para las tipografías y a cdnjs para las librerías de QR y PDF.

## Licencia

MIT. Consulta el archivo [`LICENSE`](LICENSE). Copyright (c) 2026 Kenny Espinoza.
