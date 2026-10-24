# Recorridos GUI de perfil y copia de biblioteca

Corrección de los bloqueos AC-06/AC-08 detectados en el primer cierre F9. No introduce tipos de sección, plantillas ni formatos nuevos. El resultado inicial NO APROBADA se conserva en ACCEPTANCE.md.

## Perfil maestro

Biblioteca → **Perfil maestro**. Si todavía no existe, pide un nombre para crearlo explícitamente. Si ya existe, abre su contenido confirmado. Es información reutilizable: no tiene plantilla, presentación, documentLocale ni inclusión de secciones/entradas en PDF. La pantalla no ofrece preview, cambio de idioma de CV ni controles de ocultar propios de un documento.

Las ocho áreas usan los mismos formularios que el CV: datos personales, educación, experiencia, habilidades/grupos, idiomas/CEFR, certificaciones, proyectos y personalizadas. La capa compartida `ContentForm` contiene la entidad real; no transforma un perfil en un CvDocument ficticio. Los contratos anteriores de edición de CV e importación mantienen sus adaptadores. Los textos nuevos usan el idioma de edición de la sesión (ES/EN, inicialmente el de interfaz); esto no añade un idioma de documento al perfil ni traduce contenido existente.

Confirmar valida y guarda una revisión anterior, contenido y resolución del borrador con la transacción durable existente. Cancelar elimina el borrador, incluidas modificaciones de modales hijos. Cerrar mantiene trabajo sin confirmar como recuperación; tras SIGKILL se puede recuperar o descartar explícitamente. **Revisiones del perfil** permite restaurar un estado previo como una revisión nueva, conservando el sustituido. La foto usa assets/blobs existentes y conserva la anterior al cancelar una sustitución.

## Crear CV desde perfil

Perfil maestro → **Crear CV desde perfil** → nombre/idioma del nuevo CV → selección → **Crear CV independiente**.

Se seleccionan campos personales, contactos, direcciones, foto, secciones y entradas. El nombre para mostrar sigue siendo obligatorio; no se inventa uno si falta. La selección decide qué datos copiar; los controles de inclusión del CV siguen siendo una decisión de ese documento. Elegir el idioma no traduce el perfil.

La aplicación filtra una copia y reutiliza `createCvFromProfile`: identidades locales nuevas para CV/secciones/entradas/grupos/campos materializados y `sourceRef` con perfil, entrada y revisión de origen. No cambia el perfil ni mantiene referencias vivas. Los assets inmutables pueden compartir bytes/hash; editar o sustituir una foto no sincroniza documentos. La selección se valida contra la revisión actual y crear el CV es una operación consistente. Cancelar el selector no crea nada.

## Copia completa de biblioteca

Biblioteca → **Exportar biblioteca (.cvproj)** → diálogo nativo de guardado.

Reutiliza `LibraryService.exportCvproj()` sin CV concreto y `writeProjectFile`, sin otro codec. Scope `workspace`, formato v1. Incluye exactamente lo declarado por el contrato: perfil, todos los CV y su orden, configuración de workspace/CV, memoria sensible, historial/checkpoints, plantillas y assets/bytes necesarios. No añade ExportRecord al manifiesto existente ni modifica el formato para incluir preferencias visuales temporales del editor.

Los borradores pendientes se deben recuperar/confirmar o descartar antes de exportar. El API también rechaza un formulario abierto o recuperación pendiente. No se excluyen silenciosamente cambios en curso. El archivo es una copia privada de proyecto; no es un PDF de distribución.

La GUI anuncia éxito solamente tras completar la escritura atómica, fsync/rename y verificación de archivo del adaptador. Cancelar el selector no es un error. Un fallo de permisos/disco no anuncia exportación completada; al iniciar una nueva copia se limpia el aviso de éxito anterior.

## Restaurar

Biblioteca vacía → Importar archivo → seleccionar `.cvproj` → revisar contenido de workspace → **Confirmar restauración**. Se valida el mismo manifiesto/codec y se restaura en una transacción. Una biblioteca ocupada rechaza el modo vacío. El modo de sustitución preexistente requiere confirmación expresa y una copia recuperable previa; no se sobrescribe silenciosamente.

## Evidencia específica

Pruebas de aplicación `tests/f9-profile.test.ts`: todas las áreas, ausencia de propiedades de CV, Confirmar/Cancelar, reapertura/recuperación, selección, identidades/procedencia y grupos.

`tests/ui/f9-blockers.spec.ts`, ejecutada sobre la AppImage candidata 0.1.0: **3/3 PASS**. Perfil creado y rellenado por GUI en las ocho áreas, CV A/B con campos/entradas seleccionados, ediciones independientes y reapertura; foto, pérdida abrupta y restauración de revisión; backup con dos CV/perfil/assets/historial, Cancelar selector, EACCES real sin capacidades efectivas, restauración en otra biblioteca, reapertura y comparación exacta de snapshot/blobs. El destino del diálogo nativo se controla en automatización; el codec, escritura y almacenamiento son reales.

Evidencia local: `/tmp/cvforge-f9/remediation/candidate-blockers-report.json`, capturas/recibos en `/tmp/cvforge-f9/remediation/candidate-blockers-ui`. No contiene archivos privados: todos los datos son sintéticos. La aceptación completa F9 exige además el benchmark oficial y todas las regresiones posteriores.
