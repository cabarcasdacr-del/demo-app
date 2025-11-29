"use client"

import { Card } from "@/components/ui/card"

interface RegressionModel {
  coefficients: number[]
  features: string[]
  r2: number
  rmse: number
  mae: number
  predictions: number[]
  actual: number[]
}

interface ResultsTabProps {
  model: RegressionModel | null
  showMessage: (text: string, type: "success" | "error") => void
}

export default function ResultsTab({ model, showMessage }: ResultsTabProps) {
  if (!model) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">Entrena el modelo primero para ver resultados</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20">
          <div className="text-sm font-medium text-slate-600 mb-2">R² Score</div>
          <div className="text-3xl font-bold text-blue-600">{model.r2.toFixed(4)}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20">
          <div className="text-sm font-medium text-slate-600 mb-2">RMSE</div>
          <div className="text-3xl font-bold text-green-600">{model.rmse.toFixed(4)}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20">
          <div className="text-sm font-medium text-slate-600 mb-2">MAE</div>
          <div className="text-3xl font-bold text-purple-600">{model.mae.toFixed(4)}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20">
          <div className="text-sm font-medium text-slate-600 mb-2">Registros</div>
          <div className="text-3xl font-bold text-orange-600">{model.actual.length}</div>
        </Card>
      </div>

      {/* Coefficients */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Coeficientes del Modelo</h2>
        <div className="space-y-2">
          {model.features.map((feat, i) => {
            const value = model.coefficients[i]
            const isPositive = value >= 0

            return (
              <div
                key={feat}
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border-l-4"
                style={{
                  borderColor: isPositive ? "#10b981" : "#ef4444",
                }}
              >
                <span className="font-medium">{feat}</span>
                <span
                  className="font-mono font-bold text-lg"
                  style={{
                    color: isPositive ? "#10b981" : "#ef4444",
                  }}
                >
                  {isPositive ? "+" : ""}
                  {value.toFixed(6)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Predictions vs Actual */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Predicciones vs Valores Reales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-2 px-3 font-semibold">Real</th>
                <th className="text-left py-2 px-3 font-semibold">Predicción</th>
                <th className="text-left py-2 px-3 font-semibold">Error</th>
                <th className="text-left py-2 px-3 font-semibold">% Error</th>
              </tr>
            </thead>
            <tbody>
              {model.actual.map((actual, i) => {
                const pred = model.predictions[i]
                const error = actual - pred
                const pctError = actual !== 0 ? ((error / actual) * 100).toFixed(2) : "0.00"

                return (
                  <tr key={i} className="border-b border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="py-2 px-3">{actual.toFixed(2)}</td>
                    <td className="py-2 px-3">{pred.toFixed(2)}</td>
                    <td className="py-2 px-3">{error.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span className={error > 0 ? "text-green-600" : "text-red-600"}>{pctError}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
