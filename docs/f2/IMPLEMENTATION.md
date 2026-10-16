# F2 — Dominio y contrato portable inicial

Estado: en ejecución en `f2-domain-model`. F1 permanece cerrada e intacta.
No se inicia F3; no hay UI final ni repositorio SQLite de producto.

## Primer bloque

- Dominio TypeScript en `src/domain`, independiente de Electron, React, SQLite,
  PDF.js, sistema de archivos y proveedores de traducción. Zod valida fronteras
  sin coerción, rellenos silenciosos ni eliminación de claves desconocidas.
- Perfil y CV materializados con IDs propios, contactos, configuración, áreas MVP,
  orden y visibilidad separados. Procedencia de perfil informativa, sin dependencia
  para editar o abrir el CV. Remapeo por ID, no por índice.
- Fechas de calendario de precisión año/mes/día, límites por precisión, final solo,
  ongoing y ambigüedad explícita. Texto enriquecido semántico, sin HTML/CSS libre.
- Schemas iniciales A/B/C y memoria de aprobaciones; operaciones sensibles,
  checkpoints, proyección PDF y formato portable pendientes del siguiente bloque.

Comprobación del bloque: 5 tests de dominio PASS, TypeScript PASS, 3 tests F1 PASS.

## Segundo bloque

- Traducciones sensibles con original/contexto/versiones, aprobaciones privadas,
  estado de revisión derivado y modos original/traducción/traducción + original.
  Cambiar original o contexto conserva la aprobación, pero la identifica obsoleta.
  Un texto importado solo visible conserva sus roles sin fabricar original ni
  aprobación. No se implementa un traductor.
- Checkpoints puros en memoria, con retención fijada antes de traducción, y
  restauración a una nueva revisión; sin biblioteca ni persistencia F3.
- Contratos separados ExportProjection/ExportPayload con lista permitida:
  secciones/entradas incluidas, fechas reducidas y variantes realmente mostradas.
  Preparar una foto exige un puerto explícito de normalización; nunca se copia
  el original privado al payload por defecto. No se toca el motor PDF de F1.
- La memoria transferida del perfil se limita a las aprobaciones/contextos de los
  campos seleccionados. No se enlaza con el perfil mutable.

Comprobación del bloque: 10 tests de dominio PASS, TypeScript PASS, 3 tests F1 PASS.

## Tercer bloque

- Contrato privado versionado de CV y workspace, assets y revisiones necesarias.
  Exportar un CV selecciona únicamente su cierre de dependencias, no el perfil
  ni otros CV del workspace. El contenido oculto sí pertenece al proyecto.
- `.cvproj` v1: ZIP STORE, manifest.json, snapshot.json y assets por SHA-256.
  Manifiesto y modelo tienen versiones separadas. Comprobación de CRC, hashes,
  nombres/headers locales y directorio central, límites, duplicados y symlinks.
  Los archivos nunca se extraen al sistema de archivos para validarlos.
- JSON UTF-8 estricto con claves duplicadas y peligrosas rechazadas, profundidad
  acotada y sin correcciones de datos. Un formato antiguo/desconocido se rechaza
  sin reescritura: no existe una migración real publicada que podamos inventar.
- Se verifican bytes/hash/dimensiones de activos; PNG RGB/RGBA de 8 bits sin
  entrelazado con stream completo comprobado. ExportPayload admite solo PNG
  preparado sin chunks de metadatos, con hash/dimensiones propios.

Comprobación del bloque: 17 tests PASS, TypeScript PASS, 3 tests F1 PASS.
Queda la revisión final de invariantes y documentación del contrato inicial.
