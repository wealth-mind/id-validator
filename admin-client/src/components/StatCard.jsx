/**
 * src/components/StatCard.jsx
 * Metric tile for the dashboard.
 * Props: label, value, icon (JSX), trend (optional: { direction, text })
 *        colorClass (optional Tailwind text colour class for the value)
 */
export default function StatCard({ label, value, icon, trend, colorClass = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="panel p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">{label}</p>
        <span className="text-slate-400 dark:text-white/25">{icon}</span>
      </div>
      <div>
        <h3 className={`text-xl font-bold tracking-tight ${colorClass}`}>
          {value ?? '—'}
        </h3>
        {trend && (
          <p className={`mt-1 text-xs font-medium flex items-center gap-1
            ${trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend.direction === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-white/40'}`}>
            {trend.direction === 'up' && '↑'}
            {trend.direction === 'down' && '↓'}
            {trend.text}
          </p>
        )}
      </div>
    </div>
  );
}
