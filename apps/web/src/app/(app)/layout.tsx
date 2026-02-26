import { Sidebar } from '../../components/layout/sidebar';
import { TopBar } from '../../components/layout/top-bar';
import { RealtimeProvider } from '../../components/layout/realtime-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
