export default function LoadingSpinner({ size = 'md', label = '', fullScreen = false }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-blue-700 border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-slate-500 text-sm font-medium">{label}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
