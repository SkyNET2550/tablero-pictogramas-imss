# Generador de tableros ARASAAC

> Regla de desarrollo: después de cada modificación se debe recargar y verificar la aplicación en el navegador lateral o en `http://127.0.0.1:4173/`.

Aplicación local para crear seis tableros institucionales de comunicación, en formato carta vertical y cuadrícula de 4 × 4. Consulta la API de ARASAAC, permite fijar manualmente IDs y puede guardar los pictogramas en el proyecto.

## Uso rápido

Requiere Node.js 20 o posterior.

```powershell
npm run dev
```

Abra `http://127.0.0.1:4173`. Use **Imprimir / Guardar PDF** para imprimir todos los tableros o seleccionar páginas concretas.

También puede ejecutar `run_app.bat` para iniciar el servidor y abrir la aplicación en el navegador predeterminado.

## Guardar pictogramas localmente

```powershell
npm run build
```

El proceso consulta únicamente los 96 conceptos configurados, descarga sus imágenes en `assets/pictograms`, actualiza los metadatos y registra los términos sin resultado. Después puede usar la aplicación sin volver a descargar las imágenes.

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
