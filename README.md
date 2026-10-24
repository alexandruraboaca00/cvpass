# CVForge

CVForge es una aplicación local para crear, editar y guardar CV. Incluye ocho
áreas, las plantillas originales **Simple** y **Lateral**, preview PDF y proyectos
editables `.cvproj`. La interfaz está disponible en español e inglés.

Versión candidata **0.1.0**, Linux x86_64. F1–F8 están aprobadas e integradas;
**F9 no está aprobada**, y su rama permanece sin fusionar. Faltan recorridos GUI
del perfil/copia de workspace y no se cumple el objetivo de rendimiento de Confirmar.
Resultado real y evidencia:
[ACCEPTANCE](docs/f9/ACCEPTANCE.md).

## Instalar y abrir

El artefacto local se genera en `out/f9/CVForge-0.1.0-x86_64.AppImage`.
Guárdalo en una carpeta tuya, permite ejecutarlo como programa en sus propiedades
y ábrelo con doble clic. Desde una terminal:

```sh
chmod +x CVForge-0.1.0-x86_64.AppImage
./CVForge-0.1.0-x86_64.AppImage
```

La AppImage incluye Electron y el runtime; el usuario no necesita Node, npm,
un servidor de desarrollo ni VS Code. Requiere un escritorio Linux con las
bibliotecas de sistema necesarias para Electron. No se valida universalidad
de distribuciones ni otras plataformas.

Si falla el montaje FUSE, el runtime permite ejecutar sin montaje:

```sh
APPIMAGE_EXTRACT_AND_RUN=1 ./CVForge-0.1.0-x86_64.AppImage
```

La [guía de release](docs/f9/RELEASE.md) identifica el artefacto probado,
tamaño, SHA-256, entorno y límites. No hay actualizaciones automáticas.

## Crear y editar

1. En **Tu biblioteca**, pulsa **Crear CV**, introduce un nombre para identificarlo
   y el nombre que debe aparecer en el documento.
2. Abre **Editar datos personales** o añade educación, experiencia, habilidades,
   idiomas, certificaciones, proyectos y varias secciones personalizadas.
3. **Confirmar** valida y guarda localmente. **Cancelar** descarta el formulario,
   incluidos cambios de modales hijos. No es necesario exportar para conservar una
   edición confirmada.
4. Ocultar conserva los datos del proyecto y los excluye del PDF. Contraer cambia
   solo la vista del editor. Subir/Bajar permite ordenar con teclado; eliminar
   requiere confirmación.

Los CV son independientes. Tras un cierre inesperado se puede recuperar o descartar
un borrador; la exportación utiliza siempre el contenido confirmado.

## Importar

Pulsa **Importar archivo**, selecciona el archivo y revisa antes de confirmar.
Importar crea una copia; Cancelar deja la biblioteca intacta.

- `.cvproj` CV recupera el proyecto completo de ese documento.
- `.cvproj` workspace restaura la biblioteca de su alcance declarado. Sustituir una
  biblioteca existente exige confirmación explícita y backup previo.
- PDF CVForge con payload compatible recupera solo la versión exportada.
- PDF/XML Europass compatibles recuperan el subconjunto estructurado probado;
  el informe identifica campos parciales y datos que requieren revisión.

PDF genérico, escaneado o sin estructura compatible todavía no se importa como CV
editable. No hay OCR. [Matriz de compatibilidad](docs/f9/COMPATIBILITY.md).

## Presentación y exportación

**Presentación** permite elegir Simple/Lateral y ajustar densidad, acento, fechas,
numeración y guía CEFR. **Vista previa PDF** usa PDF.js, con páginas, zoom y ajuste
al ancho. **Exportar PDF** solicita destino y guarda exactamente esos bytes; el
registro de exportaciones permanece en la biblioteca.

**Exportar proyecto (.cvproj)** guarda el CV completo: datos ocultos, memoria
sensible, activos originales e historial necesario. Resuelve primero formularios y
borradores pendientes. Es el formato para continuar trabajando o transferir un CV.

El PDF solo recupera lo visible exportado: no ocultos, borradores ni historial.
Retirar su payload deja un PDF normal y válido. Los recibos operativos locales no
viajan en `.cvproj`.

## Idiomas

**Idioma de interfaz** cambia etiquetas. **Preparar cambio de idioma** ofrece un
plan revisable para el contenido del CV y conserva un checkpoint previo. Nombres,
instituciones y contactos permanecen; los términos sensibles permiten original,
traducción o ambos y revisión de aprobaciones obsoletas.

El flujo actual es **manual y local**. No hay proveedor automático de producción
instalado. Seleccionar English no traduce automáticamente textos.

## Datos, copias y privacidad

La biblioteca vive fuera del repositorio, en `userData` de Electron: normalmente
`~/.config/CVForge/library/library.sqlite3`, o bajo `$XDG_CONFIG_HOME/CVForge`.
Allí se conservan SQLite, activos y copias internas. Mover la AppImage no mueve la
biblioteca. Para copiar archivos locales, cierra la aplicación y conserva el
**directorio completo**; copiar solo SQLite mientras está abierta no es un backup
consistente. `.cvproj` conserva el proyecto editable de su alcance declarado.

Los flujos actuales funcionan sin red ni cuenta. No se envían CV, fotos,
traducciones o importaciones a servicios externos; no hay telemetría ni CDN.
El PDF contiene solo datos visibles y recursos utilizados. El proyecto completo
sí conserva sus datos privados y originales de importación.

La GUI actual no ofrece un editor completo del perfil maestro ni exportación
de workspace; esos límites y su efecto en F9 constan en
[KNOWN_LIMITATIONS](docs/f9/KNOWN_LIMITATIONS.md).

## Desarrollo y validación

```sh
npm ci
npm run setup:electron
npm test
npm run typecheck
npm run build
npm start
```

Las pruebas gráficas requieren escritorio Linux y se ejecutan secuencialmente.
Los procedimientos de aceptación, benchmark, empaquetado y aislamiento de red
figuran en `docs/f9`. Los fixtures contienen solo datos sintéticos propios.

[Requisitos](docs/REQUIREMENTS.md) · [Arquitectura](docs/ARCHITECTURE.md) ·
[Modelo](docs/DATA_MODEL.md) · [Roadmap](docs/ROADMAP.md).
