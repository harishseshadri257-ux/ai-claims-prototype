'use client';

import { use, useState, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockClaims, type Claim } from '@/data/mockClaims';

const SEVERITY_BADGE: Record<string, string> = {
  Severe: 'bg-red-100 text-red-700',
  Moderate: 'bg-orange-100 text-orange-700',
  Minor: 'bg-yellow-100 text-yellow-700',
};

const LABEL_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-zinc-100 text-zinc-600',
  APPROVED: 'bg-green-100 text-green-700',
  ADJUSTED: 'bg-blue-100 text-blue-700',
  OVERRIDDEN: 'bg-red-100 text-red-700',
};

const COST_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-zinc-100 text-zinc-600',
  APPROVED: 'bg-green-100 text-green-700',
  ADJUSTED: 'bg-blue-100 text-blue-700',
};

const REJECT_REASONS = [
  'Estimate too high',
  'Insufficient evidence',
  'Coverage not applicable',
  'Requires further investigation',
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function AdjusterReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const claim = mockClaims.find(c => c.id === id);

  if (!claim) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-800 font-medium">Claim not found</p>
          <Link href="/" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            ← Claims Queue
          </Link>
        </div>
      </div>
    );
  }

  return <AdjusterReview claim={claim} />;
}

function AdjusterReview({ claim }: { claim: Claim }) {
  const router = useRouter();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState('');
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedLabourSources, setExpandedLabourSources] = useState<Set<string>>(new Set());

  const partsTotal = claim.costLineItems.reduce((s, i) => s + i.cost, 0);
  const labourTotal = claim.costLineItems.reduce((s, i) => s + i.labourHours * i.labourRate, 0);
  const total = partsTotal + labourTotal;

  const toggleTrace = (id: string) =>
    setExpandedTraces(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleSource = (id: string) =>
    setExpandedSources(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleLabourSource = (id: string) =>
    setExpandedLabourSources(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  function handleApprove() {
    router.push(`/adjuster/${claim.id}/approved?total=${total}`);
  }

  function handleReject() {
    const params = new URLSearchParams({ reason: rejectReason });
    if (rejectNotes.trim()) params.set('notes', rejectNotes.trim());
    router.push(`/adjuster/${claim.id}/rejected?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-zinc-900 text-sm">Senior Adjuster Dashboard</span>
          <div className="text-right">
            <p className="text-sm font-mono font-medium text-zinc-900">{claim.id}</p>
            <p className="text-xs text-zinc-500">{claim.policyHolder}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1">
          ← Claims Queue
        </Link>

        {/* Claim Summary */}
        <section className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Claim Summary</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {([
              ['Policy Number', <span key="pn" className="font-mono font-medium text-zinc-900">{claim.policyNumber}</span>],
              ['Coverage Type', claim.coverageType],
              ['Incident Date', claim.incidentDate],
              ['Incident Type', claim.incidentType],
              ['Liable Party', claim.liableParty],
            ] as [string, React.ReactNode][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="text-zinc-900">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between col-span-2">
              <dt className="text-zinc-500">Police Report</dt>
              <dd className="text-zinc-900">{claim.policeReport ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </section>

        {/* Damage Assessment Summary */}
        <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Damage Assessment Summary</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-zinc-500">Part</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Severity</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Confidence</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Final Status</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Agent Notes</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {claim.damageLabels.map(label => {
                const traceOpen = expandedTraces.has(label.id);
                return (
                  <Fragment key={label.id}>
                    <tr className="border-b border-zinc-100">
                      <td className="px-6 py-3 font-medium text-zinc-900">{label.part}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[label.severity]}`}>
                          {label.severity}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {label.agentAdded ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Agent Added</span>
                        ) : (
                          <span className="text-zinc-600">{label.confidence}%</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${LABEL_STATUS_BADGE[label.status]}`}>
                          {label.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-500 max-w-[180px]">
                        {label.agentNotes ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleTrace(label.id)}
                          className={`text-zinc-400 hover:text-zinc-700 text-sm inline-block transition-transform duration-150 ${traceOpen ? 'rotate-180' : ''}`}
                          title="View trace"
                        >
                          ▾
                        </button>
                      </td>
                    </tr>
                    {traceOpen && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="text-xs text-zinc-600 space-y-1">
                            {label.agentAdded ? (
                              <>
                                <p><span className="font-medium text-zinc-700">Source:</span> Agent Assessment</p>
                                <p><span className="font-medium text-zinc-700">Added by:</span> Claims Agent</p>
                                {label.agentNotes && (
                                  <p><span className="font-medium text-zinc-700">Agent Notes:</span> {label.agentNotes}</p>
                                )}
                              </>
                            ) : (
                              <>
                                <p><span className="font-medium text-zinc-700">Bounding Box ID:</span> {label.traceData.boundingBoxId}</p>
                                <p><span className="font-medium text-zinc-700">Model:</span> {label.traceData.model}</p>
                                <p><span className="font-medium text-zinc-700">Dataset:</span> {label.traceData.dataset}</p>
                                {label.agentNotes && (
                                  <p><span className="font-medium text-zinc-700">Agent Notes:</span> {label.agentNotes}</p>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Cost Estimate Summary */}
        <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Cost Estimate Summary</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-zinc-500">Part</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Description / Rate</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Source</th>
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Final Status</th>
              </tr>
            </thead>
            <tbody>
              {claim.costLineItems.map(item => {
                const partsOpen = expandedSources.has(item.id);
                const labourOpen = expandedLabourSources.has(item.id);
                const labourCost = item.labourHours * item.labourRate;
                return (
                  <Fragment key={item.id}>
                    {/* Parts row */}
                    <tr className="border-b border-zinc-100">
                      <td className="px-6 pt-3 pb-1 font-medium text-zinc-900 align-top" rowSpan={2}>{item.part}</td>
                      <td className="px-3 pt-3 pb-1 text-zinc-600">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">Parts</div>
                        {item.description}
                      </td>
                      <td className="px-3 pt-3 pb-1 font-mono text-zinc-900 whitespace-nowrap">{fmt(item.cost)}</td>
                      <td className="px-3 pt-3 pb-1 whitespace-nowrap">
                        {item.agentAdded ? (
                          <button
                            onClick={() => toggleSource(item.id)}
                            className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 hover:bg-blue-200 inline-flex items-center gap-1 font-medium"
                          >
                            Agent Added
                            <span className={`inline-block transition-transform duration-150 ${partsOpen ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleSource(item.id)}
                            className="text-xs bg-zinc-100 text-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-200 inline-flex items-center gap-1"
                          >
                            {item.source}
                            <span className={`inline-block transition-transform duration-150 ${partsOpen ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                        )}
                      </td>
                      <td className="px-3 pt-3 pb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${COST_STATUS_BADGE[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                    {/* Labour row */}
                    <tr className="border-b border-zinc-100">
                      <td className="px-3 pb-3 pt-1 text-zinc-600">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">Labour</div>
                        {item.labourHours} hrs @ {fmt(item.labourRate)}/hr
                      </td>
                      <td className="px-3 pb-3 pt-1 font-mono text-zinc-700 whitespace-nowrap">{fmt(labourCost)}</td>
                      <td className="px-3 pb-3 pt-1 whitespace-nowrap">
                        {item.agentAdded ? (
                          <button
                            onClick={() => toggleLabourSource(item.id)}
                            className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 hover:bg-blue-200 inline-flex items-center gap-1 font-medium"
                          >
                            Agent Added
                            <span className={`inline-block transition-transform duration-150 ${labourOpen ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleLabourSource(item.id)}
                            className="text-xs bg-zinc-100 text-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-200 inline-flex items-center gap-1"
                          >
                            {item.labourSource}
                            <span className={`inline-block transition-transform duration-150 ${labourOpen ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                        )}
                      </td>
                      <td className="px-3 pb-3 pt-1"><span className="text-xs text-zinc-400">—</span></td>
                    </tr>
                    {partsOpen && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={5} className="px-6 py-2.5">
                          {item.agentAdded ? (
                            <div className="text-xs text-zinc-600 space-y-1">
                              <p><span className="font-medium text-zinc-700">Source:</span> Agent Assessment</p>
                              {item.sourceDetail && <p><span className="font-medium text-zinc-700">Agent Notes:</span> {item.sourceDetail}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-600">{item.sourceDetail}</p>
                          )}
                        </td>
                      </tr>
                    )}
                    {labourOpen && (
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <td colSpan={5} className="px-6 py-2.5">
                          {item.agentAdded ? (
                            <div className="text-xs text-zinc-600 space-y-1">
                              <p><span className="font-medium text-zinc-700">Source:</span> Agent Assessment</p>
                              {item.labourSourceDetail && <p><span className="font-medium text-zinc-700">Agent Notes:</span> {item.labourSourceDetail}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-600">{item.labourSourceDetail}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-zinc-100 flex justify-end">
            <div className="space-y-1.5 text-sm min-w-[220px]">
              <div className="flex justify-between gap-10">
                <span className="text-zinc-500">Parts Subtotal</span>
                <span className="font-mono text-zinc-700">{fmt(partsTotal)}</span>
              </div>
              <div className="flex justify-between gap-10">
                <span className="text-zinc-500">Labour Subtotal</span>
                <span className="font-mono text-zinc-700">{fmt(labourTotal)}</span>
              </div>
              <div className="flex justify-between gap-10 pt-2 border-t border-zinc-200">
                <span className="font-semibold text-zinc-900">Grand Total</span>
                <span className="text-xl font-bold text-zinc-900 font-mono">{fmt(total)}</span>
              </div>
            </div>
          </div>
          {claim.totalLoss && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-red-800">Total Loss Flagged</p>
              </div>
            </div>
          )}
        </section>

        {/* Decision Panel */}
        <section className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-5">Decision</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-base rounded-lg py-4 transition-colors"
            >
              Approve Estimate
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-base rounded-lg py-4 transition-colors"
            >
              Reject Estimate
            </button>
          </div>
        </section>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <h3 className="text-base font-semibold text-zinc-900">Confirm Approval</h3>
            <p className="text-sm text-zinc-600">
              Are you sure you want to approve this estimate for{' '}
              <span className="font-semibold text-zinc-900">{fmt(total)}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <h3 className="text-base font-semibold text-zinc-900">Reject Estimate</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Reason</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {REJECT_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Notes (optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
