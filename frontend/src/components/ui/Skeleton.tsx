'use client';

export function SkeletonCard() {
  return (
    <div className="card animate-pulse" role="status" aria-label="Chargement">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card animate-pulse" role="status" aria-label="Chargement">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-28" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
