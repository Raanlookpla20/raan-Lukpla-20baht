import { Skeleton } from "@/components/ui/Skeleton";

export default function StorefrontLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <div className="px-4 pt-4">
        <Skeleton className="aspect-[2.5/1] w-full rounded-2xl sm:aspect-[3/1]" />
      </div>
      <div className="px-4 py-3">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
      <div className="flex items-start">
        <div className="flex w-24 shrink-0 flex-col gap-1 bg-slate-50 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="min-w-0 flex-1 px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
