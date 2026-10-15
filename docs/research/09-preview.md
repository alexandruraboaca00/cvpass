# 09 — Preview your CV

## 1. Hechos observados

Prueba activa con REA en perfil temporal, 15 de octubre de 2026. Tras crear y guardar una entrada laboral ficticia y escribir el nombre del CV, REA pulsó Preview your CV. Evidencia: ev_47a7000b1f1b11e5f703fbf988500c24ca2ed0c935196264893d0fe1d5214346.

En viewport 913 × 1200, la edición da paso a Back to edit, Customise your CV con cinco ajustes y una representación de página titulada Preview your CV. La URL permanece igual. El contenido laboral guardado se refleja en la representación accesible de imagen. La captura visual de ev_fcaf504711a2da3311acc8f990456a4179eb31b31eb4b12ab247db4a170e9d7a confirma una página con ese puesto y empleador.

Al entrar, se exponen Download y Save and exit, este último deshabilitado. En una prueba con nombre y apellido ficticios guardados, Download permaneció disponible hasta pulsarlo: ev_163ecd2111692557a8fadf3e0df2a9111c17d69d034e43b075c8e1440f211aa4. No se inició sesión.

En viewport 1280 × 720, una captura inicial mostró ajustes y preview junto a contenido del editor en accesibilidad: ev_3e58274cca89194ce13db96c914f8eb76b275b43daf798eff48b6735bd0a06e4. Su disposición visual completa no se ha validado; no equiparar presencia en el árbol con visibilidad en píxeles.

## 2. Inferencias

La transición con URL constante es compatible con alternar estados de edición y preview dentro de una pantalla. La vista parece adaptarse al ancho disponible. No demuestra un sistema de rutas concreto ni cómo se genera la imagen.

La representación del contenido confirmado respalda separar edición y renderizado en nuestra aplicación; no se ha probado aquí si un borrador de formulario sin confirmar también podría llegar a preview.

## 3. Cuestiones pendientes

Probar Back to edit, scroll/páginas múltiples, actualización durante la escritura, secciones ocultas, guías de idiomas y exportación con contenido largo. La navegación a preview está ejecutada; el retorno y persistencia de ajustes todavía no están validados.
