/**
 * SeedData.jsx  –  One-time Firestore data seeder
 *
 * Navigate to /#/seed to run this page.
 * It calls seedLenders() which has a built-in guard against re-seeding.
 * Remove this route from App.jsx before deploying to production.
 */

import { useState } from 'react'
import { seedLenders } from '../services/firestoreService'
import PageHeader from '../components/PageHeader'

export default function SeedData() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  async function handleSeed() {
    setStatus('loading')
    try {
      await seedLenders()
      setStatus('success')
      setMessage('6 lenders added to Firestore successfully. You can now use the app.')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage(err.message || 'Unknown error – check console and Firebase config.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <PageHeader
        badge="Admin — One-time Setup"
        title="Seed Lender Data"
        subtitle="Populates the Firestore 'lenders' collection with 6 finance partner records."
      />

      {status === 'success' && (
        <div className="bg-green-950 border border-green-700 text-green-300 rounded-lg p-4 mb-6 text-sm">
          ✅ {message}
        </div>
      )}
      {status === 'error' && (
        <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg p-4 mb-6 text-sm">
          ❌ {message}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 text-sm text-slate-300 space-y-2">
        <p className="font-medium text-white">Lenders that will be seeded:</p>
        {[
          { name: 'Ally Financial',      minFICO: 580, rate: '4.9%', maxTerm: '72 mo' },
          { name: 'Capital One Auto',    minFICO: 600, rate: '4.5%', maxTerm: '72 mo' },
          { name: 'Chase Auto Finance',  minFICO: 660, rate: '3.9%', maxTerm: '60 mo' },
          { name: 'TD Auto Finance',     minFICO: 620, rate: '5.2%', maxTerm: '72 mo' },
          { name: 'Westlake Financial',  minFICO: 520, rate: '8.9%', maxTerm: '72 mo' },
          { name: 'GM Financial',        minFICO: 640, rate: '4.2%', maxTerm: '72 mo' },
        ].map((l) => (
          <div key={l.name} className="flex justify-between text-xs">
            <span className="text-slate-200">{l.name}</span>
            <span className="text-slate-400">Min FICO {l.minFICO} · {l.rate} base · {l.maxTerm}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'success'}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400
          text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {status === 'loading' && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {status === 'loading' ? 'Seeding…' : status === 'success' ? 'Done ✓' : 'Run Seed'}
      </button>
    </div>
  )
}
