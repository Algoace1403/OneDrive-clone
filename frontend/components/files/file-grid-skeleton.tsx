export function FileGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg p-3 bg-muted/20">
          <div className="h-20 w-full flex items-center justify-center">
            <div className="h-12 w-12 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-2 space-y-2">
            <div className="h-3 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
