# Auditoría web — 22 de junio de 2026

## Estado

La aplicación funciona desde una única dirección local: `http://127.0.0.1:4173/`.

## Estructura funcional

- Búsqueda semántica o temática: localiza tableros relacionados con conceptos cotidianos.
- Búsqueda específica: localiza pictogramas en el acervo local y proveedores conectados.
- Constructor: permite crear, ordenar, sustituir y completar tableros tamaño carta.
- Tableros temáticos y predefinidos: presentan páginas secuenciales editables e imprimibles.
- Servicios API: permite verificar y vincular proveedores.

## Archivos y almacenamiento

- La carpeta predeterminada es `Guardados`, ubicada en la raíz del proyecto.
- Los cuadros nativos de abrir y guardar se inician en esa carpeta.
- Las exportaciones disponibles son PDF, imagen y DOCX editable.
- Los tableros editables se abren desde archivos JSON conservados en `Guardados`.

## Identidad y uso

- Todas las páginas de tableros incluyen el encabezado institucional.
- La pantalla principal y los tableros incluyen la declaración de uso institucional y atribución de repositorios.

## Verificación

- 48 pruebas automatizadas aprobadas.
- Sintaxis del servidor, editor, buscadores y generador PDF verificada.
- Exportación PDF real comprobada.
