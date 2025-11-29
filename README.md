#  Predictor de Ansiedad Académica - Regresión Lineal Múltiple

##  Descripción General

Esta es una aplicación web moderna construida con **Next.js 16** y **React 19** que implementa un modelo de **regresión lineal múltiple** robusto para predecir niveles de ansiedad académica basado en factores como horas de estudio, GPA, horas de sueño, ejercicio y apoyo social.

La aplicación fue diseñada específicamente para superar limitaciones comunes en la inversión de matrices y manejo de datos categóricos, implementando el método **QR Decomposition** que es numéricamente más estable.

---

##  Características Principales

### 1. **Carga Flexible de Datos**
- Soporta archivos **Excel** (.xlsx, .xls), **CSV** y **TSV**
- Conversión automática de variables categóricas a numéricas mediante codificación de etiquetas
- Detección inteligente de tipos de variables (numéricas vs categóricas)
- Datos de ejemplo incluidos para pruebas rápidas

### 2. **Procesamiento de Datos Robusto**
- Manejo de variables categóricas con mapeo de valores
- Validación de datos antes del entrenamiento
- Detección de valores inválidos e infinitos
- Preservación de etiquetas originales para visualización

### 3. **Algoritmo de Regresión Avanzado**
- **QR Decomposition**: Método numéricamente estable que evita problemas de colinealidad
- Validación de varianza en variables
- Detección y manejo de matrices singulares
- Cálculo completo de métricas de rendimiento (R², RMSE, MAE)

### 4. **Interfaz Interactiva**
- Selección visual de variables dependientes e independientes
- Predicción en tiempo real con deslizadores ajustables
- Visualización de métricas y resultados detallados
- Interfaz responsive diseñada con Tailwind CSS

### 5. **Validaciones Completas**
- Verificación de número mínimo de registros
- Validación de varianza de datos
- Detección de valores no finitos
- Mensajes de error descriptivos

---

##  Arquitectura del Proyecto

### Estructura de Carpetas


├── app/
│   ├── page.tsx          # Componente principal (orquestador de estado)
│   ├── layout.tsx        # Layout raíz con metadata
│   └── globals.css       # Estilos globales
│   ├── data-tab.tsx      # Carga y preview de datos
│   ├── config-tab.tsx    # Configuración y entrenamiento
│   ├── predict-tab.tsx   # Interfaz de predicción
│   ├── results-tab.tsx   # Visualización de resultados
│   │   index.ts          # Exportaciones
    └── utils.ts          # Funciones de utilidad
\`\`\`

### Flujo de Datos

\`\`\`
Usuario
  ↓
[DataTab] → Carga archivo
  ↓
Dataset → Codificación categórica
  ↓
[ConfigTab] → Selecciona features/target
  ↓
QR Decomposition → Entrena modelo
  ↓
Model Object (coefficients, R², RMSE, etc.)
  ↓
[PredictTab] ←→ [ResultsTab]
  ↓
Predicciones interactivas
\`\`\`

---

## 🔬 Explicación del Algoritmo de Regresión

### ¿Por Qué QR Decomposition?

El método tradicional de resolver regresión lineal usa:
$$\mathbf{\beta} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$$

**Problema**: La matriz $(\mathbf{X}^T\mathbf{X})$ puede ser singular o mal condicionada si hay colinealidad.

**Solución**: QR Decomposition factoriza $\mathbf{X} = \mathbf{Q}\mathbf{R}$ donde:
- $\mathbf{Q}$ es una matriz ortogonal (columnas ortonormales)
- $\mathbf{R}$ es triangular superior

Esto permite resolver el problema como:
$$\mathbf{R}\mathbf{\beta} = \mathbf{Q}^T\mathbf{y}$$

Usando **back substitution** (sustitución inversa), que es mucho más estable numéricamente.

### Implementación en el Código

\`\`\`typescript
// 1. Descomposición QR (Gram-Schmidt)
const { Q, R } = qrDecomposition(X)

// 2. Calcular Q^T * y
const Qty = multiplyMatrices(transposeMatrix(Q), y.map((v) => [v]))

// 3. Resolver por sustitución inversa
const beta = backSubstitution(R, Qty)
\`\`\`

### Cálculo de Métricas

**R² (Coeficiente de Determinación)**:
$$R^2 = 1 - \frac{SS_{res}}{SS_{tot}} = 1 - \frac{\sum(y_i - \hat{y}_i)^2}{\sum(y_i - \bar{y})^2}$$

- Rango: [0, 1]
- Interpetación: % de varianza explicada por el modelo

**RMSE (Error Cuadrático Medio)**:
$$RMSE = \sqrt{\frac{\sum(y_i - \hat{y}_i)^2}{n}}$$

- Unidades: Mismas que la variable objetivo
- Sensible a errores grandes

**MAE (Error Absoluto Medio)**:
$$MAE = \frac{1}{n}\sum|y_i - \hat{y}_i|$$

- Unidades: Mismas que la variable objetivo
- Más robusto a outliers que RMSE

---

## 💾 Procesamiento de Variables Categóricas

### El Problema

En regresión lineal, solo podemos usar números. Pero los datos a menudo contienen texto:
- "Peaceful" → Variable categórica
- "Disrupted" → Variable categórica

### La Solución: Label Encoding

\`\`\`typescript
// Input: "Study Environment" = ["Peaceful", "Disrupted", "Peaceful", ...]
// Output: "Study Environment" = [0, 1, 0, ...]

const encodingMap = {
  "Study Environment": {
    "Peaceful": 0,
    "Disrupted": 1
  }
}
\`\`\`

### Implementación Paso a Paso

1. **Análisis de columnas**: Detectar cuáles son categóricas
   \`\`\`typescript
   const value = firstRow[key]
   const numValue = Number.parseFloat(value)
   if (Number.isNaN(numValue)) {
     categoricalColumns.add(key)  // Es texto
   }
   \`\`\`

2. **Mapeo único**: Asignar número a cada valor único
   \`\`\`typescript
   if (encodingMap[key][value] === undefined) {
     encodingMap[key][value] = Object.keys(encodingMap[key]).length
   }
   \`\`\`

3. **Reemplazo en datos**: Usar números en lugar de texto
   \`\`\`typescript
   encodedRow[key] = encodingMap[key][value]
   \`\`\`

4. **Preservación**: Guardar mapeo para convertir predicciones
   \`\`\`typescript
   // Más tarde, cuando mostramos al usuario:
   const label = Object.entries(encodingMap).find(([_, v]) => v === value)?.[0]
   \`\`\`

---

## Ejemplo Práctico: Predicción de Ansiedad Académica

### Dataset Original

| StudyHours | GPA | SleepHours | Exercise | SocialSupport | StudyEnvironment | CopingStrategy | BadHabits | Anxiety |
|------------|-----|-----------|----------|---------------|-----------------|----------------|-----------|---------|
| 8 | 3.8 | 8 | 5 | 8 | Peaceful | Meditation | None | 2.5 |
| 10 | 3.5 | 6 | 2 | 5 | Disrupted | Gaming | Smoking | 7.2 |
| 5 | 3.2 | 7 | 4 | 7 | Peaceful | Exercise | None | 4.1 |

### Dataset Codificado

| StudyHours | GPA | SleepHours | Exercise | SocialSupport | StudyEnvironment | CopingStrategy | BadHabits | Anxiety |
|------------|-----|-----------|----------|---------------|-----------------|----------------|-----------|---------|
| 8 | 3.8 | 8 | 5 | 8 | 0 | 0 | 0 | 2.5 |
| 10 | 3.5 | 6 | 2 | 5 | 1 | 1 | 1 | 7.2 |
| 5 | 3.2 | 7 | 4 | 7 | 0 | 0 | 0 | 4.1 |

### Modelo Entrenado

\`\`\`
Anxiety = 
  8.234 (Intercept) +
  -0.156 * StudyHours +
  1.234 * GPA +
  -0.089 * SleepHours +
  0.045 * Exercise +
  -0.234 * SocialSupport +
  0.567 * StudyEnvironment +
  0.123 * CopingStrategy +
  0.345 * BadHabits

R² = 0.87 (El modelo explica 87% de la varianza)
RMSE = 0.92 (Error promedio: ±0.92 puntos en escala 0-10)
MAE = 0.67
\`\`\`

### Predicción Interactiva

Usuario ajusta deslizadores:
- StudyHours: 7
- GPA: 3.7
- SleepHours: 7
- Exercise: 4
- SocialSupport: 8
- StudyEnvironment: "Peaceful" → 0
- CopingStrategy: "Meditation" → 0
- BadHabits: "None" → 0

**Resultado Predicho**: Anxiety = 3.45

---

##  Guía de Uso

### Paso 1: Cargar Datos
1. Ve a la pestaña **"Datos"**
2. Carga un archivo Excel/CSV con tus datos
3. O haz clic en "Cargar Datos de Ejemplo"
4. Verifica la vista previa de los datos

### Paso 2: Configurar Modelo
1. Ve a la pestaña **"Configurar"**
2. Selecciona la **variable dependiente** (lo que quieres predecir)
3. Selecciona las **variables independientes** (características)
4. Haz clic en **"Entrenar Modelo"**

### Paso 3: Hacer Predicciones
1. Ve a la pestaña **"Predecir"**
2. Ajusta los deslizadores para tus valores de entrada
3. La predicción se actualiza en tiempo real
4. Observa la confianza del modelo

### Paso 4: Revisar Resultados
1. Ve a la pestaña **"Resultados"**
2. Analiza las métricas: R², RMSE, MAE
3. Revisa los coeficientes del modelo
4. Consulta la tabla de errores

---

## Stack Tecnológico

### Frontend
- **Next.js 16**: Framework React con SSR/SSG
- **React 19**: Librería UI con hooks modernos
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Utilidades para estilos
- **shadcn/ui**: Componentes accesibles

### Procesamiento
- **XLSX**: Lectura de archivos Excel
- **Álgebra Lineal Pura**: Sin dependencias externas
  - QR Decomposition
  - Back Substitution
  - Multiplicación de matrices
  - Transpuestas

### Validaciones
- Validación de varianza
- Detección de valores no finitos
- Verificación de dimensiones
- Manejo robusto de errores

---

##  Rendimiento y Limitaciones

### ¿Cuándo funciona bien?
-  Datos sin outliers extremos
-  Variables independientes sin alta colinealidad
-  Relación lineal entre variables
-  Mínimo 10-15 observaciones

### Limitaciones Conocidas
- No maneja automáticamente outliers
- Solo relaciones lineales (considerar transformaciones)
- Label encoding pueden perder orden ordinal (estudiar one-hot si es necesario)
- No incluye intervalos de confianza

---

## 🛠️ Instalación y Desarrollo

\`\`\`bash
# Clonar proyecto
git clone <repo-url>
cd predictor-ansiedad

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
\`\`\`

Abre http://localhost:3000 en tu navegador.

---

## Referencias Matemáticas

### QR Decomposition (Gram-Schmidt)
- Wikipedia: https://en.wikipedia.org/wiki/QR_decomposition
- Numerical Analysis by Burden & Faires

### Regresión Lineal
- Introduction to Statistical Learning (ISL)
- Applied Linear Regression by Weisberg

### Codificación de Categorías
- Feature Engineering for Machine Learning
- The elements of Statistical Learning

---


## Contribuciones

¿Encontraste un bug? ¿Ideas para mejoras?

1. Faz un fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

## Tips para Mejores Resultados

1. **Normaliza tus datos**: Si las escalas son muy diferentes, considera normalización
2. **Verifica outliers**: Visualiza tus datos antes de entrenar
3. **Interpreta coeficientes**: Un coeficiente negativo = relación inversa
4. **Evalúa R²**: Por encima de 0.7 es generalmente bueno
5. **Valida**: Usa un conjunto de prueba separado si es posible

---

**¡Listo! Ahora puedes predecir ansiedad académica con confianza basada en datos.**
