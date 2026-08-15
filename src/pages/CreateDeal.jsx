/**
 * CreateDeal.jsx  –  Step 1 of the F&I workflow
 *
 * Captures customer & vehicle information, computes the net loan amount,
 * persists the deal to Firestore, and routes the user to Step 2 (Offers).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLoanApplication } from '../services/firestoreService'
import { calcLoanAmount, formatCurrency } from '../utils/financeCalculations'
import { useDeal } from '../context/DealContext'
import PageHeader from '../components/PageHeader'
import ErrorAlert from '../components/ErrorAlert'

// ─── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  customerName: '',
  creditScore: '',
  annualIncome: '',
  vehiclePrice: '',
  downPayment: '',
  tradeInValue: '',
}

// ─── Field definitions (drives rendering loop) ────────────────────────────────
const FIELDS = [
  { id: 'customerName',  label: 'Customer Name',       type: 'text',   placeholder: 'John Smith',    hint: null },
  { id: 'creditScore',   label: 'Credit Score (FICO)', type: 'number', placeholder: '700',           hint: '300–850' },
  { id: 'annualIncome',  label: 'Annual Income ($)',   type: 'number', placeholder: '65000',         hint: 'Before taxes' },
  { id: 'vehiclePrice',  label: 'Vehicle Price ($)',   type: 'number', placeholder: '28500',         hint: 'OTD price' },
  { id: 'downPayment',   label: 'Down Payment ($)',    type: 'number', placeholder: '3000',          hint: 'Cash at signing' },
  { id: 'tradeInValue',  label: 'Trade-In Value ($)',  type: 'number', placeholder: '0',             hint: 'Enter 0 if no trade' },
]

export default function CreateDeal() {
  const navigate = useNavigate()
  const { setActiveDealId } = useDeal()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── Derived loan amount (live preview) ────────────────────────────────────
  const loanAmount = calcLoanAmount(
    parseFloat(form.vehiclePrice) || 0,
    parseFloat(form.downPayment) || 0,
    parseFloat(form.tradeInValue) || 0,
  )

  // ─── Field-level validation ─────────────────────────────────────────────────
  function validate(data) {
    const errs = {}
    if (!data.customerName.trim()) errs.customerName = 'Required'

    const cs = parseInt(data.creditScore)
    if (!data.creditScore) errs.creditScore = 'Required'
    else if (cs < 300 || cs > 850) errs.creditScore = 'Must be between 300 and 850'

    const income = parseFloat(data.annualIncome)
    if (!data.annualIncome) errs.annualIncome = 'Required'
    else if (income <= 0) errs.annualIncome = 'Must be a positive number'

    const price = parseFloat(data.vehiclePrice)
    if (!data.vehiclePrice) errs.vehiclePrice = 'Required'
    else if (price <= 0) errs.vehiclePrice = 'Must be a positive number'

    const dp = parseFloat(data.downPayment)
    if (data.downPayment === '') errs.downPayment = 'Required (enter 0 if none)'
    else if (dp < 0) errs.downPayment = 'Cannot be negative'
    else if (dp >= price) errs.downPayment = 'Down payment cannot exceed vehicle price'

    const ti = parseFloat(data.tradeInValue)
    if (data.tradeInValue === '') errs.tradeInValue = 'Required (enter 0 if none)'
    else if (ti < 0) errs.tradeInValue = 'Cannot be negative'

    return errs
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear individual field error on change
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const dealPayload = {
        customerName: form.customerName.trim(),
        creditScore: parseInt(form.creditScore),
        annualIncome: parseFloat(form.annualIncome),
        vehiclePrice: parseFloat(form.vehiclePrice),
        downPayment: parseFloat(form.downPayment),
        tradeInValue: parseFloat(form.tradeInValue),
        loanAmount,
      }

      const newDealId = await createLoanApplication(dealPayload)
      setActiveDealId(newDealId)
      navigate('/offers')
    } catch (err) {
      console.error('Failed to create deal:', err)
      setSubmitError('Failed to save deal. Check your Firebase config and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        badge="Step 1 of 3"
        title="Create New Deal"
        subtitle="Enter customer and vehicle details to generate lender financing offers."
      />

      {submitError && (
        <ErrorAlert message={submitError} onDismiss={() => setSubmitError(null)} />
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Customer Section ── */}
        <SectionLabel>Customer Information</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {FIELDS.slice(0, 3).map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={form[field.id]}
              error={errors[field.id]}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* ── Vehicle & Finance Section ── */}
        <SectionLabel>Vehicle &amp; Financing</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {FIELDS.slice(3).map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={form[field.id]}
              error={errors[field.id]}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* ── Live Loan Preview ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
          <p className="text-xs text-slate-400 uppercase font-medium tracking-wider mb-2">
            Calculated Loan Amount
          </p>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(loanAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Vehicle Price − Down Payment − Trade-In Value
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400
            text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Deal…
            </>
          ) : (
            <>
              View Lender Offers
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <span className="flex-1 h-px bg-slate-700" />
      {children}
      <span className="flex-1 h-px bg-slate-700" />
    </h2>
  )
}

function FormField({ field, value, error, onChange }) {
  return (
    <div>
      <label htmlFor={field.id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {field.label}
        {field.hint && <span className="ml-1.5 text-slate-500 font-normal">({field.hint})</span>}
      </label>
      <input
        id={field.id}
        name={field.id}
        type={field.type}
        placeholder={field.placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-800 border rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500
          focus:outline-none focus:ring-2 transition-all text-sm
          ${error ? 'border-red-600 focus:ring-red-600/40' : 'border-slate-600 focus:ring-blue-600/40 focus:border-blue-500'}`}
      />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  )
}
