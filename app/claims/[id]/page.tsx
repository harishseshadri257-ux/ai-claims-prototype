'use client';

import { use, useState, useRef, Fragment } from 'react';
import Link from 'next/link';
import { mockClaims, type Claim, type ClaimState, type DamageLabel, type CostLineItem } from '@/data/mockClaims';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEP_STATES: ClaimState[] = ['NEW', 'ASSESSING', 'ESTIMATE_GENERATED', 'PENDING_APPROVAL', 'APPROVED'];

const STEP_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSESSING: 'Assessing',
  ESTIMATE_GENERATED: 'Estimate Generated',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved / Rejected',
};

const SEVERITY_BORDER: Record<string, string> = {
  Severe: 'border-red-500',
  Moderate: 'border-orange-400',
  Minor: 'border-yellow-400',
};

const SEVERITY_BG: Record<string, string> = {
  Severe: 'bg-red-500',
  Moderate: 'bg-orange-400',
  Minor: 'bg-yellow-400',
};

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

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const seed = mockClaims.find(c => c.id === id);

  if (!seed) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-800 font-medium">Claim not found</p>
          <p className="text-zinc-500 text-sm">No claim with ID &ldquo;{id}&rdquo; exists.</p>
          <Link href="/" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            ← Claims Queue
          </Link>
        </div>
      </div>
    );
  }

  return <ClaimDetail seed={seed} />;
}

// ─── Main component ────────────────────────────────────────────────────────────

function ClaimDetail({ seed }: { seed: Claim }) {
  const [claim, setClaim] = useState<Claim>(() => JSON.parse(JSON.stringify(seed)));
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);

  // Bounding box / label table interaction
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const [labelActionId, setLabelActionId] = useState<string | null>(null);
  const [labelActionType, setLabelActionType] = useState<'adjusting' | 'overriding' | 'acknowledging' | null>(null);
  const [adjustSeverity, setAdjustSeverity] = useState<DamageLabel['severity']>('Moderate');
  const [overrideReason, setOverrideReason] = useState('');

  // Cost table interaction
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [costAdjustId, setCostAdjustId] = useState<string | null>(null);
  const [adjustCost, setAdjustCost] = useState('');

  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const patchLabel = (id: string, updates: Partial<DamageLabel>) =>
    setClaim(p => ({
      ...p,
      damageLabels: p.damageLabels.map(l => (l.id === id ? { ...l, ...updates } : l)),
    }));

  const patchCost = (id: string, updates: Partial<CostLineItem>) =>
    setClaim(p => ({
      ...p,
      costLineItems: p.costLineItems.map(i => (i.id === id ? { ...i, ...updates } : i)),
    }));

  const transition = (text: string, next: ClaimState) => {
    setLoading(true);
    setLoadingText(text);
    setTimeout(() => {
      setClaim(p => ({ ...p, state: next }));
      setLoading(false);
      setLoadingText('');
    }, 2000);
  };

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

  const clickOverlay = (id: string) => {
    setSelectedLabelId(p => (p === id ? null : id));
    rowRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const clearLabelAction = () => {
    setLabelActionId(null);
    setLabelActionType(null);
  };

  const allLabelsResolved = claim.damageLabels.every(l => l.status !== 'PENDING');
  const resolvedLabels = claim.damageLabels.filter(l => l.status !== 'PENDING').length;
  const allCostResolved = claim.costLineItems.every(i => i.status !== 'PENDING');
  const resolvedCosts = claim.costLineItems.filter(i => i.status !== 'PENDING').length;
  const total = claim.costLineItems.reduce((s, i) => s + i.cost, 0);

  const stepIdx = STEP_STATES.indexOf(claim.state === 'REJECTED' ? 'APPROVED' : claim.state);

  // ─── Shared sub-components ────────────────────────────────────────────────────

  const ClaimSummaryCard = () => (
    <section className="bg-white border border-zinc-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-zinc-900 mb-4">Claim Summary</h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {[
          ['Policy Number', <span key="pn" className="font-mono font-medium text-zinc-900">{claim.policyNumber}</span>],
          ['Policy Status', (
            <span key="ps" className={`px-2 py-0.5 rounded text-xs font-medium ${claim.policyStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {claim.policyStatus}
            </span>
          )],
          ['Coverage Type', claim.coverageType],
          ['Incident Date', claim.incidentDate],
          ['Incident Type', claim.incidentType],
          ['Liable Party', claim.liableParty],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex justify-between">
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
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Persistent header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-zinc-900 text-sm">Claims Agent Dashboard</span>
          <div className="text-right">
            <p className="text-sm font-mono font-medium text-zinc-900">{claim.id}</p>
            <p className="text-xs text-zinc-500">{claim.policyHolder}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Back link */}
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1">
          ← Claims Queue
        </Link>

        {/* State stepper */}
        <div className="bg-white border border-zinc-200 rounded-lg px-6 py-5">
          <div className="flex items-start">
            {STEP_STATES.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const last = i === STEP_STATES.length - 1;
              return (
                <div key={s} className={`flex items-start ${!last ? 'flex-1' : ''}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <p className={`mt-1.5 text-xs text-center max-w-[72px] leading-tight ${
                      active ? 'text-blue-600 font-medium' : done ? 'text-green-600' : 'text-zinc-400'
                    }`}>
                      {STEP_LABELS[s]}
                    </p>
                  </div>
                  {!last && (
                    <div className={`flex-1 h-px mt-3.5 mx-2 ${done ? 'bg-green-400' : 'bg-zinc-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-sm text-blue-800 font-medium">{loadingText}</span>
          </div>
        )}

        {/* ── VIEW 1: NEW ─────────────────────────────────────────────────────── */}
        {!loading && claim.state === 'NEW' && (
          <div className="space-y-5">
            <ClaimSummaryCard />

            {/* Photos */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Submitted Photos</h2>
              <div className="flex flex-wrap gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={claim.imageUrl}
                  alt="Vehicle damage"
                  className="w-64 rounded border border-zinc-200 object-cover aspect-video"
                />
                {extraPhotos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Additional photo ${i + 1}`}
                    className="w-64 rounded border border-zinc-200 object-cover aspect-video"
                  />
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  const files = e.target.files;
                  if (!files) return;
                  Array.from(files).forEach(f =>
                    setExtraPhotos(p => [...p, URL.createObjectURL(f)])
                  );
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 text-sm text-blue-600 border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-50"
              >
                + Add Additional Photo
              </button>
            </section>

            {/* Next action banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-900">Damage assessment pending.</p>
                <p className="text-sm text-blue-700 mt-0.5">Run the Damage Labeller to begin assessment.</p>
              </div>
              <button
                onClick={() => transition('Labeller agent analyzing photos...', 'ASSESSING')}
                className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700"
              >
                Run Damage Labeller
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: ASSESSING ───────────────────────────────────────────────── */}
        {!loading && claim.state === 'ASSESSING' && (
          <div className="space-y-5">
            {/* Photo with bounding box overlays */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Damage Photo</h2>
              <div className="relative inline-block w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={claim.imageUrl}
                  alt="Vehicle damage"
                  className="w-full block rounded"
                />
                {claim.damageLabels.map(label => {
                  const selected = selectedLabelId === label.id;
                  return (
                    <div
                      key={label.id}
                      onClick={() => clickOverlay(label.id)}
                      className={`absolute cursor-pointer ${SEVERITY_BORDER[label.severity]} ${
                        selected ? 'border-4' : 'border-2'
                      }`}
                      style={{
                        left: `${label.boundingBox.x}%`,
                        top: `${label.boundingBox.y}%`,
                        width: `${label.boundingBox.width}%`,
                        height: `${label.boundingBox.height}%`,
                      }}
                    >
                      <span className={`absolute top-0 left-0 text-white text-[10px] font-semibold px-1 py-0.5 leading-tight ${SEVERITY_BG[label.severity]}`}>
                        {label.part} · {label.confidence}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-zinc-400">Click a box to highlight it and jump to the label below.</p>
            </section>

            {/* Damage Labels table */}
            <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Damage Labels</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left bg-zinc-50">
                      <th className="px-6 py-2.5 text-xs font-medium text-zinc-500">Part</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Severity</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Confidence</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">BB ID</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Status</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Actions</th>
                      <th className="px-3 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {claim.damageLabels.map(label => {
                      const isSelected = selectedLabelId === label.id;
                      const traceOpen = expandedTraces.has(label.id);
                      const isActing = labelActionId === label.id;
                      const lowConf = label.confidence < 80;

                      return (
                        <Fragment key={label.id}>
                          {/* Main row */}
                          <tr
                            ref={el => { rowRefs.current[label.id] = el; }}
                            className={`border-b border-zinc-100 ${isSelected ? 'bg-blue-50' : 'hover:bg-zinc-50'}`}
                          >
                            <td className="px-6 py-3 font-medium text-zinc-900 whitespace-nowrap">{label.part}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[label.severity]}`}>
                                {label.severity}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`flex items-center gap-1 text-sm ${lowConf ? 'text-yellow-700' : 'text-zinc-700'}`}>
                                {lowConf && <span title="Below 80% confidence threshold">⚠</span>}
                                {label.confidence}%
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-xs text-zinc-500 whitespace-nowrap">
                              {label.traceData.boundingBoxId}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${LABEL_STATUS_BADGE[label.status]}`}>
                                {label.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {label.status === 'PENDING' ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {lowConf ? (
                                    <>
                                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap">
                                        Low Confidence
                                      </span>
                                      <button
                                        onClick={() => { setLabelActionId(label.id); setLabelActionType('acknowledging'); }}
                                        className="text-xs border border-yellow-400 text-yellow-700 rounded px-2 py-1 hover:bg-yellow-50 whitespace-nowrap"
                                      >
                                        Acknowledge &amp; Approve
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => patchLabel(label.id, { status: 'APPROVED' })}
                                      className="text-xs bg-green-50 border border-green-300 text-green-700 rounded px-2 py-1 hover:bg-green-100"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setLabelActionId(label.id);
                                      setLabelActionType('adjusting');
                                      setAdjustSeverity(label.severity);
                                    }}
                                    className="text-xs bg-zinc-50 border border-zinc-300 text-zinc-600 rounded px-2 py-1 hover:bg-zinc-100"
                                  >
                                    Adjust
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLabelActionId(label.id);
                                      setLabelActionType('overriding');
                                      setOverrideReason('');
                                    }}
                                    className="text-xs bg-red-50 border border-red-200 text-red-600 rounded px-2 py-1 hover:bg-red-100"
                                  >
                                    Override
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
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

                          {/* Trace panel */}
                          {traceOpen && (
                            <tr className="border-b border-zinc-100 bg-zinc-50">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="text-xs text-zinc-600 space-y-1">
                                  <p>
                                    <span className="font-medium text-zinc-700">Bounding Box ID:</span>{' '}
                                    {label.traceData.boundingBoxId}
                                  </p>
                                  <p>
                                    <span className="font-medium text-zinc-700">Model:</span>{' '}
                                    {label.traceData.model}
                                  </p>
                                  <p>
                                    <span className="font-medium text-zinc-700">Dataset:</span>{' '}
                                    {label.traceData.dataset}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Adjust severity inline panel */}
                          {isActing && labelActionType === 'adjusting' && (
                            <tr className="border-b border-zinc-100 bg-blue-50">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-medium text-zinc-700">Adjust severity:</span>
                                  <select
                                    value={adjustSeverity}
                                    onChange={e => setAdjustSeverity(e.target.value as DamageLabel['severity'])}
                                    className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white"
                                  >
                                    <option>Minor</option>
                                    <option>Moderate</option>
                                    <option>Severe</option>
                                  </select>
                                  <button
                                    onClick={() => {
                                      patchLabel(label.id, { status: 'ADJUSTED', severity: adjustSeverity });
                                      clearLabelAction();
                                    }}
                                    className="text-xs bg-blue-600 text-white rounded px-2.5 py-1 hover:bg-blue-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={clearLabelAction}
                                    className="text-xs text-zinc-500 hover:text-zinc-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Override reason inline panel */}
                          {isActing && labelActionType === 'overriding' && (
                            <tr className="border-b border-zinc-100 bg-red-50">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-medium text-zinc-700">Override reason:</span>
                                  <input
                                    type="text"
                                    value={overrideReason}
                                    onChange={e => setOverrideReason(e.target.value)}
                                    placeholder="Enter reason..."
                                    className="text-xs border border-zinc-300 rounded px-2 py-1 w-56"
                                  />
                                  <button
                                    onClick={() => {
                                      patchLabel(label.id, { status: 'OVERRIDDEN' });
                                      clearLabelAction();
                                      setOverrideReason('');
                                    }}
                                    className="text-xs bg-red-600 text-white rounded px-2.5 py-1 hover:bg-red-700"
                                  >
                                    Confirm Override
                                  </button>
                                  <button
                                    onClick={clearLabelAction}
                                    className="text-xs text-zinc-500 hover:text-zinc-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Acknowledge + confirm inline panel */}
                          {isActing && labelActionType === 'acknowledging' && (
                            <tr className="border-b border-zinc-100 bg-yellow-50">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-medium text-yellow-800">
                                    Confidence is {label.confidence}% — below the 80% threshold.
                                    Confirm you have manually reviewed this label before approving.
                                  </span>
                                  <button
                                    onClick={() => {
                                      patchLabel(label.id, { status: 'APPROVED' });
                                      clearLabelAction();
                                    }}
                                    className="text-xs bg-yellow-600 text-white rounded px-2.5 py-1 hover:bg-yellow-700 shrink-0"
                                  >
                                    Confirm Approval
                                  </button>
                                  <button
                                    onClick={clearLabelAction}
                                    className="text-xs text-zinc-500 hover:text-zinc-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Next action banner */}
            <div className={`border rounded-lg px-6 py-5 flex items-center justify-between gap-4 ${
              allLabelsResolved ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div>
                <p className={`text-sm font-semibold ${allLabelsResolved ? 'text-green-900' : 'text-blue-900'}`}>
                  {resolvedLabels} of {claim.damageLabels.length} damage labels reviewed.
                </p>
                <p className={`text-sm mt-0.5 ${allLabelsResolved ? 'text-green-700' : 'text-blue-700'}`}>
                  {allLabelsResolved
                    ? 'All labels resolved. Ready to generate cost estimate.'
                    : 'Approve, adjust or override all labels to proceed.'}
                </p>
              </div>
              {allLabelsResolved && (
                <button
                  onClick={() => transition('Cost estimator agent generating estimate...', 'ESTIMATE_GENERATED')}
                  className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700"
                >
                  Run Cost Estimator
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 3: ESTIMATE_GENERATED ──────────────────────────────────────── */}
        {!loading && claim.state === 'ESTIMATE_GENERATED' && (
          <div className="space-y-5">
            {/* Resolved labels summary */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">Damage Labels — Resolved</h2>
              <div className="space-y-2">
                {claim.damageLabels.map(label => (
                  <div key={label.id} className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="font-medium text-zinc-900 w-40 shrink-0">{label.part}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[label.severity]}`}>
                      {label.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${LABEL_STATUS_BADGE[label.status]}`}>
                      {label.status}
                    </span>
                    <span className="text-xs text-zinc-400">{label.confidence}% confidence</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Cost estimate table */}
            <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">Cost Estimate</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left bg-zinc-50">
                      <th className="px-6 py-2.5 text-xs font-medium text-zinc-500">Part</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Description</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Cost</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Source</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Status</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claim.costLineItems.map(item => {
                      const srcOpen = expandedSources.has(item.id);
                      const isAdjusting = costAdjustId === item.id;

                      return (
                        <Fragment key={item.id}>
                          <tr className="border-b border-zinc-100 hover:bg-zinc-50">
                            <td className="px-6 py-3 font-medium text-zinc-900 whitespace-nowrap">{item.part}</td>
                            <td className="px-3 py-3 text-zinc-600">{item.description}</td>
                            <td className="px-3 py-3 font-mono text-zinc-900 whitespace-nowrap">{fmt(item.cost)}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <button
                                onClick={() => toggleSource(item.id)}
                                className="text-xs bg-zinc-100 text-zinc-600 rounded px-2 py-0.5 hover:bg-zinc-200 inline-flex items-center gap-1"
                              >
                                {item.source}
                                <span className={`inline-block transition-transform duration-150 ${srcOpen ? 'rotate-180' : ''}`}>▾</span>
                              </button>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${COST_STATUS_BADGE[item.status]}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {item.status === 'PENDING' ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      patchCost(item.id, { status: 'APPROVED' });
                                      setCostAdjustId(null);
                                    }}
                                    className="text-xs bg-green-50 border border-green-300 text-green-700 rounded px-2 py-1 hover:bg-green-100"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCostAdjustId(item.id);
                                      setAdjustCost(String(item.cost));
                                    }}
                                    className="text-xs bg-zinc-50 border border-zinc-300 text-zinc-600 rounded px-2 py-1 hover:bg-zinc-100"
                                  >
                                    Adjust
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
                            </td>
                          </tr>

                          {/* Source detail panel */}
                          {srcOpen && (
                            <tr className="border-b border-zinc-100 bg-zinc-50">
                              <td colSpan={6} className="px-6 py-2.5">
                                <p className="text-xs text-zinc-600">{item.sourceDetail}</p>
                              </td>
                            </tr>
                          )}

                          {/* Adjust cost inline panel */}
                          {isAdjusting && (
                            <tr className="border-b border-zinc-100 bg-blue-50">
                              <td colSpan={6} className="px-6 py-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-medium text-zinc-700">Adjusted cost ($):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={adjustCost}
                                    onChange={e => setAdjustCost(e.target.value)}
                                    className="text-xs border border-zinc-300 rounded px-2 py-1 w-28 bg-white"
                                  />
                                  <button
                                    onClick={() => {
                                      const val = parseFloat(adjustCost);
                                      if (!isNaN(val) && val >= 0) {
                                        patchCost(item.id, { status: 'ADJUSTED', cost: val });
                                      }
                                      setCostAdjustId(null);
                                    }}
                                    className="text-xs bg-blue-600 text-white rounded px-2.5 py-1 hover:bg-blue-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setCostAdjustId(null)}
                                    className="text-xs text-zinc-500 hover:text-zinc-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Total */}
              <div className="px-6 py-4 border-t border-zinc-100 flex justify-end">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-zinc-500">Total Estimate</span>
                  <span className="text-xl font-bold text-zinc-900 font-mono">{fmt(total)}</span>
                </div>
              </div>
            </section>

            {/* Total loss flag */}
            {claim.totalLoss && (
              <div className="bg-red-50 border border-red-300 rounded-lg px-6 py-4">
                <p className="text-sm font-semibold text-red-800">
                  Total Loss Flagged — Mandatory Human Decision Required
                </p>
              </div>
            )}

            {/* Next action banner */}
            <div className={`border rounded-lg px-6 py-5 flex items-center justify-between gap-4 ${
              allCostResolved ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div>
                <p className={`text-sm font-semibold ${allCostResolved ? 'text-green-900' : 'text-blue-900'}`}>
                  {resolvedCosts} of {claim.costLineItems.length} cost items reviewed.
                </p>
                <p className={`text-sm mt-0.5 ${allCostResolved ? 'text-green-700' : 'text-blue-700'}`}>
                  {allCostResolved
                    ? 'All items resolved. Ready to preview estimate.'
                    : 'Approve or adjust all items to proceed.'}
                </p>
              </div>
              {allCostResolved && (
                <button
                  onClick={() => setClaim(p => ({ ...p, state: 'PENDING_APPROVAL' }))}
                  className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700"
                >
                  Preview Estimate
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 4: PENDING_APPROVAL ─────────────────────────────────────────── */}
        {!loading && claim.state === 'PENDING_APPROVAL' && (
          <div className="space-y-5">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-10 text-center space-y-3">
                <p className="text-base font-semibold text-green-900">
                  Claim submitted for adjuster review.
                </p>
                <p className="text-sm text-green-700">
                  You will be notified once a decision is made.
                </p>
                <Link
                  href="/"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  ← Back to Claims Queue
                </Link>
              </div>
            ) : (
              <>
                <ClaimSummaryCard />

                {/* Damage assessment summary */}
                <section className="bg-white border border-zinc-200 rounded-lg p-6">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">Damage Assessment</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-left">
                        <th className="py-2 pr-6 text-xs font-medium text-zinc-500">Part</th>
                        <th className="py-2 pr-4 text-xs font-medium text-zinc-500">Severity</th>
                        <th className="py-2 pr-4 text-xs font-medium text-zinc-500">Confidence</th>
                        <th className="py-2 text-xs font-medium text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claim.damageLabels.map(label => (
                        <tr key={label.id} className="border-b border-zinc-100">
                          <td className="py-2.5 pr-6 font-medium text-zinc-900">{label.part}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[label.severity]}`}>
                              {label.severity}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-zinc-600">{label.confidence}%</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${LABEL_STATUS_BADGE[label.status]}`}>
                              {label.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Cost line items */}
                <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100">
                    <h2 className="text-sm font-semibold text-zinc-900">Cost Estimate</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-left bg-zinc-50">
                        <th className="px-6 py-2.5 text-xs font-medium text-zinc-500">Part</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Description</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Cost</th>
                        <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claim.costLineItems.map(item => (
                        <tr key={item.id} className="border-b border-zinc-100">
                          <td className="px-6 py-3 font-medium text-zinc-900">{item.part}</td>
                          <td className="px-3 py-3 text-zinc-600">{item.description}</td>
                          <td className="px-3 py-3 font-mono text-zinc-900 whitespace-nowrap">{fmt(item.cost)}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${COST_STATUS_BADGE[item.status]}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-6 py-4 border-t border-zinc-100 flex justify-end">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-zinc-500">Total Estimate</span>
                      <span className="text-xl font-bold text-zinc-900 font-mono">{fmt(total)}</span>
                    </div>
                  </div>
                </section>

                {/* Total loss flag */}
                {claim.totalLoss && (
                  <div className="bg-red-50 border border-red-300 rounded-lg px-6 py-4">
                    <p className="text-sm font-semibold text-red-800">
                      Total Loss Flagged — Mandatory Human Decision Required
                    </p>
                  </div>
                )}

                {/* Submit CTA */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSubmitted(true)}
                    className="bg-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded hover:bg-blue-700"
                  >
                    Submit for Adjuster Approval
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
