# PNMC Angular

Frontend Angular paralelo para migración desde React, con backend .NET + Azure SQL como fuente única.

## Estado actual
- Arquitectura por features con rutas lazy.
- Integración backend activa:
  - `Noticias` (`/api/v1/news/articles`)
  - `Agenda` (`/api/v1/agenda/events`)
  - `Editorial` (`/api/v1/editorial/resources`)
  - `Mapa ecosistémico` (`/api/v1/map/*`) con Leaflet + TopoJSON + DIVIPOLA
  - `Participación` (`/api/v1/participation/submissions`) avanzada por tipo de actor, campos condicionales, borrador local y validaciones
  - `Módulos SQL` (`festivales`, `escuelas`, `mercados`, `organizaciones`, `espacios`, `relaciones`)
  - `Galería` (`/api/v1/gallery/albums`) con estado vacío estable
  - `Admin` (`/api/v1/admin/*`) vía API key de sesión + guard + interceptor
- Manejo de errores HTTP estandarizado (incluye fallback para `502`).
- Configuración de ambientes:
  - `src/environments/environment.ts` (producción)
  - `src/environments/environment.development.ts` (desarrollo)

## Ejecutar local
1. Levanta backend .NET (`pnmc-api`) en `http://localhost:8080`.
1. En otra terminal:

```bash
cd pnmc-angular
npm install
npm start
```

1. Abre [http://localhost:4200](http://localhost:4200) (o el puerto alterno que muestre Angular).

UI nativa Angular:
- Angular corre como frontend principal (sin capa de compatibilidad).

## Rutas
- `/`
- `/pnmc`
- `/ejes`
- `/ejes/componentes/:componentId`
- `/estrategia/circulacion`
- `/estrategia/investigacion`
- `/noticias`
- `/agenda`
- `/editorial`
- `/mapa`
- `/participacion`
- `/mapa/participa`
- `/modulos`
- `/galeria`
- `/admin/login`
- `/admin`

## Scripts
```bash
npm start
npm run build
npm test
npm run smoke:api
npm run smoke:web
```

## Checklist de salida (ready)
1. Backend arriba en `http://localhost:8080`.
1. Frontend Angular arriba (`npm start`).
1. Build OK:
```bash
npm run build
```
1. Smoke API OK:
```bash
npm run smoke:api
```
1. Smoke frontend OK:
```bash
npm run smoke:web
```
