# Base local PNMC

Este entorno permite trabajar con SQL Server local sin consumir creditos de Azure.

## Requisitos

- Docker Desktop abierto.
- En Mac con Apple Silicon, Docker puede pedir habilitar emulacion x86_64/Rosetta para la imagen oficial de SQL Server.

## Levantar la base

```bash
./scripts/local-db-up.sh
```

Esto crea un contenedor `pnmc-sqlserver` y verifica la base `PNMC_LOCAL`.

## Conexion desde VS Code

Instala la extension **MSSQL** y crea una conexion con:

- Server: `127.0.0.1,14333`
- Authentication: `SQL Login`
- User: `sa`
- Password: `PnmcLocal_2026!`
- Database: `PNMC_LOCAL`
- Trust server certificate: `true`

## Levantar el API contra local

```bash
./scripts/api-local.sh
```

El script fuerza la cadena de conexion local sin modificar `pnmc-api/.env`, que puede seguir apuntando a Azure.

## Cargar datos de prueba amplios

Despues de crear las tablas base, puedes cargar una muestra conectada con:

```bash
docker exec -i pnmc-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'PnmcLocal_2026!' -d PNMC_LOCAL -C -b \
  < pnmc-database/seed/V20260519_06__datos_prueba_amplios.sql
```

Esta semilla reinicia los contenidos sinteticos y crea 30 registros en agenda,
noticias, albumes, festivales, escuelas, mercados, redes de documentacion,
lutieres, archivos y bitacora. Tambien crea 150 registros en la capa comun
`RegistrosEcosistema` y sus relaciones con territorios sonoros y practicas
musicales.

La muestra se reparte en Antioquia, Valle del Cauca, Atlantico, Bolivar,
Narino y Meta para que el mapa tenga densidad territorial sin dispersarse por
todo el pais.

## Lectura desde el modelo limpio

La API local debe consultar directamente las tablas nuevas con nombres en
espanol: `Agenda`, `Noticias`, `Festivales`, `EscuelasMusica`,
`MercadosMusicales`, `RedesDocumentacion`, `Lutieres`, `Archivos`,
`Divipola`, `Categorias`, `EstadosContenido`, `Usuarios` y `Roles`.

No se usan vistas de compatibilidad con nombres anteriores. Si quedaron vistas
viejas en una base local de pruebas, se pueden eliminar sin afectar el modelo
limpio.

## Nota

Esta base nace vacia. La idea es usarla para disenar el nuevo modelo limpio y luego migrar solamente los datos que valga la pena conservar.
