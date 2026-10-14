/// <reference lib="webworker" />
import { parseSTL, type STLParseResult } from '../features/quote/utils/stlParser'

addEventListener('message', (e: Event) => {
  const msgEvent = e as MessageEvent<{ buffer: ArrayBuffer }>
  try {
    const { buffer } = msgEvent.data
    const result: STLParseResult = parseSTL(buffer)
    // Transfer positions Float32Array buffer for zero-copy performance
    ;(self as unknown as DedicatedWorkerGlobalScope).postMessage(
      { success: true, result },
      [result.positions.buffer]
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse STL file'
    ;(self as unknown as DedicatedWorkerGlobalScope).postMessage({ success: false, error: message })
  }
})
