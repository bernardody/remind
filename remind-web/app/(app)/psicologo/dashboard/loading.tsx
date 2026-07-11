import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton nativo do App Router — a página é um Server Component async e antes disso ficava em branco até resolver (PRD.md §4.17/§5.4). */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Visão geral da sua prática clínica." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}
