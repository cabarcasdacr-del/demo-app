"use client"

import type React from "react"

import { useRef } from "react"
import * as XLSX from "xlsx"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Dataset {
  rows: Record<string, number | string>[]
  columns: string[]
  numericColumns: string[]
  categoricalColumns: string[]
  encodingMap: Record<string, Record<string, number>>
}

interface DataTabProps {
  dataset: Dataset
  onDataUpdate: (dataset: Dataset) => void
}

export default function DataTab({ dataset, onDataUpdate }: DataTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encodeCategoricalData = (rows: Record<string, any>[]) => {
    const encodingMap: Record<string, Record<string, number>> = {}
    const numericColumns: Set<string> = new Set()
    const categoricalColumns: Set<string> = new Set()

    // Analyze first row to determine column types
    if (rows.length === 0) return { rows, encodingMap, numericColumns, categoricalColumns }

    const firstRow = rows[0]
    for (const key in firstRow) {
      const value = firstRow[key]
      const numValue = Number.parseFloat(value)
      if (!Number.isNaN(numValue) && value !== "") {
        numericColumns.add(key)
      } else {
        categoricalColumns.add(key)
      }
    }

    // Encode categorical columns
    const encodedRows = rows.map((row) => {
      const encodedRow: Record<string, number | string> = {}
      for (const key in row) {
        if (numericColumns.has(key)) {
          encodedRow[key] = Number.parseFloat(row[key]) || 0
        } else {
          // Initialize encoding map if needed
          if (!encodingMap[key]) {
            encodingMap[key] = {}
          }

          const value = String(row[key]).trim()
          // Assign numeric code if not already assigned
          if (encodingMap[key][value] === undefined) {
            encodingMap[key][value] = Object.keys(encodingMap[key]).length
          }
          encodedRow[key] = encodingMap[key][value]
        }
      }
      return encodedRow
    })

    return {
      rows: encodedRows,
      encodingMap,
      numericColumns: Array.from(numericColumns),
      categoricalColumns: Array.from(categoricalColumns),
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet)

        if (rows.length < 2) {
          throw new Error("Se necesitan al menos 2 filas de datos")
        }

        const {
          rows: encodedRows,
          encodingMap,
          numericColumns,
          categoricalColumns,
        } = encodeCategoricalData(rows as Record<string, any>[])

        onDataUpdate({
          rows: encodedRows,
          columns: Object.keys(encodedRows[0]),
          numericColumns,
          categoricalColumns,
          encodingMap,
        })
      } catch (error) {
        console.error("Error al leer archivo:", error)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const loadExampleData = () => {
    const exampleData = [
      { studyHours: 8, gpa: 3.8, sleepHours: 8, exercise: 5, socialSupport: 8, anxiety: 2.5 },
      { studyHours: 10, gpa: 3.5, sleepHours: 6, exercise: 2, socialSupport: 5, anxiety: 7.2 },
      { studyHours: 5, gpa: 3.2, sleepHours: 7, exercise: 4, socialSupport: 7, anxiety: 4.1 },
      { studyHours: 12, gpa: 4.0, sleepHours: 5, exercise: 1, socialSupport: 4, anxiety: 8.9 },
      { studyHours: 6, gpa: 3.6, sleepHours: 8, exercise: 5, socialSupport: 9, anxiety: 2.3 },
      { studyHours: 9, gpa: 3.4, sleepHours: 6, exercise: 3, socialSupport: 6, anxiety: 6.5 },
      { studyHours: 4, gpa: 3.0, sleepHours: 7, exercise: 4, socialSupport: 8, anxiety: 3.8 },
      { studyHours: 11, gpa: 3.9, sleepHours: 5, exercise: 2, socialSupport: 3, anxiety: 8.4 },
      { studyHours: 7, gpa: 3.7, sleepHours: 8, exercise: 5, socialSupport: 8, anxiety: 3.2 },
      { studyHours: 10, gpa: 3.3, sleepHours: 5, exercise: 1, socialSupport: 5, anxiety: 7.8 },
    ]

    const { rows: encodedRows, encodingMap, numericColumns, categoricalColumns } = encodeCategoricalData(exampleData)

    onDataUpdate({
      rows: encodedRows,
      columns: Object.keys(encodedRows[0]),
      numericColumns,
      categoricalColumns,
      encodingMap,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Card */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Cargar Datos</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Selecciona archivo Excel/CSV/TSV</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="block w-full border-2 border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 transition"
            />
            <p className="text-xs text-slate-500 mt-2">Se converterán automáticamente variables categóricas</p>
          </div>
          <Button onClick={loadExampleData} variant="secondary" className="w-full">
            Cargar Datos de Ejemplo
          </Button>
        </div>
      </Card>

      {/* Data Preview Card */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">
          {dataset.rows.length > 0
            ? `${dataset.rows.length} registros - ${dataset.categoricalColumns?.length || 0} categóricas, ${dataset.numericColumns?.length || 0} numéricas`
            : "Vista previa de datos"}
        </h2>
        {dataset.rows.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    {dataset.columns.map((col) => (
                      <th key={col} className="text-left py-2 px-2 font-semibold">
                        <span>{col}</span>
                        <span className="text-xs text-slate-500 block">
                          {dataset.numericColumns?.includes(col) ? "numérica" : "categórica"}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      {dataset.columns.map((col) => {
                        const value = row[col]
                        const encodingMap = dataset.encodingMap?.[col]
                        const label = encodingMap
                          ? Object.entries(encodingMap).find(([, v]) => v === value)?.[0]
                          : value

                        return (
                          <td key={col} className="py-2 px-2 text-xs">
                            {label || (typeof value === "number" ? value.toFixed(2) : value)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dataset.rows.length > 5 && (
              <p className="text-center text-slate-500 text-sm">+{dataset.rows.length - 5} registros más...</p>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">
            No hay datos cargados. Carga un archivo o usa datos de ejemplo.
          </p>
        )}
      </Card>
    </div>
  )
}
