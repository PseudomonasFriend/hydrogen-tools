'use client'

interface NumInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  error?: string
  hint?: string
}

export default function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  error,
  hint,
}: NumInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-stretch">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`flex-1 min-w-0 border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
            unit ? 'rounded-l-md rounded-r-none' : 'rounded-md'
          } ${
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {unit && (
          <span className="inline-flex items-center px-2.5 text-xs text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
