export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)]">
      <div className="rounded-[var(--radius)] bg-[var(--surface)] p-12 shadow-[var(--shadow)]">
        <h1 className="text-4xl font-bold text-[var(--text)]">
          Smartboard
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Multi-tenant analytics platform — scaffold ready.
        </p>
      </div>
    </main>
  );
}
