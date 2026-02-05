export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-slate-200 rounded animate-pulse mb-8" />

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse mb-4" />
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
