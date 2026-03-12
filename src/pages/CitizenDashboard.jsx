import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../App.jsx'
import { queueAPI, departmentAPI, servicesAPI, documentsAPI } from '../services/api.js'
import { connectSocket, joinDepartment, leaveDepartment, onQueueUpdated, disconnectSocket } from '../services/socket.js'
import TokenCard from '../components/TokenCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState('')
  const [loadingServices, setLoadingServices] = useState(false)
  const [activeToken, setActiveToken] = useState(null)
  const [tokenStatus, setTokenStatus] = useState(null)
  const [taking, setTaking] = useState(false)
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [tokenHistory, setTokenHistory] = useState([])
  const [error, setError] = useState('')
  const [notification, setNotification] = useState('')

  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 4000)
  }

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data } = await queueAPI.getUserTokens(user.id)
      setTokenHistory(data.tokens || data || [])

      // Check if there is an active token in history
      const active = (data.tokens || data || []).find(t => ['waiting', 'called', 'serving'].includes(t.status))
      if (active && !activeToken) {
        setActiveToken(active)
      }
    } catch {
      // silent
    }
  }, [user?.id, activeToken])

  useEffect(() => {
    departmentAPI.getAll()
      .then(({ data }) => setDepartments(data.departments || data || []))
      .catch(() => setError('Failed to load departments'))
      .finally(() => setLoadingDepts(false))

    fetchHistory()
  }, [fetchHistory])

  const refreshStatus = useCallback(async (tokenId) => {
    try {
      const { data } = await queueAPI.getStatus(tokenId)
      setTokenStatus(data)
      setActiveToken(prev => ({ ...prev, ...data.token }))
    } catch {
      // silent refresh
    }
  }, [])

  useEffect(() => {
    if (activeToken?.id && !tokenStatus) {
      refreshStatus(activeToken.id)
    }
  }, [activeToken?.id, tokenStatus, refreshStatus])

  useEffect(() => {
    if (!selectedDept) {
      setServices([])
      setSelectedService('')
      return
    }
    setLoadingServices(true)
    servicesAPI.getByDepartmentId(selectedDept)
      .then(({ data }) => setServices(data || []))
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoadingServices(false))
  }, [selectedDept])

  useEffect(() => {
    if (!activeToken?.service_id) {
      setDocuments([])
      return
    }
    setLoadingDocs(true)
    documentsAPI.getByServiceId(activeToken.service_id)
      .then(({ data }) => setDocuments(data || []))
      .catch(() => { /* silent */ })
      .finally(() => setLoadingDocs(false))
  }, [activeToken?.service_id])

  useEffect(() => {
    if (!activeToken) return

    const token = localStorage.getItem('ql_token')
    const socket = connectSocket(token)
    joinDepartment(activeToken.department_id || selectedDept)

    const cleanup = onQueueUpdated((data) => {
      refreshStatus(activeToken.id)
      if (data.called_token === activeToken.number) {
        showNotification('🔔 Your token is being called! Please proceed to the counter.')
      }
    })

    return () => {
      cleanup()
      leaveDepartment(activeToken.department_id || selectedDept)
    }
  }, [activeToken?.id, selectedDept, refreshStatus])

  useEffect(() => {
    if (!activeToken) return
    const interval = setInterval(() => refreshStatus(activeToken.id), 30000)
    return () => clearInterval(interval)
  }, [activeToken?.id, refreshStatus])

  const handleTakeToken = async () => {
    if (!selectedDept) {
      setError('Please select a department first.')
      return
    }
    if (services.length > 0 && !selectedService) {
      setError('Please select a service.')
      return
    }
    setTaking(true)
    setError('')
    try {
      const activeService = services.find(s => s.id === selectedService)
      const payload = {
        department_id: selectedDept,
        service_id: selectedService || null,
        service_name: activeService?.name || null,
        service_estimate: activeService?.estimate || null
      }
      const { data } = await queueAPI.takeToken(payload)
      setActiveToken(data.token || data)
      setTokenStatus(data)
      showNotification('✅ Token generated successfully!')
      fetchHistory()
    } catch (err) {
      console.error('Take Token Error:', err)
      setError(err.message || err.response?.data?.message || 'Failed to generate token. Please try again.')
    } finally {
      setTaking(false)
    }
  }

  const handleCancelToken = async () => {
    if (activeToken?.department_id) {
      leaveDepartment(activeToken.department_id)
    }
    disconnectSocket()
    if (activeToken?.id) {
      try {
        await queueAPI.cancelToken(activeToken.id)
      } catch (e) {
        // silently fail if backend throws error on cancel during demo
      }
    }
    setActiveToken(null)
    setTokenStatus(null)
    setSelectedDept('')
    setSelectedDistrict('')
    fetchHistory()
    showNotification('Token cancelled successfully.')
  }

  // Derive unique districts from departments
  const districts = [...new Set(departments.map(d => d.city).filter(Boolean))].sort()

  // Filter departments by selected district
  const filteredDepartments = selectedDistrict
    ? departments.filter(d => d.city === selectedDistrict)
    : departments

  const selectedDeptName = departments.find(d => d.id === selectedDept || d._id === selectedDept)?.name || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {activeToken && (
          <span className="live-badge">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-dot" />
            Live
          </span>
        )}
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {notification}
        </div>
      )}

      {!activeToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">Take a Token</h2>

              {loadingDepts ? (
                <div className="flex items-center gap-2 py-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-slate-400 text-sm">Loading departments...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {districts.length > 0 && (
                      <div className="text-left">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">1. Select District / City</label>
                        <select
                          className="input-field appearance-none bg-white"
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value)
                            setSelectedDept('') // Reset department when district changes
                          }}
                        >
                          <option value="">— Choose a district —</option>
                          {districts.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="text-left relative">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {districts.length > 0 ? '2. Select Department' : 'Select Department'}
                      </label>
                      <select
                        className="input-field appearance-none bg-white"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        disabled={districts.length > 0 && !selectedDistrict}
                      >
                        <option value="">— Choose a department —</option>
                        {filteredDepartments.map((dept) => (
                          <option key={dept.id || dept._id} value={dept.id || dept._id}>
                            {dept.name} {dept.city ? `- ${dept.city}` : ''} ({dept.queue_count || 0} waiting)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedDept && (
                      <div className="text-left relative fade-in">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          3. Select Service *
                        </label>
                        {loadingServices ? (
                          <div className="text-sm text-slate-500 py-2">Loading services...</div>
                        ) : services.length === 0 ? (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            No services found for this department. Cannot estimate wait time.
                          </div>
                        ) : (
                          <select
                            className="input-field appearance-none bg-white"
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                          >
                            <option value="">— Select a service —</option>
                            {services.map((svc) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.name} (~{svc.estimate} min)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {selectedDept && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 fade-in">
                        {departments.find(d => (d.id || d._id) === selectedDept) && (() => {
                          const dept = departments.find(d => (d.id || d._id) === selectedDept)
                          return (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-blue-900 text-sm">{dept.name}</p>
                                <p className="text-blue-600 text-xs mt-0.5">{dept.description || 'Government Service Department'}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-blue-700 text-lg">{dept.queue_count || 0}</p>
                                <p className="text-blue-500 text-xs">in queue</p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleTakeToken}
                    disabled={taking || !selectedDept || loadingDepts || (services.length > 0 && !selectedService) || services.length === 0}
                    className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {taking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Token...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Take Token
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">How it works</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Select your department' },
                  { step: '2', text: 'Generate your token' },
                  { step: '3', text: 'Track your position live' },
                  { step: '4', text: 'Arrive when called' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-slate-600 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl p-6 text-white">
              <p className="font-bold text-sm mb-1">Today's Stats</p>
              <p className="text-blue-200 text-xs mb-4">Across all departments</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tokens Issued', value: '—' },
                  { label: 'Avg Wait', value: '—' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-3">
                    <p className="token-display text-xl font-bold">{s.value}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
              <h3 className="text-base font-bold text-slate-900 mb-4">My Token History</h3>
              {tokenHistory.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">No previous tokens found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                        <th className="px-4 py-3">Token No.</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {tokenHistory.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">{t.number}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {t.departments?.name || 'Unknown'}
                            {t.service_name && <span className="block text-[10px] text-purple-600 font-semibold">{t.service_name}</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(t.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                              ${['waiting', 'called', 'serving'].includes(t.status) ? 'bg-blue-100 text-blue-700' :
                                t.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                  t.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-500' // cancelled
                              }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TokenCard
              token={activeToken}
              position={tokenStatus?.position}
              waitTime={tokenStatus?.estimated_wait}
              department={selectedDeptName || activeToken.department_name || 'Government Office'}
              departmentObj={departments.find(d => (d.id || d._id) === activeToken.department_id)}
              isLive
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => refreshStatus(activeToken.id)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </button>
              <button
                onClick={handleCancelToken}
                className="text-sm font-semibold text-red-600 hover:text-red-700 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Cancel Token
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Required Documents
              </h3>

              {loadingDocs ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner size="sm" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-3">Please keep these documents ready for your service ({activeToken.service_name || 'General'}):</p>
                  <ul className="space-y-2">
                    {documents.map((doc, idx) => (
                      <li key={doc.id || idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700 font-medium leading-tight">{doc.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-center">
                  <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-700 mb-1">No Specific Documents</p>
                  <p className="text-xs text-slate-500">Please refer to general guidelines or ask at the counter.</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Stay Nearby</p>
                  <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                    You'll be notified when your token is about to be called. Please remain within the premises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  )
}
