# Generador de tableros ARASAAC

> Regla de desarrollo: después de cada modificación se debe recargar y verificar la aplicación en el navegador lateral o en `http://127.0.0.1:4173/`.

Aplicación local y web para crear tableros de comunicación en formato carta vertical y cuadrícula de 4 × 4. Incluye 88 pictogramas locales, consulta ARASAAC y ofrece integración opcional con proveedores externos.

## Uso rápido

Requiere Node.js 20 o posterior.

```powershell
npm run dev
```

Abra `http://127.0.0.1:4173`. Use **Imprimir / Guardar PDF** para imprimir todos los tableros o seleccionar páginas concretas.

También puede ejecutar `run_app.bat` para iniciar el servidor y abrir la aplicación en el navegador predeterminado.

El servidor escucha únicamente en `127.0.0.1`. No configure `APP_HOST=0.0.0.0` salvo que necesite acceso desde una red controlada y haya definido `ALLOWED_ORIGINS`.

## Validación

```powershell
npm ci
npx playwright install chromium
npm run validate
npm run test:e2e
npm run release:check
```

`release:check` distingue los controles técnicos de las aprobaciones humanas o institucionales pendientes.

## Edición web

Vercel publica los archivos estáticos y las funciones de `api/`. Cuando una exportación de servidor no está disponible, la aplicación utiliza impresión, Word HTML editable o SVG desde el navegador. Los tableros se conservan localmente mediante IndexedDB y una copia compatible en `localStorage`.

El almacenamiento privado en Vercel Blob está preparado, pero permanece desactivado hasta configurar `ENABLE_CLOUD_STORAGE=true` y `BLOB_READ_WRITE_TOKEN`. No lo habilite para datos personales sin definir previamente autenticación, privacidad y retención.

## Guardar pictogramas localmente

```powershell
npm run build
```

El proceso consulta los 96 conceptos configurados, descarga las imágenes disponibles en `assets/pictograms`, actualiza los metadatos y registra los términos sin resultado. Actualmente existen 88 recursos locales y ocho conceptos pendientes de selección humana.

## Agregar o modificar temas

Edite `data/grupos-semanticos.json`. Cada grupo genera una página. Para conservar el diseño 4 × 4, use 16 conceptos por grupo.

## Selección manual

Si el primer resultado no representa bien un concepto, agregue su ID a `data/pictogramas-seleccionados.json`:

```json
{
  "dolor": {
    "id": 1234,
    "label": "Dolor",
    "source": "ARASAAC"
  }
}
```

Ejecute de nuevo `npm run build`.

## Licencia y validación

Pictogramas: Sergio Palao. Origen: ARASAAC. Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).

La selección automática usa el primer resultado de búsqueda. Antes de distribuir o utilizar los tableros, una persona profesional de comunicación aumentativa y alternativa debe revisar la correspondencia semántica de cada pictograma.
