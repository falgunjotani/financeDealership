/**
 * StatCard.jsx
 * Generic metric display card used on the Offers and Summary pages.
 */

export default function StatCard({ label, value, sub, highlight = false }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'bg-blue-950 border-blue-700' : 'bg-slate-800 border-slate-700'}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-300' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
