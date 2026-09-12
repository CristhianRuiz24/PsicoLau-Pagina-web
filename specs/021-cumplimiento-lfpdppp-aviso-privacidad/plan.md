# Plan Técnico 021 — Cumplimiento Integral de la LFPDPPP, Actualización del Aviso de Privacidad y Validación de Consentimiento

## 1. Resumen de la Solución Técnica
Esta especificación solventa los tres vacíos normativos identificados en la auditoría respecto a la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)**, los **Lineamientos del Aviso de Privacidad del INAI** y la **NOM-004-SSA3-2012**.
La intervención abarca dos frentes:
1. **Actualización Documental y Legal en `privacidad.html`**:
   - Incorporación de numeral sobre remisiones y transferencias a infraestructura tecnológica (Supabase, Render, Cloudflare, Resend) amparada en los Artículos 36 y 37 fracciones IV y VII de la LFPDPPP y 49 del Reglamento.
   - Incorporación de numeral específico sobre cookies, almacenamiento local y tecnologías similares (Lineamiento Trigésimo Primero del INAI).
   - Incorporación de la regla de conservación legal obligatoria de 5 años para expedientes clínicos y bloqueo preventivo (NOM-004-SSA3-2012 y Art. 26 Fracc. II LFPDPPP).
   - Precisión del plazo de 15 días hábiles para ejecución de solicitudes ARCO y delimitación territorial en la Ciudad de México.
2. **Defensa en Profundidad del Consentimiento en Frontend y Backend**:
   - `contacto.html` y `js/main.js`: Envío garantizado del campo `privacyCheck: true` en el payload JSON.
   - `backend/src/utils/validators.js`: Inclusión de `privacyCheck: z.literal(true, { errorMap: () => ({ message: "Debes aceptar el Aviso de Privacidad para enviar tu consulta" }) })` en `contactoSchema`.
   - `backend/scripts/testConsentimientoLFPDPPP.js`: Suite automatizada que comprueba el bloqueo de peticiones no consentidas y el éxito de peticiones válidas.

## 2. Alineación con la Constitución
- **Principio 1 (Cifrado de datos sensibles)**: Se mantiene intacto el cifrado AES-256-GCM en notas clínicas y PII.
- **Principio 3 (Frontend simple sin dependencias)**: Actualización de HTML y JS vanilla nativo, sin scripts pesados de banners de consentimiento de terceros.
- **Principio 5 (CORS y superficie de ataque)**: Mantenimiento de listas blancas de orígenes y sanitización semántica de entradas.
- **Principio 6 (No regresión)**: Se garantiza que el flujo de contacto y agenda siga funcionando al 100%.

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                    | Tipo de cambio
-----------------|---------------------------------------------|------------------
Frontend Web     | privacidad.html                             | Modificar (Redacción legal completa)
Frontend Web     | js/main.js                                  | Modificar (Payload con privacyCheck)
Backend API      | backend/src/utils/validators.js             | Modificar (contactoSchema con privacyCheck)
Backend Tests    | backend/scripts/testConsentimientoLFPDPPP.js| Crear (Suite de verificación)
Documentación    | overview/session.md, overview/tasks.md      | Modificar (Memoria de sesión y tareas)
```

## 4. Modelo de Datos y Esquema
No se requieren modificaciones en `backend/prisma/schema.prisma`. El modelo actual ya almacena los datos de pacientes y notas clínicas cifrados con AES-256-GCM y búsquedas con blind index HMAC-SHA256. El formulario de contacto no persiste datos en base de datos (se transmiten cifrados vía HTTPS a través de Resend API).

## 5. Contratos de API / Endpoints

### `POST /api/contacto`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+525512345678",
    "categoria": "ansiedad_depresion",
    "mensaje": "Hola, me gustaría agendar una consulta de valoración.",
    "privacyCheck": true
  }
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "success": true,
    "message": "Mensaje enviado correctamente. La Lic. Laura te contactará pronto."
  }
  ```
- **Respuesta 400 Bad Request (Sin consentimiento o `false`)**:
  ```json
  {
    "success": false,
    "message": "Debes aceptar el Aviso de Privacidad para enviar tu consulta"
  }
  ```

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica / legal | Alternativa descartada y por qué |
|---|---|---|
| **Redacción exhaustiva inlined en `privacidad.html`** | Cumple directamente con los Lineamientos del INAI sin agregar peticiones de red externas ni iframes | *Descargar PDF de aviso externo: Descartado por fricción de accesibilidad y SEO.* |
| **Validación de `privacyCheck` en `validators.js` con Zod** | Asegura que ningún bot o petición directa a la API omita el consentimiento informado | *Validar únicamente en frontend (`required` en HTML): Descartado porque cualquier petición cURL/Postman podría enviar datos sin consentir.* |
| **Clasificación de proveedores cloud como "Encargados" (Art. 49 RLFPDPPP)** | Supabase, Render, Cloudflare y Resend son proveedores tecnológicos bajo contrato, no destinatarios de cesión para beneficio propio | *Clasificarlos como transferencias comerciales que requieren autorización independiente: Descartado por no aplicar al cómputo en la nube bajo Art. 37 Fracc. IV/VII.* |
| **Documentación de la regla de 5 años (NOM-004-SSA3-2012)** | Brinda certeza jurídica y previene quejas ante el INAI en solicitudes de cancelación anticipada | *Permitir borrado inmediato de notas clínicas: Descartado porque violaría la norma sanitaria federal de salud.* |

---

## 7. Propuesta de Redacción Legal para el Aviso de Privacidad

A continuación se detalla la redacción jurídica exacta a incorporar en `privacidad.html`:

### Sección 5 bis: Uso de Cookies, Almacenamiento Local y Tecnologías de Rastreo
> *"Conforme al Lineamiento Trigésimo Primero de los Lineamientos del Aviso de Privacidad del INAI, le informamos que el sitio web **psicolau.com** no utiliza cookies de seguimiento comercial, píxeles de redes sociales ni herramientas de publicidad invasiva.  
> Se utilizan únicamente tecnologías esenciales y técnicas:  
> 1. **Almacenamiento Local Técnico (`localStorage`):** Utilizado exclusivamente en la suite clínica administrativa (`/panel`) para mantener la sesión autenticada de manera segura mediante tokens criptográficos JWT temporales (8 horas). No se almacena información en el navegador de los visitantes públicos.  
> 2. **Analítica Web Respetuosa de la Privacidad (Cloudflare Web Analytics):** Servicio de telemetría técnica que mide el volumen de visitas agregadas sin utilizar cookies, sin recolectar direcciones IP individuales y sin rastrear el comportamiento del usuario a través de otros sitios de internet.  
> 3. **Fachadas de Video Ligeras (YouTube No-Cookie):** Las grabaciones y testimonios utilizan el dominio de privacidad mejorada `youtube-nocookie.com`, el cual impide la colocación de cookies de rastreo en su dispositivo hasta que usted decide voluntariamente hacer clic para reproducir el video.  
> Usted puede en cualquier momento restringir, bloquear o borrar las cookies y datos locales de navegación a través de la configuración de su navegador web (Chrome, Firefox, Safari, Edge)."*

### Sección 5 ter: Transferencias de Datos y Remisiones a Proveedores Tecnológicos (Cómputo en la Nube)
> *"En estricto cumplimiento con los Artículos 36 y 37 de la LFPDPPP y el Artículo 49 de su Reglamento, **PSICOLAU no vende, no alquila, no cede ni transfiere sus datos personales ni de salud a terceras empresas u organizaciones con fines publicitarios o comerciales**.  
> Para la prestación de los servicios de consulta digital y gestión del consultorio, sus datos son tratados mediante **remisiones a Encargados tecnológicos** (proveedores de infraestructura en la nube) que operan bajo rigurosos acuerdos de confidencialidad y estándares internacionales de seguridad de la información:  
> - **Supabase Inc. (Base de Datos):** Servidores en la nube para almacenamiento de base de datos PostgreSQL cifrada (AES-256-GCM).  
> - **Render Services Inc. (Servidor de Aplicación / API):** Procesamiento seguro del backend y cifrado en memoria.  
> - **Cloudflare Inc. (Seguridad Perimetral y Red de Distribución):** Blindaje contra ataques informáticos y transporte seguro con cifrado HTTPS / TLS 1.3 forzado.  
> - **Resend Inc. (Notificaciones Seguras):** Transmisión cifrada de confirmaciones y solicitudes de consulta vía correo electrónico.  
> Dichas remisiones se encuentran amparadas en las excepciones previstas por el **Artículo 37, fracciones IV y VII de la LFPDPPP**, por tratarse de la gestión y mantenimiento de la relación profesional y la prestación de los servicios solicitados."*

### Sección 6 (Actualización de Cancelación y Bloqueo conforme a la NOM-004-SSA3-2012):
> *"**Excepción Médica Legal a la Cancelación Inmediata (Expediente Clínico):**  
> De conformidad con el **Artículo 26, fracción II de la LFPDPPP** y la **Norma Oficial Mexicana NOM-004-SSA3-2012 (Del expediente clínico, numeral 5.4)**, los prestadores de servicios de atención médica y de salud mental tienen la obligación jurídica de conservar las notas y expedientes clínicos por un **periodo mínimo obligatorio de cinco (5) años**, contados a partir de la fecha de la última consulta o intervención terapéutica.  
> En caso de que usted solicite la Cancelación de sus datos clínicos antes de dicho periodo, sus datos no podrán ser eliminados de manera inmediata, sino que entrarán formalmente en un **periodo de bloqueo** (Artículo 25 de la LFPDPPP). Durante el bloqueo, sus registros quedan aislados e inaccesibles para cualquier tratamiento ordinario y se conservan exclusivamente a disposición de las autoridades judiciales o administrativas competentes para la atención de posibles responsabilidades legales derivadas del acto clínico. Concluido el término de 5 años, se procederá a la supresión y destrucción definitiva y confidencial de la información."*

### Sección 6 (Actualización de Plazos Legales ARCO conforme al Art. 32 LFPDPPP):
> *"Su solicitud de derechos ARCO será atendida y resuelta en un plazo máximo de **veinte (20) días hábiles** contados a partir de la fecha de recepción de la solicitud. En caso de resultar procedente, la determinación se hará efectiva dentro de los **quince (15) días hábiles** siguientes a la fecha en que se comunique la respuesta (ambos plazos prorrogables por una sola vez por un periodo igual, siempre que existan causas justificadas conforme a la ley)."*

---

## 8. Estrategia de Pruebas y Validación
1. **Prueba sintáctica y unitaria**: `testConsentimientoLFPDPPP.js` ejecutado con `node --test`.
2. **Prueba integral de la suite**: `npm test` ejecutado secuencialmente en `backend/` aprobando el 100% de los tests.
3. **Prueba de linter**: `npm run lint` pasando con 0 errores.
4. **Verificación visual en navegador**: Inspección de `privacidad.html` y prueba de envío de formulario en `contacto.html`.
