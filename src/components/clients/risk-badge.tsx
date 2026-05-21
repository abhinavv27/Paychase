export function RiskBadge({ score }: { score: number }) {
  const color =
    score < 0.3
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : score < 0.7
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  const label = score < 0.3 ? 'Low' : score < 0.7 ? 'Medium' : 'High'
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {label} ({(score * 100).toFixed(0)}%)
    </span>
  )
}
