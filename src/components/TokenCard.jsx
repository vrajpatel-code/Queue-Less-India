import { useState, useEffect } from 'react'

const STATUS_CONFIG = {
  waiting: { label: 'Waiting', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  serving: { label: 'Now Serving', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  called: { label: 'Called', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  done: { label: 'Completed', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  skipped: { label: 'Skipped', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' },
}

export default function TokenCard({ token, position, waitTime, department, isLive = false, departmentObj }) {
  const [blink, setBlink] = useState(false)
  const config = STATUS_CONFIG[token?.status] || STATUS_CONFIG.waiting

  // Break functionality: default 12:30 to 14:00 (90 mins) if no department object passed
  const breakStartString = departmentObj?.break_start || '12:30:00'
  const breakEndString = departmentObj?.break_end || '14:00:00'

  // Parse break hours to minutes from start of day to easily calculate duration
  const breakStartMins = parseInt(breakStartString.split(':')[0]) * 60 + parseInt(breakStartString.split(':')[1])
  const breakEndMins = parseInt(breakEndString.split(':')[0]) * 60 + parseInt(breakEndString.split(':')[1])
  const breakDurationMins = breakEndMins - breakStartMins

  const timeData = (() => {
    if (waitTime === undefined || waitTime === null || !token?.created_at) return null
    const arrivalDate = new Date(token.created_at)

    const isFirst = Number(position) === 1
    let finalWait = isFirst ? 10 : (waitTime || 0)

    // Calculate initial arrival time
    arrivalDate.setMinutes(arrivalDate.getMinutes() + finalWait)

    const arrivalMinsFromMidnight = arrivalDate.getHours() * 60 + arrivalDate.getMinutes()
    const createdAtDate = new Date(token.created_at)
    const createdAtMins = createdAtDate.getHours() * 60 + createdAtDate.getMinutes()

    if (arrivalMinsFromMidnight > breakStartMins && createdAtMins < breakEndMins) {
      // Add pause time only if not generated after break
      const waitTimeIncrement = createdAtMins <= breakStartMins 
        ? breakDurationMins 
        : breakEndMins - createdAtMins

      arrivalDate.setMinutes(arrivalDate.getMinutes() + waitTimeIncrement)
      finalWait += waitTimeIncrement
    }

    return {
      time: arrivalDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      wait: finalWait,
      adjusted: finalWait !== (isFirst ? 10 : waitTime)
    }
  })()

  useEffect(() => {
    if (token?.status === 'called') {
      const interval = setInterval(() => setBlink(b => !b), 600)
      return () => clearInterval(interval)
    }
  }, [token?.status])

  if (!token) return null

  return (
    <div className={`relative bg-white rounded-2xl border-2 ${token.status === 'called' ? 'border-blue-500 shadow-blue-100' : 'border-slate-100'} shadow-lg overflow-hidden fade-in`}>
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Token Number</p>
            <p className="text-xs text-slate-500 font-medium">{department}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} ${token.status === 'called' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
          </div>
        </div>

        <div className={`text-center py-6 ${token.status === 'called' ? (blink ? 'opacity-100' : 'opacity-70') : ''} transition-opacity duration-300`}>
          <p className="token-display text-7xl sm:text-8xl font-bold text-blue-700 tracking-tight leading-none">
            {token.number || token.token_number}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Position</p>
            <p className="text-2xl font-bold text-slate-800">
              {position !== undefined && position !== null ? `#${position}` : '—'}
            </p>
          </div>
          <div className="text-center relative flex flex-col justify-center">
            {Number(position) === 1 ? (
              <p className="text-xs font-bold text-emerald-600 leading-tight flex items-center justify-center h-full">
                You are First To<br />Generate Tocken
              </p>
            ) : (
              <>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Est. Wait</p>
                <p className="text-2xl font-bold text-slate-800 flex justify-center items-center gap-2">
                  {timeData ? `${timeData.wait}m` : '—'}
                  {timeData?.adjusted && (
                    <span title="Includes lunch break time" className="cursor-help w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">!</span>
                  )}
                </p>
              </>
            )}
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Arrival</p>
            <p className="text-2xl font-bold text-slate-800">
              {timeData?.time || '—'}
            </p>
          </div>
        </div>

        {timeData?.adjusted && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center py-2 px-3 rounded-lg font-medium">
            ⏸️ Wait time paused for department break ({breakStartString.slice(0, 5)} to {breakEndString.slice(0, 5)})
          </div>
        )}

        {isLive && (
          <div className="mt-4 flex items-center justify-center">
            <span className="live-badge">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-dot" />
              Live Updates Active
            </span>
          </div>
        )}

        {token.status === 'called' && (
          <div className="mt-4 bg-blue-700 text-white text-center py-3 rounded-xl font-semibold animate-pulse">
            🔔 Please proceed to your counter!
          </div>
        )}
      </div>
    </div>
  )
}
