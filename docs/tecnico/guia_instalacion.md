# GUÍA DE INSTALACIÓN Y ARRANQUE LOCAL

Este sub-documento técnico detalla el procedimiento paso a paso para clonar, instalar, configurar y ejecutar localmente todo el stack de la plataforma **PNMC (Plan Nacional de Música para la Convivencia)** en un entorno de desarrollo.

---

## 1. REQUISITOS PREVIOS

Antes de comenzar, asegúrese de tener instalados los siguientes componentes en su máquina:

* **Node.js**: Versión `v18.0.0` o superior (se recomienda LTS).
* **.NET SDK**: Versión `.NET 10 SDK` o superior.
* **Docker Desktop** (o Docker Engine en segundo plano) para levantar la instancia local de base de datos SQL Server.
* **Sistema Operativo**: macOS, Windows (con WSL2 recomendado) o Linux.

---

## 2. CONFIGURACIÓN DE VARIABLES DE ENTORNO

La plataforma requiere configurar archivos `.env` en el frontend y en el backend para poder comunicarse. Utilice como referencia las plantillas `.env.example` en cada carpeta respectiva.

### 2.1 Backend (`pnmc-api/.env`)
Cree el archivo `pnmc-api/.env` con la siguiente estructura de conexión local:

```ini
# Configuración del servidor SQL Server
AZURE_SQL_SERVER=127.0.0.1,14333
AZURE_SQL_DATABASE=PNMC_LOCAL
AZURE_SQL_USER=sa
AZURE_SQL_PASSWORD=P@sswordLocal2026!
AZURE_SQL_ENCRYPT=false

# Token de seguridad interna para endpoints ministeriales / administrativos
PNMC_ADMIN_API_KEY=ApiKey_Secure_Local_Token_2026
```

### 2.2 Frontend (`pnmc-web/.env`)
Cree el archivo `pnmc-web/.env` indicando la ruta base de escucha del backend:

```ini
VITE_API_BASE_URL=http://localhost:8080
```

---

## 3. SCRIPTS DE MONTAJE Y DESMONTAJE (AUTOMÁTICO Y MANUAL)

Para facilitar la administración diaria del entorno de desarrollo sin necesidad de recordar comandos largos, la raíz del proyecto cuenta con dos scripts macOS ejecutables y comandos manuales equivalentes para montar (arrancar) y desmontar (detener) todos los servidores.

### 3.1 Montaje del Entorno (Arranque)

#### Opción A: Script Automático (`Iniciar PNMC.command`)
Es un script ejecutable diseñado para macOS. Para utilizarlo:
1. Haga doble clic en `Iniciar PNMC.command` desde el Finder, o ejecútelo en terminal:
   ```bash
   ./Iniciar\ PNMC.command
   ```
2. **¿Qué hace bajo el capó?**
   * **Verifica Docker**: Comprueba si la aplicación Docker Desktop está abierta. Si no es así, la inicia automáticamente y espera hasta que el servicio esté listo.
   * **Base de Datos**: Lanza el contenedor SQL Server local en segundo plano (puerto `14333`) y ejecuta la siembra inicial (seeds).
   * **Consolas de Servidores**: Lanza dos nuevas ventanas de terminal del sistema independientes:
     * Una ejecutando la API de .NET 10 (`./scripts/api-local.sh`).
     * Otra ejecutando el servidor de desarrollo de React 19/Vite (`pnmc-web`) en `http://127.0.0.1:5173`.

#### Opción B: Montaje Manual Paso a Paso
Si prefiere un control directo en una sola terminal:
```bash
# 1. Levantar contenedor de base de datos en segundo plano
docker compose -f docker-compose.local.yml up -d

# 2. Poblar tablas e inyectar semillas
./scripts/seed-local-db.sh

# 3. Arrancar la API .NET (Puerto 8080)
cd pnmc-api && dotnet run --project src/PNMC.Api

# 4. Arrancar el Frontend React (Puerto 5173 - en otra terminal)
cd pnmc-web && npm run dev
```

---

### 3.2 Desmontaje del Entorno (Parada y Limpieza)

#### Opción A: Script Automático (`Detener PNMC.command`)
Es el script complementario ejecutable de apagado rápido.
1. Ejecútelo haciendo doble clic o en terminal:
   ```bash
   ./Detener\ PNMC.command
   ```
2. **¿Qué hace bajo el capó?**
   * **Apaga Frontend**: Busca el PID escuchando en el puerto `5173` y finaliza de manera limpia el proceso de Vite.
   * **Apaga Backend**: Busca el PID escuchando en el puerto `8080` y finaliza la API de .NET.
   * **Apaga Base de Datos**: Ejecuta `docker compose -f docker-compose.local.yml stop`, deteniendo el contenedor de SQL Server de forma segura sin eliminar tus datos guardados.

#### Opción B: Desmontaje Manual Y Limpieza
Para detener y limpiar recursos huérfanos manualmente:
```bash
# 1. Detener el contenedor de base de datos conservando datos
docker compose -f docker-compose.local.yml stop

# 2. Detener base de datos Y ELIMINAR el contenedor (limpieza total de volumen local)
docker compose -f docker-compose.local.yml down -v

# 3. Finalizar procesos huérfanos de puertos (macOS)
kill -9 $(lsof -t -i :5173) 2>/dev/null || true
kill -9 $(lsof -t -i :8080) 2>/dev/null || true
```

---

## 4. ARRANQUE RÁPIDO AUTOMÁTICO DE DESARROLLO (macOS / Linux)

El monorepo cuenta con scripts de arranque programados en Bash. Si se encuentra en macOS o Linux, ejecute el comando integrado desde la raíz:

```bash
# Otorgar permisos de ejecución si es primera vez
chmod +x Iniciar\ PNMC.command

# Iniciar la plataforma de forma completa
./Iniciar\ PNMC.command
```

### ¿Qué realiza este script automático?
1. **Docker**: Descarga e inicia la imagen oficial de SQL Server 2022 en un contenedor Docker, mapeando el puerto externo `14333`.
2. **Semilla (Seeds)**: Crea el esquema `PNMC_LOCAL` y ejecuta la inyección de tablas e información semilla de prueba.
3. **Backend**: Compila e inicia la Minimal API en .NET en el puerto `8080`.
4. **Frontend**: Instala dependencias e inicia el servidor de desarrollo de Vite en el puerto `5173`.

---

## 4. LEVANTAMIENTO MANUAL DEL STACK

Si prefiere arrancar los servicios manualmente para depurar de forma individual en terminales independientes:

### Paso 1: Iniciar la Base de Datos Local en Docker
```bash
# Arrancar el contenedor Docker con SQL Server local
./scripts/local-db-up.sh
```

### Paso 2: Ejecutar los Scripts SQL y Datos Semilla (Seeds)
```bash
# Correr la inyección SQL de tablas y registros iniciales
./scripts/seed-local-db.sh
```

### Paso 3: Ejecutar la API de .NET 10
```bash
cd pnmc-api
# Restaurar dependencias NuGet de la solución
dotnet restore PNMC.Api.sln

# Iniciar el backend (.NET Web API en puerto 8080)
../scripts/api-local.sh
```
*Swagger UI estará disponible para consulta interactiva en: [http://localhost:8080/swagger](http://localhost:8080/swagger)*

### Paso 4: Ejecutar el Frontend React 19
```bash
cd pnmc-web
# Instalar dependencias npm
npm install

# Levantar el servidor de Vite en el puerto 5173
npm run dev
```
*Frontend disponible en: [http://127.0.0.1:5173](http://127.0.0.1:5173)*

---

## 5. EJECUCIÓN DE PRUEBAS DE CALIDAD Y COMPILACIÓN

Para validar que el entorno se ha levantado sin errores lógicos ni de tipado, ejecute las suites de pruebas integradas:

### 5.1 Pruebas del Frontend (Vitest)
```bash
cd pnmc-web
# Ejecuta las 23 pruebas unitarias de render y lógica de negocio
npm run test
```

### 5.2 Compilación del Frontend (Vite Bundle)
```bash
cd pnmc-web
# Genera el empaquetado final de producción comprobando que no haya errores
npm run build
```

### 5.3 Pruebas del Backend (.NET xUnit)
```bash
cd pnmc-api
# Ejecuta la suite de pruebas unitarias y de integración de .NET
dotnet test PNMC.Api.sln
```

---

## 6. CREDENCIALES SEMBRADAS PARA PRUEBAS LOCALES

Una vez completada la siembra de datos semilla (`seed-local-db.sh`), puede acceder a las distintas consolas de administración usando las siguientes cuentas locales:

| Rol de Acceso | Correo Electrónico | Contraseña | Destino en Consola |
| --- | --- | --- | --- |
| **Webmaster** (Admin Central) | `admin@pnmc.local` | `pnmc-master` | `/admin` |
| **Gestor Interno** (Ministerio) | `gestor@pnmc.local` | `pnmc-gestor` | `/admin` |
| **Aliado Coordinador** (Red) | `aliado-admin@pnmc.local` | `pnmc-aliado` | `/colaboradores` |
| **Colaborador Externo** (Gestor) | `externo@pnmc.local` | `pnmc-externo` | `/colaboradores` |
