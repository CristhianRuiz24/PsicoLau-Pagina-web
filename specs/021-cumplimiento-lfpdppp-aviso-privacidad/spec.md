# Spec 021 — Cumplimiento Integral de la LFPDPPP, Actualización del Aviso de Privacidad y Validación de Consentimiento

## 1. Contexto y Objetivo
El sitio web y suite clínica de **PSICOLAU** (titular: Lic. Ana Laura Gómez Díaz) maneja datos personales ordinarios y datos personales sensibles (salud mental y notas clínicas). Si bien la base de datos cuenta con un blindaje criptográfico de excelencia (AES-256-GCM y blind indexing HMAC-SHA256), la auditoría técnica y regulatoria identificó que el Aviso de Privacidad en `privacidad.html` carece de tres cláusulas obligatorias bajo los **Lineamientos del INAI** y la **NOM-004-SSA3-2012**:
1. Cláusula expresa de remisiones y transferencias a proveedores de infraestructura en la nube (Supabase, Render, Cloudflare, Resend).
2. Cláusula expresa sobre uso de cookies, almacenamiento local y tecnologías de rastreo (Lineamiento Trigésimo Primero).
3. Excepción médica legal de retención y bloqueo previo a la cancelación de notas clínicas (NOM-004-SSA3-2012 - 5 años de conservación obligatoria).

Asimismo, para garantizar trazabilidad técnica del consentimiento en formularios web, se requiere validar a nivel de API (`POST /api/contacto`) la aceptación obligatoria del Aviso de Privacidad (`privacyCheck: true`).

## 2. Usuarios / Actores
- **Consultante / Paciente**: Persona que visita la web, consulta el Aviso de Privacidad, otorga su consentimiento informado en el formulario de contacto o solicita el ejercicio de sus Derechos ARCO.
- **Lic. Ana Laura Gómez Díaz (Responsable)**: Psicóloga titular que custodia los expedientes, atiende solicitudes ARCO y brinda los servicios clínicos.
- **Backend / API (Sistema)**: Validador semántico y procesador de datos que asegura que ninguna solicitud sin consentimiento sea procesada.

## 3. Historias de Usuario
- **H1**: Como **consultante**, quiero acceder a un Aviso de Privacidad integral, transparente y conforme a la ley mexicana, para tener certeza jurídica sobre cómo se protegen mis datos de salud, quién tiene acceso a ellos y cómo ejercer mis derechos ARCO.
- **H2**: Como **psicóloga responsable**, quiero que el Aviso de Privacidad estipule claramente las remisiones a servidores en la nube y la retención obligatoria de 5 años del expediente clínico bajo la NOM-004-SSA3-2012, para prevenir controversias infundadas ante el INAI en solicitudes de cancelación.
- **H3**: Como **sistema de backend**, quiero validar obligatoriamente que todo mensaje de contacto provenga de un usuario que aceptó expresamente el Aviso de Privacidad, rechazando solicitudes no consentidas.

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Módulo Aviso de Privacidad (`privacidad.html`)
- **RF-1 (Transferencias y Remisiones a la Nube)**: EL SISTEMA mantendrá en `privacidad.html` una sección explícita de transferencias y remisiones de datos que declare la prohibición de comercialización o cesión no autorizada de datos, fundamentando las remisiones a encargados tecnológicos (Supabase, Render, Cloudflare, Resend) conforme a los Artículos 36 y 37 fracciones IV y VII de la LFPDPPP y Art. 49 del RLFPDPPP.
- **RF-2 (Declaración de Cookies y Tecnologías Similares)**: EL SISTEMA incluirá en `privacidad.html` una sección conforme al Lineamiento Trigésimo Primero del INAI informando sobre el uso de almacenamiento local técnico (`localStorage` para sesiones autenticadas del panel) y analítica sin cookies invasivas (Cloudflare Web Analytics), declarando la ausencia de cookies publicitarias o de terceros invasivas e indicando cómo desactivarlas en navegadores comunes.
- **RF-3 (Excepción Médica Legal al Derecho de Cancelación NOM-004-SSA3-2012)**: EL SISTEMA estipulará en la sección de Derechos ARCO de `privacidad.html` que, de conformidad con la Norma Oficial Mexicana NOM-004-SSA3-2012 (numeral 5.4) y el Artículo 26 fracción II de la LFPDPPP, las notas y expedientes clínicos deberán conservarse bajo estricta confidencialidad por un periodo mínimo de 5 años contados a partir del último acto clínico, procediendo el bloqueo preventivo previo a cualquier supresión definitiva.
- **RF-4 (Procedimiento y Plazos ARCO Completos)**: EL SISTEMA especificará en `privacidad.html` los plazos legales del Art. 32 de la LFPDPPP: máximo 20 días hábiles para comunicar la determinación al titular y 15 días hábiles adicionales para hacerla efectiva en caso de procedencia.
- **RF-5 (Delimitación Territorial y Domicilio)**: EL SISTEMA precisará la delimitación territorial convencional para oír y recibir notificaciones legales en la Ciudad de México conforme al Lineamiento Vigésimo Primero del INAI.

### Módulo Formulario y Validación (`contacto.html` y Backend)
- **RF-6 (Envío de Consentimiento en Frontend)**: CUANDO el usuario presione "Enviar mensaje" en `contacto.html`, EL SISTEMA en `js/main.js` incluirá en el payload JSON el campo `privacyCheck: true` obtenido de la casilla de verificación requerida.
- **RF-7 (Validación de Consentimiento en Backend)**: CUANDO se reciba una petición en `POST /api/contacto`, EL SISTEMA en `validators.js` validará que `privacyCheck` sea estrictamente un valor booleano `true`.
- **RF-8 (Rechazo por Omisión de Consentimiento)**: SI una petición en `POST /api/contacto` omite `privacyCheck` o envía `false`, ENTONCES EL SISTEMA responderá con HTTP 400 Bad Request y el mensaje: `"Debes aceptar el Aviso de Privacidad para enviar tu consulta"`.

### Módulo Pruebas y Auditoría
- **RF-9 (Pruebas Automatizadas de Consentimiento)**: EL SISTEMA contará con una suite de pruebas de integración en `backend/scripts/` que verifique: (a) rechazo con HTTP 400 ante omisión de `privacyCheck`, (b) rechazo ante `privacyCheck: false`, (c) procesamiento exitoso con HTTP 200 cuando `privacyCheck: true`.
- **RF-10 (No-Regresión de la Suite Backend)**: EL SISTEMA mantendrá el 100% de las pruebas automatizadas existentes en verde ejecutando `npm test` secuencialmente (`--test-concurrency=1`).

## 5. Requisitos No Funcionales & Seguridad
- **Legal & Ética**: Apego total a la LFPDPPP, Reglamento de la LFPDPPP, Lineamientos del INAI y Código Ético del Psicólogo en México.
- **Cero Build Steps**: Los cambios en frontend deben realizarse en HTML semántico y JS vanilla nativo, preservando tiempos de carga inmediatos.
- **Defensa en Profundidad**: Validación de consentimiento doble: validación obligatoria en navegador (`required` en DOM) y validación criptográfica/semántica en servidor con Zod.

## 6. Casos Límite y Manejo de Errores
- **Envío manual sin marcar casilla (bypass de DOM o bots)**: El backend intercepta la solicitud y devuelve HTTP 400 con mensaje semántico claro sin procesar el envío de correo.
- **Solicitud ARCO sobre expediente activo antes de los 5 años**: Se notifica al solicitante la aplicación del bloqueo legal bajo la NOM-004-SSA3-2012 y el Art. 26 fracc. II de la LFPDPPP.
- **Navegadores con cookies bloqueadas**: El sitio web público sigue funcionando al 100% dado que no depende de cookies para su navegación ni para el envío de formularios.

## 7. Fuera de Alcance (Out of Scope)
- Recolección de firmas biométricas avanzadas o módulos de firma digital PKI (el consentimiento formal de inicio de psicoterapia se recaba mediante el formato clínico impreso o PDF en la primera sesión terapéutica).
- Modificaciones estructurales en las tablas de base de datos (el modelo actual con AES-256-GCM y blind indexing ya satisface plenamente la LFPDPPP).

## 8. Criterios de Finalización (Definition of Done)
- [ ] Aviso de Privacidad en `privacidad.html` actualizado con las 3 secciones requeridas (Transferencias, Cookies, Retención NOM-004 y plazos ARCO).
- [ ] Schema Zod en `backend/src/utils/validators.js` actualizado con validación estricta de `privacyCheck`.
- [ ] Script de envío en `js/main.js` actualizado para transmitir `privacyCheck: true`.
- [ ] Suite de pruebas de integración creada y ejecutada con éxito (`npm test` 100% PASS).
- [ ] Documentación SDD actualizada en `overview/session.md` y `overview/tasks.md`.

## 9. Dudas Abiertas / Pendientes de Aclaración
- *Ninguna. Los requisitos derivan directamente del marco normativo federal mexicano y las directrices del INAI.*
