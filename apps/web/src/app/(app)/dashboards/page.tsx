import { Card, CardContent } from '@smartboard/ui';

export default function DashboardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboards</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Build and share your analytics dashboards</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[var(--muted)]">Dashboard builder — coming in Phase 6</p>
        </CardContent>
      </Card>
    </div>
  );
}
