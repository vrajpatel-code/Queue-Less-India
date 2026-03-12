import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../App.jsx'
import { queueAPI, servicesAPI } from '../services/api.js'
import { supabase } from '../services/supabase.js'
import { connectSocket, joinDepartment, onQueueUpdated } from '../services/socket.js'
import QueueTable from '../components/QueueTable.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function WorkerDashboard() {
  const { user } = useAuth()
  const [queue, setQueue] = useState([])
  const [currentToken, setCurrentToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [notification, setNotification] = useState({ msg: '', type: 'success' })
  const [services, setServices] = useState([])
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [editEstimate, setEditEstimate] = useState('')
  const [savingService, setSavingService] = useState(false)
  const [departmentDetails, setDepartmentDetails] = useState(null)
  const [isAddingService, setIsAddingService] = useState(false)
  const [newServiceForm, setNewServiceForm] = useState({ name: '', estimate: '' })
  const [addingService, setAddingService] = useState(false)
  const [activeTab, setActiveTab] = useState('queue') // 'queue' or 'services'

  const deptId = user?.department_id

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification({ msg: '', type: 'success' }), 3500)
  }

  const fetchQueue = useCallback(async () => {
    if (!deptId) return
    try {
      const { data } = await queueAPI.getQueue(deptId)
      const items = data.queue || data || []
      setQueue(items)
      const serving = items.find(t => t.status === 'serving' || t.status === 'called')
      if (serving) setCurrentToken(serving)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [deptId])

  useEffect(() => {
    fetchQueue()
    const token = localStorage.getItem('ql_token')
    const socket = connectSocket(token)
    if (deptId) {
      joinDepartment(deptId)

      // Fetch department details to get the district
      supabase.from('departments').select('*').eq('id', deptId).single()
        .then(({ data }) => setDepartmentDetails(data))
        .catch(err => console.error("Could not fetch department", err))

      // Fetch services for this department
      servicesAPI.getByDepartmentId(deptId)
        .then(({ data }) => setServices(data || []))
        .catch(err => console.error("Could not fetch services", err))
    }

    const cleanup = onQueueUpdated(() => fetchQueue())
    return () => cleanup()
  }, [fetchQueue, deptId])

  const handleCallNext = async () => {
    setActionLoading('next')
    try {
      const { data } = await queueAPI.callNext(deptId)
      setCurrentToken(data.token || data)
      await fetchQueue()
      notify(`✅ Called token ${data.token?.number || data.number}`)
    } catch (err) {
      notify(err.response?.data?.message || 'No more tokens in queue', 'error')
    } finally {
      setActionLoading('')
    }
  }

  const handleEditService = (svc) => {
    setEditingServiceId(svc.id)
    setEditEstimate(svc.estimate.toString())
  }

  const handleSaveService = async (id) => {
    setSavingService(true)
    try {
      const { data } = await servicesAPI.updateService(id, { estimate: parseInt(editEstimate, 10) })
      setServices(services.map(s => s.id === id ? data : s))
      setEditingServiceId(null)
      notify('✅ Service estimate updated')
    } catch {
      notify('Failed to update service', 'error')
    } finally {
      setSavingService(false)
    }
  }

  const handleAddService = async () => {
    if (!newServiceForm.name.trim() || !newServiceForm.estimate) {
      notify('Please provide both name and estimate', 'error')
      return;
    }
    setAddingService(true)
    try {
      const { data } = await servicesAPI.createService({
        name: newServiceForm.name,
        estimate: parseInt(newServiceForm.estimate, 10),
        department_id: deptId
      })
      setServices([...services, data])
      setIsAddingService(false)
      setNewServiceForm({ name: '', estimate: '' })
      notify('✅ New service added successfully')
    } catch {
      notify('Failed to add new service', 'error')
    } finally {
      setAddingService(false)
    }
  }

  const handleDone = async (id) => {
    setActionLoading(`done-${id}`)
    try {
      await queueAPI.markDone(id)
      if (currentToken?.id === id) setCurrentToken(null)
      await fetchQueue()
      notify('✅ Token marked as done')
    } catch {
      notify('Failed to update token', 'error')
    } finally {
      setActionLoading('')
    }
  }

  const handleSkip = async (id) => {
    setActionLoading(`skip-${id}`)
    try {
      await queueAPI.skipToken(id)
      if (currentToken?.id === id) setCurrentToken(null)
      await fetchQueue()
      notify('⏭ Token skipped')
    } catch {
      notify('Failed to skip token', 'error')
    } finally {
      setActionLoading('')
    }
  }

  const waitingCount = queue.filter(t => t.status === 'waiting').length
  const doneCount = queue.filter(t => t.status === 'done').length

  if (!deptId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">No Department Assigned</h2>
        <p className="text-slate-500 text-sm max-w-sm">You haven't been assigned to a department yet. Please contact your administrator.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Worker Station</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {user?.department_name || 'Your Department'} · Counter {user?.counter || '—'}
          </p>
        </div>
        <span className="live-badge">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-dot" />
          Live
        </span>
      </div>

      {notification.msg && (
        <div className={`text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2.5 fade-in
          ${notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* TABS */}
      <div className="flex bg-white rounded-xl border border-slate-100 p-1.5 w-max">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'queue'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          Live Queue
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'services'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          Manage Services
        </button>
      </div>

      {activeTab === 'queue' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Waiting', value: waitingCount, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Completed Today', value: doneCount, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Total in Queue', value: queue.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5`}>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color} token-display`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-5">Now Serving</h2>

                {currentToken ? (
                  <div className="text-center py-4">
                    <div className="mb-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Token</p>
                    </div>
                    <div className="token-display text-8xl font-bold text-blue-700 leading-none mb-4">
                      {currentToken.number || currentToken.token_number}
                    </div>
                    <div className="mb-6">
                      <p className="text-slate-600 font-semibold text-lg">{currentToken.citizen_name || currentToken.name || 'Citizen'}</p>
                      {currentToken.service_name && (
                        <span className="inline-flex items-center mt-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase rounded-full shadow-sm">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {currentToken.service_name}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDone(currentToken.id)}
                        disabled={!!actionLoading}
                        className="btn-success flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {actionLoading === `done-${currentToken.id}` ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Done
                      </button>
                      <button
                        onClick={() => handleSkip(currentToken.id)}
                        disabled={!!actionLoading}
                        className="btn-warning flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {actionLoading === `skip-${currentToken.id}` ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        )}
                        Skip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="token-display text-7xl font-bold text-slate-200 leading-none mb-4">—</div>
                    <p className="text-slate-400 text-sm">No token currently being served</p>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button
                    onClick={handleCallNext}
                    disabled={!!actionLoading || waitingCount === 0}
                    className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all text-base flex items-center justify-center gap-2.5 shadow-sm"
                  >
                    {actionLoading === 'next' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Call Next Token
                      </>
                    )}
                  </button>
                  {waitingCount === 0 && (
                    <p className="text-center text-slate-400 text-xs mt-2">Queue is empty</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Queue List</h2>
                  <button
                    onClick={fetchQueue}
                    disabled={loading}
                    className="text-xs text-blue-700 font-semibold hover:text-blue-800 flex items-center gap-1.5"
                  >
                    <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="p-6">
                  <QueueTable
                    queue={queue}
                    loading={loading}
                    showActions
                    onDone={handleDone}
                    onSkip={handleSkip}
                    currentToken={currentToken}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* District & Department Services Management Section */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-2 pt-1">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Services & Estimates</h2>
              <p className="text-sm text-slate-500 mt-1">
                Access and manage the services associated with your assigned district
                {departmentDetails?.city && (
                  <span className="font-semibold text-slate-700 ml-1 bg-slate-100 px-2 py-0.5 rounded-md">({departmentDetails.city})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {departmentDetails && (
                <div className="hidden md:block bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Assigned Department</p>
                  <p className="font-semibold text-blue-900 text-sm leading-tight">{departmentDetails.name}</p>
                </div>
              )}
              <button
                onClick={() => setIsAddingService(!isAddingService)}
                className="btn-primary text-sm whitespace-nowrap"
              >
                + Add Service
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-b-2xl">
            {isAddingService && (
              <div className="mb-6 bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Add New Service</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Aadhaar Update)"
                    value={newServiceForm.name}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Estimate (Min)"
                    value={newServiceForm.estimate}
                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, estimate: e.target.value }))}
                    className="input-field w-full sm:w-32"
                  />
                  <button
                    onClick={handleAddService}
                    disabled={addingService}
                    className="btn-primary text-sm sm:w-auto w-full disabled:opacity-50"
                  >
                    {addingService ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium text-sm">No services configured</p>
                <p className="text-slate-400 text-xs mt-1 max-w-xs">There are no specific services assigned to this department in the current district.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map(svc => (
                  <div key={svc.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-100 inline-block">
                          {departmentDetails?.city || 'District Area'} Service
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{svc.name}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {departmentDetails?.name || 'Assigned Department'}
                      </p>
                    </div>

                    {editingServiceId === svc.id ? (
                      <div className="mt-auto bg-slate-50 -mx-5 -mb-5 p-5 px-5 rounded-b-xl border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Set Estimate (Mins)</label>
                        <input
                          type="number"
                          min="1"
                          value={editEstimate}
                          onChange={(e) => setEditEstimate(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white mb-3"
                          placeholder="e.g. 15"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveService(svc.id)}
                            disabled={savingService || !editEstimate}
                            className="flex-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {savingService ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingServiceId(null)}
                            disabled={savingService}
                            className="flex-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 py-2.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-end justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Estimate</p>
                          <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-black text-slate-800 leading-none">{svc.estimate}</p>
                            <p className="text-sm font-semibold text-slate-500">min</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditService(svc)}
                          className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Change Time
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
