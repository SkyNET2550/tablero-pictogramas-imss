# Publicación en GitHub y Vercel

## Objetivo

Publicar el generador de tableros de comunicación alternativa por pictogramas para consulta en línea mediante GitHub y Vercel.

## Estado preparado

- El proyecto puede versionarse con Git.
- Se excluyen carpetas temporales, respaldos, cachés, salidas y la carpeta `Guardados`.
- Se agregó configuración básica de Vercel.
- La validación configurada para despliegue ejecuta `npm test`.

## Paso 1. Crear repositorio en GitHub

1. Entrar a https://github.com/new
2. Crear un repositorio nuevo, por ejemplo:
   - Nombre: `tablerio-pictogramas-imss`
   - Visibilidad: privada o pública, según convenga institucionalmente.
3. No inicializar con README, `.gitignore` o licencia, porque el proyecto ya los contiene.

## Paso 2. Conectar el repositorio local con GitHub

En una terminal dentro de:

`C:\Users\Rosemberg\Documents\PROYECTOS IA\TABLERIO DE PICTOGRAMAS\arasaac-tableros-html`

ejecutar:

```powershell
git remote add origin https://github.com/USUARIO/TABLERIO-PICTOGRAMAS-IMSS.git
git branch -M main
git push -u origin main
```

Sustituir `USUARIO/TABLERIO-PICTOGRAMAS-IMSS` por la ruta real del repositorio.

## Paso 3. Publicar en Vercel

Opción recomendada:

1. Entrar a https://vercel.com
2. Iniciar sesión.
3. Seleccionar `Add New...` > `Project`.
4. Importar el repositorio de GitHub.
5. Mantener:
   - Framework Preset: `Other`
   - Build Command: `npm test`
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

## Nota importante sobre funciones locales

Algunas funciones fueron diseñadas para ejecución local en Windows, especialmente:

- Cuadro nativo de Windows para guardar o abrir archivos.
- Guardado directo en la carpeta local `Guardados`.
- Exportación local mediante scripts del equipo.

En Vercel esas funciones deberán operar como descarga del navegador o como almacenamiento en nube. La interfaz web y búsqueda pueden publicarse, pero la persistencia local de Windows no existe dentro de Vercel.

## Recomendación de siguiente fase

Para una versión completamente institucional en línea:

1. Sustituir los cuadros nativos de Windows por descargas web.
2. Guardar tableros editables en una base de datos o almacenamiento institucional.
3. Convertir las rutas `/api` a funciones serverless compatibles con Vercel.
4. Definir si el repositorio será público, privado o interno.
