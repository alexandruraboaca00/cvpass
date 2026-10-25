> **Control previo actual: integración bloqueada.** El usuario aprobó F9/MVP 0.1.0 en `7088c4c`; la regresión nueva conserva 216 tests, UI, 33 PDF, offline y privacidad PASS, pero Confirmar durable p95 **359,7 ms >300**. Arranque p95 2469,1 ms PASS. Sin merge/push a main ni F10. [Evidencia actual](MERGE_VALIDATION.md). La aceptación anterior y todos sus resultados se conservan como historia.

## Registro aprobado anterior, conservado

# F9 — Aceptación técnica tras corregir el arranque

**F9 = APROBADA técnicamente. MVP candidato 0.1.0, pendiente de nueva aprobación del usuario.**
25/10/2026. Rama `f9-mvp-acceptance`, sin fusionar ni hacer push a main;
base `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`. **F10 no iniciada.**

La regresión se investigó antes de optimizar. [Perfilado, comparación de commits,
causas y garantías](STARTUP_PROFILING.md); [resultados crudos](evidence/startup-acceptance.json).
No se cambió el benchmark oficial, el marcador de 100 tarjetas ni ningún umbral.
No se revirtió perfil/workspace ni se relajó SQLite FULL/WAL.

| Caso | Resultado actual | Evidencia |
| --- | --- | --- |
| AC-01 Europass | PASS, subconjunto parcial | Dos muestras privadas, valores y cantidades comparados con oráculo independiente: 8 educaciones, 3 experiencias, 18 skills/2 grupos, 2 maternas, 1 extranjera/cinco B2, contactos/enlaces/foto, reapertura y originales intactos. No fixtures privados ni compatibilidad universal. |
| AC-02 Reapertura propia | PASS | E2E AppImage: Simple y Lateral → bibliotecas vacías → revisión/confirmación/reapertura y comparación visible. `.cvproj` recupera el proyecto completo declarado. |
| AC-03 Confirmar/Cancelar | PASS | GUI email A/B, cancelar conserva A sin borrador residual; confirmar y reiniciar conserva B. También formularios de perfil y modales hijos. |
| AC-04 Crash/borradores | PASS | SIGKILL real, recuperar/descartar, confirmado separado y PDF sin borrador. |
| AC-05 Idiomas | PASS, workflow manual vigente | Original/traducción/ambos, aprobación reutilizada, cambio revisado con checkpoint y obsolescencia sin borrar originales. |
| AC-06 Perfil independiente | PASS por GUI | Ocho áreas, selección explícita para A/B, IDs nuevos/sourceRef, edición independiente de A/perfil/B y comparación tras reinicio. Sin presentación/documentLocale de CV en el perfil. |
| AC-07 PDF | PASS | 33 casos, 48 párrafos, enlaces, listas, glifos/foto, márgenes y ambas plantillas; SHA-256 preview/export idéntico. Simple sin cambio de render. |
| AC-08 Workspace | PASS por GUI | Perfil/CV/assets/historial → exportar → biblioteca vacía → restaurar/reabrir → comparación; EACCES y Cancelar no anuncian éxito. |
| AC-09 Rendimiento/offline | PASS | 20 procesos nuevos/100 CV: startup p95 1844.4 ≤3000 ms; Confirmar durable 228.4 ≤300. Todos los presupuestos previos pasan. FUSE normal adicional: 20 aperturas, p95 2339.4 ms, sin extracción. |
| AC-10 Límites/privacidad | PASS en corpus probado | Corruptos/futuros/ambiguos/tamaño y PDF genérico sin medio CV; payload sin centinelas privados. Privados no tracked/staged; antecedente histórico de huellas explicado abajo. |

**216 tests distintos PASS**: F1 3; dominio/aplicación/SQLite 180; UI/pulido/layout
23; aceptación GUI AppImage 10. Se añaden seis regresiones, solo con datos sintéticos.
Además 33 casos PDF y dos aceptaciones privadas, sin sumarlas al total unitario/UI.
TypeScript/build y AppImage PASS. [Recibos resumidos](evidence/startup-validation.json).

Evidencia local: `/tmp/cvforge-f9-startup/final-offline/`.
Las 216 pruebas pasaron antes de que un comprobador auxiliar consultara demasiado
pronto el título al reabrir un CV. Se corrigió esa espera asíncrona, sin modificar
el producto ni el criterio. Se verificaron los recibos y SHA exactos antes de
repetir desde cero el recorrido de crear/cerrar/reabrir y completar PDF/privacidad.
`network-proof.json`: `resumedAfterPackage=true`, solo loopback, cero rutas,
ENETUNREACH externo, capacidades cero. Ninguna prueba fallida se omitió.

El paquete se ejecuta fuera del checkout; 105 archivos de producción/recursos
contrastados con dist, sandbox Chromium activo, sin pruebas/datos privados.
Normal FUSE también crea y reabre sin switch userData, con XDG aislado y sandbox.
Dos reconstrucciones producen los mismos bytes:
`16c0a4f77ac117b33a066b6c50a6ee75154552de2d485cf1fc9f8aa1974a14b3`, 159760475 bytes.

Abrir CV p95 2819.1 ms queda informado; no tenía umbral formal y no
se amplió el alcance para optimizarlo. Cachés SO/runtime no se vacían: el frío es
de proceso/perfil, como en la definición previa. El diagnóstico con trazas y el
FUSE normal permanecen separados de las 20 muestras oficiales.

No se modifican Simple/Lateral, formatos, RenderSnapshot, payload, idiomas,
assets, revisiones ni garantías de guardado. La deuda de PDF escrito sin receipt
ante crash conserva su comportamiento aprobado: CV intacto, ningún éxito falso y
reintento explícito. No se implementa F10, OCR, PDF genérico ni servicios remotos.

## Registro histórico conservado

Las cifras y estados siguientes corresponden a evaluaciones anteriores; la cabecera actual y STARTUP_PROFILING gobiernan esta candidata.

## F9 — Aceptación del MVP

**F9 y MVP 0.1.0 APROBADOS por el usuario.** Integración bloqueada por la nueva
regresión de arranque: p95 3462,3 ms >3000. [Control previo al merge](MERGE_VALIDATION.md).
La aceptación técnica anterior permanece como evidencia. Versión **0.1.0**,
rama `f9-mvp-acceptance`, base `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`.
Sin fusionar ni publicar main por el resultado del control previo. **F10 no iniciada.**
La primera evaluación NO APROBADA y sus 471,1 ms se conservan íntegros más abajo.

## Reevaluación y evidencia final — 24/10/2026

Antes de repetir el cierre completo se ejecutaron AC-06 y AC-08 por GUI/AppImage
(3 pruebas, incluyendo recuperación del perfil) y el benchmark oficial de AC-09.
Solo al pasar los tres se repitieron F1–F9, UI, PDF, privacidad y el E2E empaquetado.
No se cambió ningún criterio ni se relajó la durabilidad.

| Caso | Resultado final | Evidencia actual |
| --- | --- | --- |
| AC-01 Europass | PASS, subconjunto probado | Dos PDF privados: 8 educaciones, 3 experiencias, 18 habilidades/2 grupos, 2 maternas y una extranjera/cinco B2, contactos/enlaces/foto. Valores comparados con oráculo XML independiente y reapertura; cinco URLs revisadas expresamente por muestra. Siguen siendo importaciones parciales, no compatibilidad universal. |
| AC-02 Reapertura propia | PASS | Simple/Lateral exportados desde AppImage → otras bibliotecas vacías → revisión/confirmar/reabrir → proyección visible completa idéntica. `.cvproj` CV conserva el proyecto privado y dependencias según su contrato. |
| AC-03 Confirmar/Cancelar | PASS | A → editar B → Cancelar mantiene A, revisión, resumen/PDF y ningún borrador. Confirmar B → reiniciar conserva B. También perfil y modales hijos. |
| AC-04 Cierre inesperado | PASS | SIGKILL real con borrador CV y perfil: confirmado separado, recuperar/descartar/cancelar explícitos, PDF solo confirmado y reapertura consistente. |
| AC-05 Idiomas | PASS en alcance manual vigente | ES→EN revisado con checkpoint, nombres B intactos, original/translation/ambos, aprobaciones reutilizadas y obsolescencia sin borrar original. Interfaz/documentLocale independientes. |
| AC-06 Perfil independiente | PASS por GUI | Crear/rellenar ocho áreas del perfil, seleccionar campos/secciones/entradas y materializar A/B con IDs nuevos/sourceRef. Editar A y después perfil no cambia el otro CV. Comparación exacta tras reinicio; perfil sin presentación/documentLocale/inclusión de CV. |
| AC-07 PDF | PASS | 33 casos F7/F8; 48 párrafos íntegros, márgenes, listas, enlaces/URL larga, glifos/foto, lectura PDF.js/Poppler y seis documentos en PDFium externo. Preview/export tienen el mismo SHA-256. Sin cambios al renderizador Simple/Lateral. |
| AC-08 Copia recuperable | PASS por GUI | Exportar workspace con perfil/dos CV/assets/historial → biblioteca vacía → restaurar → reabrir → snapshot y blobs exactos. EACCES real, reintento después de éxito y Cancelar selector sin éxito falso; biblioteca ocupada rechazada. |
| AC-09 Rendimiento/offline | PASS | Mismo corpus/hash de 100 CV, SSD/equipo y límites IPC, 20 procesos nuevos. Confirmar p50 251,1; p90 260,9; p95 261,3; máximo 271,5 ms, objetivo ≤300. Todos los presupuestos previos pasan. Cierre completo sin red. |
| AC-10 Límites/privacidad | PASS en corpus probado | Ambigüedad, corruptos, futuro, exceso de tamaño y PDF genérico producen resultados útiles sin medio CV. Payload completo sin centinelas privados; auditoría actual de repositorio limpia, originales privados sin staged/tracked. Antecedente de huellas históricas conservado abajo. |

**210 tests distintos PASS**: F1 3; dominio/aplicación/SQLite F2–F9 174;
UI F4–F8/pulido 23; aceptación AppImage F9 10. Además 33 casos PDF y dos
aceptaciones privadas, sin sumarlas como tests unitarios. TypeScript/build PASS.
Paquete Linux/AppImage fuera del checkout: 95 archivos de código/recursos
contrastados con dist, sin fuentes/tests/archivos privados y sandbox activo.

Evidencia completa nueva: `/tmp/cvforge-f9/remediation/final-offline/`.
`network-proof.json`: solo loopback, cero rutas, ENETUNREACH externo, CapEff=0,
**resumedPrivateAudit=false**; todas las suites se ejecutaron de nuevo.
Peticiones HTTP/errores del renderer: listas vacías. El mismo artefacto identificado
en RELEASE supera benchmark y aceptación empaquetada.

PDFium Chrome 153.0.8010.52 vuelve a abrir Simple 1/5 páginas y Lateral 1/3/5/8,
con navegación a última página y capturas locales. GUI: 1180×880, 1366×768,
1440×900 y 820×700, teclado/foco y geometría sin regresión. Se revisó además
visualmente el perfil con todas las áreas y un formulario de educación compartido.
No se declara WCAG ni PDF/UA completo.

Arranque **FUSE normal fuera del namespace: PASS**, creación/cierre/reapertura,
sin switch userData ni extracción, sandbox activo. En aislamiento sin red sigue
pasando la ruta extract-and-run. AppImageLauncher se desactiva solo para que el
harness no mueva el archivo; no es una dependencia de la aplicación.
Evidencia: `/tmp/cvforge-f9/remediation/host-fuse/results.json`.

### Correcciones acotadas

- GUI de MasterProfile y materialización explícita: mismos ocho formularios,
  entidad perfil real y borradores/revisiones/assets existentes. [Recorrido](PROFILE_AND_BACKUP.md).
- Exportación workspace GUI: codec v1 y escritura existentes, diálogo nativo,
  resolver borradores primero y anuncio solo después de escritura verificada.
- Latencia: valores exactos reutilizables para validación local, invariantes
  globales siempre verificadas, clones/transporte/relecturas y serialización
  redundantes eliminados. FULL/WAL, revisión, atomicidad y borrador resuelto
  antes del reconocimiento. [Perfilado A–K](CONFIRM_PROFILING.md).
- Aviso de backup anterior: se limpia al iniciar otra operación, para que un
  fallo o Cancelar no deje visible un éxito correspondiente al intento previo.

El caso **Crash/reconciliation between successful PDF file write and durable
ExportRecord** vuelve a pasar: PDF sin receipt posible, CV intacto, ningún recibo
inventado ni anuncio de registro y reintento explícito durable. No se añade una
transacción distribuida ni exploración automática de rutas privadas.

### Commits nuevos de corrección

| Commit | Trabajo |
| --- | --- |
| 29a9260 | Validación exacta reutilizable y transporte SQLite, con regresiones de integridad. |
| 452d709 | Edición de contenido del perfil y materialización selectiva independiente. |
| 4407f77 | GUI del perfil y export workspace; formularios compartidos. |
| 97778ea | Perfilado por etapas, historial antes/después y percentiles oficiales. |
| bb69f52 | Runner con nuevas regresiones y versión real del controlador. |
| d367aae | Cancelar padre, reintentar backup y arranque normal FUSE. |

El commit documental posterior registra este cierre, artefacto y limitaciones.
La aprobación posterior del usuario autoriza el merge condicionado a regresiones PASS.
El nuevo [control](MERGE_VALIDATION.md) bloquea la fusión y el push; F10 no se inicia.

## Primera evaluación conservada — resultado histórico del commit 2efbd39

El texto siguiente corresponde al primer intento fallido. Sus FAIL y métricas
son evidencia histórica; el estado vigente es la matriz de reevaluación anterior.


**F9 = NO APROBADA.** Versión candidata 0.1.0, rama `f9-mvp-acceptance`,
base `cc7cf0d6b4aa56689ec9d0dec22b6aa9e5cba28c`. No fusionada; F10 no iniciada.
Los bloqueos de GUI AC-06/AC-08 impiden aprobar el producto aunque las regresiones
pasen. La aceptación de rendimiento se informa aparte, sin cambiar NF-05.

Se leyeron completos los diez documentos requeridos, se verificaron main limpio,
HEAD/base y origin/main mediante fetch/ls-remote y se validó F1–F8 antes de crear
la rama. Evidencia de base: `/tmp/cvforge-f8-recheck-20261023/`. Eso no sustituye
la aceptación nueva de producto.

| Caso | Resultado | Evidencia y límite real |
| --- | --- | --- |
| AC-01 Europass | PASS, subconjunto compatible | Ambas muestras privadas: 8 educaciones, 3 experiencias, 18 habilidades/2 grupos, 2 maternas, una extranjera/cinco B2; valores, periodos, contactos/enlaces y foto contrastados contra XML independiente, con reapertura. Cinco URLs por muestra corregidas expresamente; campos no soportados informados, sin prometer importación universal/completa. |
| AC-02 Reapertura propia | PASS | E2E AppImage de ambas plantillas → otras bibliotecas vacías → confirmar/reiniciar → igualdad de ExportProjection. `.cvproj` recupera el proyecto completo y sus dependencias; regresiones SQLite comparan además bytes de assets e historial. |
| AC-03 Confirmar/Cancelar | PASS | Email A → B → Cancelar conserva CV/revisión, resumen y PDF de A, sin borrador pendiente. Confirmar B y reiniciar conserva B; también F4 completo. |
| AC-04 Cierre inesperado | PASS | SIGKILL del main de la AppImage con borrador durable, recuperación separada, Cancelar/descartar explícitos y PDF solo del confirmado. |
| AC-05 Idiomas | PASS en alcance manual/revisable vigente | Cambio ES→EN revisado, checkpoint, B intacto, memoria C aprobada reutilizada, modos original/traducción/ambos y obsolescencia sin borrar original. Cancelar padre descarta hijo. No se declara motor automático de producción. |
| AC-06 Perfil independiente | FAIL de producto | Nueva prueba aplicación/SQLite con perfil y dos CV, editar CV/perfil y reabrir: PASS. La GUI no ofrece creación/edición completa del perfil; el recorrido real solicitado no puede completarse. |
| AC-07 PDF | PASS | 33 casos F7/F8, 48 párrafos completos, límites, listas, URLs, ES/EN/RO, imagen, etiquetas/enlaces y lectura PDF.js/Poppler; lector externo PDFium abre seis documentos y navega hasta la última página. No PDF/UA certificado. |
| AC-08 Copia recuperable | FAIL de producto | Workspace completo exportado/restaurado por aplicación/SQLite: igualdad tras reapertura y fallo de archivo sin éxito falso. La GUI restaura workspace pero todavía no lo exporta. La copia CV por GUI sí supera su ciclo completo. |
| AC-09 Rendimiento/offline | FAIL NF-05; offline funcional PASS | 100 CV, SSD, proceso/perfil nuevo, corpus determinista, 20 repeticiones por operación y presupuesto previo. Ver valores finales en PERFORMANCE. La AppImage completa el ciclo sin red; no se confunde eso con cumplir todos los p95. |
| AC-10 Límites/privacidad | PASS para payload y flujos probados | Adjunto ambiguo, XML roto, payload/formato futuro, exceso de tamaño, genérico y corrupto: mensajes y cero medio CV. Payload extraído completo sin centinelas privados, imagen normalizada, fechas/variantes visibles. Auditoría Git y antecedente de dos huellas históricas descritos abajo. |

No se eleva AC-06/AC-08 a PASS usando únicamente operaciones que el usuario no
puede ejecutar desde la GUI. No se añade apresuradamente un editor de perfil ni
una política nueva de copias durante la aceptación.

Evidencia funcional final: `/tmp/cvforge-f9/accepted-environment/`; aceptación
privada completada tras la redacción con `offline-completion.log` y `private/`.
`--resume-private` exige primero los recibos sin fallos de F1/170 tests/UI 23/7,
PDF 26/7, equivalencia, arranque y el mismo SHA-256 AppImage; no omite una regresión
fallida ni reutiliza otro artefacto. La pasada inicial se conserva y documenta el
hallazgo que motivó la redacción.

Los objetivos previos son NF-05: arranque frío ≤3 s; escritura ≤100 ms;
confirmación durable ≤300 ms; preview hasta 3 páginas ≤2 s tras debounce de
400 ms; exportación 10 páginas ≤5 s; importación estructurada 3 páginas ≤3 s.
Otras métricas se registran sin inventar un umbral. Se distinguirá inicio de
proceso de caché fría del SO, y preparación/confirmación de importación.

Caso F8 reproducido y decisión validada, sin prometer transacción distribuida:
**Crash/reconciliation between successful PDF file write and durable ExportRecord**.
Archivo sin recibo posible, CV intacto y reintento explícito; detalle y prueba abajo.

## Recorridos y fallos reproducidos en F9

La prueba nueva `tests/ui/f9.spec.ts` usa el ejecutable AppImage real, con cwd
fuera del repositorio, bibliotecas vacías independientes, archivos escritos de
verdad y un resultado controlado del diálogo de destino. No conecta a Vite ni
al ejecutable Node del desarrollador para ejecutar código de producción.

El recorrido principal importa un PDF Europass sintético conocido, revisa y
confirma; contrasta valores de cada bloque y foto; confirma email A, cancela B y
comprueba también el PDF de A; confirma B y reinicia; cancela un plan lingüístico,
revisa manualmente el cambio a English con instituciones/empresas intactas y
checkpoint; oculta una entrada; exporta Simple y Lateral; reimporta cada PDF en
otra biblioteca y compara la proyección completa tras reiniciar; exporta el
proyecto completo y lo recupera en una tercera biblioteca; finalmente reabre el
CV fuente. Se comprueban orden, fechas, niveles, foto y presentación además de
cantidades. El origen es sintético; los dos documentos privados tienen otra
aceptación local, sin trasladar sus valores a este recorrido versionado.

El contrato PDF recupera la proyección visible efectiva, no el original privado:
no se exige recuperar ocultos, memoria C privada ni precisión de fecha omitida.
La comparación `.cvproj` normaliza solo IDs de copia y la revisión/procedencia
que añade expresamente la importación. Compara todo el resto y sus recursos.

| Hallazgo | Clasificación | Acción y evidencia |
| --- | --- | --- |
| Relecturas/validaciones y tránsito main/worker repetían toda la biblioteca de 100 CV. | Rendimiento bloqueante. | Cache de snapshots validados por generation/data_version, copias aisladas y staging idéntico sin segunda escritura. Siete regresiones F9 y suites existentes. Mejora parcial; no se elimina el FAIL p95. |
| Cancelar podía dejar el foco en BODY con la ventana activa. | Bug de teclado. | Reproducido en F4, dos fallos de tres; restauración posterior al commit React con controles habilitados y sin cerrar un dialog ya desmontado. Tres repeticiones completas posteriores PASS; F9 añade cancelaciones consecutivas. |
| Crear CV vacío devolvía error general sin señalar campos. | Validación/UX. | Labels/error asociado y foco al primer inválido, conservando validación del IPC. |
| Fallos de permisos/espacio/lock o plantilla antigua mostraban códigos poco útiles. | UX de fallo local. | Mensajes ES/EN explican la conservación del confirmado y cómo reintentar. Los códigos quedan para diagnóstico, sin stack/rutas/valores. |
| AppImage legacy variaba con el reloj pese a SOURCE_DATE_EPOCH. | Entrega. | Toolset 1.0.3 admitido por builder; dos builds idénticos con fuente/fecha fija. No se parchea node_modules. |
| AppImageLauncher movía el artefacto durante los tests. | Entorno/harness. | Desactivar su integración solo en el proceso de prueba, sin tocar la configuración del host. |
| Montaje FUSE denegado en el namespace de prueba. | Límite de ejecución. | Arranque por extracción incluido en el runtime, documentado y probado sin desactivar sandbox. No más intentos que abran avisos en el escritorio. |
| Perfil maestro y exportación workspace no tienen los recorridos GUI requeridos. | Bloqueos de producto. | Se prueban las operaciones de aplicación/SQLite, pero AC-06/AC-08 no se declaran aceptados como usuario final. No se ocultan detrás de esos tests. |

Las primeras pasadas gráficas conservaron sus fallos bajo `/tmp/cvforge-f9`.
Una entrada recibió una V ajena al fixture en el escritorio compartido. Se pasó a
Xvfb/Openbox temporales, con X11 explícito y autorización por cookie, para evitar
pulsaciones externas y conservar foco de ventana real. Esto permitió reproducir
la carrera BODY y corregirla; no se eliminó ni debilitó la aserción de foco.
Los programas de pantalla virtual son herramientas de aceptación extraídas fuera
del repositorio, verificadas contra el repositorio Arch; no son dependencias de
la aplicación ni se instalan en el sistema.

La primera prueba de permisos dentro de unshare conservaba capacidades del
namespace y podía escribir en una carpeta chmod 0500. No era una simulación válida
del usuario ordinario. El runner corregido prepara lo y elimina después bounding,
inheritable y ambient capabilities con setpriv; comprueba CapEff=0 tanto en el
controlador como en el main de la AppImage. El caso de permisos y crash vuelve a
pasar sin capacidades. No se falsea el destino ni se relaja su aserción.

## Disco, interrupción y registro de exportaciones

La producción escribe/fsync/verifica el PDF antes de confirmar ExportRecord. Si
el archivo falla o se cancela el selector, no crea recibo ni muestra éxito. Si
falla después el recibo, `EXPORT_FILE_WRITTEN_RECORD_FAILED` explica que existe
un archivo sin registro y que debe comprobarse el destino antes de reintentar.

La prueba nueva retiene una conexión SQLite externa con `BEGIN IMMEDIATE`, espera
a que el PDF real tenga longitud/hash correctos y mata con SIGKILL el **PID real
del main de Electron**, no solo el launcher AppImage. Al reabrir exige CV intacto,
ningún recibo para esa operación y PDF legible/reimportable. Reexporta a otro
destino y exige un único recibo nuevo, durable tras otro reinicio. El PDF anterior
no se elimina ni modifica.

Decisión para **Crash/reconciliation between successful PDF file write and durable
ExportRecord**: el archivo puede quedar sin receipt si muere el proceso en esa
ventana; no hay pérdida/corrupción del CV ni falsa afirmación de registro. El
usuario puede conservar/reimportar ese PDF o reexportar expresamente. No se añade
una exploración automática de rutas privadas ni una transacción distribuida.
La ausencia del recibo sigue siendo visible; no se inventa uno al iniciar.

Las regresiones de almacenamiento fuerzan SQLITE_FULL real con el límite de
páginas, SIGKILL dentro de transacción, fallo de migración y restauración. La
AppImage añade destino sin permisos, cancelación y cierre en la ventana crítica.
La copia de workspace se prueba por aplicación/SQLite con fallo de archivo y
restauración exacta; sigue faltando su acción GUI de exportación.

## Privacidad y límites de la comprobación

Payload extraído completo, comparación con ExportProjection y búsqueda de
centinelas en JSON/imágenes: perfil, otros CV, ocultos, borradores, historia,
alternativas lingüísticas, procedencia, datos no mapeados y originales fuente.
La foto normalizada no conserva EXIF ni píxeles fuera del recorte. Las fechas
recuperan exclusivamente la precisión representada. Retirar el payload mantiene
PDF legible, enlaces y el mismo resultado visual.

El aislamiento de red se verifica antes de arrancar: solo lo, cero rutas IPv4 y
conexión externa con ENETUNREACH. Los fixtures/corpus/recursos están instalados;
todo el ciclo usa esa red aislada, sin CDN. Las peticiones HTTP del renderer y
sus errores se recogen en evidencia. Además se revisan CSP connect-src none,
webRequest del renderer/main y sesión de render restringida a recursos locales.
No se convierte esta prueba en una certificación de todas las plataformas.

Las muestras privadas se comparan con un oráculo XML independiente, incluyendo
títulos/instituciones/periodos, puestos/empresas, miembros y orden de los grupos,
contactos, dimensiones CEFR y hash/bytes de foto, antes y después de reabrir SQLite.
Cinco URLs por muestra requieren una corrección **expresa** en revisión; no se
añade corrección automática a producción ni se afirma importación completa de
campos no soportados. Solo se publican cantidades y resultados booleanos.

Se revisan working tree, índice, git ls-files e historial relevante, y se buscan
en fuentes/documentos y blobs F9 nombres/emails/huellas de las muestras y una
huella del contenido de su foto. Los originales, bases, outputs y configuración
privada de aceptación quedan fuera de Git.


## Regresión y evidencia de entrega — 23–24/10/2026

- F1: 3/3. F2–F9 dominio/aplicación/SQLite: 170/170. UI F4–F8/pulido: 23/23.
  Aceptación GUI nueva sobre AppImage fuera del checkout: 7/7. **203 tests distintos**,
  sin sumar las repeticiones adicionales de diagnóstico/foco ni benchmarks.
- TypeScript y build PASS. AppImage inventariada: 91 archivos de código/recursos
  comparados con dist, sin fuentes TS/tests/spikes/archivos privados; recursos y
  licencias locales. Dos builds finales idénticos; [artefacto/uso](RELEASE.md).
- PDF F8: 26 casos; PDF F7: 7. Preview/export SHA-256 idénticos; Simple conserva
  todos los bytes frente a la referencia, salvo los dos relojes PDF ya existentes.
  Esto no se presenta como igualdad de hashes crudos entre generaciones distintas.
- PDFium externo Google Chrome 153.0.8010.52: Simple 1/5 páginas; Lateral 1/3/5/8.
  Capturas de primera/última página, texto seleccionable/enlaces y geometría
  contrastados además con PDF.js/Poppler.
- GUI: 1180×880, 1366×768, 1440×900 y 820×700; capturas, geometría y revisión visual
  de modales/presentación/plan/preview, sin overlap ni overflow horizontal detectado.
- Teclado: crear, errores asociados, ciclos de modal, Escape, Tab contenido,
  Subir/Bajar, plantilla, zoom/importación/exportación; el foco vuelve al invocador.
  No certificación WCAG completa ni de todos los diálogos nativos.
- SQLite: reaperturas independientes, integridad ok, claves foráneas y rollback
  en las pruebas. Errores/requests del renderer registrados como listas vacías.

## Historial y datos privados de aceptación

Los dos PDF originales están ignorados, sin staged/tracked ni nombres PDF en el
historial. No se copiaron a fixtures; los datasets y PDFs generados son sintéticos.
El escáner detectó dos **huellas de los archivos**, sin sus bytes ni contenido del
CV, en `docs/research/21-importacion-generica-ocr-y-compatibilidad.md`, heredadas de
cc2db00. Se retiraron de la versión actual con nota de redacción, sin modificar
observaciones históricas ni sustituirlas por resultados nuevos.

El commit antiguo conserva esas dos huellas: **no se declara un historial sin
rastro alguno de metadata**, ni se reescribe historia compartida sin autorización.
No equivale a que los PDF o su contenido estén versionados. El escáner actual y
los blobs nuevos de F9 quedan sin coincidencias; el informe publica solo categorías
y resultados, nunca valores privados.

[Benchmark](PERFORMANCE.md) · [Compatibilidad](COMPATIBILITY.md) ·
[Release](RELEASE.md) · [Límites y bloqueos](KNOWN_LIMITATIONS.md).


## Commits de F9

| Commit | Trabajo |
| --- | --- |
| 319adfc | Alcance/documentación inicial de aceptación. |
| cb2cc1e | Reducir validación/lecturas y staging repetidos. |
| d61c411 | Cache validado a través del worker, con regresiones de invalidación. |
| db89189 | Foco de modales, errores de campo y mensajes locales útiles. |
| 2accac4 | AppImage candidata y construcción reproducible. |
| 31c4668 | Corregir carrera de foco al habilitar controles tras cerrar formulario. |
| e0f5a8d | E2E empaquetado, corpus, privacidad y benchmark. |
| f3df49b | Retirar capacidades del entorno de aceptación y comprobarlas. |
| 492025e | Redactar huellas privadas y completar auditoría sin repetir suites válidas. |
| d69b7b7 | Exit de fallo cuando se incumple un presupuesto p95. |

El commit documental de cierre añade esta matriz, métricas finales, compatibilidad,
release/README y estado real del roadmap. La rama queda limpia, sin fusionar ni
publicar un nuevo main. **F9 = NO APROBADA** hasta resolver o revisar expresamente
los bloqueos; F10 no se inicia.
