# Publicación en GitHub y Vercel

## Objetivo

Publicar el generador de tableros de comunicación alternativa por pictogramas para consulta en línea mediante GitHub y Vercel.

## Estado preparado

- El proyecto puede versionarse con Git.
- Se excluyen carpetas temporales, respaldos, cachés, salidas y la carpeta `Guardados`.
- Vercel publica la aplicación estática y las funciones de `api/`.
- La validación de despliegue ejecuta `npm run validate`.
- GitHub Actions ejecuta validación, pruebas de navegador y auditoría de dependencias.

## Paso 1. Crear repositorio en GitHub

1. Entrar a https://github.com/new
2. Crear un repositorio nuevo, por ejemplo:
   - Nombre: `tablero-pictogramas-imss`
   - Visibilidad: privada o pública, según convenga institucionalmente.
3. No inicializar con README, `.gitignore` o licencia, porque el proyecto ya los contiene.

## Paso 2. Conectar el repositorio local con GitHub

En una terminal dentro de:

`C:\Users\Rosemberg\Documents\PROYECTOS IA\TABLERIO DE PICTOGRAMAS\arasaac-tableros-html`

ejecutar:

```powershell
git remote add origin https://github.com/USUARIO/tablero-pictogramas-imss.git
git branch -M main
git push -u origin main
```

Sustituir `USUARIO/tablero-pictogramas-imss` por la ruta real del repositorio.

## Paso 3. Publicar en Vercel

Opción recomendada:

1. Entrar a https://vercel.com
2. Iniciar sesión.
3. Seleccionar `Add New...` > `Project`.
4. Importar el repositorio de GitHub.
5. Mantener:
   - Framework Preset: `Other`
   - Build Command: `npm run validate`
   - Output Directory: `.`
6. Deploy.

## Paso 4. Variables de entorno

Si se usan proveedores externos con credenciales, agregarlas en Vercel > Project Settings > Environment Variables:

- `GLOBAL_SYMBOLS_API_KEY`
- `GLOBAL_SYMBOLS_BASE_URL`
- `GLOBAL_SYMBOLS_AUTH_MODE`
- `OPENSYMBOLS_TOKEN`
- `OPENSYMBOLS_SECRET`
- `OPENSYMBOLS_USERNAME`
- `SYMBOTALK_API_KEY`
- `SYMBOTALK_USERNAME`
- `ENABLE_MONITORING=true`, si se autoriza el registro de diagnósticos mínimos.
- `ENABLE_CLOUD_STORAGE=true` y `BLOB_READ_WRITE_TOKEN`, únicamente después de crear un almacén Blob privado y aprobar la política de datos.

## Nota importante sobre funciones locales

Algunas funciones fueron diseñadas para ejecución local en Windows, especialmente:

- Cuadro nativo de Windows para guardar o abrir archivos.
- Guardado directo en la carpeta local `Guardados`.
- Exportación local mediante scripts del equipo.

En Vercel, guardar y abrir utilizan el navegador e IndexedDB. PDF recurre a impresión, Word a un documento HTML editable y la imagen a SVG cuando el exportador del servidor no está disponible. Los diálogos nativos de Windows se mantienen exclusivamente en la edición local.

## Recomendación de siguiente fase

Para una versión completamente institucional en línea:

1. Ejecutar `npm run release:check` y atender los bloqueos.
2. Validar los ocho pictogramas pendientes.
3. Completar pruebas con lectores de pantalla y personas usuarias.
4. Obtener autorización jurídica e institucional.
5. Activar almacenamiento privado sólo cuando exista una política de datos aprobada.
