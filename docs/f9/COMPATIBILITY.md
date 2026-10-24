# F9 — Compatibilidad real

Versión MVP 0.1.0 aprobada por el usuario, pendiente de integración; véase [control previo](MERGE_VALIDATION.md). La matriz se refiere a los contratos y corpus probados;
no promete compatibilidad universal con Europass ni con cualquier PDF.

| Entrada | Estado | Alcance |
| --- | --- | --- |
| `.cvproj` v1, CV | Soportado | Proyecto completo, ocultos, memoria C, recursos/activos e historial necesario. Copia con IDs nuevos; la revisión de importación añade procedencia/revisión cuando corresponde. |
| `.cvproj` v1, workspace | Soportado por GUI | Biblioteca/perfil/CV y dependencias declaradas. Biblioteca vacía o sustitución explícita con backup previo; sin fusionar por nombre. Exportación desde Biblioteca con diálogo de archivo; resolver antes los borradores. |
| PDF CVForge payload v1, Simple/Lateral v1 | Soportado | Solo distribución visible resuelta: campos, fechas, variantes, orden, imagen y configuración efectiva; revisión antes de crear copia. |
| PDF CVForge sin payload | No soportado para reedición | Sigue siendo PDF válido y legible; se informa ausencia de estructura, sin inventar un CV. |
| PDF Europass Candidate/HR-XML 4.0 probado | Parcial | Rutas MVP compatibles; nombre de adjunto libre y selección expresa de candidatos distintos. Otros campos/diseño quedan informados y privados. |
| XML Europass del mismo contexto | Parcial | UTF-8, UTF-16 LE/BE y namespaces por URI; misma adaptación y límites. |
| PDF genérico de texto | Fase futura F11 | Sin extracción por texto/layout en 0.1.0. |
| PDF escaneado | Fase futura F12 | Sin OCR. |
| PDF cifrado | No soportado | Error controlado; no se elude el cifrado. |
| Versión propia futura/incompatible | No soportado | Rechazo antes de confirmar, sin reescritura destructiva. |
| Corrupto/hash inválido/XML inválido | Rechazado | Informe/error útil, sin CV parcialmente confirmado. |
| Campo Europass desconocido | Parcial | Informe/fuente privada conservados; no se anuncia como editable ni pasa al payload. |

Las dos muestras privadas vuelven a recuperar 8 educaciones, 3 experiencias,
18 habilidades/2 grupos, 2 lenguas maternas y una extranjera con cinco B2,
contactos, enlaces y foto. Se comparan valores con un oráculo XML independiente,
no solo cantidades, y se reabre SQLite. Ambas son parciales. Cinco URLs por muestra
requieren revisión explícita de protocolo; el producto no las corrige automáticamente.
No se publican nombres, valores, hashes ni archivos privados.

## Seguridad y límites

Entrada normal 50 MiB; workspace 200 MiB con límites del codec; JSON/XML de control
10 MiB. XML sin DTD/entidades externas ni red/ejecución; profundidad 64. PDF: hasta
100 adjuntos, 10 MiB por adjunto y 100 MiB acumulados. ZIP con inventario/hash,
rutas seguras y rechazo de enlaces o duplicados ambiguos. No se trunca al excederlos.

PNG/JPEG dentro del subconjunto verificado; PNG RGB/RGBA de 8 bits sin entrelazado.
Los hashes verifican integridad, no autoría ni coincidencia con páginas editadas
externamente. La revisión de importación permanece.
