/**
 * PageHeader.jsx
 * Consistent page title + subtitle block used across all 3 pages.
 */

export default function PageHeader({ title, subtitle, badge }) {
  return (
    <div className="mb-8">
      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300 mb-3">
          {badge}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1.5 text-slate-400 text-sm sm:text-base">{subtitle}</p>}
    </div>
  )
}
