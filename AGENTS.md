# AGENTS.md — Web PsicoLau

## Contexto del proyecto
Sitio web profesional para Ana Laura Gómez Díaz, psicóloga clínica, bajo la marca
**PSICOLAU — Psicología y Resiliencia**. Es un sitio de salud mental: prioriza calidez,
claridad y confianza clínica por encima de estética "corporativa" o de plantilla genérica.

## Fuente de verdad para contenido
- Toda la información profesional real (formación, experiencia, protocolos, publicaciones)
  está en `Recursos para que use la IA/Currículum Vitae Laura Gómez-3.pdf`.
- El logo oficial está en `Recursos para que use la IA/logo psicolau_Mesa de trabajo 1.png`.
- No inventes datos clínicos, credenciales ni cifras que no estén en el PDF. Si falta un dato,
  pregúntame en vez de inventarlo o dejar un placeholder tipo "Lorem ipsum".

## Estructura del sitio (multipágina)
1. Inicio
2. Sobre mí
3. Áreas de atención (Ansiedad, Depresión, Neurodivergencias en adultos —TEA/TDAH—, Trauma,
   Dependencia emocional, Relaciones saludables)
4. Experiencia y reconocimiento (medios, publicaciones)
5. Contacto (formulario que envía correo + redes sociales)

## Identidad visual
- Rosa/coral: `#EC5E86` — títulos y elementos de marca
- Turquesa: `#3EB8CC` — CTAs, botones, enlaces
- Gris cálido: `#8C8C8C` — texto de cuerpo (nunca negro puro)
- Fondo claro con mucho espacio en blanco; el logo ya es vibrante, no saturar de color
- Tipografía cálida y legible; título con carácter (serif/script suave), cuerpo en sans-serif limpia

## Convenciones técnicas
- Stack: HTML5, CSS vanilla, y JS vanilla (arquitectura multipágina clásica). Mismo nav/header/footer replicados en cada archivo para su fácil edición manual.
- Hosting/Dominio: Cloudflare Pages (deploy automático desde GitHub).
- Formulario de contacto: Integrado con Formspree (plan gratuito).
- Foto de perfil: Extraída temporalmente del CV, fácil de reemplazar luego.
- Responsive obligatorio (móvil, tablet, escritorio)
- Semántica HTML correcta y alt text descriptivo en todas las imágenes
- Formulario de contacto con validación básica antes de enviar

## Verificación antes de dar una tarea por terminada
Antes de marcar cualquier página como lista, usa el navegador integrado y revisa:
- [ ] La página carga sin errores en consola
- [ ] Se ve bien en móvil y en escritorio (usa el redimensionador del navegador integrado)
- [ ] Los colores coinciden con la paleta de arriba (no colores inventados)
- [ ] Todos los enlaces/anclas funcionan
- [ ] El formulario de contacto valida campos y no se rompe con datos vacíos
- [ ] El contenido de texto viene del PDF, no inventado

## Notas de trabajo
- Registra aquí decisiones importantes que tomes (ej. "se eligió stack X porque...") para que
  sesiones futuras del agente tengan ese contexto sin que yo lo repita.
- **2026-08-21**: Se decidió usar HTML/CSS/JS clásico para optimizar carga y simplicidad de mantenimiento en Cloudflare Pages, con formulario gestionado por Formspree.
