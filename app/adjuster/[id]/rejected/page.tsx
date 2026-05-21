import Link from 'next/link';

export default async function RejectedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reason?: string; notes?: string }>;
}) {
  const { id } = await params;
  const { reason, notes } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-10 max-w-md w-full mx-4 text-center space-y-4">
        <div className="text-6xl">❌</div>
        <h1 className="text-2xl font-bold text-zinc-900">Estimate Rejected</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Claim has been reassigned to Claims Agent for reassessment.
        </p>
        <div className="bg-zinc-50 rounded-lg px-5 py-4 text-sm text-left space-y-2 border border-zinc-100">
          <div className="flex justify-between">
            <span className="text-zinc-500">Claim ID</span>
            <span className="font-mono font-medium text-zinc-900">{id}</span>
          </div>
          {reason && (
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500 shrink-0">Rejection Reason</span>
              <span className="text-zinc-900 text-right">{reason}</span>
            </div>
          )}
          {notes && (
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500">Notes</span>
              <span className="text-zinc-700">{notes}</span>
            </div>
          )}
        </div>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Claims Queue
        </Link>
      </div>
    </div>
  );
}
