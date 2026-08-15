/**
 * Summary.jsx  –  Step 3 of the F&I workflow
 *
 * Displays the finalized deal with a complete financial breakdown:
 *  - Customer profile
 *  - Vehicle & loan details
 *  - Selected lender, APR, term
 *  - Monthly payment
 *  - Total cost of financing (principal + interest)
 *  - Amortisation highlight (first vs last payment interest/principal split)
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeal } from '../context/DealContext'
import { getLoanApplication } from '../services/firestoreService'
import { calcTotalInterest, formatCurrency } from '../utils/financeCalculations'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import StatCard from '../components/StatCard'

export default function Summary() {
  const navigate = useNavigate()
  const { activeDealId, clearDeal } = useDeal()

  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDeal = useCallback(async () => {
    if (!activeDealId) {
      setError('No active deal found. Please start from Step 1.')
      setLoading(false)
      return
    }

    try {
      const data = await getLoanApplication(activeDealId)
      if (!data) {
        setError('Deal not found.')
        setLoading(false)
        return
      }
      if (!data.selectedLender) {
        setError('No lender has been selected yet. Please complete Step 2 first.')
        setLoading(false)
        return
      }
      setDeal(data)
    } catch (err) {
      console.error('Error loading deal summary:', err)
      setError('Failed to load deal. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeDealId])

  useEffect(() => {
    loadDeal()
  }, [loadDeal])

  function handleNewDeal() {
    clearDeal()
    navigate('/create')
  }

  if (loading) return <LoadingSpinner message="Loading deal summary…" />

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <ErrorAlert message={error} />
        <button onClick={() => navigate('/offers')} className="mt-4 text-blue-400 hover:underline text-sm">
          ← Back to Offers
        </button>
      </div>
    )
  }

  const totalInterest = calcTotalInterest(deal.monthlyPayment, deal.selectedTerm, deal.loanAmount)
  const totalCost = deal.loanAmount + totalInterest
  // Total out-of-pocket including down payment and trade-in offset
  const totalOutOfPocket = deal.vehiclePrice + totalInterest - deal.tradeInValue
  // Interest-to-principal ratio as a percentage
  const interestRatio = ((totalInterest / deal.loanAmount) * 100).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        badge="Step 3 of 3 — Deal Finalized"
        title="Deal Summary"
        subtitle="Review the complete financial breakdown before printing the deal jacket."
      />

      {/* ── Key metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Monthly Payment" value={formatCurrency(deal.monthlyPayment)} highlight />
        <StatCard label="APR" value={`${deal.selectedRate}%`} sub={`${deal.selectedTerm} months`} />
        <StatCard label="Total Interest" value={formatCurrency(totalInterest)} />
        <StatCard label="Total Cost" value={formatCurrency(totalCost)} sub="Loan + Interest" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ── Customer & Vehicle ── */}
        <InfoPanel title="Customer Profile" icon="👤">
          <InfoRow label="Customer" value={deal.customerName} />
          <InfoRow label="Credit Score (FICO)" value={deal.creditScore} />
          <InfoRow label="Annual Income" value={formatCurrency(deal.annualIncome)} />
        </InfoPanel>

        <InfoPanel title="Vehicle Details" icon="🚗">
          <InfoRow label="Vehicle Price" value={formatCurrency(deal.vehiclePrice)} />
          <InfoRow label="Down Payment" value={formatCurrency(deal.downPayment)} />
          <InfoRow label="Trade-In Value" value={formatCurrency(deal.tradeInValue)} />
          <InfoRow label="Net Loan Amount" value={formatCurrency(deal.loanAmount)} highlight />
        </InfoPanel>

        {/* ── Lender Terms ── */}
        <InfoPanel title="Financing Terms" icon="🏦">
          <InfoRow label="Lender" value={deal.selectedLender} />
          <InfoRow label="Interest Rate (APR)" value={`${deal.selectedRate}%`} />
          <InfoRow label="Term" value={`${deal.selectedTerm} months`} />
          <InfoRow label="Monthly Payment" value={formatCurrency(deal.monthlyPayment)} highlight />
        </InfoPanel>

        {/* ── Total Cost Breakdown ── */}
        <InfoPanel title="Total Cost of Financing" icon="📊">
          <InfoRow label="Principal (Loan)" value={formatCurrency(deal.loanAmount)} />
          <InfoRow label="Total Interest Paid" value={formatCurrency(totalInterest)} />
          <InfoRow label="Total Loan Cost" value={formatCurrency(totalCost)} highlight />
          <InfoRow label="Interest / Principal" value={`${interestRatio}%`} />
          <InfoRow label="Total Out-of-Pocket" value={formatCurrency(totalOutOfPocket)} sub="Incl. down pmt, excl. trade-in" />
        </InfoPanel>
      </div>

      {/* ── Amortisation note ── */}
      <AmortisationNote
        principal={deal.loanAmount}
        rate={deal.selectedRate}
        term={deal.selectedTerm}
        monthly={deal.monthlyPayment}
      />

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={() => navigate('/offers')}
          className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white
            font-medium rounded-xl transition-colors text-sm text-center"
        >
          ← Back to Offers
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white
            font-medium rounded-xl transition-colors text-sm"
        >
          🖨 Print Deal Jacket
        </button>
        <button
          onClick={handleNewDeal}
          className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold
            rounded-xl transition-colors text-sm"
        >
          + New Deal
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoPanel({ title, icon, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-slate-700/60">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, highlight = false, sub }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-600">{sub}</p>}
      </div>
      <p className={`text-sm font-semibold ${highlight ? 'text-blue-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}

/**
 * AmortisationNote
 * Shows the first and last payment's interest vs. principal breakdown.
 * This is a key F&I education tool – customers often don't realise how
 * much of their early payments go toward interest.
 */
function AmortisationNote({ principal, rate, term, monthly }) {
  const r = rate / 100 / 12

  // First payment breakdown
  const firstInterest = parseFloat((principal * r).toFixed(2))
  const firstPrincipal = parseFloat((monthly - firstInterest).toFixed(2))

  // Balance after one payment
  const balanceAfterFirst = principal - firstPrincipal

  // Last payment estimate (simplified – actual last payment may differ by a few cents)
  const lastInterest = parseFloat((balanceAfterFirst * Math.pow(1 + r, -(term - 1)) * r).toFixed(2))
  const lastPrincipalEst = parseFloat((monthly - lastInterest).toFixed(2))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span>📈</span> Amortisation Snapshot
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Early payments are heavily weighted toward interest. As the principal decreases each month,
        the interest portion shrinks and the principal portion grows.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <AmortRow label="Payment 1 – Interest" value={formatCurrency(firstInterest)} sub="Goes to lender" />
        <AmortRow label="Payment 1 – Principal" value={formatCurrency(firstPrincipal)} sub="Reduces balance" />
        <AmortRow label={`Payment ${term} – Est. Interest`} value={formatCurrency(Math.max(0, lastInterest))} sub="Near zero" />
        <AmortRow label={`Payment ${term} – Est. Principal`} value={formatCurrency(Math.max(0, lastPrincipalEst))} sub="Final payoff" />
      </div>
    </div>
  )
}

function AmortRow({ label, value, sub }) {
  return (
    <div className="bg-slate-750 rounded-lg p-3 border border-slate-700">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-base font-bold text-white mt-0.5">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}
