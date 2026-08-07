# Instalación y ejecución

## Requisitos

- Windows 10/11, macOS o Linux para la aplicación web local. Los cuadros nativos de archivo requieren Windows.
- Node.js 20 o posterior.
- Conexión a internet para búsquedas externas.

## Inicio

Instale exactamente las dependencias verificadas y el navegador de pruebas:

```powershell
npm ci
npx playwright install chromium
```

En Windows puede ejecutar `run_app.bat` o:

```powershell
npm run dev
```

Abra `http://localhost:4173/`.

## Uso en red local

Por seguridad, el servidor sólo acepta conexiones del mismo equipo. Si una instalación administrada requiere acceso LAN, defina `APP_HOST` y una lista estricta `ALLOWED_ORIGINS` en `.env`. No utilice `0.0.0.0` en una red pública.

## Comprobación

```powershell
npm run validate
npm run test:e2e
npm run release:check
```

Las pruebas automáticas no sustituyen la validación con lectores de pantalla, personas usuarias ni la aprobación jurídica.

## Respaldo

Ejecute:

```powershell
npm run backup
```

## Condiciones de servicios y validación

- SymboTalk depende de que su servicio externo esté activo.
- OpenSymbols y Global Symbols requieren credenciales.
- La revisión jurídica generada es técnica; la publicación institucional externa requiere validación de la unidad competente.
