# Plan Técnico 022 — Rediseño Visual de Plantillas de Correo HTML Transaccionales

## 1. Resumen de la Solución Técnica
Reestructurar las funciones generadoras de correo en `backend/src/services/emailService.js` para utilizar componentes de layout HTML con CSS inline robusto. Se creará una función helper interna `construirPlantillaBase({ titulo, subtitulo, contenidoHtml, botonAccion, textoFooter })` que encapsula la estructura HTML común (cabecera corporativa de PsicoLau, contenedor centrado tipo tarjeta, tipografía accesible, botón de acción CTA y pie legal/confidencial).

Con esta arquitectura:
- Eliminamos la duplicación de código CSS inline en cada plantilla (DRY).
- `enviarAvisoLaura`, `enviarConfirmacionPaciente` y `enviarMensajeContacto` solo definirán sus bloques de contenido específicos.
- El texto plano legacy *"Revisa el panel de administración para confirmarla"* se elimina y se sustituye por un botón estilizado `Abrir Panel Clínico →` apuntando al endpoint canónico `https://psicolau.com/panel` (o variable de entorno `PANEL_URL`).

## 2. Alineación con la Constitución
- **Principio 1 (Cifrado de datos sensibles)**: Los correos solo contienen datos administrativos necesarios para el contacto (nombre, fecha, hora, teléfono). Ninguna nota clínica ni información de expedientes médicos viaja por correo.
- **Principio 3 (Frontend simple / Vanilla)**: No se introducen dependencias de plantillas como Handlebars, EJS o MJML; se utiliza JavaScript nativo (template literals con CSS inline).
- **Principio 6 (No romper flujos existentes)**: La firma de las funciones en `emailService.js` se mantiene 100% idéntica, garantizando total retrocompatibilidad con los controladores de citas y contacto.

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                           | Tipo de cambio
-----------------|-----------------------------------|------------------
Backend Service  | backend/src/services/emailService.js| Modificar (Layout & plantillas)
Backend Tests    | backend/scripts/testAislamientoEmail.js | Verificar no-regresión
Backend Scripts  | backend/scripts/previewEmails.js   | Crear script de vista previa HTML local
```

## 4. Estructura Visual de la Plantilla Base (`construirPlantillaBase`)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #EAEAEA;" cellspacing="0" cellpadding="0" border="0">
          <!-- CABECERA INSTITUCIONAL -->
          <tr>
            <td style="background: linear-gradient(135deg, #EC5E86 0%, #D84872 100%); padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">PSICOLAU</h1>
              <p style="margin: 6px 0 0; color: #FFE4EC; font-size: 13px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px;">Psicología y Resiliencia</p>
            </td>
          </tr>
          <!-- CONTENIDO PRINCIPAL -->
          <tr>
            <td style="padding: 32px 28px;">
              {{contenidoHtml}}
              <!-- BOTÓN CTA (OPCIONAL) -->
              {{botonAccion}}
            </td>
          </tr>
          <!-- PIE DE PÁGINA -->
          <tr>
            <td style="background-color: #FDFBF9; padding: 20px 24px; text-align: center; border-top: 1px solid #F0ECE7; font-size: 12px; color: #8C8C8C; line-height: 1.6;">
              {{textoFooter}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 5. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Helper interno `construirPlantillaBase` con CSS inline en tablas HTML** | Máxima compatibilidad asegurada en todos los clientes de correo (incluyendo Outlook de escritorio que utiliza el motor de renderizado de Word) sin romper diseños responsivos. | Usar solo `<div>` con CSS moderno: descartado porque versiones de Outlook y clientes móviles deforman los contenedores. |
| **Template literals nativos de ES6** | Cero dependencias npm adicionales, peso mínimo y ejecución instantánea en Node.js. | Instalar motores como Handlebars, Pug o MJML: descartado por añadir peso innecesario al backend y contravenir la constitución. |
| **Sustituir texto legacy por botón institucional** | Resuelve directamente el requerimiento del usuario eliminando la frase redundante y ofrece un acceso ergonómico directo en un clic. | Mantener el texto debajo del botón: descartado por petición expresa del usuario. |

## 6. Estrategia de Pruebas y Validación
1. **Script de previsualización visual**: Crear `backend/scripts/previewEmails.js` que genere los archivos HTML resultantes en disco para abrirlos en el navegador y constatar visualmente la calidad estética.
2. **Suite de pruebas de integración**: Ejecutar `backend/scripts/testAislamientoEmail.js` y `npm test` verificando que ningún mock ni aserción se rompa.
3. **Linter**: Ejecutar `npm run lint` para confirmar cero errores o variables no utilizadas.
