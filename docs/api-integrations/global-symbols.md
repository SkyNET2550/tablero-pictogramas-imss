# Global Symbols

La aplicación integra la API oficial v2 de Global Symbols exclusivamente desde el servidor local. La clave nunca se incorpora al HTML ni al JavaScript enviado al navegador.

## Configuración

1. Copiar `.env.example` como `.env`.
2. Registrar `GLOBAL_SYMBOLS_API_KEY`.
3. Reiniciar la aplicación.
4. Abrir **Menú → Estado de servicios** y pulsar **Verificar**.

La búsqueda del navegador llama a `GET /api/pictograms/search`; el servidor consulta `GET https://globalsymbols.com/api/v2/labels/search` mediante `X-Api-Key`, normaliza los resultados y conserva una caché de 24 horas (30 minutos para búsquedas vacías).

Los conjuntos de símbolos conservan los campos de licencia y atribución recibidos. Antes de publicar o redistribuir un tablero debe revisarse la licencia específica de cada conjunto.

Referencia oficial: https://globalsymbols.com/api/v2/docs
