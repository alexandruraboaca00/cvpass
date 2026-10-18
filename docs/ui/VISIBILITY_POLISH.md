# Pulido de visibilidad de la interfaz

Rama `ui-visibility-polish`, desde main
`8ff5e698d888245d4750d75d0f50dbbc9376d3fe`. Trabajo de presentación posterior
a F7, autorizado por separado. No es F8 y no inicia esa fase. La rama se entrega
sin fusionar, pendiente de aprobación.

## Alcance

Solo `src/ui`, pruebas y documentación. Sin cambios en dominio, aplicación,
SQLite, importación como adaptador/caso de uso, contratos, TranslationProvider,
RenderSnapshot, motor/plantilla Simple, fuentes, paginación, payload o `.cvproj`.
Sin dependencias nuevas ni recursos remotos.

## Sistema visual

`src/ui/styles.css` centraliza background, surface, surface-elevated,
text-primary, text-secondary, border, primary/hover, danger/hover, focus-ring y
overlay. Añade superficies suaves, estados de aviso/éxito/deshabilitado,
sombras y radios coherentes. No incorpora un selector light/dark.

La aplicación y los diálogos fijan `color-scheme: only light` y sus colores de
fondo/texto. El CSS global de PDF.js incluía `color-scheme: light dark`, que
permitía fondos nativos oscuros con texto propio oscuro. Se comprueba el tema
claro incluso emulando una preferencia de sistema oscura.

Texto base de 16 px; labels de 15 px; cabeceras de sección de unos 22 px y
modales de 24 px. Botones secundarios claros con borde y texto oscuro, primarios
azules, peligro rojo y ghost para contraer/expandir. Disabled usa fondo/texto
propios en vez de bajar la opacidad de todo el control. Inputs de al menos
42 px y botones de 40 px; toolbar de texto enriquecido de 36 px.

Biblioteca con acciones Crear/Importar separadas, CV como elementos interactivos,
selección azul con indicador lateral y revisión secundaria legible. Cards sobre
un fondo diferenciado, borde de foco y acciones de eliminación visibles. El
borrador tiene una banda de aviso; el estado confirmado conserva su mensaje.
No se añade contenido ni se cambia la semántica de los formularios.

## Modales y formularios

El componente Modal conserva el `dialog` nativo, sus portales y los handlers de
cada formulario. Una envoltura puramente visual separa cabecera, cuerpo con scroll
y pie de acciones. El formulario HTML original sigue conteniendo sus campos y
su footer; la confirmación de importación se asocia al mismo formulario mediante
el atributo nativo `form`, para poder mostrarla en el pie fijo exterior.

Cancelar/Confirmar, borradores y formularios anidados conservan sus contratos.
La introducción del cuerpo scrollable hizo que el autofocus nativo eligiese ese
contenedor antes del primer campo. La regresión F4 lo detectó; Modal restaura
el primer control habilitado y da prioridad al autofocus explícito existente.
La misma prueba de teclado pasa después, sin modificar sus expectativas.

Se reutilizan los grupos semánticos existentes: identidad, contacto, ubicación,
foto, periodos y demás fieldsets. Se añaden espaciado, bordes, fondos y contraste.
A 760 px las cuadrículas pasan a una columna. Los botones de la navegación de
importación no se comprimen cuando su lista necesita scroll.

## Preview

Más ancho disponible (editor hasta 1560 px), área de lectura de mayor altura,
barra de navegación sticky y controles de zoom visibles. «Ajustar al ancho» es
la vista inicial, con mensaje ES/EN en el catálogo existente. ResizeObserver mide
el ancho interior útil y PDF.js escala proporcionalmente canvas, texto y enlaces.
No se usa una preview HTML ni se regeneran bytes por cambiar zoom/ancho.

La selección de zoom es estado temporal del visor, no contenido ni configuración
persistente del CV. Un porcentaje grande puede necesitar scroll horizontal de
forma intencionada; Ajustar al ancho evita ese scroll en los tamaños comprobados.

## Contraste y accesibilidad comprobada

Ratios calculados de los tokens, según luminancia relativa sRGB:

| Par | Ratio |
| --- | ---: |
| Texto principal / blanco | 15,25:1 |
| Texto secundario / superficie suave | 6,32:1 |
| Blanco / botón primario | 6,49:1 |
| Blanco / botón peligro | 6,51:1 |
| Borde de campo / blanco | 3,30:1 |
| Anillo de foco / blanco | 5,51:1 |

La prueba visual comprueba también estilos computados, contraste de títulos,
labels, hints y botones primarios, ausencia de overflow horizontal y texto de
botones sin cortar. Conserva labels, foco visible de 3 px, Tab/Enter/Escape y
el comportamiento de foco de los modales. Esto no es una certificación completa
de accesibilidad ni una auditoría con lector de pantalla.

## Validación

Evidencia sintética local en `/tmp/cvforge-ui-polish`, fuera de Git. Las capturas
no contienen documentos privados.

- F1: 3/3, ejecutable empaquetado, creación/reapertura y PDF sin red.
- F2–F7: 151/151 tests de dominio/aplicación, también repetidos sin red.
- UI F4–F7: 15/15, repetidos en namespace sin interfaces/rutas externas.
- Prueba visual adicional: 1/1 sin red; doce casos solicitados y modal hijo de habilidades;
  comprobaciones de contraste, foco, scroll, pie y viewport.
- Casos visuales: Crear CV, datos personales, educación, experiencia, habilidades,
  idiomas, certificaciones, proyectos, personalizada, revisión de importación,
  plan de idioma y preview. Cancelar todos los formularios deja el CV confirmado
  exactamente igual antes/después.
- Tamaños: 1180×880, 760×680 para modal/cuadrícula y 900×720, 1180×880,
  1600×1000 para preview. Hash de generación invariable al cambiar ancho/zoom.
- F7: siete casos PDF, incluido pequeño de una página y grande de cinco páginas
  con los 48 párrafos completos; inspección PDF.js/Poppler y payload.
- TypeScript/build y `git diff --check`: PASS. Total: 154 tests F1–F7 y 16 tests UI, más siete casos PDF. Los 30 informes de errores/peticiones de las suites UI anteriores y los dos de la prueba visual quedan vacíos.

### Comparación del PDF

Se generó la matriz F7 antes del primer cambio de UI (`before`) y después
(`offline-final/pdf`). `scripts/ui-pdf-equivalence.mjs` compara todos los bytes
sin reescribir los archivos. Solo iguala los 14 dígitos de reloj de los dos
metadatos existentes CreationDate/ModDate para comparar ejecuciones independientes.
No ignora streams, contenido, recursos, payload, geometría ni paginación. Los siete casos pasan con igualdad byte a byte fuera de esas dos fechas; recibo local `pdf-equivalence.json`.

La igualdad SHA-256 completa entre dos generaciones en momentos diferentes no
es una propiedad determinista del motor existente: sus fechas cambian. No se
modifica el motor para ocultarlo. Se comprueba separadamente la igualdad exacta
de bytes/SHA-256 entre PDF.js y el archivo realmente exportado para una misma
generación, mediante la suite F7 existente.

Comandos principales reproducibles:

```sh
npm test
npm run typecheck
npm run build
npm run validate:f7:offline
CVFORGE_UI_PLATFORM=x11 npm exec -- playwright test --config playwright.config.ts visibility.spec.ts
node scripts/ui-pdf-equivalence.mjs /tmp/cvforge-ui-polish/before /tmp/cvforge-ui-polish/offline-final/pdf /tmp/cvforge-ui-polish/pdf-equivalence.json
```

Los scripts Electron/namespace requieren permisos de ejecución de escritorio y
creación de namespaces del entorno. Los artefactos de referencia deben haberse
generado previamente con `validate:f7:render`, en los directorios indicados.

## Continuación de la revisión

La revisión completa posterior de pantallas, controles y cuatro tamaños se documenta
en [LAYOUT_REVIEW.md](LAYOUT_REVIEW.md). Incluye Presentación Simple, confirmaciones,
estados de error/disabled y campos opcionales, sin iniciar F8.

## Límites

No hay tema oscuro, auditoría completa de accesibilidad, aceptación en otras
plataformas ni diseño para ventanas de teléfono. La lista de importación puede
requerir su propio scroll además del cuerpo del modal. Se mantienen las deudas
anteriores (incluidos avisos Vite/VA-API); no se amplía su alcance. La revisión
visual final del usuario queda pendiente. F8 no iniciada.
