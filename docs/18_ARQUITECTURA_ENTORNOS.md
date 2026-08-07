# Arquitectura de ambientes y servicios

## Aplicación local

`scripts/server.js` sirve la aplicación en la interfaz de loopback. Aplica límites de tamaño y frecuencia, valida orígenes y reserva los diálogos nativos para solicitudes locales. PDF, PNG y DOCX utilizan dependencias declaradas del proyecto.

## Aplicación web

`api/[...path].js` implementa salud, estado de proveedores, búsqueda protegida de Global Symbols, diagnósticos y almacenamiento privado opcional. Las credenciales sólo se leen desde variables de Vercel.

## Persistencia

El navegador utiliza IndexedDB y conserva una copia compatible en `localStorage`. Vercel Blob es opcional y privado. Cada tablero remoto requiere una clave de capacidad; la interfaz pública no activa esta función automáticamente.

## Variables por ambiente

- Desarrollo: copie `.env.example` como `.env` y mantenga `APP_HOST=127.0.0.1`.
- Preview: configure únicamente credenciales de prueba. Mantenga desactivado Blob si no hay política de datos.
- Producción: use secretos independientes, Blob privado, monitoreo explícito y orígenes definitivos.
