import { Skeleton } from "@/components/ui/Skeleton";

export default function StorefrontLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-4">
      <Skeleton className="aspect-[2.5/1] w-full rounded-2xl sm:aspect-[3/1]" />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
