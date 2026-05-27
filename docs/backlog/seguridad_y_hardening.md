# SEGURIDAD Y BLINDAJE DE INFRAESTRUCTURA (HARDENING)

Este sub-documento detalla los riesgos de seguridad identificados en la plataforma del **PNMC** y los planes de mitigación de ingeniería obligatorios antes de autorizar el despliegue en producción.

---

## 1. VULNERABILIDADES EN LIBRERÍAS DE HOJAS DE CÁLCULO (`xlsx`)

* **Riesgo Identificado**: La librería frontend `xlsx` (usada en las importaciones y exportaciones masivas de marcadores) presenta vulnerabilidades conocidas públicamente de las cuales no existe un parche directo en la versión instalada. Asimismo, `exceljs` depende de una versión vulnerable de `uuid`.
* **Plan de Mitigación**:
  1. **Migración Server-Side**: Desacoplar la lectura y escritura de archivos Excel del cliente React. Trasladar la lógica al backend de .NET utilizando librerías nativas seguras (como CloseXML o EPPlus bajo licencias válidas).
  2. **Resolución de Subdependencias**: Forzar resoluciones explícitas de subdependencias vulnerables (como `uuid`) en el archivo `package.json` del frontend utilizando directivas de Yarn/NPM override.

---

## 2. BLINDAJE ESTRICTO DE ENDPOINTS (HABEAS DATA DE BASE)

* **Riesgo Identificado**: Exposición accidental de datos de contacto personales de ciudadanos de base en llamadas AJAX del mapa público.
* **Plan de Mitigación**:
  * Diseñar dos DTOs de salida diferenciados en el backend:
    1. `MarcadorPublicoDto`: Devuelve únicamente datos públicos de cartografía. Excluye por completo campos de teléfono, dirección física exacta, cédulas o correos electrónicos personales.
    2. `MarcadorDetalleAdministrativoDto`: Devuelve datos enriquecidos. Requiere cabecera de autenticación con Token JWT válido y verificación explícita de privilegios de rol.

---

## 3. PROTOCOLO SEGURO DE CARGA DE ARCHIVOS (FILE UPLOAD SECURITY)

Si en fases futuras se habilita la subida de archivos (fotografías para escuelas, PDFs editoriales, documentos institucionales, etc.), se deben implementar obligatoriamente las siguientes medidas de seguridad para evitar ataques de Ejecución Remota de Código (RCE):

1. **Validación de Tipo MIME Real**: Validar la firma digital interna del archivo (magic numbers) en el servidor de .NET y no basarse únicamente en la extensión visual del archivo (`.jpg`, `.pdf`).
2. **Almacenamiento Aislado**: Almacenar los archivos en repositorios desacoplados (como Azure Blob Storage o AWS S3) configurando accesos por firmas de firma de acceso temporal (SAS tokens). Nunca guardarlos en la carpeta física del servidor web.
3. **Renombrado Aleatorio**: Reescribir el nombre del archivo en el servidor utilizando identificadores GUID únicos generados de forma aleatoria para evitar ataques de cruce de directorios (*directory traversal*).
4. **Antivirus**: Pasar un antivirus (como ClamAV) sobre el flujo de bytes en el backend antes de persistir los archivos en el almacenamiento definitivo.

---

## 4. COOKIES DE SESIÓN SEGURAS Y CABECERAS CSP

* **Plan de Mitigación**:
  * Configurar en producción que todas las cookies transaccionales cuenten con las flags:
    * `HttpOnly=true` (bloquea lectura por scripts Javascript de terceros, previniendo robos de sesión XSS).
    * `Secure=true` (garantiza transmisión exclusiva sobre enlaces HTTPS encriptados).
    * `SameSite=Strict` o `Lax` (previene ataques de falsificación de petición en sitios cruzados - CSRF).
  * Implementar cabeceras robustas de **Content Security Policy (CSP)** en el servidor web de .NET para restringir la ejecución de scripts no autorizados o la inyección de iframes ajenos.

---

## 5. PROTECCIÓN CONTRA ABUSOS (RATE LIMITING & CAPTCHAS)

* **Plan de Mitigación**:
  * **Rate Limiting**: Configurar middlewares de limitación de tasa de peticiones (*rate limiting*) en el backend para los endpoints públicos de registro y envío de participación (ej. máximo 5 envíos por minuto por IP).
  * **CAPTCHA**: Integrar un validador server-side real (como Cloudflare Turnstile o reCAPTCHA v3) en el backend de envío del wizard, evitando soluciones basadas meramente en deshabilitar botones en el cliente de React.
