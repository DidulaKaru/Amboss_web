import { useCart } from '../useCart'

/**
 * Non-blocking notice toast driven by the cart context (replaces window.alert).
 * Info notices use a persistent role="status" (polite) region; errors use role="alert".
 */
export default function CartToast() {
  const { notice, dismissNotice } = useCart()

  const content = notice && (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded border px-3 py-2 text-xs shadow-lg ${
        notice.type === 'error'
          ? 'border-red-900/60 bg-red-950 text-red-100'
          : 'border-zinc-700 bg-zinc-900 text-zinc-100'
      }`}
    >
      <span className="flex-1">{notice.message}</span>
      <button
        type="button"
        onClick={dismissNotice}
        aria-label="Dismiss notification"
        className="shrink-0 text-zinc-400 hover:text-zinc-100 cursor-pointer"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4">
      <div role="status" aria-live="polite" aria-atomic="true">
        {notice?.type === 'info' ? content : null}
      </div>
      {/* role="alert" content is announced on insertion, so it is only mounted while an error is shown */}
      {notice?.type === 'error' && (
        <div role="alert" aria-atomic="true">
          {content}
        </div>
      )}
    </div>
  )
}
