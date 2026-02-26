'use client';

import { useRef, useState } from 'react';
import { Button, Card, CardContent } from '@smartboard/ui';
import { useDatasets, useCreateAndUploadDataset } from '@/hooks/useDatasets';
import type { Dataset } from '@/lib/datasets';

const STATUS_COLOURS: Record<Dataset['status'], string> = {
  created:    'bg-gray-400',
  uploaded:   'bg-blue-400',
  processing: 'bg-yellow-400',
  ready:      'bg-green-500',
  error:      'bg-red-500',
};

const STATUS_LABELS: Record<Dataset['status'], string> = {
  created:    'Created',
  uploaded:   'Uploaded',
  processing: 'Processing…',
  ready:      'Ready',
  error:      'Error',
};

function StatusBadge({ status }: { status: Dataset['status'] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white ${STATUS_COLOURS[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--text)]">{dataset.name}</p>
          {dataset.description && (
            <p className="mt-0.5 truncate text-sm text-[var(--muted)]">{dataset.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="uppercase">{dataset.fileType}</span>
            {dataset.rowCount != null && (
              <span>{dataset.rowCount.toLocaleString()} rows</span>
            )}
            <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <StatusBadge status={dataset.status} />
      </CardContent>
    </Card>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const { mutateAsync, isPending } = useCreateAndUploadDataset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!file) { setError('Please select a file'); return; }
    if (!name.trim()) { setError('Name is required'); return; }

    try {
      await mutateAsync({ name: name.trim(), description: description.trim() || undefined, fileType, file });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Upload Dataset</h2>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Sales Data"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">File type</label>
            <div className="flex gap-3">
              {(['csv', 'json'] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="radio"
                    name="fileType"
                    value={t}
                    checked={fileType === t}
                    onChange={() => setFileType(t)}
                    className="accent-[var(--accent)]"
                  />
                  {t.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">
              File <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] px-4 py-8 text-center hover:border-[var(--accent)]"
            >
              {file ? (
                <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-[var(--muted)]">Click to select a .{fileType} file</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">or drag &amp; drop</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={fileType === 'csv' ? '.csv,text/csv' : '.json,application/json'}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isPending && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <div className="h-full animate-pulse rounded-full bg-[var(--accent)]" style={{ width: '70%' }} />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DatasetsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useDatasets();
  const datasets = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Datasets</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Upload and manage your data sources</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Upload Dataset</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      ) : datasets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-[var(--muted)]">No datasets yet. Upload your first CSV or JSON file.</p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              Upload Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {datasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>
      )}

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
