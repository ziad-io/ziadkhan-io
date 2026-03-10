import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password')
      setIsLoading(false)
      return
    }

    // Demo credentials - in production, this would call the backend
    const validEmail = 'admin@gpskharkay.edu'
    const validPassword = 'admin123'

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (email === validEmail && password === validPassword) {
      // Store login state
      localStorage.setItem('gps_dmc_logged_in', 'true')
      localStorage.setItem('gps_dmc_user', email)
      onLogin()
    } else {
      setError('Invalid email or password')
    }

    setIsLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>GPS KHARKAY</h1>
          <h2>DMC Management System</h2>
          <p className="login-subtitle">Secure Login Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span>❌</span> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">⏳ Logging in...</span>
            ) : (
              <span>🔐 Login</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo Credentials:</p>
          <code>admin@gpskharkay.edu / admin123</code>
        </div>
      </div>
    </div>
  )
}

export default Login
