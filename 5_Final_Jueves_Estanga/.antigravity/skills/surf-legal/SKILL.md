---
name: surf-legal
description: Redacción y mantenimiento de documentos legales. Se activa al crear/editar T&C, contratos o políticas.
---

# Skill: Legal

## Documentos obligatorios (en /legal/)
1. terminos-y-condiciones.md
2. contrato-agencia-owner.md
3. contrato-alquiler-template.md
4. politica-danos.md
5. politica-seguros.md
6. politica-cancelacion.md
7. politica-privacidad.md
8. politica-puntos.md
9. politica-multas.md
10. reglamento-owner.md
11. consentimiento-informado.md
12. autorizacion-debito.md
13. acuerdo-confidencialidad.md

## Cláusulas obligatorias en T&C
1. Aceptación con firma digital (Ley 25.506)
2. Consentimiento expreso de débito con monto máximo
3. Silencio = aceptación tras 24h de notificación fehaciente
4. Fotos con EXIF intacto como prueba
5. Triple canal de notificación (email + push + WhatsApp)
6. Mediación previa obligatoria (Ley 26.589)
7. Jurisdicción: Mar del Plata, Argentina
8. Limitación de responsabilidad de la agencia (intermediaria)
9. El seguro NO cubre lesiones personales
10. Definición explícita de daño vs desgaste normal
11. Derecho de admisión
12. Prohibición de contacto fuera de plataforma
13. Retención de datos 5 años (Ley 25.326)
14. Versión + hash de T&C en cada aceptación
15. Doble consentimiento en checkout
16. Derivación a estudios jurídicos para cobros no ejecutables

## Leyes aplicables (Argentina)
- Ley 24.240 (Defensa del Consumidor)
- Ley 25.326 (Protección de Datos Personales)
- Ley 25.506 (Firma Digital)
- Ley 26.589 (Mediación Prejudicial)
- Código Civil y Comercial (contratos)

## Formato de cada documento
```md
# [Título]

**Versión**: X.Y
**Última actualización**: YYYY-MM-DD
**Partes**: [A] ↔ [B]
**Jurisdicción**: Mar del Plata, Argentina

## 1. Definiciones
...
## 2. Objeto
...
## N. Aceptación
...

---
Versión anterior: Y.Y (link)
```

## Reglas de redacción
- Español claro, sin jerga jurídica innecesaria.
- Cada cláusula numerada.
- Términos definidos en mayúsculas la primera vez (ej: "el CONSUMER").
- Ejemplos concretos cuando aclaran (ej: "se considera daño: rotura, fisura...").
- Fechas en formato ISO en metadatos, español en cuerpo.
- Guardar cada versión histórica.
- Aclarar lugar de firma: "Mar del Plata, Argentina".
