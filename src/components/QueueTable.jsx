import LoadingSpinner from './LoadingSpinner.jsx'

const STATUS_STYLES = {
  waiting: 'bg-amber-50 text-amber-700 border border-amber-200',
  serving: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  called: 'bg-blue-50 text-blue-700 border border-blue-200',
  done: 'bg-slate-100 text-slate-500',
  skipped: 'bg-red-50 text-red-600 border border-red-200',
}

export default function QueueTable({ queue = [], loading = false, onDone, onSkip, showActions = false, currentToken }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="md" label="Loading queue..." />
      </div>
    )
  }

  if (!queue.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-medium text-sm">No tokens in queue</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3 pl-2">Token</th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3">Citizen</th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3">Department</th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3">Status</th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3">Time</th>
            {showActions && <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-widest pb-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {queue.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-slate-50 transition-colors duration-100 ${item.id === currentToken?.id ? 'bg-blue-50/50' : ''}`}
            >
              <td className="py-3.5 pl-2">
                <span className="token-display font-bold text-blue-700 text-base">
                  {item.number || item.token_number}
                </span>
              </td>
              <td className="py-3.5">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{item.citizen_name || item.name || '—'}</p>
                  <p className="text-slate-400 text-xs">{item.phone || ''}</p>
                  {item.service_name && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold uppercase rounded-md">
                      {item.service_name}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3.5">
                <span className="text-slate-600 text-sm">{item.department?.name || item.department_name || '—'}</span>
              </td>
              <td className="py-3.5">
                <span className={`status-badge ${STATUS_STYLES[item.status] || STATUS_STYLES.waiting}`}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Waiting'}
                </span>
              </td>
              <td className="py-3.5">
                <span className="text-slate-400 text-xs">
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </td>
              {showActions && (
                <td className="py-3.5">
                  {item.status === 'waiting' && (
                    <div className="flex items-center gap-2">
                      {onDone && (
                        <button
                          onClick={() => onDone(item.id)}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Done
                        </button>
                      )}
                      {onSkip && (
                        <button
                          onClick={() => onSkip(item.id)}
                          className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
