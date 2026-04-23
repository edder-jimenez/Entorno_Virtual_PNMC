# Project Structure

```text
src/
  app/
  components/
    layout/
    ui/
  hooks/
    data/
  lib/
  services/
    data/
    navigation/
  test/
  main.jsx
```

## Notas

- `services/data/` consume exclusivamente endpoints del backend (`pnmc-api`).
- No hay sincronización de catálogos locales como fuente primaria de datos.
- El frontend conserva su UI actual y desacopla el acceso a datos en la capa de servicios.
