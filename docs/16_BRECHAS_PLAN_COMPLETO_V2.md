# Brechas restantes frente al plan completo v2

Revisión: 19 de junio de 2026.

## Dependen de credenciales o servicios externos

- OpenSymbols: falta shared secret/token.
- Global Symbols: falta API key.
- SymboTalk: integración terminada; el servicio remoto responde HTTP 403.

## Dependen de validación humana institucional

- Validación comunicativa con personas usuarias y especialistas CAA.
- Dictamen jurídico institucional definitivo.
- Prueba manual completa con NVDA o JAWS.

## Desarrollo opcional de segunda versión

- Empaquetado instalable Electron.
- Migración de JSON a SQLite.
- Migración de interfaz a React o Vue.

## Implementado en esta revisión

- Panel Servicios API.
- Verificación individual y conjunta.
- Estados normalizados, tiempo de respuesta e historial.
- Activación y desactivación.
- Credenciales protegidas fuera del frontend.
- Exclusión de proveedores no disponibles.
- Uso de biblioteca local cuando no existen servicios externos utilizables.
