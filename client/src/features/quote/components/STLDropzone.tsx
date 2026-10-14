import React, { useState, useRef } from 'react'

interface STLDropzoneProps {
  onFileLoaded: (file: File, buffer: ArrayBuffer) => void
  isLoading: boolean
}

export default function STLDropzone({ onFileLoaded, isLoading }: STLDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    setError(null)

    if (!file.name.toLowerCase().endsWith('.stl')) {
      setError('Please upload a valid .stl 3D model file.')
      return
    }

    const maxSizeBytes = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSizeBytes) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB limit.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (buffer) {
        onFileLoaded(file, buffer)
      } else {
        setError('Failed to read file content.')
      }
    }
    reader.onerror = () => {
      setError('Error reading file from disk.')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  // Generate a standard 20mm calibration cube sample for instant testing
  const loadSampleCube = () => {
    setError(null)
    const numTriangles = 12
    const bufferSize = 84 + numTriangles * 50
    const buffer = new ArrayBuffer(bufferSize)
    const view = new DataView(buffer)
    view.setUint32(80, numTriangles, true)

    const size = 20
    const p = [
      [0, 0, 0], [size, 0, 0], [size, size, 0], [0, size, 0],
      [0, 0, size], [size, 0, size], [size, size, size], [0, size, size],
    ]
    const triangles = [
      [p[0], p[2], p[1]], [p[0], p[3], p[2]],
      [p[4], p[5], p[6]], [p[4], p[6], p[7]],
      [p[0], p[1], p[5]], [p[0], p[5], p[4]],
      [p[2], p[3], p[7]], [p[2], p[7], p[6]],
      [p[0], p[4], p[7]], [p[0], p[7], p[3]],
      [p[1], p[2], p[6]], [p[1], p[6], p[5]],
    ]
    let offset = 84
    for (const tri of triangles) {
      view.setFloat32(offset, 0, true); offset += 12
      for (const v of tri) {
        view.setFloat32(offset, v[0], true)
        view.setFloat32(offset + 4, v[1], true)
        view.setFloat32(offset + 8, v[2], true)
        offset += 12
      }
      view.setUint16(offset, 0, true); offset += 2
    }

    const mockFile = new File([buffer], '20mm_calibration_cube.stl', { type: 'model/stl' })
    onFileLoaded(mockFile, buffer)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-10 sm:p-14 rounded-lg border border-dashed transition cursor-pointer ${
          isDragOver
            ? 'border-zinc-500 bg-zinc-900/60'
            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-10 h-10 rounded border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <h3 className="text-sm font-medium text-zinc-200 mb-1 text-center">
          {isLoading ? 'Reading STL mesh geometry...' : 'Upload STL file'}
        </h3>

        <p className="text-xs text-zinc-500 text-center max-w-sm mb-4">
          Drag and drop an .stl file here, or click to browse. Maximum 50MB.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            loadSampleCube()
          }}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition"
        >
          Or load a sample 20mm cube
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded border border-red-900/50 bg-red-950/30 text-red-300 text-xs">
          {error}
        </div>
      )}
    </div>
  )
}
