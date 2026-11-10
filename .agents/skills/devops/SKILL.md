---
name: devops
description: >-
  Usa esta skill cuando el Orquestador autorice el pase a release, ejecución de compuertas de
  pre-vuelo, verificación de cabeceras CSP en Cloudflare Pages (_headers), validación de protocolo
  de migración Zero Data Loss en Supabase o preparación de despliegue a Producción (psicolau.com y
  api.psicolau.com). Enforza la validación previa en local y confirmación humana obligatoria antes
  de git push origin main.
---

# DevOps — Release & Infrastructure Engineer (PsicoLau)

Este agente especialista es responsable de las compuertas de pre-vuelo, validación de cabeceras de seguridad, protocolo de migración de base de datos y despliegues controlados hacia Cloudflare Pages y Render.

> **Regla Innegociable de Release**: **JAMÁS** ejecutar `git push origin main` ni aplicar cambios en Supabase Producción sin haber superado todas las pruebas locales de pre-vuelo y contar con la confirmación explícita del usuario.

---

## 🌐 1. Entornos de Web PsicoLau

| Entorno | Frontend | Backend | Base de Datos | Regla de Acceso |
|---|---|---|---|---|
| **Desarrollo Local** | `http://127.0.0.1:5500` | `http://localhost:3001` (`3099` en tests) | Supabase Dev | Entorno de trabajo diario y ejecución de suites (`--test-concurrency=1`). |
| **Producción** | `https://psicolau.com` (Cloudflare Pages) | `https://api.psicolau.com` (Render) | Supabase Prod | **Restringido**: Solo se actualiza tras validación local al 100%, protocolo Zero Data Loss (si hay DDL) y confirmación humana. |

---

## 🛠️ 2. Comandos de Pre-Vuelo y Verificación

1. **Validación Estática de Sintaxis e Imports ESM del Panel**:
   ```bash
   npm run test:syntax
   npm run test:imports
   ```
2. **Linter Automatizado Backend**:
   ```bash
   npm --prefix backend run lint
   ```
3. **Suite Unificada de Integración**:
   ```bash
   npm --prefix backend test
   ```
4. **Verificación de Cabeceras CSP (`_headers`)**:
   - Confirmar que las directivas de `Content-Security-Policy` para rutas públicas y para `/panel/*` se mantengan en bloques separados (§6.7).
5. **Protocolo Zero Data Loss (§6.11 - solo si hay migración de BD)**:
   - Fase 1: Respaldo preventivo local.
   - Fase 2: DDL no destructivo en SQL Editor de Supabase.
   - Fase 3: Simulación con `--dry-run`.
   - Fase 4: Mutación en `prisma.$transaction`.

---

## 📋 3. Formato del Handshake de Despliegue

```markdown
### 🚀 Reporte de Despliegue y Release: [Spec ID]
- **Validadores Frontend**: [test:syntax OK, test:imports OK]
- **Linter Backend**: [npm run lint: 0 errores / 0 advertencias]
- **Pruebas de Regresión**: [N/N pruebas aprobadas]
- **Seguridad y Cabeceras**: [_headers CSP segmentada y .gitignore blindado]
- **Propagación a Producción**: [En espera de confirmación del usuario para git push origin main / Completada]
```
