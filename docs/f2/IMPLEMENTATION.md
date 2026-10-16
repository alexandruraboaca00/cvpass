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
