"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface RegressionModel {
  coefficients: number[]
  features: string[]
  r2: number
  rmse: number
  mae: number
  predictions: number[]
  actual: number[]
}

interface PredictTabProps {
  model: RegressionModel | null
  dataset: {
    rows: Record<string, number | string>[]
    columns: string[]
    numericColumns?: string[]
    categoricalColumns?: string[]
    encodingMap?: Record<string, Record<string, number>>
  }
  selectedFeatures: string[]
  showMessage: (text: string, type: "success" | "error") => void
}

export default function PredictTab({ model, dataset, selectedFeatures, showMessage }: PredictTabProps) {
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  const [prediction, setPrediction] = useState<number | null>(null)

  const sliderRanges = useMemo(() => {
    const ranges: Record<string, [number, number]> = {}
    selectedFeatures.forEach((feat) => {
      const values = dataset.rows.map((r) => Number.parseFloat(String(r[feat])) || 0)
      const min = Math.min(...values)
      const max = Math.max(...values)
      ranges[feat] = [min, max]
      setSliderValues((prev) => ({
        ...prev,
        [feat]: (min + max) / 2,
      }))
    })
    return ranges
  }, [selectedFeatures, dataset])

  const handlePrediction = () => {
    if (!model) {
      showMessage("Entrena el modelo primero", "error")
      return
    }

    const values = [1, ...selectedFeatures.map((feat) => sliderValues[feat] || 0)]
    const pred = model.coefficients.reduce((sum, coef, i) => sum + coef * values[i], 0)
    setPrediction(pred)
  }

  if (!model) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">Entrena el modelo primero en la pestaña de Configurar</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sliders */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Ajusta los Parámetros</h2>
        <div className="space-y-6">
          {selectedFeatures.map((feat) => {
            const [min, max] = sliderRanges[feat] || [0, 1]
            const current = sliderValues[feat] || (min + max) / 2
            const encodingMap = dataset.encodingMap?.[feat]
            const isCategory = encodingMap !== undefined
            const label = isCategory
              ? Object.entries(encodingMap).find(([, v]) => v === Math.round(current))?.[0]
              : null

            return (
              <div key={feat}>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium">{feat}</label>
                  <span className="text-lg font-bold text-blue-600">{label || current.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={isCategory ? "1" : "0.1"}
                  value={current}
                  onChange={(e) =>
                    setSliderValues((prev) => ({
                      ...prev,
                      [feat]: Number.parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{min.toFixed(1)}</span>
                  <span>{max.toFixed(1)}</span>
                </div>
              </div>
            )
          })}
          <Button onClick={handlePrediction} size="lg" className="w-full">
            Hacer Predicción
          </Button>
        </div>
      </Card>

      {/* Prediction Result */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Resultado de Predicción</h2>
        {prediction !== null ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-6 rounded-lg border-2 border-green-500">
              <div className="text-5xl font-bold text-green-600 mb-2">{prediction.toFixed(2)}</div>
              <div className="text-slate-600">Índice de ansiedad predicho</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Parámetros utilizados:</h3>
              <div className="space-y-2 text-sm">
                {selectedFeatures.map((feat) => {
                  const encodingMap = dataset.encodingMap?.[feat]
                  const value = sliderValues[feat] || 0
                  const label = encodingMap
                    ? Object.entries(encodingMap).find(([, v]) => v === Math.round(value))?.[0]
                    : null
                  return (
                    <div key={feat} className="flex justify-between">
                      <span className="text-slate-600">{feat}:</span>
                      <span className="font-mono font-bold">{label || value.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-lg">
            <p className="text-slate-500">Ajusta los parámetros y haz una predicción</p>
          </div>
        )}
      </Card>
    </div>
  )
}
