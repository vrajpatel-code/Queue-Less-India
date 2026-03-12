export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-700',
      accent: 'bg-blue-700',
      text: 'text-blue-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      accent: 'bg-emerald-700',
      text: 'text-emerald-700',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      accent: 'bg-orange-600',
      text: 'text-orange-600',
    },
    purple: {
      bg: 'bg-violet-50',
      icon: 'text-violet-700',
      accent: 'bg-violet-700',
      text: 'text-violet-700',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      accent: 'bg-red-600',
      text: 'text-red-600',
    },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs yesterday</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} p-3 rounded-xl`}>
            <Icon className={`w-6 h-6 ${c.icon}`} />
          </div>
        )}
      </div>
      <div className={`mt-4 h-1 w-12 ${c.accent} rounded-full`} />
    </div>
  )
}
