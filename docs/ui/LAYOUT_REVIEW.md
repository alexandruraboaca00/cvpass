# Revisión completa del layout de la GUI

Continuación de `ui-visibility-polish` desde `290938a`, sin fusionar. Main permanece
en `8ff5e698d888245d4750d75d0f50dbbc9376d3fe`. No inicia F8. Alcance: estilos,
estructura visual de Presentación y pies de confirmación, tests y documentación.
Sin cambios de dominio, persistencia, adaptadores de importación/traducción,
contratos ni motor/recursos/PDF de Simple.

## Problemas encontrados y correcciones

| Observación | Corrección visual |
| --- | --- |
| Presentación usaba labels inline: el color quedaba entre su label y el de precisión; los toggles estaban pegados. | Campos en grid, labels encima, precisión a ancho completo, toggles separados. |
| La regla general de inputs prevalecía sobre el ancho compacto del color. | Selector específico de componente: 72×44 px, alineado con selects de 44 px. |
| Los selects dentro de labels heredaban tamaño/peso distintos de otros campos. | Tipografía y padding comunes, texto de valor normal y altura mínima compartida. |
| El submit primario podía conservar el fondo azul estando disabled por especificidad CSS. | El estilo primario se aplica a enabled; disabled tiene superficie/texto propios. |
| Tres confirmaciones de importación no tenían el footer común. | Sus acciones existentes pasan al mismo footer exterior al cuerpo desplazable, sin cambiar handlers. |
| Espaciados, radios y alturas heterogéneos. | Tokens de spacing, controles, tipografía, bordes, radios y foco; reutilización del sistema de colores/sombras anterior. |
| La grid dependía solo de la anchura de ventana, aunque un formulario de importación dispone de menos ancho interior. | Auto-fit según el ancho disponible, con mínimo fluido por campo y colapso a una columna cuando no caben dos. |
| El borde de error aumentaba de grosor. | Borde exterior constante y refuerzo interior, sin variar dimensiones. Foco con outline. |
| La cabecera real podía superar la altura restada al área de trabajo y producir scroll en biblioteca vacía. | Shell flexible que reparte la altura real, sin restar una altura supuesta. |
| La ayuda de foto quedaba pegada al botón de retirar. | Ayuda en bloque con margen propio y separación bajo la miniatura. |
| Contactos/cadenas largas podían forzar el ancho de un resumen o estado del visor. | Min-width y wrapping en resúmenes personales, títulos y mensajes/recibos, sin modificar sus valores. |

Los checkboxes/radios conservan su tamaño e inclusión semántica; se alinean con
la primera línea del texto. Los botones de orden y texto enriquecido conservan
su comportamiento. No se añaden controles ni preferencias nuevas.

## Matriz visual

`tests/ui/layout.spec.ts` recorre los mismos flujos con datos sintéticos en:

- 1180×880;
- 1366×768;
- 1440×900;
- 820×700 (ventana estrecha de escritorio).

Son dimensiones del viewport del renderer; no se rediseña el marco nativo de la ventana.

En cada tamaño captura la biblioteca vacía y poblada, Crear CV, datos personales,
foto/upload, teléfono/dirección, educación y campos opcionales, experiencia,
habilidades, grupo hijo, idiomas maternos/extranjeros, certificaciones, proyectos,
entrada/nombre de personalizada, revisión sensible con radios, orden, plan de
idioma, duplicado, historial/restauración, confirmación de eliminación,
Presentación normal/foco/disabled y preview con error/lista.

La importación se revisa con XML corrupto, proyecto CV, workspace y PDF de varios
candidatos sintéticos; se capturan también los tres diálogos secundarios. Solo
la copia CV de prueba se confirma. Las restauraciones, cambios de candidato,
eliminaciones y formularios de edición se cancelan; la igualdad profunda del CV
antes/después verifica que esos recorridos visuales no confirman contenido.

Para formularios largos hay capturas superiores e inferiores y algunas de zonas
intermedias. Las imágenes no convierten en error que un campo esté legítimamente
fuera del área visible y accesible por scroll. Se comprueba que el footer permanece
fuera de ese scroll y que no tapa su área de contenido.

## Comprobaciones automáticas y revisión de imágenes

Las métricas adjuntas a cada captura comprueban:

- cero overflow horizontal de documento/contenedor;
- controles visibles sin intersección entre sí ni texto de botones cortado;
- geometría del diálogo dentro del viewport;
- cabecera, cuerpo y footer separados;
- biblioteca vacía sin scrollbar vertical sobrante;
- foco que conserva dimensiones;
- color picker compacto y controles de Presentación a 44 px;
- diferencia visual de disabled (incluye un probe DOM temporal de estilos que
  deshabilita los controles existentes sin invocar handlers ni persistir datos).

La detección de intersecciones considera el clipping real de los contenedores
con scroll y excluye contenido de details cerrados. No confunde posiciones de
contenido oculto con solapamientos de controles visibles. No sustituye la revisión
visual: se inspeccionan capturas, galerías y pantallas críticas a tamaño completo.

Evidencia local, sintética y fuera de Git: `/tmp/cvforge-ui-review`. Las carpetas
`baseline`, `check`, `narrow`, `closure-ui` y `final-captures` separan referencias, diagnóstico y
validación final. `final-gallery/index.html` permite abrir las 214 capturas finales a tamaño
completo; los PNG y JSON finales están bajo `final-captures/layout-GUI-layout-*`.
No se versionan imágenes ni documentos personales.

## Regresión y PDF

La suite F1 empaquetada pasa sus tres pruebas de creación/reapertura sin red.
Los 151 tests F2–F7 pasan con la compilación final. TypeScript y build pasan.
La suite UI final incluye los 15 tests F4–F7, el test visual anterior y los
cuatro tamaños nuevos (20 tests distintos), ejecutados sin red externa.

En un primer pase UI apareció `EDITOR_FORM_OPEN` en la consulta del test de
habilidades tras confirmar la eliminación de un grupo. La repetición aislada con
traza pasó. Se añadió además una espera explícita al cierre de Cancelar, que antes
se deducía de un recuento ya vacío. No se cambió la lógica de la aplicación ni se
relajaron invariantes de datos. Las dos siguientes pasadas completas pasaron 20/20, incluida la versión final
con el espaciado de foto corregido. No se atribuye una causa no demostrada al fallo inicial.

Los siete fixtures PDF pasan su inspección PDF.js/Poppler y la comparación con la
referencia anterior al pulido. Se mantienen número de páginas, recursos, texto,
foto, enlaces y payload; todos los bytes son iguales salvo los 14 dígitos de
CreationDate/ModDate, que ya variaban entre generaciones independientes. No se
reescriben PDFs ni se modifica el renderizador para estabilizar esas fechas.
La suite F7 comprueba aparte SHA-256 idéntico preview/archivo exportado para una
misma generación. Evidencia: `pdf-equivalence-final.json`, `closure-pdf/inspection.json`.

## Resultado final

| Viewport | Capturas / informes de layout | Solapamientos | Botones cortados | Overflow horizontal |
| --- | ---: | ---: | ---: | ---: |
| 1180×880 | 53 | 0 | 0 | 0 |
| 1366×768 | 54 | 0 | 0 | 0 |
| 1440×900 | 53 | 0 | 0 | 0 |
| 820×700 | 54 | 0 | 0 | 0 |

214 capturas y sus 214 informes, con diálogos dentro del viewport y cabecera/cuerpo/
footer separados. Las cuatro bibliotecas vacías tienen overflow vertical cero.
La versión final pasa F1 3/3, F2–F7 151/151, UI 20/20, TypeScript/build y los siete
casos PDF. Los 40 informes de errores/peticiones de UI quedan vacíos. La suite UI
se ejecutó sin red externa. Logs, JSON, traza diagnóstica y capturas permanecen
fuera de Git, en la carpeta de evidencia indicada.

## Reproducir

```sh
npm test
npm run typecheck
CVFORGE_UI_PLATFORM=x11 npm exec -- playwright test --config playwright.config.ts
CVFORGE_F7_OUTPUT=/tmp/cvforge-ui-review/pdf npm run validate:f7:pdf
```

Las ejecuciones de escritorio/namespace requieren los permisos correspondientes
del entorno. Los artefactos locales se guardan mediante `CVFORGE_F4_OUTPUT` y
`CVFORGE_F4_REPORT`. La pasada final utiliza namespace de red con solo loopback
para CDP, sin interfaces ni rutas externas.

## Límites

Se validan estas pantallas y tamaños en Linux/Electron; no se declara auditoría
universal de todos los textos, zooms de sistema, plataformas o combinaciones de
campos opcionales. Los popups nativos del sistema (paleta de color, selector de
archivo) no se rediseñan. El scroll de formularios largos y el horizontal al
seleccionar un zoom PDF grande son intencionados. Se mantienen las deudas anteriores
sin ampliarlas. La rama espera revisión del usuario, sin merge ni inicio de F8.
