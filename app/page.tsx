'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockClaims, type Claim, type ClaimState } from '@/data/mockClaims';

const stateBadgeClass: Record<ClaimState, string> = {
  NEW: 'bg-zinc-100 text-zinc-700',
  ASSESSING: 'bg-blue-100 text-blue-800',
  ESTIMATE_GENERATED: 'bg-purple-100 text-purple-800',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const stateLabel: Record<ClaimState, string> = {
  NEW: 'New',
  ASSESSING: 'Assessing',
  ESTIMATE_GENERATED: 'Estimate Generated',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type FormState = {
  policyHolder: string;
  policyNumber: string;
  coverageType: 'Comprehensive' | 'Third Party';
  incidentDate: string;
  incidentType: 'Single Vehicle' | 'Two Party';
  liableParty: 'Policyholder' | 'Third Party' | 'Disputed';
  policeReport: boolean;
  photo: File | null;
};

const blankForm: FormState = {
  policyHolder: '',
  policyNumber: '',
  coverageType: 'Comprehensive',
  incidentDate: '',
  incidentType: 'Single Vehicle',
  liableParty: 'Policyholder',
  policeReport: false,
  photo: null,
};

export default function ClaimsQueuePage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>(mockClaims);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [nextIndex, setNextIndex] = useState(mockClaims.length + 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newClaim: Claim = {
      id: `CLM-${new Date().getFullYear()}-${String(nextIndex).padStart(3, '0')}`,
      policyHolder: form.policyHolder,
      policyNumber: form.policyNumber,
      policyStatus: 'ACTIVE',
      coverageType: form.coverageType,
      incidentDate: form.incidentDate,
      incidentType: form.incidentType,
      liableParty: form.liableParty,
      policeReport: form.policeReport,
      state: 'NEW',
      imageUrl: '/images/car-damage.jpg',
      damageLabels: [],
      costLineItems: [],
      totalEstimate: 0,
      totalLoss: false,
      submittedAt: new Date().toISOString(),
      adjusterNotes: '',
    };
    setClaims(prev => [...prev, newClaim]);
    setNextIndex(n => n + 1);
    setForm(blankForm);
    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Claims Queue</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Claim Request
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Claim ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Policyholder</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">State</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Coverage Type</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500">Total Estimate</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {claims.map(claim => (
                <tr
                  key={claim.id}
                  onClick={() => router.push(`/claims/${claim.id}`)}
                  className="hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800">{claim.id}</td>
                  <td className="px-4 py-3 text-zinc-800">{claim.policyHolder}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${stateBadgeClass[claim.state]}`}>
                      {stateLabel[claim.state]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{claim.coverageType}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                    {claim.state === 'NEW' ? '—' : formatCurrency(claim.totalEstimate)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(claim.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-zinc-900">New Claim Request</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Policyholder Name</label>
                <input
                  required
                  type="text"
                  value={form.policyHolder}
                  onChange={e => setForm(f => ({ ...f, policyHolder: e.target.value }))}
                  placeholder="Full name"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Policy Number</label>
                <input
                  required
                  type="text"
                  value={form.policyNumber}
                  onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))}
                  placeholder="POL-XXXXXX"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Coverage Type</label>
                  <select
                    value={form.coverageType}
                    onChange={e => setForm(f => ({ ...f, coverageType: e.target.value as FormState['coverageType'] }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Comprehensive</option>
                    <option>Third Party</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Incident Date</label>
                  <input
                    required
                    type="date"
                    value={form.incidentDate}
                    onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Incident Type</label>
                  <select
                    value={form.incidentType}
                    onChange={e => setForm(f => ({ ...f, incidentType: e.target.value as FormState['incidentType'] }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Single Vehicle</option>
                    <option>Two Party</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Liable Party</label>
                  <select
                    value={form.liableParty}
                    onChange={e => setForm(f => ({ ...f, liableParty: e.target.value as FormState['liableParty'] }))}
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Policyholder</option>
                    <option>Third Party</option>
                    <option>Disputed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Damage Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setForm(f => ({ ...f, photo: e.target.files?.[0] ?? null }))}
                  className="w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  id="policeReport"
                  type="checkbox"
                  checked={form.policeReport}
                  onChange={e => setForm(f => ({ ...f, policeReport: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="policeReport" className="text-sm text-zinc-700">Police report filed</label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
