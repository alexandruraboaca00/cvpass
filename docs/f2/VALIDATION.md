# F2 — Resultado de aceptación técnica

**16 de octubre de 2026 · F2 = APROBADA técnicamente en `f2-domain-model`.**
Pendiente de revisión/aprobación del usuario para fusionar. F3 no iniciada.
F1 sigue cerrada; no se modificó ninguno de sus archivos o evidencias.

## Matriz de criterios

| Criterio F2 | Estado | Evidencia |
| --- | --- | --- |
| Dominio independiente de UI/SQLite/Electron/PDF | PASS | Importaciones limitadas a módulos de dominio y Zod; adaptadores separados; test de frontera |
| Perfil maestro y CV independientes | PASS | Creación/materialización con nuevos IDs, modificación bidireccional sin propagación y procedencia informativa |
| Ocho áreas MVP | PASS | Datos personales y entradas educación/trabajo/habilidades/idiomas/certificación/proyecto/custom, fixture completa y round-trip |
| Orden, pertenencia e inclusión | PASS | Permutaciones exactas, mapas/IDs coherentes, grupos de habilidades sin segundo orden, ocultar/mostrar sin borrar |
| Fechas parciales y periodos | PASS | Año/mes/día, bisiestos, final sola, ongoing sin fin, inversión rechazada y ambigüedad conservada |
| Errores concretos y texto semántico | PASS | Rutas/códigos, nombres/títulos no blancos, protocolos permitidos, spans válidos, sin coerción ni descarte silencioso |
| CEFR parcial | PASS | Cinco dimensiones; solo interacción oral B1 y el resto null sobreviven al paquete |
| Narrativa A y literales B | PASS | Un solo texto activo/idioma, spans protegidos en simple/enriquecido, sin mapa perpetuo de variantes |
| Sensibles C | PASS | Original/contexto, aprobación persistente, estado derivado, cambio obsoleto detectable, orden traducción + original |
| Valor importado solo visible | PASS | Original desconocido y sin aprobación inventada; roles visibles conservados |
| Revisiones relevantes | PASS | Checkpoint independiente fijado antes de traducción, restore a revisión nueva; propietarios/conflictos validados |
| `.cvproj` CV y workspace | PASS | ZIP estándar con manifiesto/modelo versionados y bytes; round-trip exacto de estado y dependencias, sin datos ajenos al alcance |
| Activos y referencias | PASS | CRC/hash/tamaño/dimensiones, recursos de plantilla y assets exclusivos de estados históricos; huérfanos/ausentes rechazados |
| Corrupción, versiones y límites | PASS | Versiones 0/futuras incompatibles, hashes/ZIP malformados, claves JSON duplicadas, rutas/symlinks/solapes y límites rechazados sin modificar entrada |
| Frontera de migración | PASS | v1 revalidada; copia exacta de entrada y pasos explícitos ascendentes con fixture v0 sintética; lector sin migración automática |
| ExportProjection / ExportPayload privados separados | PASS | Lista permitida visible, precisión reducida, sin IDs privados, ocultos, historial, originales no impresos o blobs ajenos; PNG preparado obligatorio |
| Tests / TypeScript / build | PASS | 30/30 tests F2, cero omitidos; tsc noEmit y build con declaraciones pasan |
| Regresión F1 | PASS | 3/3 tests después de cada bloque; ejecución final nueva sin red con dos procesos; fuentes/evidencia y hash del ASAR intactos |

Evidencia automática: [validation.json](validation.json).
Implementación/decisiones/deuda: [IMPLEMENTATION.md](IMPLEMENTATION.md).
Formato y límites exactos: [CVPROJ.md](CVPROJ.md).

## Comandos ejecutados

```bash
npm test
npm run typecheck
npm run build
CVFORGE_F1_OUTPUT=/tmp/cvforge-f1-closure-final-20261016 npm run test:f1
CVFORGE_F1_OUTPUT=/tmp/cvforge-f2-f1-regression \
  unshare --user --map-current-user --net node spikes/f1/offline-check.cjs
```

La regresión final inicia el paquete F1 ya cerrado, crea/lee SQLite, genera y
visualiza los PDF, termina y reabre en otro proceso, y ejecuta sus tres tests.
No hay rutas ni interfaces de red activas; TCP externo devuelve ENETUNREACH.
Se verificó que el ASAR conserva el hash registrado en el cierre F1. No se
recompiló ni editó F1. Main y origin/main conservan el commit publicado
`4c19c98a23d04be6f95f9469c5c191ac8beeb640`.

Los tests F2 son de dominio/contratos en Node, con datos sintéticos y sin servidor,
servicios cloud, proveedor de traducción, SQLite o navegador. Los dos nuevos
paquetes de producción (Zod/fflate) y las herramientas de F2 están fijados por
lockfile; `npm audit` raíz devuelve cero vulnerabilidades. Las incidencias previas
F1 no se intentaron resolver ni se usaron como condición para ampliar F2.

## Incidencias encontradas y resueltas dentro de F2

- El primer control global de IDs incluía una referencia compartida a plantilla.
  Se separaron IDs propios y referencias externas de catálogo/plantilla/procedencia;
  se verifican también propietarios en snapshots históricos.
- La revisión detectó la necesidad de transferir solo aprobaciones del contenido
  elegido, distinguir límites de CV/workspace y preservar fotos usadas únicamente
  por checkpoints. Los casos tienen tests de regresión de dominio.
- TypeScript 7 no ofrece la antigua API JS de parser del compilador en este paquete;
  el test de frontera se limita a las importaciones estáticas del código propio y
  rechaza acceso dinámico a módulos. La compilación estricta completa sí se ejecuta.
- Se mantiene el rechazo explícito de formatos/representaciones no soportadas;
  no se añadieron defaults para hacer pasar datos inválidos.

Sin FAIL arquitectónicos pendientes en el alcance F2. El formato inicial STORE,
las representaciones de imagen y los componentes de fases posteriores tienen
los límites documentados; no se anuncian como funciones terminadas de producto.
La rama no está fusionada ni se autoriza F3 por este informe.
