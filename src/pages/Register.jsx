import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { authAPI } from '../services/api.js'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      })

      const data = response.data

      if (data.requiresEmailVerification) {
        setInfo('Registration successful. Please check your email to verify your account before signing in.')
        setForm({ name: '', email: '', password: '', confirmPassword: '' })
        return
      }

      // When confirmation emails are off, the token and user are returned immediately
      if (data.token && data.user) {
        login(data.token, data.user)
        navigate('/citizen', { replace: true })
      } else {
        setInfo('Registration successful. You can now sign in.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-purple-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-emerald-300/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite_4s]" />
      </div>

      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden m-6 relative z-10">

        {/* Left: Branding & Info */}
        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-800 to-purple-900 text-white rounded-[2rem] m-2">
          {/* Decorative pattern inside the card */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent bg-[length:20px_20px]" />

          <div className="relative z-10 mb-8">
            <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
              <img src="/src/QueueLess-India-logo.png" alt="QueueLess Logo" className="h-16 lg:h-20 w-auto object-contain drop-shadow-md" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
              Start your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                journey here.
              </span>
            </h1>
            <p className="text-purple-100 text-lg leading-relaxed max-w-sm font-medium animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              Create your account in seconds and say goodbye to long physical queues forever.
            </p>
          </div>

          <div className="relative z-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {[
              { title: 'Real-time Tracking', desc: 'Monitor your position from anywhere' },
              { title: 'Smart Estimates', desc: 'Know exactly when to arrive' },
              { title: 'Paperless', desc: 'Secure digital tokens on your phone' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">{feature.title}</h3>
                  <p className="text-purple-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Create an account</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign up.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all duration-300 shadow-sm"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all duration-300 shadow-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all duration-300 shadow-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Confirm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all duration-300 shadow-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {info && !error && (
              <div className="flex items-center gap-3 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-800 text-sm px-5 py-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white text-base font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-600 font-medium">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:text-purple-800 font-bold hover:underline underline-offset-4 transition-colors"
            >
              Sign in securely
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

