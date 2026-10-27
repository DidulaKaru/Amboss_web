import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both username and access key.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await login(username.trim(), password)
      if (result.success) {
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin'
        navigate(from, { replace: true })
      } else {
        setErrorMessage(result.error || 'Authentication rejected. Verify credentials.')
      }
    } catch {
      setErrorMessage('Communication error with authentication endpoint.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-mono font-medium tracking-tight text-zinc-100">
            AMBOSS // SYS.CTRL
          </h1>
          <p className="text-xs text-zinc-500 font-mono">
            Catalog & Inventory Administrative Gateway
          </p>
        </div>

        {/* Login Box */}
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded border border-red-900/50 bg-red-950/40 text-red-300 text-xs font-mono space-y-1"
              >
                <div className="flex items-center gap-2 font-medium">
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>ACCESS DENIED</span>
                </div>
                <p className="text-[11px] text-red-300/80 pl-5.5">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="admin-username"
                className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-900 font-mono font-medium text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>ENTER</span>
              )}
            </button>
          </form>
        </div>

        {/* Navigation Return */}
        <div className="text-center font-mono text-xs">
          <Link
            to="/"
            className="text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>RETURN TO PUBLIC SITE</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
