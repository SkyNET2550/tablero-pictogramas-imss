# Plan de publicación piloto

## Alcance

La versión piloto permite consultar el acervo, generar y editar tableros, guardarlos en el dispositivo y exportarlos desde el navegador. Las funciones locales de Windows no se ofrecen en la edición web.

## Ambientes

- Desarrollo: servidor en `127.0.0.1`, credenciales sólo en `.env`.
- Pruebas: despliegue Preview de Vercel, datos no sensibles y proveedores de prueba.
- Producción piloto: dominio HTTPS, variables de producción y almacenamiento en nube desactivado hasta contar con autorización.

## Criterios técnicos de entrada

- `npm ci`, `npm run validate` y `npm run test:e2e` aprobados.
- Sin vulnerabilidades altas en `npm audit`.
- `/`, `/api/health` y `/api/providers/status` disponibles.
- Guardado local, apertura, impresión y exportaciones de respaldo comprobados.
- Sin errores de consola en recorridos principales.

## Criterios humanos obligatorios

- Revisión de los ocho conceptos sin pictograma local.
- Pruebas con NVDA y JAWS.
- Revisión con personas usuarias de comunicación aumentativa.
- Autorización jurídica y de identidad institucional.
- Definición de aviso de privacidad antes de almacenar información en nube.

## Monitoreo y reversión

Los errores del cliente pueden registrarse en Vercel cuando `ENABLE_MONITORING=true`; el evento se limita a tipo, mensaje recortado y ruta. No se envían tableros ni contenido de pictogramas. Ante errores críticos, se revierte al último despliegue estable y se desactiva la función afectada.

## Decisión

Ejecute `npm run release:check`. Un resultado `NO-GO` identifica tanto bloqueos técnicos como aprobaciones externas pendientes; no debe interpretarse como una certificación automática.
