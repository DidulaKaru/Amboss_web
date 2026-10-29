import { useState } from 'react'
import STLDropzone from './components/STLDropzone'
import PartViewer from './components/PartViewer'
import QuoteForm from './components/QuoteForm'
import { parseSTL, type STLParseResult } from './utils/stlParser'
import { MATERIALS, type MaterialOption } from './types'

export default function QuotePage() {
  const [stlResult, setStlResult] = useState<STLParseResult | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(MATERIALS[0])

  const handleFileLoaded = (file: File, buffer: ArrayBuffer) => {
    setIsLoading(true)
    setFileName(file.name)

    // Attempt parsing via Web Worker for non-blocking UI
    try {
      const worker = new Worker(
        new URL('../../workers/stlVolumeWorker.ts', import.meta.url),
        { type: 'module' }
      )

      worker.onmessage = (e) => {
        setIsLoading(false)
        if (e.data.success) {
          setStlResult(e.data.result)
        } else {
          fallbackParse(buffer)
        }
        worker.terminate()
      }

      worker.onerror = () => {
        fallbackParse(buffer)
        worker.terminate()
      }

      worker.postMessage({ buffer })
    } catch {
      fallbackParse(buffer)
    }
  }

  const fallbackParse = (buffer: ArrayBuffer) => {
    try {
      const result = parseSTL(buffer)
      setStlResult(result)
    } catch (e) {
      console.error('Direct STL parsing error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStlResult(null)
    setFileName('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Minimal Header */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Instant Estimation
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            3D Print Configurator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Upload an STL file to get an instant cost estimate for your 3D print.
          </p>
        </div>

        {/* Upload Zone (If no file is active) */}
        {!stlResult && (
          <div className="max-w-2xl">
            <STLDropzone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
          </div>
        )}

        {/* Active Analysis & Quotation View */}
        {stlResult && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-zinc-400 text-[11px] uppercase tracking-wider">
                Model Preview
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition cursor-pointer"
              >
                Upload different file
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 3D Previewer */}
              <div className="lg:col-span-7">
                <PartViewer
                  stlResult={stlResult}
                  fileName={fileName}
                />
              </div>

              {/* Right Column: Interactive Quotation Form */}
              <div className="lg:col-span-5">
                <QuoteForm
                  stlResult={stlResult}
                  fileName={fileName}
                  selectedMaterial={selectedMaterial}
                  onMaterialChange={setSelectedMaterial}
                />
              </div>
            </div>
          </div>
        )}

        {/* Minimal Reference Strip */}
        <div className="pt-6 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <span>Max Single-Piece: 350 × 350 × 350 mm</span>
          <span>Lead Time: 24–48 Hours</span>
          <span>Pickup (UoR / Hapugala) or Courier</span>
        </div>
      </div>
    </div>
  )
}
