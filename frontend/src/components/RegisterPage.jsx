import { useState } from 'react'
import { register, login } from '../api/auth'

export default function RegisterPage({ onLogin, onGoLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, password)
      // Auto-login after successful registration
      await login(username, password)
      onLogin()
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '))
      } else {
        setError(typeof detail === 'string' ? detail : 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">✨</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Get started for free</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Username
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Minimum 3 characters"
              required
              autoFocus
              minLength={3}
              maxLength={50}
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button className="link-btn" onClick={onGoLogin}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}
