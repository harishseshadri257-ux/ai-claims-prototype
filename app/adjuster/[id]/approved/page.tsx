import Link from 'next/link';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default async function ApprovedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ total?: string }>;
}) {
  const { id } = await params;
  const { total: totalParam } = await searchParams;
  const total = totalParam ? parseInt(totalParam, 10) : null;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-10 max-w-md w-full mx-4 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-zinc-900">Estimate Approved</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Claims Agent has been notified to communicate with the customer and coordinate repair.
        </p>
        <div className="bg-zinc-50 rounded-lg px-5 py-4 text-sm text-left space-y-2 border border-zinc-100">
          <div className="flex justify-between">
            <span className="text-zinc-500">Claim ID</span>
            <span className="font-mono font-medium text-zinc-900">{id}</span>
          </div>
          {total !== null && !isNaN(total) && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Total Estimate</span>
              <span className="font-bold text-zinc-900">{fmt(total)}</span>
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
