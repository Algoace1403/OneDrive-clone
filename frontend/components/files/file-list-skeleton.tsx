export function FileListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full">
      <table className="w-full table-fixed">
        <thead className="bg-card sticky top-0 z-10">
          <tr className="text-left text-sm text-muted-foreground border-b border-border">
            <th className="w-[40px] p-3"></th>
            <th className="w-[16px] p-0"></th>
            <th className="p-3 font-normal">Name</th>
            <th className="p-3 font-normal">Modified</th>
            <th className="p-3 font-normal">File size</th>
            <th className="p-3 font-normal">Sharing</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              <td className="p-3">
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
              </td>
              <td className="p-0">
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              </td>
              <td className="p-3">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              </td>
              <td className="p-3">
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              </td>
              <td className="p-3">
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </td>
              <td className="p-3">
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

