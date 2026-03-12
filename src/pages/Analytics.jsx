import { useState, useEffect, useCallback } from 'react'
import { departmentAPI, analyticsAPI, adminAPI } from '../services/api.js'
import StatsCard from '../components/StatsCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList
} from 'recharts'

const PIE_COLORS = ['#2563EB', '#059669', '#F97316', '#DC2626', '#64748B'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    )
}

export default function Analytics() {
    const [departments, setDepartments] = useState([])
    const [summary, setSummary] = useState(null)
    const [dailyData, setDailyData] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [tokenStats, setTokenStats] = useState([])
    const [loading, setLoading] = useState(true)

    // Filtering states
    const [selectedState, setSelectedState] = useState('')
    const [selectedDistrict, setSelectedDistrict] = useState('')

    const fetchAll = useCallback(async () => {
        try {
            const [deptsRes, summaryRes, dailyRes, usersRes, chartRes] = await Promise.allSettled([
                departmentAPI.getAll(),
                analyticsAPI.getSummary(),
                analyticsAPI.getDaily(),
                adminAPI.getAllUsers(),
                adminAPI.getChartData(),
            ])

            if (deptsRes.status === 'fulfilled') {
                setDepartments(deptsRes.value.data.departments || deptsRes.value.data || [])
            }
            if (summaryRes.status === 'fulfilled') {
                setSummary(summaryRes.value.data)
            }
            if (dailyRes.status === 'fulfilled') {
                setDailyData(dailyRes.value.data.daily || dailyRes.value.data || [])
            }
            if (usersRes.status === 'fulfilled') {
                setAllUsers(usersRes.value.data.users || [])
            }
            if (chartRes.status === 'fulfilled') {
                const rawStatuses = chartRes.value.data.statusData || [];
                const statusCounts = rawStatuses.reduce((acc, curr) => {
                    acc[curr.status] = (acc[curr.status] || 0) + 1;
                    return acc;
                }, {});

                const formattedTokens = Object.keys(statusCounts).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: statusCounts[key]
                }));
                setTokenStats(formattedTokens);
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const summaryCards = [
        {
            title: 'Total Tokens Today',
            value: summary?.total_tokens ?? '—',
            subtitle: 'Across all departments',
            color: 'blue',
            trend: summary?.token_trend,
            icon: (props) => (
                <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
        },
        {
            title: 'Tokens Served',
            value: summary?.served ?? '—',
            subtitle: 'Completed today',
            color: 'emerald',
            trend: summary?.served_trend,
            icon: (props) => (
                <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: 'Avg Wait Time',
            value: summary?.avg_wait_time ? `${summary.avg_wait_time}m` : '—',
            subtitle: 'Minutes per citizen',
            color: 'orange',
            icon: (props) => (
                <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: 'Active Departments',
            value: departments.length || '—',
            subtitle: 'Registered offices',
            color: 'purple',
            icon: (props) => (
                <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                </svg>
            ),
        },
    ]

    // Filter derivations
    const states = [...new Set(departments.map(d => d.state).filter(Boolean))].sort()
    const availableDistricts = [...new Set(departments
        .filter(d => !selectedState || d.state === selectedState)
        .map(d => d.city).filter(Boolean)
    )].sort()

    const filteredDepartments = departments.filter(d => {
        if (selectedState && d.state !== selectedState) return false
        if (selectedDistrict && d.city !== selectedDistrict) return false
        return true
    })

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Analytics & Insights</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Deep dive into system performance</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" label="Loading analytics..." />
                </div>
            ) : (
                <>
                    {/* Top KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryCards.map((card) => (
                            <StatsCard key={card.title} {...card} />
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900">Daily Token Volume</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">Last 7 days</p>
                                </div>
                            </div>
                            {dailyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={dailyData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'DM Sans', paddingTop: '12px' }} />
                                        <Bar dataKey="issued" name="Issued" fill="#2563EB" radius={[4, 4, 0, 0]}>
                                            <LabelList dataKey="issued" position="top" fill="#64748b" fontSize={10} fontWeight="bold" />
                                        </Bar>
                                        <Bar dataKey="served" name="Served" fill="#059669" radius={[4, 4, 0, 0]}>
                                            <LabelList dataKey="served" position="top" fill="#64748b" fontSize={10} fontWeight="bold" />
                                        </Bar>
                                        <Bar dataKey="skipped" name="Skipped" fill="#F97316" radius={[4, 4, 0, 0]}>
                                            <LabelList dataKey="skipped" position="top" fill="#64748b" fontSize={10} fontWeight="bold" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-60 flex flex-col items-center justify-center text-slate-300">
                                    <p className="text-sm text-slate-400">No analytics data yet</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-1">
                            <h3 className="font-bold text-slate-900 mb-4">Tokens by Status</h3>
                            {tokenStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={tokenStats} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                                            {tokenStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-8">No token data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Users Pie */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-1">
                            <h3 className="font-bold text-slate-900 mb-4">Users by Role</h3>
                            {allUsers.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Citizens', value: allUsers.filter(u => u.role === 'citizen').length },
                                                { name: 'Workers', value: allUsers.filter(u => u.role === 'worker').length },
                                                { name: 'Admins', value: allUsers.filter(u => u.role === 'admin').length }
                                            ].filter(d => d.value > 0)}
                                            cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        >
                                            <Cell fill="#059669" /> {/* Citizens */}
                                            <Cell fill="#2563EB" /> {/* Workers */}
                                            <Cell fill="#F97316" /> {/* Admins */}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-8">No user data yet</p>
                            )}
                        </div>

                        {/* Department Status Widget with Filters */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
                            <h3 className="font-bold text-slate-900 mb-4">Department Status</h3>

                            <div className="flex gap-4 mb-6">
                                <select
                                    className="input-field appearance-none bg-slate-50 text-sm py-2"
                                    value={selectedState}
                                    onChange={e => {
                                        setSelectedState(e.target.value)
                                        setSelectedDistrict('')
                                    }}
                                >
                                    <option value="">All States</option>
                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                <select
                                    className="input-field appearance-none bg-slate-50 text-sm py-2"
                                    value={selectedDistrict}
                                    onChange={e => setSelectedDistrict(e.target.value)}
                                    disabled={!selectedState}
                                >
                                    <option value="">All Districts</option>
                                    {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {filteredDepartments.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">No departments match this filter.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filteredDepartments.map((dept) => (
                                        <div key={dept.id || dept._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dept.queue_count > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <p className="text-slate-700 text-sm font-medium truncate">
                                                    {dept.name} {dept.city ? `- ${dept.city}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(dept.queue_count || 0) > 10 ? 'bg-red-50 text-red-700' :
                                                    (dept.queue_count || 0) > 5 ? 'bg-amber-50 text-amber-700' :
                                                        'bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                    {dept.queue_count || 0} waiting
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
