"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ConfigTabProps {
  dataset: {
    rows: Record<string, number | string>[]
    columns: string[]
    numericColumns?: string[]
    categoricalColumns?: string[]
    encodingMap?: Record<string, Record<string, number>>
  }
  selectedTarget: string
  selectedFeatures: string[]
  onTargetChange: (target: string) => void
  onFeaturesChange: (features: string[]) => void
  onTrain: (model: any) => void
  showMessage: (text: string, type: "success" | "error") => void
}

export default function ConfigTab({
  dataset,
  selectedTarget,
  selectedFeatures,
  onTargetChange,
  onFeaturesChange,
  onTrain,
  showMessage,
}: ConfigTabProps) {
  const handleTrainModel = () => {
    if (!selectedTarget || selectedFeatures.length === 0) {
      showMessage("Selecciona variable dependiente e independientes", "error")
      return
    }

    if (dataset.rows.length < 2) {
      showMessage("Se necesitan al menos 2 registros", "error")
      return
    }

    try {
      const numericRows = dataset.rows.map((row) => {
        const numRow: Record<string, number> = {}
        for (const col of dataset.columns) {
          numRow[col] = Number.parseFloat(String(row[col])) || 0
        }
        return numRow
      })

      const model = trainRegressionModel(numericRows, selectedTarget, selectedFeatures)
      onTrain(model)
    } catch (error) {
      showMessage(`Error: ${(error as Error).message}`, "error")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Target Selection */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Variable Dependiente (Target)</h2>
        <div className="space-y-2">
          {dataset.columns.map((col) => (
            <label
              key={col}
              className="flex items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded cursor-pointer"
            >
              <input
                type="radio"
                name="target"
                value={col}
                checked={selectedTarget === col}
                onChange={(e) => onTargetChange(e.target.value)}
                className="w-4 h-4"
              />
              <span className="ml-3">{col}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Features Selection */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Variables Independientes (Features)</h2>
        <div className="space-y-2">
          {dataset.columns.map((col) => (
            <label
              key={col}
              className={`flex items-center p-2 rounded cursor-pointer ${
                col === selectedTarget
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-slate-50 dark:hover:bg-slate-900/30"
              }`}
            >
              <input
                type="checkbox"
                value={col}
                disabled={col === selectedTarget}
                checked={selectedFeatures.includes(col)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onFeaturesChange([...selectedFeatures, col])
                  } else {
                    onFeaturesChange(selectedFeatures.filter((f) => f !== col))
                  }
                }}
                className="w-4 h-4"
              />
              <span className="ml-3">{col}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Train Button */}
      <div className="lg:col-span-2 text-center">
        <Button onClick={handleTrainModel} size="lg" className="gap-2">
          Entrenar Modelo
        </Button>
      </div>
    </div>
  )
}

function trainRegressionModel(data: Record<string, number>[], target: string, features: string[]): any {
  const n = data.length

  if (n < features.length + 2) {
    throw new Error(`Se necesitan al menos ${features.length + 2} registros (tienes ${n})`)
  }

  // Build X matrix with intercept column
  const X: number[][] = []
  for (let i = 0; i < n; i++) {
    const row: number[] = [1]
    for (const feat of features) {
      const val = Number.parseFloat(String(data[i][feat]))
      if (Number.isNaN(val) || !isFinite(val)) {
        throw new Error(`Valor inválido en ${feat}: ${data[i][feat]}`)
      }
      row.push(val)
    }
    X.push(row)
  }

  // Build y vector
  const y: number[] = []
  for (let i = 0; i < n; i++) {
    const val = Number.parseFloat(String(data[i][target]))
    if (Number.isNaN(val) || !isFinite(val)) {
      throw new Error(`Valor inválido en ${target}: ${data[i][target]}`)
    }
    y.push(val)
  }

  // Validate variance
  const meanY = y.reduce((a, b) => a + b, 0) / n
  const varianceY = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0) / n
  if (varianceY < 1e-10) {
    throw new Error("La variable dependiente no tiene varianza")
  }

  const { Q, R } = qrDecomposition(X)

  // Solve R * beta = Q^T * y
  const Qty = multiplyMatrices(
    transposeMatrix(Q),
    y.map((v) => [v]),
  ).map((row) => row[0])
  const beta = backSubstitution(R, Qty)

  if (beta.some((v) => !isFinite(v))) {
    throw new Error(
      "El modelo no puede ser entrenado con estos datos. Intenta normalizar o seleccionar otras variables.",
    )
  }

  // Calculate predictions
  const predictions = X.map((row) => row.reduce((sum, val, i) => sum + val * beta[i], 0))

  // Calculate metrics
  const ssTotal = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0)
  const ssRes = y.reduce((sum, yi, i) => sum + (yi - predictions[i]) ** 2, 0)
  const r2 = ssTotal > 0 ? 1 - ssRes / ssTotal : 0
  const rmse = Math.sqrt(Math.max(0, ssRes / n))
  const mae = y.reduce((sum, yi, i) => sum + Math.abs(yi - predictions[i]), 0) / n

  return {
    coefficients: beta,
    features: ["Intercept", ...features],
    r2: Math.max(0, Math.min(1, r2)),
    rmse,
    mae,
    predictions,
    actual: y,
    method: "QR Decomposition",
  }
}

function qrDecomposition(A: number[][]): { Q: number[][]; R: number[][] } {
  const m = A.length
  const n = A[0].length
  const Q: number[][] = Array(m)
    .fill(0)
    .map(() => Array(n).fill(0))
  const R: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (let j = 0; j < n; j++) {
    let v = A.map((row) => row[j])

    for (let i = 0; i < j; i++) {
      const qCol = Q.map((row) => row[i])
      const dotProduct = dotVectors(v, qCol)
      R[i][j] = dotProduct
      v = v.map((v_k, idx) => v_k - dotProduct * qCol[idx])
    }

    const norm = Math.sqrt(dotVectors(v, v))
    if (norm < 1e-10) {
      throw new Error("Las variables tienen colinealidad. Intenta con menos variables.")
    }
    R[j][j] = norm
    Q.forEach((_, i) => {
      Q[i][j] = v[i] / norm
    })
  }

  return { Q, R }
}

function backSubstitution(R: number[][], b: number[]): number[] {
  const n = R.length
  const x: number[] = Array(n).fill(0)

  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i]
    for (let j = i + 1; j < n; j++) {
      sum -= R[i][j] * x[j]
    }
    if (Math.abs(R[i][i]) < 1e-10) {
      throw new Error("Sistema singular en back substitution")
    }
    x[i] = sum / R[i][i]
  }

  return x
}

function dotVectors(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0)
}

function transposeMatrix(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]))
}

function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const result = Array(a.length)
    .fill(0)
    .map(() => Array(b[0].length).fill(0))

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < b.length; k++) {
        result[i][j] += a[i][k] * b[k][j]
      }
    }
  }
  return result
}
