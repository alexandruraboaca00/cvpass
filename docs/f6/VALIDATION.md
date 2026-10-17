# Validación F6 — Importación estructurada

17 de octubre de 2026. **F6 = APROBADA técnicamente**, en
`f6-structured-import`, pendiente de aprobación del usuario y de integración.
`main`/`origin/main` permanecen en `238dee3`. **F7 no iniciada.**
Implementación y límites: [IMPORT.md](IMPORT.md).

## Punto de partida y alcance

Se leyeron completos AGENTS, REQUIREMENTS, ARCHITECTURE, DATA_MODEL, ROADMAP y
los documentos de implementación/validación F5 actuales. Main estaba limpio,
sincronizado tras fetch y con el cierre F5 publicado. Antes de crear la rama:
F1 3/3, F2–F5 114/114, TypeScript/build y UI F4 4/4 + F5 5/5 offline pasaron.
La evidencia de partida está en `/tmp/cvforge-f6-baseline`.

No se cambió F1 ni se implementó extracción PDF por texto/layout, OCR, modelos de
traducción, cloud, plantillas o preview F7. Solo fixtures sintéticos propios en
las pruebas automatizadas. No se usaron guiones históricos como dependencias.

## Criterios

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Firma de contenido, independiente de extensión/nombre | PASS | `f6-detection`: XML renombrado, PDF con extensión cvproj, proyecto con extensión PDF y falso PDF de texto. |
| `.cvproj` CV íntegro y revisable | PASS | Codec existente: hashes/inventario/rutas/límites; revisión crea copia con historial/activos/ocultos. Unitarios F2/F3 y `f6-library`, UI native. |
| Workspace sin sobrescritura implícita | PASS | Resumen y modos explícitos; no vacío se rechaza; reemplazar exige confirmación y backup; vacío y reapertura exacta, `f6-library`. UI comprueba rechazo y Cancelar. |
| PDF propio compatible | PASS | Payload F2 v1 y sobre digest v1, lectura por contenido, proyección visible, C sin original inventado, campos corregibles, confirmación/reapertura UI. |
| Integridad/versiones propias | PASS | Digest alterado, bytes de imagen corruptos, versión futura de proyecto/payload/sobre y registro privado futuro rechazados; archivos corruptos sin CV parcial. |
| PDF sin payload y PDF corrupto | PASS | Códigos controlados; UI explica incompatibilidad sin ofrecer falsa confirmación. F1 probe se identifica como anterior al contrato de producto. |
| PDF Europass y adjunto renombrado | PASS | PDF sintético propio con XML bajo otro nombre; real PDF.js/worker. Ambas muestras privadas detectadas adicionalmente. |
| Varios adjuntos/irrelevantes/inválidos | PASS | Todos analizados; un compatible o duplicados idénticos con motivo; dos compatibles distintos exigen elegir. UI muestra candidatos y confirma elección explícita. |
| XML UTF-8, UTF-16 LE/BE y namespaces | PASS | Prefijos distintos con las mismas URI, namespaces ajenos sin suplantar campos, codificación/declaración coherentes. |
| XML corrupto/truncado/incompleto | PASS | Errores seguros; nombre requerido ausente produce propuesta parcial que bloquea Confirmar; no se inventan valores. UI muestra error XML. |
| Seguridad XML/HTML | PASS | DTD/entidades rechazadas, límites de profundidad/tamaño/estructura; árbol enriquecido sin script/URL ejecutable/recursos remotos. |
| Ocho áreas y valores, no solo cantidades | PASS | Sintético: 8 educaciones, 3 trabajos, 18 habilidades/2 grupos, 2 nativas, 1 extranjera, 2 certificados, 2 proyectos, 2 personalizadas con 2 entradas; títulos, instituciones, periodos, textos, vínculos y orden comparados. |
| Fechas parciales, inválidas y CEFR parcial | PASS | Año/mes/día, final sola, Ongoing; fecha inválida conserva input y bloquea hasta corrección. Listening B1 con otras cuatro null; nativa sin C2. |
| Contactos/foto/activos | PASS | Bytes/hash/referencias, PNG inválido y referencia rota; foto en SQLite tras reapertura real. País alfa-2 capitalizado; URI sin protocolo permanece para revisión. |
| Procedencia y desconocidos | PASS | Nombre base/hash/candidato/URI-rutas; marcador sintético no mapeado persiste con source completo en cvproj. Informe parcial y aceptación expresa; IDs remapeados al copiar. |
| Revisión editable y Confirmar/Cancelar | PASS | UI real: corrige email/fecha/enlace y texto C visible. Cancelar/Escape y Cancelar padre después de confirmar hijo no cambian biblioteca ni dejan recuperación. |
| Antes de Confirmar no cambia biblioteca | PASS | Comparación de estado/generación completa en integración, rechazo sin aceptación del informe y cancelación del worker real. |
| Nuevo CV independiente | PASS | Perfil y CV existentes idénticos; IDs nuevos y checkpoint import pinned. Workspace solo modifica perfil/CV con restauración expresa. |
| Confirmación atómica/rollback | PASS | SQLite real: fallo inyectado después de entidades deja sin CV/asset/blob/revisión parcial, conserva generación y permite reintentar. |
| Cierre/reapertura | PASS | Nueva conexión SQLite y proceso Electron nuevo con mismo userData; contenido, foto, niveles, procedencia y revisiones recuperados; integrity=ok y FK=0. |
| Idioma y TranslationProvider | PASS | Evidencia ES/EN preservada, sin traducción ni aprobación inventada; metadata privada fuera del plan. Regresión F5 completa. |
| Privacidad de futuras exportaciones | PASS | Registro/source/desconocidos ausentes de proyección y plan lingüístico; exportación bloqueada con incidencias pendientes. F1 valida payload mínimo y PDF sin payload. |
| Offline | PASS | Namespace sin interfaz/ruta externa; 13 UI y 25 Node F6; prueba TCP externa ENETUNREACH. F1 ejecutable create/reopen offline adicional. |
| Originales privados fuera de Git | PASS | Originales intactos por hash antes/después; `git ls-files` no incluye PDF/XML/BD privadas; staging por lista explícita de código/docs. Ninguna muestra original es fixture. |

Los PASS de integridad no son una certificación de seguridad ni autenticidad del
PDF. SHA-256 no compara semánticamente páginas con adjunto. Compatibilidad limitada
al contrato propio y a las rutas Candidate/HR-XML 4.0 documentadas.

## Aceptación local privada adicional

Los dos originales seguían disponibles localmente. Se usaron solo para aceptación
privada, con extracción y bases temporales en `/tmp/cvforge-f6-private`. No se
publican aquí nombres de persona, contacto, instituciones, títulos, bytes ni hashes
privados. El informe local solo imprime contadores, categorías y booleanos.

Se construyó un oráculo independiente con Python ElementTree sobre el XML extraído
del PDF; no se usó el adaptador bajo prueba para construir los valores esperados.
El importador sí pasó por LocalStructuredImport (worker) y SQLite reales. Se
compararon todos los títulos/instituciones/periodos/web de educación, todos los
puestos/empresas/periodos, las 18 etiquetas, nombres/pertenencia/orden de los dos
grupos, códigos lingüísticos, las cinco destrezas, todos los contactos y el hash de
los bytes de la foto. Se comprobó cvproj, proyección/plan sin origen privado,
perfil intacto, ausencia de borrador, original intacto y nueva conexión SQLite.

| Caso | Resultado soportado | Revisión y limitaciones |
| --- | --- | --- |
| PDF privado ES | PASS: 8 educaciones, 3 experiencias, 18 habilidades/2 grupos, 2 nativas, 1 extranjera con cinco B2, 3 contactos, enlaces y foto; valores y reapertura exactos. | Parcial. Una URL social y cuatro webs de instituciones carecen de protocolo. Se conservaron crudas, se revisaron y se añadió HTTPS expresamente en la propuesta local de aceptación. El programa no lo añade. |
| PDF privado EN | PASS: mismos conteos y comprobaciones de valores propios del archivo inglés; documentLocale=en, sin traducirlo a ES. | Mismas cinco correcciones explícitas y clasificación parcial; no se atribuyen sus textos ingleses a una traducción del importador. |

En cada archivo quedan 14 hojas sin correspondencia: código auxiliar de país del
contacto telefónico, lugar de nacimiento, direcciones alternativas de empleadores
y ajustes de diseño. También se informa un atributo raíz y que el diseño original
no se reproduce. Metadatos de proveedor/documento y 18 taxonomías se conservan como
información privada. Todo sigue en el origen completo; nada se afirma editable
cuando no lo es. No se denomina «importación completa» a estas recuperaciones.

## Ejecución final

| Comprobación | Resultado |
| --- | --- |
| F1, paquete Linux create/reopen sin red y closure tests | 3/3 PASS |
| F2, dominio/portable/fechas/revisiones | 30/30 PASS |
| F3, SQLite/biblioteca/activos/fallos/reapertura | 39/39 PASS |
| F4, aplicación/texto enriquecido | 13/13 PASS |
| F5, dominio/editor/i18n/proveedor manual | 32/32 PASS |
| F6, detección/XML/integración SQLite | 25/25 PASS (6 + 9 + 10) |
| Total Node raíz | 139/139 PASS; 0 omitidos |
| UI Electron sin red: F4 / F5 / F6 | 4/4 + 5/5 + 4/4 PASS; 0 flaky/omitidos |
| TypeScript | PASS, salida 0 |
| Build TypeScript + Vite | PASS, salida 0 |
| Renderer errors / peticiones remotas de los 13 flujos | 0 / 0 |

Comandos y evidencia local sintética (no versionada):

```sh
npm run build
npm run typecheck
node --test dist/tests/*.test.js
CVFORGE_F6_OFFLINE_OUTPUT=/tmp/cvforge-f6-final/offline npm run validate:f6:offline
CVFORGE_F1_OUTPUT=/tmp/cvforge-f6-final/f1 unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

Logs de cierre: `/tmp/cvforge-f6-baseline/final-node.log`, `final-build.log`,
`final-typecheck.log`, `final-offline.log`, `final-f1-offline.log`.
`/tmp/cvforge-f6-final/offline/network-proof.json` registra solo `lo`, ninguna
ruta externa y ENETUNREACH; reportes por fase y renderer-errors/remote-requests.
El script usa `unshare --user --map-root-user --net`, activa únicamente lo para
CDP local y ejecuta secuencialmente UI F4/F5/F6 y los 25 tests Node F6. El uid
mapeado sigue siendo el usuario invocante en el host. F1 usa su script existente
sin modificarlo y ejecuta dos procesos reales del paquete Linux.

## Problemas encontrados, correcciones y deuda

- La lectura inicial de Education/OrganizationContact tomaba solo la primera
  Communication; ahora busca dirección y webs por separado, conserva las URL
  inválidas en el formulario y exige corrección explícita. Tests sintéticos y
  comparación privada ampliada lo verifican.
- Una incidencia de candidato XML único no seleccionado no se veía en UI; ahora
  se muestra su error. El selector de idioma tiene label asociado explícitamente.
- Los atributos desconocidos se distinguen por URI además de nombre local, para
  no ocultarlos al consumir un atributo conocido con el mismo nombre.
- No quedan fallos arquitectónicos conocidos bloqueantes dentro de F6. Se mantienen
  los avisos Vite (directiva use client/tamaño de bundle), VA-API y deudas previas,
  sin ampliarlas. No aparecieron errores de renderer en los flujos finales.
- Saxes archivado upstream, otras familias XML no soportadas, integridad sin
  autenticidad/páginas, subconjunto PNG y accesibilidad completa son límites/deuda
  documentados. No se añadió motor automático definitivo ni servicio remoto.

## Commits y límite de fase

- `0dc40a7` — adaptadores estructurados y procedencia privada.
- `f797be7` — revisión de aplicación y persistencia atómica, rollback y codecs.
- `e6638a3` — interfaz de revisión, pruebas Electron y ejecución offline.
- El commit documental de cierre añade este registro y actualiza la especificación.

Rama pendiente de revisión/aprobación del usuario. No merge ni push a main.
La siguiente fase no está iniciada.
