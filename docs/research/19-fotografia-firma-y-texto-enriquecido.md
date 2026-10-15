# 19 — Fotografía, firma y texto con formato

## 1. Hechos observados

Pruebas REA con imágenes sintéticas propias, sin firmas ni fotografías reales del usuario.

| Evidencia | Cobertura |
| --- | --- |
| `ev_0e824db34b3887d37265b38f2c412f52f45fe33ffa83265e43a48c37642614cf` | Firma PNG, formato rechazado, tamaño excesivo y exportación. La salida terminal se truncó al final. |
| `ev_e2397908f7dcd21c9d444b2c9033f451e5ff4838607be1bc0cff9211c3086ea8` | Fotografía PNG, sustitución de firma por JPG, exportación/reimportación y viñetas. |
| `ev_c803bd859e0e4135df83028057fd01a5c8459dfd7e512667005d47841b96f3e7` | Lista limpia, retirada de foto y firma, reimportación sin imágenes y permisos múltiples. |
| `ev_c5beaffcbad318fe20dc7b78d1c4b845b588fb19f223c26742d5424ea7423201` | Sustitución limpia de descripción, negrita/cursiva y reimportación. |

### Fotografía y firma

| Aspecto | Fotografía | Firma |
| --- | --- | --- |
| Entrada | Edit profile picture abre un diálogo con Select file y zona de arrastre. | Upload dentro de Closing statement abre un diálogo Signature image. |
| Formatos declarados | PNG, JPG | PNG, JPG |
| Tamaño declarado | 20 MB; recomienda dimensiones menores de 1024 × 1024 para calidad ideal. | 1 MB |
| Pruebas válidas | PNG sintético guardado y recuperado al importar. | PNG y luego JPG sintéticos guardados y recuperados al importar. |
| Retirada | Delete profile picture solicita una confirmación adicional. | Delete en el formulario de declaración; después Save. |

La firma rechazó un TXT con un error de formato y un PNG de más de 1 MB con error de tamaño. El archivo grande era una imagen sintética válida con relleno añadido: la prueba mide el límite de tamaño, no un máximo de resolución. Al seleccionar después el PNG pequeño, los avisos anteriores todavía estaban visibles, pero la imagen pudo confirmarse y guardarse. No se interpreta cada aviso persistente como un nuevo rechazo del archivo válido.

La fotografía y la firma reaparecen al reimportar `foto-y-firma.pdf`. Tras retirar ambas y exportar `sin-imagenes.pdf`, la siguiente importación no expone imágenes data URI y el XML no contiene sus adjuntos.

La firma está en `CandidateProfile/Attachment`, con `FileType=photo` e `Instructions=Signature`; no en un nodo llamado Signature. El dato se codifica como base64 de una data URI que a su vez contiene base64 de la imagen. La firma PNG inicial conserva los bytes del archivo sintético en el XML. No se debe identificar el propósito del adjunto solo por FileType. La foto pasa por el tratamiento de imagen del editor y no se presupone identidad binaria con la subida original.

La firma se ve en las páginas finales renderizadas de Classic y Accent. Es una imagen visual; no se ha observado una firma digital criptográfica del PDF.

### Texto enriquecido

Se sustituyó la descripción de Projects usando selección de texto y entrada de teclado, sin modificar código ni estado interno del sitio. El texto nuevo empieza exactamente por NEGRITA_REA y CURSIVA_REA, sin el texto de ejemplo que había quedado en las primeras pruebas. Los elementos strong y em sobreviven al guardado, XML y reimportación.

Una lista con dos viñetas se guardó como dos elementos `li` con `data-list="bullet"`, dentro de `ol`. La prueba corregida conserva exactamente VIÑETA_REA_1 y VIÑETA_REA_2. Ese detalle de serialización impide deducir el estilo visual de lista solo por el contenedor ol.

En las pruebas iniciales, abrir o usar la barra con el editor vacío dejó texto de ejemplo junto al texto introducido. Las pruebas corregidas seleccionan/sustituyen el contenido y verifican el valor antes de guardar. No se atribuye el problema a todos los usos del editor ni se da por demostrada su causa interna.

## 2. Inferencias y criterios propios

Foto, firma y contenido con formato necesitan datos independientes y una exportación que los recupere sin perder su función. La firma gráfica debe seguir diferenciada de mecanismos de firma digital, si se añadieran en el futuro.

Para nuestra herramienta conviene que el texto de ayuda sea un placeholder y no parte del contenido editable, y que las listas se representen con significado propio en el modelo. La inspección describe el formato de compatibilidad observado; no propone copiar el editor o sus recursos.

## 3. Cuestiones pendientes

No se han medido todos los límites de resolución, orientación EXIF, transparencia, SVG, arrastre real ni umbrales exactos en bytes. Tampoco se ha validado cada herramienta de texto, pegado desde Word o todas las combinaciones de formato. PNG/JPG, dos estilos y viñetas sí tienen evidencia de recuperación.
