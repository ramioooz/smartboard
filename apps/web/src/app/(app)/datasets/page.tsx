import { Card, CardContent } from '@smartboard/ui';

export default function DatasetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Datasets</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Upload and manage your data sources</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[var(--muted)]">Dataset upload and management — coming in Phase 7</p>
        </CardContent>
      </Card>
    </div>
  );
}
