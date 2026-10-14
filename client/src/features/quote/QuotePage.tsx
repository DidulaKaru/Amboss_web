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

      worker.postMessage({ buffer }, [buffer])
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
            Instant Quotation
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            3D Print Configurator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Upload an STL file to calculate model volume, material weight, and instant manufacturing cost.
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
              <span className="font-mono text-zinc-400">
                Active model: <span className="text-zinc-200">{fileName}</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition"
              >
                Upload different file
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 3D Previewer & Dimensions */}
              <div className="lg:col-span-7 space-y-4">
                <PartViewer
                  stlResult={stlResult}
                  fileName={fileName}
                />

                {/* Geometric Analysis Summary Card */}
                <div className="p-4 rounded-lg border border-zinc-800/80 bg-zinc-900/30 space-y-2 text-xs font-mono">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    Geometry Specifications
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Dimensions</span>
                      <span className="text-zinc-200">
                        {stlResult.boundingBox.dimensions.x} × {stlResult.boundingBox.dimensions.y} × {stlResult.boundingBox.dimensions.z} mm
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Net Volume</span>
                      <span className="text-zinc-200">{stlResult.volumeCm3} cm³</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Surface Area</span>
                      <span className="text-zinc-200">{stlResult.surfaceAreaCm2} cm²</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Topology</span>
                      <span className="text-zinc-200">
                        {stlResult.isManifoldEstimate ? 'Watertight' : 'Mesh warning'}
                      </span>
                    </div>
                  </div>
                </div>
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

        {/* Minimal Manufacturing Reference Strip */}
        <div className="pt-8 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400">
          <div className="space-y-1">
            <h3 className="font-medium text-zinc-200">Equipment</h3>
            <p className="leading-relaxed text-zinc-500">
              Creality K2 Plus (enclosed, up to 350×350×350 mm), Elegoo Centauri Carbon, Bambu Lab A1 AMS, and Elegoo Saturn 4 Ultra 16K resin.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-zinc-200">Turnaround & Delivery</h3>
            <p className="leading-relaxed text-zinc-500">
              Typical lead time 24–48 hours. Pickup at University of Ruhuna (Galle) or nationwide courier delivery.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-zinc-200">Design Verification</h3>
            <p className="leading-relaxed text-zinc-500">
              Every file is verified for wall thickness, overhang angles, and orientation before printing begins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
