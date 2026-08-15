/**
 * Offers.jsx  –  Step 2 of the F&I workflow
 *
 * Fetches:
 *  1. The active deal from Firestore (to get credit score, vehicle price, loan amount)
 *  2. All lenders from Firestore
 *
 * Then applies the dealership's risk-based pricing matrix to each eligible
 * lender and renders selectable offer cards for each term option.
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeal } from '../context/DealContext'
import { getLoanApplication, getLenders, saveLenderSelection } from '../services/firestoreService'
import {
  calcAdjustedRate,
  calcMonthlyPayment,
  calcTotalInterest,
  formatCurrency,
} from '../utils/financeCalculations'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import StatCard from '../components/StatCard'

// Term options offered on every qualifying lender (months)
const AVAILABLE_TERMS = [36, 48, 60, 72]

/**
 * Build the full offer matrix for a single lender × all terms.
 * Lenders are excluded if their minimum credit score is not met.
 *
 * @param {object} lender
 * @param {object} deal    – active deal document
 * @returns {object|null}  – enriched lender with per-term offers, or null if ineligible
 */
function buildLenderOffer(lender, deal) {
  // Credit-score gate: lender won't approve below their floor
  if (deal.creditScore < lender.minCreditScore) return null

  const terms = AVAILABLE_TERMS.filter((t) => t <= lender.maxTermMonths)

  const offers = terms.map((term) => {
    const rate = calcAdjustedRate(lender.baseRate, deal.creditScore, deal.vehiclePrice, term)
    const monthly = calcMonthlyPayment(deal.loanAmount, rate, term)
    const totalInterest = calcTotalInterest(monthly, term, deal.loanAmount)
    return { term, rate, monthly, totalInterest }
  })

  return { ...lender, offers }
}

export default function Offers() {
  const navigate = useNavigate()
  const { activeDealId } = useDeal()

  const [deal, setDeal] = useState(null)
  const [lenderOffers, setLenderOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selected offer: { lenderId, lenderName, term, rate, monthly }
  const [selected, setSelected] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // ─── Fetch deal + lenders in parallel ──────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!activeDealId) {
      setError('No active deal found. Please start from Step 1.')
      setLoading(false)
      return
    }

    try {
      const [dealData, lendersData] = await Promise.all([
        getLoanApplication(activeDealId),
        getLenders(),
      ])

      if (!dealData) {
        setError('Deal not found in database.')
        setLoading(false)
        return
      }

      setDeal(dealData)

      // Build the offer matrix, filter out ineligible lenders
      const offers = lendersData
        .map((lender) => buildLenderOffer(lender, dealData))
        .filter(Boolean)
        // Sort: best (lowest) base rate first
        .sort((a, b) => a.baseRate - b.baseRate)

      setLenderOffers(offers)
    } catch (err) {
      console.error('Error loading offers:', err)
      setError('Failed to load lender offers. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [activeDealId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Persist selection and navigate ────────────────────────────────────────
  async function handleSelectOffer() {
    if (!selected) return
    setIsSaving(true)
    try {
      await saveLenderSelection(activeDealId, {
        selectedLender: selected.lenderName,
        selectedRate: selected.rate,
        selectedTerm: selected.term,
        monthlyPayment: selected.monthly,
      })
      navigate('/summary')
    } catch (err) {
      console.error('Error saving selection:', err)
      setError('Failed to save your selection. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Render states ──────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner message="Fetching lender offers…" />

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <ErrorAlert message={error} />
        <button onClick={() => navigate('/create')} className="mt-4 text-blue-400 hover:underline text-sm">
          ← Back to Create Deal
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        badge="Step 2 of 3"
        title="Lender Financing Offers"
        subtitle={`Showing offers for ${deal.customerName} · FICO ${deal.creditScore} · ${formatCurrency(deal.loanAmount)} loan`}
      />

      {/* ── Deal summary bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard label="Loan Amount" value={formatCurrency(deal.loanAmount)} />
        <StatCard label="Vehicle Price" value={formatCurrency(deal.vehiclePrice)} />
        <StatCard label="Credit Score" value={deal.creditScore} sub="FICO" />
        <StatCard label="Eligible Lenders" value={lenderOffers.length} sub="of all partners" />
      </div>

      {lenderOffers.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No Eligible Lenders</p>
          <p className="text-sm mt-1">The credit score does not meet any lender's minimum requirement.</p>
        </div>
      ) : (
        <>
          <div className="space-y-5 mb-8">
            {lenderOffers.map((lender) => (
              <LenderCard
                key={lender.id}
                lender={lender}
                selected={selected}
                onSelect={setSelected}
                deal={deal}
              />
            ))}
          </div>

          {/* ── Sticky selection footer ── */}
          <div className="sticky bottom-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4
            flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            {selected ? (
              <div className="text-sm text-slate-300">
                <span className="font-semibold text-white">{selected.lenderName}</span>
                {' · '}
                <span>{selected.term} mo @ {selected.rate}%</span>
                {' · '}
                <span className="text-blue-400 font-semibold">{formatCurrency(selected.monthly)}/mo</span>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Select an offer below to continue</p>
            )}
            <button
              onClick={handleSelectOffer}
              disabled={!selected || isSaving}
              className="w-full sm:w-auto py-2.5 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
                disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Finalize Deal
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── LenderCard ───────────────────────────────────────────────────────────────

function LenderCard({ lender, selected, onSelect, deal }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Lender header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-750 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-blue-300 text-xs font-bold">{lender.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{lender.name}</p>
            <p className="text-slate-400 text-xs">Base Rate: {lender.baseRate}% · Min FICO: {lender.minCreditScore}</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">Up to {lender.maxTermMonths} mo</span>
      </div>

      {/* Term offers grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-700">
        {lender.offers.map((offer) => {
          const isSelected =
            selected?.lenderId === lender.id && selected?.term === offer.term

          return (
            <button
              key={offer.term}
              onClick={() =>
                onSelect({
                  lenderId: lender.id,
                  lenderName: lender.name,
                  ...offer,
                })
              }
              className={`text-left p-4 transition-colors hover:bg-slate-700/60 cursor-pointer
                ${isSelected ? 'bg-blue-950 ring-inset ring-2 ring-blue-500' : ''}`}
            >
              <p className="text-xs text-slate-400 mb-1">{offer.term} Months</p>
              <p className="text-lg font-bold text-white">{formatCurrency(offer.monthly)}</p>
              <p className="text-xs text-slate-400">/month</p>
              <div className="mt-2 pt-2 border-t border-slate-700 space-y-0.5">
                <p className="text-xs text-slate-300">
                  <span className="text-slate-500">APR </span>{offer.rate}%
                </p>
                <p className="text-xs text-slate-300">
                  <span className="text-slate-500">Int. </span>{formatCurrency(offer.totalInterest)}
                </p>
              </div>
              {/* Risk flags */}
              <RiskBadges creditScore={deal.creditScore} vehiclePrice={deal.vehiclePrice} term={offer.term} />
              {isSelected && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300 font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * RiskBadges
 * Shows small colour-coded tags explaining why the rate was adjusted.
 * This transparency is important in F&I – the F&I manager needs to explain
 * the pricing to the customer.
 */
function RiskBadges({ creditScore, vehiclePrice, term }) {
  const badges = []
  if (creditScore < 650) badges.push({ label: 'Sub-prime +2%', color: 'text-amber-400' })
  if (vehiclePrice > 50000) badges.push({ label: 'Luxury +1%', color: 'text-orange-400' })
  if (term > 60) badges.push({ label: 'Long term +0.5%', color: 'text-red-400' })

  if (badges.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {badges.map((b) => (
        <span key={b.label} className={`text-[10px] font-medium ${b.color}`}>{b.label}</span>
      ))}
    </div>
  )
}
