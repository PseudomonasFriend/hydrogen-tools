'use client'

interface ParamGroupProps {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export default function ParamGroup({
  id,
  label,
  open,
  onToggle,
  children,
}: ParamGroupProps) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={open}
        aria-controls={`param-group-${id}`}
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          id={`param-group-${id}`}
          className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {children}
        </div>
      )}
    </div>
  )
}
