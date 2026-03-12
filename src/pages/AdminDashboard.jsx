import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { departmentAPI, workerAPI, adminAPI, servicesAPI, documentsAPI } from '../services/api.js'
import { connectSocket, onQueueUpdated } from '../services/socket.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const TABS = ['Users', 'Departments', 'Services & Documents']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Users')
  const [departments, setDepartments] = useState([])
  const [workers, setWorkers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [deptForm, setDeptForm] = useState({ name: '', description: '', city: '', state: '' })
  const [workerForm, setWorkerForm] = useState({ name: '', email: '', password: '', department_id: '' })
  const [assignForm, setAssignForm] = useState({ department_id: '', worker_id: '', counter: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [notification, setNotification] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Documents tab states
  const [selectedDeptForDocs, setSelectedDeptForDocs] = useState('')
  const [servicesForDocs, setServicesForDocs] = useState([])
  const [selectedServiceForDocs, setSelectedServiceForDocs] = useState('')
  const [documents, setDocuments] = useState([])
  const [docForm, setDocForm] = useState({ name: '', is_required: true })
  const [loadingDocs, setLoadingDocs] = useState(false)

  const notify = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3500)
  }

  const fetchAll = useCallback(async () => {
    try {
      const [deptsRes, usersRes] = await Promise.allSettled([
        departmentAPI.getAll(),
        adminAPI.getAllUsers(),
      ])

      if (deptsRes.status === 'fulfilled') {
        setDepartments(deptsRes.value.data.departments || deptsRes.value.data || [])
      }
      if (usersRes.status === 'fulfilled') {
        setAllUsers(usersRes.value.data.users || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWorkers = useCallback(async () => {
    try {
      const { data } = await workerAPI.getAll()
      setWorkers(data.workers || data || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchWorkers()
    const token = localStorage.getItem('ql_token')
    connectSocket(token)
    const cleanup = onQueueUpdated(() => fetchAll())
    return () => cleanup()
  }, [fetchAll, fetchWorkers])

  // Fetch Services when Dept selected
  useEffect(() => {
    if (!selectedDeptForDocs) {
      setServicesForDocs([])
      setSelectedServiceForDocs('')
      return
    }
    servicesAPI.getByDepartmentId(selectedDeptForDocs)
      .then(({ data }) => setServicesForDocs(data || []))
      .catch((err) => notify('Failed to load services'))
  }, [selectedDeptForDocs])

  // Fetch Documents when Service selected
  useEffect(() => {
    if (!selectedServiceForDocs) {
      setDocuments([])
      return
    }
    setLoadingDocs(true)
    documentsAPI.getByServiceId(selectedServiceForDocs)
      .then(({ data }) => setDocuments(data || []))
      .catch((err) => notify('Failed to load documents'))
      .finally(() => setLoadingDocs(false))
  }, [selectedServiceForDocs])

  const handleCreateDept = async () => {
    if (!deptForm.name.trim()) {
      setFormError('Department name is required.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await departmentAPI.create(deptForm)
      await fetchAll()
      setDeptForm({ name: '', description: '', city: '', state: '' })
      setShowDeptModal(false)
      notify('✅ Department created successfully!')
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create department')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCreateWorker = async () => {
    if (!workerForm.name.trim() || !workerForm.email.trim() || !workerForm.password.trim()) {
      setFormError('Name, email, and password are required.')
      return
    }
    if (workerForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await workerAPI.create(workerForm)
      await fetchWorkers()
      setWorkerForm({ name: '', email: '', password: '', department_id: '' })
      setShowWorkerModal(false)
      notify('✅ Worker created successfully!')
    } catch (err) {
      setFormError(err.message || 'Failed to create worker')
    } finally {
      setFormLoading(false)
    }
  }


  const handleAssignWorker = async () => {
    if (!assignForm.department_id || !assignForm.worker_id) {
      setFormError('Department and worker are required.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await departmentAPI.assignWorker(assignForm.department_id, {
        worker_id: assignForm.worker_id,
        counter: assignForm.counter,
      })
      await fetchAll()
      setAssignForm({ department_id: '', worker_id: '', counter: '' })
      setShowAssignModal(false)
      notify('✅ Worker assigned successfully!')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to assign worker')
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddDocument = async () => {
    if (!docForm.name.trim() || !selectedServiceForDocs) return
    setLoadingDocs(true)
    try {
      await documentsAPI.addDocument({
        service_id: selectedServiceForDocs,
        name: docForm.name,
        is_required: docForm.is_required
      })
      setDocForm({ name: '', is_required: true })
      const { data } = await documentsAPI.getByServiceId(selectedServiceForDocs)
      setDocuments(data || [])
      notify('✅ Document added successfully!')
    } catch (err) {
      notify('❌ Failed to add document')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to remove this document requirement?')) return
    setLoadingDocs(true)
    try {
      await documentsAPI.deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      notify('✅ Document removed')
    } catch (err) {
      notify('❌ Failed to remove document')
    } finally {
      setLoadingDocs(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">System overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/analytics')} className="btn-secondary flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics
          </button>
          <button onClick={() => { setFormError(''); setShowWorkerModal(true) }} className="btn-secondary flex items-center gap-2 text-sm bg-white border border-slate-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            New Worker
          </button>
          <button onClick={() => { setFormError(''); setShowDeptModal(true) }} className="btn-primary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Department
          </button>
          <button onClick={() => { setFormError(''); setShowAssignModal(true) }} className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Assign Worker
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium px-4 py-3 rounded-xl fade-in">
          {notification}
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150
              ${activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {(activeTab === 'Users' || activeTab === 'Departments') && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      )}

      {activeTab === 'Users' && (() => {
        const filteredUsers = allUsers.filter(u =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">User History & Directory</h2>
                <p className="text-xs text-slate-500 mt-1">Manage system accounts and citizens</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">{filteredUsers.length} total</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label="Loading users..." />
              </div>
            ) : allUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <p className="font-medium text-sm">No users found in database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Department / Location</th>
                      <th className="px-6 py-4">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <div className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-slate-500 text-xs">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                          ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' :
                              user.role === 'worker' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.departments ? (
                            <div>
                              <p className="text-slate-800 font-medium">{user.departments.name}</p>
                              {(user.departments.city || user.departments.state) && (
                                <p className="text-slate-400 text-xs">
                                  {[user.departments.city, user.departments.state].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                          ) : user.role === 'citizen' && Array.isArray(user.tokens) && user.tokens.length > 0 ? (
                            <div>
                              <p className="text-slate-800 font-medium text-xs">Tokens Generated For:</p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {[...new Set(user.tokens.map(t => t?.departments?.name).filter(Boolean))].join(', ')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs font-medium">
                          {new Date(user.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'Departments' && (() => {
        const filteredDepts = departments.filter(d =>
          d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">All Departments</h2>
              <span className="text-xs text-slate-400 font-medium">{filteredDepts.length} registered</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label="Loading departments..." />
              </div>
            ) : departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                </svg>
                <p className="font-medium text-sm">No departments created</p>
                <button onClick={() => setShowDeptModal(true)} className="mt-3 btn-primary text-sm">
                  Create First Department
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredDepts.map((dept) => {
                  const deptWorkers = workers.filter(w => w.department_id === (dept.id || dept._id));
                  return (
                    <div key={dept.id || dept._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 text-sm">{dept.name}</p>
                            {(dept.city || dept.state) && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                                {[dept.city, dept.state].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">{dept.description || 'Government Department'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 justify-between sm:justify-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{dept.queue_count || 0}</p>
                            <p className="text-slate-400 text-xs">in queue</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{deptWorkers.length}</p>
                            <p className="text-slate-400 text-xs">workers</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`status-badge ${dept.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {dept.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                          <button onClick={() => {
                            setFormError('');
                            setAssignForm({ department_id: dept.id || dept._id, worker_id: '', counter: '' });
                            setShowAssignModal(true);
                          }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors title='Assign/Replace Worker'">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'Services & Documents' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-bold text-slate-900">Manage Required Documents</h2>
            <p className="text-xs text-slate-500 mt-1">Configure which documents citizens need to bring for each service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selection Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">1. Select Department</label>
                <select
                  className="input-field appearance-none"
                  value={selectedDeptForDocs}
                  onChange={(e) => setSelectedDeptForDocs(e.target.value)}
                >
                  <option value="">— Choose a department —</option>
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>{d.name} {d.city ? `- ${d.city}` : ''}</option>
                  ))}
                </select>
              </div>

              {selectedDeptForDocs && (
                <div className="fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">2. Select Service</label>
                  <select
                    className="input-field appearance-none"
                    value={selectedServiceForDocs}
                    onChange={(e) => setSelectedServiceForDocs(e.target.value)}
                  >
                    <option value="">— Choose a service —</option>
                    {servicesForDocs.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Documents Column */}
            {selectedServiceForDocs && (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 fade-in">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Required Documents</h3>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Document name (e.g. Aadhaar Card)"
                    className="input-field py-2 text-sm"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  />
                  <button
                    onClick={handleAddDocument}
                    disabled={!docForm.name.trim() || loadingDocs}
                    className="btn-primary py-2 px-4 whitespace-nowrap text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                ) : documents.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No documents added for this service yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map(doc => (
                      <li key={doc.id} className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Remove document"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showDeptModal && (
        <Modal title="Create New Department" onClose={() => setShowDeptModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Name *</label>
              <input
                type="text"
                placeholder="e.g. RTO Mumbai"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <input
                type="text"
                placeholder="Brief description of services"
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={deptForm.city}
                  onChange={(e) => setDeptForm({ ...deptForm, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={deptForm.state}
                  onChange={(e) => setDeptForm({ ...deptForm, state: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            {formError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowDeptModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleCreateDept}
                disabled={formLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAssignModal && (
        <Modal title="Assign Worker" onClose={() => setShowAssignModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department *</label>
              <select
                value={assignForm.department_id}
                onChange={(e) => setAssignForm({ ...assignForm, department_id: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.name} {d.city ? `- ${d.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Worker *</label>
              <select
                value={assignForm.worker_id}
                onChange={(e) => setAssignForm({ ...assignForm, worker_id: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="">— Select Worker —</option>
                {workers.map((w) => (
                  <option key={w.id || w._id} value={w.id || w._id}>{w.name} ({w.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Counter</label>
              <input
                type="text"
                placeholder="Counter number"
                value={assignForm.counter}
                onChange={(e) => setAssignForm({ ...assignForm, counter: e.target.value })}
                className="input-field"
              />
            </div>

            {formError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleAssignWorker}
                disabled={formLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Assign
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showWorkerModal && (
        <Modal title="Create New Worker" onClose={() => setShowWorkerModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={workerForm.name}
                onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                placeholder="worker@example.com"
                value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign Password *</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={workerForm.password}
                onChange={(e) => setWorkerForm({ ...workerForm, password: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Department (Optional)</label>
              <select
                value={workerForm.department_id}
                onChange={(e) => setWorkerForm({ ...workerForm, department_id: e.target.value })}
                className="input-field appearance-none"
              >
                <option value="">— Unassigned —</option>
                {departments.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.name} {d.city ? `- ${d.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowWorkerModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleCreateWorker}
                disabled={formLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
