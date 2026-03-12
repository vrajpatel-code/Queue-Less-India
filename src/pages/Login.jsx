import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { authAPI } from '../services/api.js'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.login(form)
      const data = response.data

      login(data.token, data.user)
      const redirect = data.user.role === 'citizen' ? '/citizen' : data.user.role === 'worker' ? '/worker' : '/admin'
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err?.message || err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-blue-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite_2s]" />
        <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-emerald-300/20 blur-[100px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite_4s]" />
      </div>

      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden m-6 relative z-10">

        {/* Left: Branding & Info */}
        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-[2rem] m-2">
          {/* Decorative pattern inside the blue card */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent bg-[length:20px_20px]" />

          <div className="relative z-10 mb-12">
            <div className="flex items-center gap-3 mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-white text-xl tracking-tight">QueueLess India</p>
                <p className="text-blue-200 text-sm font-medium tracking-wide uppercase mt-0.5">GovTech Initiative</p>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
              Skip the line.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-emerald-200">
                Own your time.
              </span>
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm font-medium animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              Join millions of citizens saving hours at government offices with our smart real-time queueing engine.
            </p>
          </div>

          <div className="relative z-10 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {/* <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-white mb-1">2M+</p>
              <p className="text-blue-200 text-sm font-medium">Hours Saved</p>
            </div> */}
            <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-white mb-1">100%</p>
              <p className="text-blue-200 text-sm font-medium">Transparency</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back</h2>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
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
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                  autoComplete="username"
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
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 shadow-sm"
                  autoComplete="current-password"
                />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white text-base font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-600 font-medium">
            <span>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline underline-offset-4 transition-colors"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
