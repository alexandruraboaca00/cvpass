# F6 — Importación estructurada

En implementación en `f6-structured-import`, desde main `238dee3`.
F6 todavía no está aprobada. No se inicia F7.

La regresión de partida pasó F1 3/3, F2–F5 114/114, TypeScript/build y UI
F4 4/4 + F5 5/5 dentro de un namespace sin red externa. Artefactos sintéticos
en `/tmp/cvforge-f6-baseline`. Los dos PDF privados originales están disponibles;
su aceptación adicional sigue pendiente y no se declaran resultados por inspección.

## Límites y contratos

Dominio independiente de XML/PDF/Node. `ImportRecord` privado, opcional en CV,
tiene `recordVersion=1`, origen/hash/activo, candidato y motivo de selección,
correspondencias y problemas con estado. Las fechas de trayectoria mantienen F2.
Una propuesta puede contener campos obligatorios vacíos y fechas crudas inválidas;
ese estado no puede confirmarse en la biblioteca.

Se mantiene el contenedor `.cvproj` v1 y su codec único. La extensión opcional de
CV tiene una versión propia; snapshots anteriores sin procedencia no se reescriben
ni reciben orígenes inventados. Una aplicación anterior rechaza la propiedad
desconocida por validación estricta, en vez de descartarla al guardar. Un
`recordVersion` futuro se rechaza. SQLite conserva el esquema v2 y sus índices
existentes de referencias; un activo de origen usa rol `source`.

Las correspondencias privadas no son referencias vivas al perfil ni a otros CV.
Se remapean sus IDs destino al duplicar. Los activos de origen tienen cierre de
dependencias en historial/`.cvproj`, sin depender de rutas temporales.
`ExportProjection` mantiene su lista permitida y rechaza revisiones de importación
pendientes. El plan lingüístico excluye toda procedencia privada.

## Adaptadores implementados en el primer bloque

- Firma por bytes para ZIP/PDF/XML; formato propio verificado por su identificador.
- `.cvproj` reutiliza versiones, inventario, hashes, límites y rutas del codec F2/F3.
- PDF.js enumera nombres del catálogo y obtiene cada contenido por su clave,
  sin depender del nombre del adjunto. No solicita texto, layout ni renderizado.
- Europass `Candidate` en `http://www.europass.eu/1.0`, DocumentID HR-XML 4.0,
  con rutas/URI explícitas de Europass, HR-XML, OAGIS y EURES. No se afirma validar XSD.
- UTF-8/UTF-16 LE/BE, BOM/declaración coherentes, rechazo de DTD/entidades,
  10 MiB XML, profundidad 64 y 100.000 nodos. No hay resolución de red.
- HTML de datos convertido con parse5 al árbol semántico limitado, sin ejecutar
  etiquetas, CSS, scripts ni recursos remotos; degradación informada.
- Un worker acotado a 30 s y heap de 512 MiB aísla el análisis del proceso de UI.
  Se consumen diagnósticos del parser sin imprimir contenido importado.
- PDF propio acepta `cvforge-export-payload` v1 del dominio F2. Su validación
  estructural y hashes de imágenes no son una firma ni prueban coincidencia con
  las páginas; se informa cuando falta digest del transporte. Un sobre opcional
  `cvforge-pdf-data` v1 añade longitud/SHA-256 de los bytes exactos del payload,
  reutilizando el codec existente. El payload v1 no cambia.
- `cvforge-export-probe` de la prueba técnica F1 se identifica como incompatible;
  no es un proyecto ni el contrato de producto F2. No se modifica el spike F1.

Los candidatos compatibles distintos exigen elección. Se permite selección
determinista con un único candidato compatible, o varios contenidos idénticos
del mismo formato; el motivo queda disponible para la revisión.

## Dependencias de este bloque

| Paquete | Versión | Licencia | Propósito |
| --- | --- | --- | --- |
| pdfjs-dist | 6.4.299 | Apache-2.0 | Catálogo/adjuntos PDF locales. |
| saxes | 6.0.0 | ISC | Parser XML con namespaces; envuelto con límites/rechazo DTD. |
| parse5 | 8.0.1 | MIT | Interpretar HTML de descripciones sin DOM ejecutable. |
| pdf-lib (desarrollo) | 1.17.1 | MIT | Crear PDF sintéticos propios en tests. |

Saxes está archivado upstream; se fija la versión, se limita su exposición y se
prueba la política XML. La actualización/mantenimiento futuro queda registrada.
No se copian estilos, fuentes, imágenes ni código de Europass. Los tests generan
sus textos, nombres, contactos e imágenes; no usan documentos de investigación
como dependencias.

## Pendiente en este punto

Integración de revisión/Confirmar/Cancelar con biblioteca y UI, transacción de
alta/restauración, pruebas de reapertura, aceptación local privada, regresión
final/offline y cierre documental. Esta lista se sustituirá por el estado probado.
