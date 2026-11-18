import { useEffect, useRef, useState } from 'react'
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
  const [uploadError, setUploadError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)

  const stopWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }

  // Terminate any in-flight worker on unmount and invalidate pending responses
  useEffect(() => {
    const requestId = requestIdRef
    const worker = workerRef
    return () => {
      requestId.current++
      worker.current?.terminate()
      worker.current = null
    }
  }, [])

  const applyResult = (result: STLParseResult | undefined) => {
    if (!result || result.triangleCount === 0) {
      setUploadError('The uploaded STL file contains 0 triangles or is empty.')
      setStlResult(null)
    } else {
      setStlResult(result)
      setUploadError(null)
    }
    setIsLoading(false)
  }

  const handleFileLoaded = (file: File, buffer: ArrayBuffer) => {
    // New upload invalidates any previous in-flight parse
    const requestId = ++requestIdRef.current
    stopWorker()

    setIsLoading(true)
    setFileName(file.name)
    setUploadError(null)

    const isStale = () => requestId !== requestIdRef.current

    // The buffer is transferred (detached) to the worker, so the main-thread
    // fallback re-reads the file from disk instead of reusing it.
    const fallbackParse = async () => {
      try {
        const fresh = await file.arrayBuffer()
        if (isStale()) return
        applyResult(parseSTL(fresh))
      } catch (e: unknown) {
        if (isStale()) return
        console.error('Direct STL parsing error:', e)
        const msg = e instanceof Error ? e.message : 'Corrupted or unsupported STL file.'
        setUploadError(msg)
        setStlResult(null)
        setIsLoading(false)
      }
    }

    // Attempt parsing via Web Worker for non-blocking UI
    try {
      const worker = new Worker(
        new URL('../../workers/stlVolumeWorker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker

      worker.onmessage = (e) => {
        if (isStale()) return
        stopWorker()
        if (e.data.success) {
          applyResult(e.data.result)
        } else {
          void fallbackParse()
        }
      }

      worker.onerror = () => {
        if (isStale()) return
        stopWorker()
        void fallbackParse()
      }

      worker.postMessage({ buffer }, [buffer])
    } catch {
      stopWorker()
      void fallbackParse()
    }
  }

  const handleReset = () => {
    setStlResult(null)
    setFileName('')
    setUploadError(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Minimal Header */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Instant Quote
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            Want to know the cost of your 3D print?
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Upload an STL file to get an instant cost estimate for your 3D print.
          </p>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div
            role="alert"
            className="max-w-2xl p-3.5 rounded border border-red-900/60 bg-red-950/40 text-red-200 text-xs font-mono flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-200 underline text-[11px] shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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
      </div>
    </div>
  )
}
