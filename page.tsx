"use client"

import { useState } from "react"
import DataTab from "@/components/regression/data-tab"
import ConfigTab from "@/components/regression/config-tab"
import PredictTab from "@/components/regression/predict-tab"
import ResultsTab from "@/components/regression/results-tab"
import { Button } from "@/components/ui/button"

type TabType = "data" | "configure" | "predict" | "results"

interface Dataset {
  rows: Record<string, number | string>[]
  columns: string[]
  numericColumns?: string[]
  categoricalColumns?: string[]
  encodingMap?: Record<string, Record<string, number>>
}

interface RegressionModel {
  coefficients: number[]
  features: string[]
  r2: number
  rmse: number
  mae: number
  predictions: number[]
  actual: number[]
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("data")
  const [dataset, setDataset] = useState<Dataset>({ rows: [], columns: [] })
  const [selectedTarget, setSelectedTarget] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [model, setModel] = useState<RegressionModel | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleDataUpdate = (newDataset: Dataset) => {
    setDataset(newDataset)
    setSelectedTarget("")
    setSelectedFeatures([])
    showMessage(`Datos cargados: ${newDataset.rows.length} registros, ${newDataset.columns.length} columnas`)
  }

  const handleModelTrain = (trainedModel: RegressionModel) => {
    setModel(trainedModel)
    showMessage("Modelo entrenado correctamente")
    setActiveTab("predict")
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "data", label: "Datos", icon: "📊" },
    { id: "configure", label: "Configurar", icon: "⚙️" },
    { id: "predict", label: "Predecir", icon: "🔮" },
    { id: "results", label: "Resultados", icon: "📈" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Predictor de Ansiedad Académica</h1>
          <p className="text-slate-300">Regresión Lineal Múltiple - Predice basado en factores académicos</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-500 dark:bg-green-900/30 dark:text-green-200"
                : "bg-red-50 text-red-800 border-red-500 dark:bg-red-900/30 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "outline"}
              className="gap-2"
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "data" && <DataTab dataset={dataset} onDataUpdate={handleDataUpdate} />}

          {activeTab === "configure" && (
            <ConfigTab
              dataset={dataset}
              selectedTarget={selectedTarget}
              selectedFeatures={selectedFeatures}
              onTargetChange={setSelectedTarget}
              onFeaturesChange={setSelectedFeatures}
              onTrain={handleModelTrain}
              showMessage={showMessage}
            />
          )}

          {activeTab === "predict" && (
            <PredictTab model={model} dataset={dataset} selectedFeatures={selectedFeatures} showMessage={showMessage} />
          )}

          {activeTab === "results" && <ResultsTab model={model} showMessage={showMessage} />}
        </div>
      </div>
    </div>
  )
}
