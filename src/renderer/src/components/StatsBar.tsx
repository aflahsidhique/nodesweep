interface StatItem {
  value: string
  label: string
}

export function StatsBar({ stats }: { stats: StatItem[] }): JSX.Element {
  return (
    <div className="grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-1 px-2 py-4 text-center">
          <span className="text-xl font-semibold text-slate-900">{stat.value}</span>
          <span className="text-xs text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
