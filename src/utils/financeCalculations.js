/**
 * financeCalculations.js
 *
 * Pure functions for automotive finance math.
 * Keeping these separate from components makes them trivially unit-testable
 * and keeps the EMI formula reasoning easy to audit.
 */

/**
 * Calculates the loan amount after subtracting down payment and trade-in.
 *
 * Net Loan = Vehicle Price − Down Payment − Trade-In Value
 *
 * @param {number} vehiclePrice
 * @param {number} downPayment
 * @param {number} tradeInValue
 * @returns {number}
 */
export function calcLoanAmount(vehiclePrice, downPayment, tradeInValue) {
  const net = vehiclePrice - downPayment - tradeInValue
  return Math.max(0, net) // cannot be negative
}

/**
 * Risk-based rate adjustment engine.
 *
 * Lenders adjust their base APR upward to compensate for:
 *  - Sub-prime borrowers (credit score < 650) → +2.00%
 *  - Luxury / high-value vehicles (>$50 000)  → +1.00%
 *  - Extended term financing (>60 months)     → +0.50% per 12-month block above 60
 *
 * @param {number} baseRate        – lender's published base APR
 * @param {number} creditScore
 * @param {number} vehiclePrice
 * @param {number} termMonths
 * @returns {number} adjusted APR rounded to 2 decimal places
 */
export function calcAdjustedRate(baseRate, creditScore, vehiclePrice, termMonths) {
  let adjustment = 0

  // Sub-prime risk premium
  if (creditScore < 650) adjustment += 2.0

  // High-value asset risk (harder to repossess / sell)
  if (vehiclePrice > 50000) adjustment += 1.0

  // Extended term risk (longer exposure, higher default probability)
  if (termMonths > 60) adjustment += 0.5

  return parseFloat((baseRate + adjustment).toFixed(2))
}

/**
 * Standard amortising loan monthly payment (EMI) formula:
 *
 *   EMI = P × [r(1+r)^n] / [(1+r)^n − 1]
 *
 * where:
 *   P = principal (loan amount)
 *   r = periodic interest rate (annual % / 12 / 100)
 *   n = number of monthly periods (term in months)
 *
 * Edge case: if rate is 0%, EMI is simply P / n (interest-free deal).
 *
 * @param {number} principal      – loan amount in dollars
 * @param {number} annualRatePct  – APR as a percentage (e.g. 4.9 for 4.9%)
 * @param {number} termMonths
 * @returns {number} monthly payment rounded to 2 decimal places
 */
export function calcMonthlyPayment(principal, annualRatePct, termMonths) {
  if (principal <= 0) return 0
  if (annualRatePct === 0) return parseFloat((principal / termMonths).toFixed(2))

  const r = annualRatePct / 100 / 12          // monthly periodic rate
  const n = termMonths
  const factor = Math.pow(1 + r, n)           // (1+r)^n

  const emi = (principal * r * factor) / (factor - 1)
  return parseFloat(emi.toFixed(2))
}

/**
 * Total interest paid over the life of the loan.
 *
 *   Total Interest = (EMI × n) − Principal
 *
 * @param {number} monthlyPayment
 * @param {number} termMonths
 * @param {number} principal
 * @returns {number}
 */
export function calcTotalInterest(monthlyPayment, termMonths, principal) {
  return parseFloat(((monthlyPayment * termMonths) - principal).toFixed(2))
}

/**
 * Format a dollar amount to US currency string.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
