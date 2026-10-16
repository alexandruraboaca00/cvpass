# Editor principal F4

Implementación acotada a datos personales, educación y experiencia laboral. Rama
`f4-core-editor`, desde `c5392ec`. F1 permanece cerrada; F2/F3 se reutilizan sin
migración de dominio, SQLite o `.cvproj`. F5 no se inicia. La aceptación y las
limitaciones probadas se registran en [VALIDATION.md](VALIDATION.md).

## Ejecutar

```bash
npm ci
npm run setup:electron
npm run build
npm start
```

El instalador de Electron 44 es explícito. `build` compila backend/preload/tests
con TypeScript y produce los recursos locales del renderer con Vite. `start`
abre la aplicación real; no carga fixtures ni el spike F1. Para una biblioteca
de prueba aislada: `npm start -- --user-data-dir=/tmp/cvforge-manual-test`.
El backend conserva `app.getPath('userData')/library/library.sqlite3`, fuera del
repositorio, con el esquema F3 v2, WAL/FULL, worker y controles de integridad F3.

## Capas y comunicación

| Componente | Responsabilidad |
| --- | --- |
| `src/ui/App.tsx` | Biblioteca, resúmenes, diálogos, foco, orden e inclusión. |
| `PersonalForm.tsx`, `EntryForm.tsx`, `fields.tsx` | Formularios controlados y componentes compartidos. |
| `RichEditor.tsx`, `rich-codec.ts` | Tiptap limitado y conversión al árbol semántico F2. |
| `Photo.tsx` | Preview local por Blob URL, dimensiones y recorte ya existente. |
| `src/application/editor-model.ts` | Copia temporal, fechas/números escritos, validación y límite de la entidad editable. |
| `src/application/editor.ts` | Sesión de formulario, biblioteca, borrador durable, confirmar/cancelar y assets. |
| `src/application/editor-contract.ts` | Contrato de capacidades y resultados para el renderer. |
| `src/desktop/main.ts`, `preload.cts` | Electron, puente IPC permitido, validación del emisor, fotos y cierre. |
| Aplicación/repositorio/worker F3 | Transacciones, revisión esperada, historial, blobs y SQLite. |

El dominio no importa React, Tiptap, Electron o SQLite. El renderer no obtiene
SQLite, filesystem, `require`, `process`, rutas de almacenamiento ni un método
IPC genérico. Preload publica métodos concretos. Main valida canal, operación,
argumentos y ventana/frame/URL del emisor, y serializa las peticiones. La ventana
usa `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` y CSP;
los permisos y la navegación externa se rechazan. No hay servicios, telemetría,
CDN, fuentes remotas ni cargas de contenido.

La biblioteca permite abrir los CV existentes y crear otro desde una copia
explícita de los datos personales del perfil, sin secciones. Si no hay perfil,
el usuario introduce su nombre para crearlo. Nada se rellena con datos de prueba.
El perfil y los otros CV permanecen independientes. La referencia declarativa
`cvforge-core@1` admite educación/experiencia; no es una plantilla PDF final.
Las otras áreas de un proyecto existente se conservan, sin construir sus editores.

## Formularios y durabilidad

Hay una sesión de formulario activa. `beginDraft` F3 fija la revisión y copia
base. El sobre privado guarda el objetivo, copia del CV y entradas originales de
fecha/número, incluidas las inválidas. Este sobre pertenece al almacenamiento de
borradores; no se añade al modelo exportable ni al formato `.cvproj`.

Cada cambio se refleja inmediatamente en React y se entrega a la sesión. El
`DraftAutosaver` F3 agrupa las escrituras: 500 ms de debounce y 2 s de espera
máxima. El estado de guardado del borrador se muestra por separado de la
confirmación. Un CV con recuperación pendiente requiere resolverla antes de
abrir otra edición. No se aplican borradores ni conflictos automáticamente.

- **Confirmar:** vacía la cola, valida fechas/números, campos e invariantes F2;
  `confirmDraft` escribe CV/recursos/historial y retira el borrador en una
  transacción F3. Solo entonces cambia el resumen y aparece el éxito local.
- **Cancelar/Escape:** espera las entregas pendientes y descarta el borrador,
  incluidos recursos nuevos no referenciados. Devuelve el CV confirmado, sin
  incrementar su revisión ni ofrecer después la edición cancelada como recuperación.
- **Cerrar:** tanto la petición nativa como `beforeunload` mantienen la ventana
  abierta mientras termina la operación en curso, se entrega la última copia y
  se vacía el autosave. Main destruye la ventana tras cerrar SQLite. Un error
  conserva la posibilidad de volver a intentar; no se comunica éxito falso.
- **Crash:** se recupera el último borrador reconocido por SQLite. Las pulsaciones
  aún no reconocidas antes de un SIGKILL siguen sujetas al límite del debounce;
  no se promete durabilidad por tecla. Recuperar abre un formulario, nunca confirma.

Main limita el cambio al objetivo: datos personales/inclusión de sus campos,
una entrada concreta o una permutación de orden. No reconstruye las demás
entradas. Las operaciones confirmadas de inclusión/eliminación utilizan también
revisión esperada e historial F3.

## Campos y validación

Datos personales incluye nombre para mostrar obligatorio, nombre/apellidos,
otros nombres, titular, presentación, contactos repetibles (email/teléfono/web/
red social), direcciones, nacimiento parcial, nacionalidades, género,
identificadores y foto. La selección de inclusión se guarda en
`personalFieldVisibility`, y `photo.visible` para la imagen. Desmarcar conserva
los datos. Retirar una fila del formulario requiere Confirmar para eliminarla.

Educación incluye titulación obligatoria, institución, ubicación, periodo,
descripción, web/enlaces, dirección, EQF, área, nota, tesis, materias,
clasificación nacional, créditos y validez opcional. Experiencia incluye puesto
obligatorio, empresa, ubicación, periodo, descripción/responsabilidades,
web/enlaces, sector, departamento y contacto. Los resúmenes muestran título,
institución/empresa y periodo.

Las fechas se escriben como `AAAA`, `AAAA-MM` o `AAAA-MM-DD`; los formatos
identifican su precisión F2. Se permiten fin sin inicio y Actualmente con fin
vacío. Marcar Actualmente no borra una fecha final ya escrita: si coexisten,
Confirmar muestra el error. Los textos inválidos permanecen en el input y en el
borrador; Cancelar recupera exactamente el estado previo. No hay coerción a
primer día/mes, truncado o normalización silenciosa. Los números inválidos
tienen el mismo tratamiento. Una fila de dirección nueva necesita al menos
un dato, evitando generar un literal visible vacío en la proyección F2.

Los campos A/B/C conservan su clasificación y metadatos. Editar un original C
incrementa su revisión; una aprobación anterior puede quedar obsoleta según F2,
sin borrarla. F4 no ofrece traducción ni revisión sensible. Un C procedente de
PDF sin original conocido se conserva como lectura, sin inventar un original.
Las ediciones que invalidan fragmentos narrativos protegidos requieren corregir
el texto o cancelar; aún no hay controles para revisar esos fragmentos.

## Texto enriquecido y foto

Tiptap solo tiene párrafos, saltos, texto, negrita, cursiva, enlaces seguros y
listas planas de viñetas/números desde 1. Se desactivan encabezados, tablas,
código, imágenes, subrayado, tachado y listas anidadas. El adaptador comprueba el
JSON del editor y lo convierte a `RichTextDoc`; persiste `RichNarrative` F2, sin
HTML, nodos internos de Tiptap o CSS. Pegar otros estilos no amplía el esquema.
Enter crea párrafo y Mayús+Enter salto. Enlaces admiten http/https/mailto/tel.

El selector entrega únicamente bytes de la imagen elegida, hasta 10 MiB. Main
valida firma, tamaño, hash, dimensiones y decodificación antes de usar los assets
F3. Se aceptan JPEG y el subconjunto PNG F2 (8 bits RGB/RGBA, sin entrelazado).
Los errores explican la limitación; no se interpreta una ruta enviada por el
renderer. El preview usa Blob URL revocada al cambiar de imagen, conserva
proporciones/recorte y no copia rutas al CV. Sustituir/retirar modifica el
borrador; Cancelar conserva los bytes anteriores. Confirmar retiene los activos
históricos necesarios y F3 recoge los recursos que ya no tienen referencias.
No se añaden herramientas de recorte.

## Secciones, orden y accesibilidad

Las acciones de sección y entrada tienen grupos separados y nombres concretos.
Ocultar/mostrar cambia `included` de forma durable y conserva el contenido.
Contraer/expandir modifica exclusivamente un `Set` React; no incrementa la
revisión, no cambia la inclusión y no se guarda entre sesiones ni se exporta.
Los proyectos y PDFs continúan teniendo alcances distintos: los datos excluidos
se conservan en `.cvproj` y no entran en `ExportProjection`/payload PDF.

La reordenación abre un borrador con botones Subir/Bajar, activables con Tab,
Enter/Espacio. Confirmar persiste la permutación; Cancelar conserva el orden
anterior. Eliminar una sección/entrada pide una confirmación que identifica el
objetivo, no se ofrece como sinónimo de ocultar y conserva el historial F3.

Hay labels asociados, campos obligatorios/optativos visibles, errores asociados
con `aria-invalid`/`aria-describedby`, alertas, foco inicial, devolución de foco,
diálogos nativos con contención de tabulación, Escape y botones de orden
accesibles. No se declara certificación completa ni validación con lector de
pantalla/PDF accesible; corresponde a la aceptación transversal posterior.

## Dependencias y límites

| Paquetes añadidos | Versión | Licencia declarada | Uso |
| --- | --- | --- | --- |
| react, react-dom | 19.3.1 | MIT | Interfaz local. |
| @tiptap/core, /pm, /react, /starter-kit, /extension-list | 3.32.0 | MIT | Edición limitada y esquema de listas. |
| vite | 8.3.4 | MIT | Bundle local de producción. |
| electron | 44.7.2 | MIT | Desarrollo/ejecución del host validado. |
| @playwright/test | 1.64.1 | Apache-2.0 | Pruebas de la aplicación real. |
| @types/react, @types/react-dom | 19.3.0 | MIT | Tipos de desarrollo. |

Licencias comprobadas en los paquetes instalados. No se copian recursos de
Europass ni se usan servicios/extensiones comerciales de Tiptap. El audit de
producción de esta raíz no detectó vulnerabilidades; los avisos históricos F1
no se sustituyen por este resultado ni se resuelven como trabajo F4.

Deuda: UI española inicial, controles aún extensos para campos opcionales,
optimización de carga del bundle y pruebas de accesibilidad más amplias. El
build informa de `use client` de Tiptap y de un chunk mayor de 500 kB; no son
fallos de compilación ni dependencias de red. Los límites PNG y la edición de
fragmentos protegidos quedan explícitos. Empaquetar este editor como producto
distribuible y las plantillas/preview finales siguen sus fases del roadmap.
Se mantienen fuera de F4 las incidencias F1 de Poppler/VA-API, avisos de desarrollo
y ONNX, y la deuda F3 de 100 CV, reparación de SQLite y otras plataformas.

Referencias técnicas: [aislamiento de Electron](https://www.electronjs.org/docs/latest/tutorial/context-isolation),
[cierre de ventana](https://www.electronjs.org/docs/latest/api/browser-window#event-close),
[StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit).
