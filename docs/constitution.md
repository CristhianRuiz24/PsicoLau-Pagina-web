# Constitución del proyecto — PsicoLau

Principios innegociables. Toda spec, plan o decisión técnica debe respetarlos.
Si algo en `specs/` contradice esto, se corrige la constitución primero (a propósito, no en silencio) y luego la spec.

## 1. Los datos sensibles de pacientes siempre van cifrados
Notas clínicas, diagnósticos y contenido de expedientes se cifran a nivel de aplicación
(AES-256-GCM) antes de tocar la base de datos. Nunca se guarda texto clínico en claro,
ni en la DB ni en logs ni en backups.

## 2. Entornos dev y producción están siempre separados
Proyectos de Supabase distintos para desarrollo y producción. Ningún script de seed,
migración o prueba corre nunca contra la base de datos de producción. Las credenciales
de un entorno no se reutilizan en el otro.

## 3. Frontend simple, sin dependencias innecesarias
El sitio público se mantiene en HTML5 + CSS vanilla + JS vanilla, multipágina, sin
framework ni build step. Cualquier excepción (ej. el panel interno) debe justificarse
explícitamente en el plan de esa feature, no asumirse por comodidad.

## 4. Autenticación real, sin atajos
No existen bypasses de login en ningún entorno, incluido desarrollo. JWT + bcrypt es
el mecanismo de auth del panel. Ningún endpoint que exponga datos de pacientes queda
sin autenticación, ni siquiera temporalmente "para probar".

## 5. CORS y superficie de ataque explícitos
Los orígenes permitidos se declaran en una lista explícita (`allowedOrigins`), nunca
con `*` ni con configuraciones abiertas "por ahora". Cualquier cambio a esta lista es
una decisión consciente, documentada en el plan de la feature correspondiente.

## 6. El código nuevo no rompe lo que ya funciona para Laura
Cada feature nueva (recordatorios, pagos, expedientes, etc.) se implementa y prueba
sin degradar el flujo de agenda y confirmación de citas que ya está en uso. Antes de
dar una tarea por terminada, se verifica que el resto del panel sigue funcionando.
