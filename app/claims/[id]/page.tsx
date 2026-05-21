'use client';

import { use } from 'react';
import Link from 'next/link';
import { mockClaims, type ClaimState } from '@/data/mockClaims';

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

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const claim = mockClaims.find(c => c.id === id);

  if (!claim) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-zinc-800 font-medium">Claim not found</p>
          <p className="text-zinc-500 text-sm">No claim with ID &ldquo;{id}&rdquo; exists.</p>
          <Link href="/" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Back to Claims Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 mb-6">
          ← Claims Queue
        </Link>

        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold font-mono text-zinc-900">{claim.id}</h1>
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${stateBadgeClass[claim.state]}`}>
              {stateLabel[claim.state]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Policyholder</span>
            <span className="text-zinc-800 font-medium">{claim.policyHolder}</span>
          </div>
          <p className="mt-8 text-xs text-zinc-400">
            Claim detail panels — policy summary, fraud signals, damage assessment, cost estimate — coming next.
          </p>
        </div>
      </div>
    </div>
  );
}
