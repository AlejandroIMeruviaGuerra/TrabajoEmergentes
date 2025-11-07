# 🔄 GitHub Actions - CI/CD Workflows

Este directorio contiene los workflows de GitHub Actions para Integración Continua (CI) y Despliegue Continuo (CD).

---

## 📋 Workflows Disponibles

### **ci.yml** - Build & Test Pipeline

Workflow principal de CI que ejecuta en cada push o PR a `dev` y `main`.

#### **Jobs incluidos:**

1. **backend-node** 🟢
   - Instala dependencias con `npm ci`
   - Ejecuta linter (si existe)
   - Ejecuta tests (si existen, tolerante a fallas)
   - Verifica build exitoso

2. **ingestor-java** ☕
   - Configura Java 17
   - Compila con Maven (`mvn package -DskipTests`)
   - Genera artefacto JAR
   - Sube JAR como artifact (7 días de retención)

3. **streamer-java** ☕
   - Configura Java 17
   - Compila con Maven (`mvn package -DskipTests`)
   - Genera artefacto JAR
   - Sube JAR como artifact (7 días de retención)

4. **summary** 📊
   - Espera a que todos los jobs terminen
   - Muestra resumen de resultados
   - Falla si algún job falló

---

## 🚀 Cómo Funciona

### Triggers

El workflow se ejecuta cuando:
- Se hace **push** a las ramas `dev` o `main`
- Se crea un **Pull Request** hacia `dev` o `main`

### Artefactos Generados

Los archivos JAR compilados se guardan como artefactos y están disponibles por 7 días:
- `ingestor-jar` - JAR del ingestor de CSV
- `streamer-jar` - JAR del procesador de streams

#### Descargar artefactos:
1. Ve a la pestaña **Actions** en GitHub
2. Selecciona el workflow run
3. Baja hasta la sección **Artifacts**
4. Descarga el JAR que necesites

---

## ✅ Estado del CI

Para ver el estado actual:

1. **Badge en README** (agregar esto al README.md principal):
   ```markdown
   ![CI Status](https://github.com/AlejandroIMeruviaGuerra/TrabajoEmergentes/workflows/CI%20-%20Build%20%26%20Test/badge.svg)
   ```

2. **Pestaña Actions**: Ve a la pestaña Actions del repositorio

---

## 🔧 Configuración Local

Antes de hacer push, puedes verificar localmente:

### Backend Node.js
```bash
cd BackEnd
npm ci
npm run lint  # Si está configurado
npm test      # Si hay tests
```

### Ingestor Java
```bash
cd ingestor-java
mvn clean package -DskipTests
# Verifica que se genera: target/*.jar
```

### Streamer Java
```bash
cd streamer-java
mvn clean package -DskipTests
# Verifica que se genera: target/*.jar
```

---

## 📝 Mejoras Futuras

- [ ] Agregar tests unitarios reales (actualmente se toleran si no existen)
- [ ] Agregar análisis de cobertura de código
- [ ] Configurar SonarQube/CodeQL para análisis de calidad
- [ ] Agregar workflow de deployment automático
- [ ] Cachear dependencias de Maven más eficientemente
- [ ] Agregar notificaciones (Slack/Discord)
- [ ] Tests de integración con Kafka en contenedor

---

## 🐛 Troubleshooting

### Error: "npm ci" falla

**Causa:** package-lock.json desactualizado

**Solución:**
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

### Error: Maven no encuentra dependencias

**Causa:** Falta configuración en pom.xml o repositorio Maven inaccesible

**Solución:**
- Verifica que `pom.xml` tenga todas las dependencias
- Revisa que Maven Central sea accesible
- Limpia cache: `mvn clean`

### Jobs se cancelan automáticamente

**Causa:** Múltiples pushes rápidos

**Solución:** GitHub Actions cancela workflows antiguos automáticamente. Es normal.

---

## 📚 Referencias

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Node.js Action](https://github.com/actions/setup-node)
- [Java Action](https://github.com/actions/setup-java)
- [Upload Artifact](https://github.com/actions/upload-artifact)

---

**Última actualización:** 7 de noviembre de 2025  
**Mantenedor:** Equipo A - Infra & DevOps
