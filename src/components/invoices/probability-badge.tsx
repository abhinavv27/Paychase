interface Props {
  probability: number
  label: string
}

export function ProbabilityBadge({ probability, label }: Props) {
  const color = probability >= 70
    ? 'text-green-700 bg-green-50 border-green-200'
    : probability >= 40
    ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-700 bg-red-50 border-red-200'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {probability}% {label}
    </span>
  )
}
