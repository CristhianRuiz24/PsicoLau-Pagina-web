# AGENTS.md — Web PsicoLau

## Contexto del proyecto
Sitio web profesional para Ana Laura Gómez Díaz, psicóloga clínica, bajo la marca
**PSICOLAU — Psicología y Resiliencia**. Es un sitio de salud mental: prioriza calidez,
claridad y confianza clínica por encima de estética "corporativa" o de plantilla genérica.

## Fuente de verdad para contenido
- Toda la información profesional real (formación, experiencia, protocolos, publicaciones)
  está en `Recursos para que use la IA/Currículum Vitae Laura Gómez-3.pdf`. (Nota: Esta carpeta está ignorada en `.gitignore` por privacidad).
- El logo oficial y las imágenes del sitio se encuentran en la carpeta `assets/`.
- No inventes datos clínicos, credenciales ni cifras que no estén en el PDF. Si falta un dato,
  pregúntame en vez de inventarlo o dejar un placeholder tipo "Lorem ipsum".

## Estructura del sitio (multipágina)
1. Inicio
2. Sobre mí
3. Áreas de atención (Neurodivergencias en adultos, Trauma y violencia, Ansiedad/Depresión y regulación emocional, Neuropsicología clínica, Relaciones y vínculos saludables)
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
- **2026-08-21 (Sesión 1)**: Se decidió usar HTML/CSS/JS clásico para optimizar carga y simplicidad de mantenimiento en Cloudflare Pages, con formulario gestionado por Formspree.
- **2026-08-21 (Sesión 2 - Seguridad y Despliegue)**: 
  - Se configuró el repositorio Git conectándolo a Cloudflare Pages bajo el dominio `psicolau.com`.
  - Se realizó una auditoría de ciberseguridad: Se bloqueó la subida de datos personales ignorando la carpeta de recursos originales en `.gitignore`, se agregaron cabeceras de seguridad CSP en el archivo `_headers` para Cloudflare, se añadió `rel="noopener noreferrer"` a enlaces externos y SRI a los CDNs.
  - Se crearon los archivos `robots.txt`, `sitemap.xml` y `README.md` para buenas prácticas de SEO.
  - Se resolvieron problemas de codificación UTF-8 que corrompieron tildes y guiones tras procesos automatizados.

- **2026-08-21 (Sesión 3 - Ajustes de Contenido y UI)**:
  - Se actualizaron las categorías en "Áreas de Atención" (de 6 a 5 principales) y se usó CSS Flexbox (`display: flex; flex-wrap: wrap; justify-content: center`) para evitar que las tarjetas de la fila inferior se estiren desproporcionadamente.
  - Se añadieron iconos FontAwesome a las tarjetas de vista previa en `index.html`.
  - Se corrigió la especificidad en CSS (`.btn` con `!important`) para evitar que `.nav-links a` sobreescribiera el color blanco del texto en botones al estado normal y de `:hover`.
  - Se alinearon uniformemente los botones de la sección de Libros (`margin-top: auto`) y se corrigieron márgenes en iconos de `experiencia.html`.

- **2026-08-21 (Sesión 4 - Actualización de Experiencia)**:
  - Se añadió el manual "Pensamiento autista y otras neurodivergencias (en proceso)" en la lista de publicaciones de `experiencia.html`.
