# Spec 022 — Rediseño Visual de Plantillas de Correo HTML Transaccionales

## 1. Contexto y Objetivo
Actualmente, los correos electrónicos enviados por el backend mediante la API de Resend para notificar solicitudes de cita y confirmaciones (`enviarAvisoLaura` y `enviarConfirmacionPaciente`) se construyen con HTML básico y crudo (etiquetas `<h2>`, `<ul><li>` y párrafos sin estilos CSS). Esto genera una apariencia descuidada, fría y poco profesional en clientes de correo (Gmail, Outlook, Yahoo) y en la bandeja de previsualización de Resend, además de incluir un texto plano poco ergonómico ("Revisa el panel de administración para confirmarla").

El objetivo de esta especificación es dotar a todos los correos transaccionales del sistema de un diseño visual premium, cálido y responsivo que refleje la identidad institucional de PsicoLau (paleta oficial `#EC5E86` y `#1E94A8`), sustituya los textos planos por componentes de acción claros (botones CTA hacia el panel y enlaces directos a WhatsApp) y garantice la máxima compatibilidad en clientes de correo móvil y de escritorio sin alterar las políticas constitucionales de seguridad ni el aislamiento en pruebas.

## 2. Usuarios / Actores
- **Lic. Laura Gómez (Administradora)**: Recibe avisos estructurados, legibles e inmediatos con los datos del paciente y un botón directo para acceder al panel clínico.
- **Paciente / Solicitante**: Recibe un correo cálido, confiable y estéticamente alineado con la web que confirma la recepción de su solicitud de cita o consulta.

## 3. Historias de Usuario
- **H1**: Como Laura, quiero recibir correos de notificación de citas con un diseño institucional limpio, datos claramente destacados y un botón para abrir el panel, para gestionar mis citas con comodidad y rapidez desde cualquier dispositivo.
- **H2**: Como paciente, quiero recibir una confirmación de cita visualmente atractiva, empática y profesional, para sentirme seguro y saber que mi solicitud está siendo atendida por una profesional de salud mental.
- **H3**: Como Laura, quiero que el texto plano legacy "Revisa el panel de administración para confirmarla" sea eliminado y reemplazado por un botón de acción estilizado.

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Módulo de Aviso de Cita a Laura (`enviarAvisoLaura`)
- **RF-1**: CUANDO un paciente envíe una solicitud de cita desde la web, EL SISTEMA enviará un correo HTML a Laura con la cabecera oficial de PsicoLau (`#EC5E86`), contenedor de tarjeta centrado (`max-width: 600px`), fondo marfil institucional (`#FDFBF9`), y tipografía legible `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif`.
- **RF-2**: EL SISTEMA mostrará los datos de la cita (Paciente, Correo, Teléfono con enlace directo `wa.me`, Fecha/Hora solicitada y Categoría) estructurados en un panel de datos limpio con etiquetas estilizadas, eliminando viñetas `<ul><li>` sin estilo.
- **RF-3**: EL SISTEMA omitirá de forma definitiva el texto plano *"Revisa el panel de administración para confirmarla"* e incluirá en su lugar un botón de acción destacado (*Call to Action*) con fondo turquesa `#1E94A8`, texto blanco y enlace directo a `https://psicolau.com/panel`.

### Módulo de Confirmación al Paciente (`enviarConfirmacionPaciente`)
- **RF-4**: CUANDO se confirme la recepción de una solicitud de cita, EL SISTEMA enviará al paciente un correo con el mismo sistema visual institucional, saludo personalizado, tarjeta destacando la fecha y hora seleccionadas, mensaje empático de bienvenida y firma profesional de la Lic. Laura Gómez Díaz.
- **RF-5**: EL SISTEMA incluirá en el correo del paciente un botón de contacto directo por WhatsApp institucional para dudas urgentes.

### Módulo de Mensaje de Contacto Web (`enviarMensajeContacto`)
- **RF-6**: CUANDO un usuario envíe un mensaje desde el formulario de contacto público, EL SISTEMA notificará a Laura con una plantilla armonizada al nuevo estándar visual, destacando el mensaje en un bloque de cita suave (`#FDFBF9` con borde rosa `#EC5E86`) y botón de respuesta rápida.

### Seguridad y Calidad Transversal
- **RF-7**: EL SISTEMA escapará obligatoriamente todas las variables interpoladas mediante `escapeHtml` para mitigar cualquier riesgo de inyección HTML/XSS en los clientes de correo.
- **RF-8**: EL SISTEMA mantendrá intacto el mecanismo de aislamiento de pruebas (`NODE_ENV === 'test'`, filtro anti-rebote de dominios ficticios y silenciado en desarrollo) estipulado en la Spec 016.

## 5. Requisitos No Funcionales & Seguridad
- **Compatibilidad de Clientes**: CSS 100% inline en atributos `style="..."` para renderizado perfecto en Gmail (web/app), Apple Mail, Outlook (desktop/web) y Yahoo Mail.
- **Identidad Visual**: Respeto irrestricto a la paleta oficial (Rosa `#EC5E86`, Turquesa `#1E94A8` / `#3EB8CC`, Marfil `#FDFBF9`, Texto oscuro `#2D3748`).
- **Seguridad**: Cero exposición de datos sensibles de expedientes (los correos solo contienen datos administrativos de agendamiento o contacto).

## 6. Casos Límite y Manejo de Errores
- **Paciente sin teléfono o sin formato internacional**: El sistema renderiza el valor plano o 'No proporcionado' sin romper el enlace de WhatsApp.
- **Categoría no especificada**: Se muestra badge suave con texto predeterminado 'Consulta Psicológica'.
- **Fallo en servicio de correo (Resend)**: Se captura el error, se registra en logger y no interrumpe la respuesta HTTP del formulario de usuario ni la creación de la cita.

## 7. Fuera de Alcance (Out of Scope)
- No se incorporan frameworks pesados de plantillas (ej. MJML compilado o Handlebars externos); se mantiene Vanilla JS con template literals y CSS inline para máxima simplicidad y velocidad (<1ms de renderizado en Node.js).
- No se modifican los contratos de API ni endpoints existentes.

## 8. Criterios de Finalización (Definition of Done)
- [ ] Plantilla `enviarAvisoLaura` actualizada con diseño visual institucional y botón hacia el panel.
- [ ] Eliminado el texto plano legacy "Revisa el panel de administración para confirmarla".
- [ ] Plantilla `enviarConfirmacionPaciente` actualizada con diseño coherente y firma profesional.
- [ ] Plantilla `enviarMensajeContacto` refinada con el mismo estándar visual.
- [ ] Todos los campos escapados con `escapeHtml`.
- [ ] Linter backend (`npm run lint`) pasando con 0 errores y 0 advertencias.
- [ ] Suite completa de pruebas unificada (`npm test`) pasando al 100% (48/48 PASS).
- [ ] Verificación visual de los correos en navegador o simulador.
