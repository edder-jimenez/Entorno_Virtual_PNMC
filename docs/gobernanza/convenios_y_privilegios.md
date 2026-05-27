# CONVENIOS INSTITUCIONALES Y PRIVILEGIOS DE ACCESO (HABEAS DATA)

Este sub-documento de gobernanza detalla el funcionamiento de los **Privilegios de Acceso** de la plataforma, el cumplimiento de la **Ley de Protección de Datos Personales (Habeas Data)** en Colombia y las excepciones de visualización para **Entidades Aliadas**.

---

## 1. MARCO LEGAL Y OPERATIVO (HABEAS DATA E INTERCAMBIO SEGURO)

De acuerdo con la **Ley 1581 de 2012 (Ley de Habeas Data de Colombia)**, el Ministerio de las Culturas, las Artes y los Saberes está obligado a proteger la confidencialidad de la información personal de los ciudadanos. Datos como correos personales, números de teléfono celular privados de directores de bandas y direcciones domiciliarias de lutieres autónomos son catalogados como **Datos Personales Sensibles/Privados**.

### 1.1 El Estatus Jurídico de las Entidades Aliadas
Las **Entidades Aliadas** (como corporaciones académicas, secretarías de cultura y redes asociadas) firman **Convenios de Asociación e Intercambio de Información** con el Ministerio. Estos instrumentos jurídicos las acreditan como **Encargadas del Tratamiento de Datos** bajo fines netamente formativos y de desarrollo territorial.

Por esta razón, la plataforma otorga a los roles aliados (`aliado_admin`, `aliado_editor`, `aliado_lector`) un **Acceso Privilegiado** para visualizar y exportar estos datos privados de contacto en las áreas y componentes específicos de su competencia, bajo estrictos acuerdos de no divulgación.

---

## 2. MATRIZ DE VISUALIZACIÓN Y ENMASCARAMIENTO DE DATOS

El sistema maneja dos vistas de API en base al nivel de autorización del cliente:

| Tipo de Datos | Exposición al Público General | Exposición a Colaborador Externo (`externo`) | Exposición en Consola de Aliados (`aliado_*`) |
| --- | --- | --- | --- |
| **Datos de Carácter Público** (Nombre de la escuela, especialidades, municipio, trayectoria, coordenadas). | **Completamente Visible** (Permite la búsqueda libre en el geovisor público). | **Visible y Editable** (Únicamente respecto a sus propios registros vinculados). | **Completamente Visible** (Permite mapear la red completa del componente). |
| **Datos de Contacto Protegidos** (Nombres de directores, correos electrónicos, teléfonos, direcciones exactas). | **OCULTO / ENMASCARADO** (Se oculta de la respuesta de la API pública para evitar minería de datos, spam o acoso). | **Visible y Editable** (Únicamente sobre su propia ficha personal para recibir notificaciones). | **COMPLETAMENTE VISIBLE** (Acceso crudo para labores de acompañamiento y fomento regional). |

---

## 3. ARQUITECTURA TÉCNICA DEL ACCESO PRIVILEGIADO

La protección y el enmascaramiento se resuelven en la **Capa de Backend** (.NET Minimal API) y nunca en el frontend, garantizando seguridad absoluta ante ataques de inspección de consola de navegador.

### 3.1 Flujo de Autorización del Token JWT

1. **Autenticación**: El usuario inicia sesión. El backend inyecta los claims correspondientes al rol y, si aplica, el `EntidadAliadaId` y el arreglo de códigos geográficos de cobertura asignados a su convenio regional.
2. **Lógica de Consulta del Backend**:
   Cuando un usuario solicita detalles de un registro ecosistémico, la API de .NET ejecuta las siguientes comprobaciones lógicas:
   ```csharp
   // Pseudocódigo de validación en el Endpoint del Backend
   if (Usuario.Rol == "webmaster" || Usuario.Rol == "gestor_interno")
   {
       // Acceso total: Devolver objeto completo
       return DevolverRegistroCompleto(registro);
   }
   else if (Usuario.Rol.StartsWith("aliado_"))
   {
       // Validar si el registro pertenece a la red de su entidad o cobertura regional
       if (registro.EntidadAliadaId == Usuario.EntidadAliadaId || Usuario.MunicipiosAsignados.Contains(registro.MunicipioDivipola))
       {
           return DevolverRegistroCompleto(registro); // Acceso privilegiado concedido
       }
   }
   
   // Si no cumple las condiciones, aplicar enmascaramiento estricto
   return DevolverRegistroEnmascarado(registro);
   ```

### 3.2 El Proceso de Enmascaramiento de Datos
Para los usuarios que no superan las comprobaciones de privilegios, la API aplica un transformador que enmascara los caracteres sensibles antes de enviar la respuesta JSON:
* *Nombre Director*: `"Carlos Andrés Mendoza"` ──► `"C***** A***** M******"`
* *Correo*: `"carlos.mendoza@redmusical.org"` ──► `"c*********@******.***"`
* *Teléfono*: `"3157890123"` ──► `"315*******"`
* *Dirección*: `"Calle 4 # 12-45, Barrio Centro"` ──► `"Calle * # **-**, Barrio Centro"`

Esto garantiza el cumplimiento absoluto de la Ley de Habeas Data al blindar la información de la ciudadanía contra accesos no autorizados.
