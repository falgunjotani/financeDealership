/**
 * firestoreService.js
 *
 * All Firestore CRUD operations are centralised here so that components
 * stay clean and business logic is testable in isolation.
 *
 * Collections:
 *  - loanApplications  → customer deals
 *  - lenders           → financing partner rules
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── Collection references ────────────────────────────────────────────────────
const LOAN_APPS_COLLECTION = 'loanApplications'
const LENDERS_COLLECTION = 'lenders'

// ─── Loan Applications ────────────────────────────────────────────────────────

/**
 * Persist a new loan application to Firestore.
 * Returns the generated document ID so the router can pass it to /offers.
 *
 * @param {object} dealData  – structured deal fields from the Create Deal form
 * @returns {Promise<string>} newly created document ID
 */
export async function createLoanApplication(dealData) {
  const docRef = await addDoc(collection(db, LOAN_APPS_COLLECTION), {
    ...dealData,
    // selectedLender fields are null until the user picks an offer
    selectedLender: null,
    selectedRate: null,
    selectedTerm: null,
    monthlyPayment: null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Fetch a single loan application by its Firestore document ID.
 *
 * @param {string} dealId
 * @returns {Promise<object|null>}
 */
export async function getLoanApplication(dealId) {
  const docRef = doc(db, LOAN_APPS_COLLECTION, dealId)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

/**
 * Persist the selected lender offer back onto the deal document.
 * Called when the F&I manager clicks "Select This Offer" on the Offers page.
 *
 * @param {string} dealId
 * @param {object} offerData  – { selectedLender, selectedRate, selectedTerm, monthlyPayment }
 */
export async function saveLenderSelection(dealId, offerData) {
  const docRef = doc(db, LOAN_APPS_COLLECTION, dealId)
  await updateDoc(docRef, {
    ...offerData,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Fetch the most recent loan applications (for a potential dashboard list).
 * Ordered by creation date descending.
 *
 * @param {number} [count=20]
 * @returns {Promise<object[]>}
 */
export async function getRecentDeals(count = 20) {
  const q = query(
    collection(db, LOAN_APPS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(count)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ─── Lenders ──────────────────────────────────────────────────────────────────

/**
 * Fetch all lender rule documents.
 * Each document drives the risk-based pricing engine on the Offers page.
 *
 * @returns {Promise<object[]>}
 */
export async function getLenders() {
  const snapshot = await getDocs(collection(db, LENDERS_COLLECTION))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Seed the lenders collection with default finance partner data.
 * Run this ONCE from the browser console or a one-off seed page.
 * Guard condition prevents accidental re-seeding if data already exists.
 */
export async function seedLenders() {
  const existing = await getDocs(collection(db, LENDERS_COLLECTION))
  if (!existing.empty) {
    console.warn('Lenders collection already has data. Skipping seed.')
    return
  }

  const lenders = [
    {
      name: 'Ally Financial',
      minCreditScore: 580,
      baseRate: 4.9,
      maxTermMonths: 72,
    },
    {
      name: 'Capital One Auto',
      minCreditScore: 600,
      baseRate: 4.5,
      maxTermMonths: 72,
    },
    {
      name: 'Chase Auto Finance',
      minCreditScore: 660,
      baseRate: 3.9,
      maxTermMonths: 60,
    },
    {
      name: 'TD Auto Finance',
      minCreditScore: 620,
      baseRate: 5.2,
      maxTermMonths: 72,
    },
    {
      name: 'Westlake Financial',
      minCreditScore: 520,
      baseRate: 8.9,
      maxTermMonths: 72,
    },
    {
      name: 'GM Financial',
      minCreditScore: 640,
      baseRate: 4.2,
      maxTermMonths: 72,
    },
  ]

  for (const lender of lenders) {
    await addDoc(collection(db, LENDERS_COLLECTION), lender)
  }

  console.log('Lenders seeded successfully.')
}
