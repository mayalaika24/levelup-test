import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPanelSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6">
        <Skeleton className="mb-3 h-6 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </section>
      <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6">
        <Skeleton className="mb-4 h-5 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </section>
    </div>
  );
}

