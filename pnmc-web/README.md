# pnmc-web

Frontend actual de PNMC en React + Vite. La UI existente se conserva; el consumo de datos se hace vía `pnmc-api`.

## Estructura

- `src/app`: shell principal (`App.jsx`) y estilos globales.
- `src/components/ui`: componentes reutilizables.
- `src/components/layout`: navegación y footer.
- `src/hooks`: hooks de navegación y carga de datos.
- `src/services/data`: clientes para consumir backend (`/api/v1`).
- `src/services/navigation`: rutas y navegación interna.
- `src/lib`: utilidades de integración cliente.
- `src/test`: setup y pruebas.

## Configuración

`.env.example`:

- `VITE_API_BASE_URL` (ejemplo: `http://localhost:8080`)

## Ejecutar

```bash
cd pnmc-web
npm install
npm run dev
```

## Build y pruebas

```bash
npm run build
npm test
```
