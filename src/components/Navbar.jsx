/**
 * Navbar.jsx
 * Top navigation bar – shows brand name, active route highlight, and a
 * breadcrumb-style step indicator matching the 3-page deal workflow.
 */

import { NavLink } from 'react-router-dom'

const steps = [
  { label: 'Create Deal', path: '/create' },
  { label: 'Lender Offers', path: '/offers' },
  { label: 'Deal Summary', path: '/summary' },
]

export default function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              AutoFinance <span className="text-blue-400">F&amp;I</span>
            </span>
          </div>

          {/* Step navigation */}
          <div className="hidden sm:flex items-center gap-1">
            {steps.map((step, idx) => (
              <NavLink
                key={step.path}
                to={step.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                {step.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
