# PSICOLAU — Psicología y Resiliencia

Sitio web oficial y profesional de **Ana Laura Gómez Díaz**, psicóloga clínica especializada en evaluación e intervención de personas neurodivergentes y víctimas de violencia y trauma.

## 💻 Tecnologías Utilizadas
- **Estructura:** HTML5 semántico
- **Estilos:** CSS3 (Vanilla), diseño responsivo (Mobile-First)
- **Interactividad:** JavaScript (Vanilla) para navegación móvil
- **Iconografía:** FontAwesome 6.4.0
- **Tipografías:** Lora (Serif) y Outfit (Sans-serif) vía Google Fonts

## 🚀 Despliegue
Este proyecto está optimizado para ser alojado como un sitio estático en **Cloudflare Pages**.
El repositorio incluye un archivo `_headers` en la raíz con políticas de seguridad (CSP, X-Frame-Options, etc.) configuradas automáticamente para Cloudflare.

## ✉️ Formulario de Contacto
El formulario de contacto (ubicado en `contacto.html`) está integrado con **Formspree** para el envío de correos electrónicos sin necesidad de un backend o base de datos. 

## 🔒 Seguridad
- Se han implementado protecciones básicas contra *Tabnabbing* (`rel="noopener noreferrer"`) en enlaces externos.
- Subresource Integrity (SRI) en llamadas a CDNs.
- El currículum y otra información sensible se ignora explícitamente vía `.gitignore`.
